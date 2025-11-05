# セキュリティ設定変更・デプロイ標準ワークフロー

Phase 3.7 の実装に合わせ、2FA 設定や通信制御を変更する際の手順と責任分担を以下の通り定義する。

## 1. 変更申請とレビュー

1. 変更内容（例: FIDO2 オリジン追加、HSTS 設定調整、WAF ルール更新）を Jira チケットに記載し、セキュリティ担当（SRE）とプロダクトオーナーへ承認依頼する。
2. チケットには以下を必ず記載する。
   - 対象環境（dev/stg/prod）と予定日時
   - 影響を受けるユーザー（例: 医師アカウント）
   - 必要な環境変数 (`FACTOR2_AES_KEY_B64`, `FIDO2_*`) の差分
   - ロールバック手順（旧値への復元方法、環境変数撤回手順）
3. セキュリティ担当は `docs/server-modernization/security/3_7-security-compliance.md` の要件と整合しているかを確認し、監査ログが適切に記録されるかをレビューする。

## 2. 実装・適用手順

1. 変更前に `AuditTrailService` のテーブルをバックアップ（`pg_dump -t d_audit_event` など）する。
2. 必要な環境変数を Secrets Manager / Vault に登録し、CI/CD パイプラインの `docker-compose.yml` へ反映する。
3. `ops/modernized-server/docker/configure-wildfly.cli` の変更がある場合は、`jboss-cli` の dry-run を実施し差分を確認する。
4. デプロイ後に以下を実施。
   - `/20/adm/factor2/fido2/registration/options` を用いた疎通確認（stg 環境で実施）。
   - `SELECT action, request_id FROM d_audit_event ORDER BY event_time DESC LIMIT 5;` でログが生成されていることを確認。
   - WAF を経由したリクエストで 403 やヘッダ欠落がないかを手動テスト。

### 2.1 FACTOR2_AES_KEY_B64 の生成・ローテーション

1. **生成要件**  
   - AES-256 用の 32 バイト乱数を生成し、Base64 (URL セーフでなく標準エンコード) した文字列を `FACTOR2_AES_KEY_B64` に設定する。  
   - 開発検証用のデフォルト値は `docker-compose.modernized.dev.yml` が提供するが、本番・ステージングでは必ず Secrets Manager 管理の値へ置き換える。
2. **生成手順例**  
   - オフライン端末または認証済みターミナルで以下を実施し、一度だけ表示された値を控える。  
     ```
     $ openssl rand -out factor2_aes.key 32
     $ base64 -w 0 factor2_aes.key
     ```
   - 生成した `factor2_aes.key` は即時安全に廃棄する（`shred -u factor2_aes.key` など）。Base64 文字列のみを Secrets Manager へ登録する。
3. **登録と展開**  
   - CI/CD 用 Vault パス: `kv/modernized-server/factor2` に `aes_key_b64` として保存する。  
   - 手動デプロイ時は `.env` または `server-modernized/config/server-modernized.env` へ一時的に書き込み、デプロイ完了後にローカルファイルから削除する。
4. **ローテーション**  
   - 半期毎（4 月・10 月）にローテーションを行い、事前に TOTP / FIDO2 への影響を QA 環境で検証する。  
   - ローテーション時は旧値も Secrets Manager に `aes_key_b64_previous` として一時保存し、切替後 7 日間はロールバック可能な状態を保持する。  
   - WildFly 再起動後に `/20/adm/factor2/status` で E2E 確認、`d_audit_event` に `TOTP_KEY_ROTATE` が記録されることを監査する。
5. **未設定時の挙動**  
   - Jakarta EE 起動シーケンス中に `IllegalStateException` が送出され、アプリケーションがデプロイ不可となる。Secrets 未投入でのリリースを防ぐため、必ず事前に CI 環境で `FACTOR2_AES_KEY_B64` の存在チェックを行う。

### 2.2 Jakarta EE 10 環境での Secrets 配布フロー

1. **保管レイヤー**  
   - 本番: HashiCorp Vault（`kv/modernized-server/*`）を正とし、ロールベースアクセス制御（RBA）で Ops のみ書込許可。  
   - ステージング/QA: AWS Secrets Manager を利用し、環境ごとに `opendolphin/<env>/server-modernized` 名前空間を作成する。  
   - ローカル開発: `.env` または `server-modernized/config/server-modernized.env` を参照するが、ファイルは Git 忽略（`.gitignore`）されていることを確認する。
2. **CI/CD 展開**  
   - GitHub Actions では `OPS_SECRET_FETCH` ワークフローで Vault から `server-modernized.env` を生成し、Artifact として暗号化配布する。  
   - Jenkins/Argo CD では Deployment Job 前に `vault kv get` → `envsubst` を実行し、WildFly Pod の `Secret` マニフェストへ注入する。
3. **WildFly への受け渡し**  
   - Docker Compose: `docker-compose.modernized.dev.yml` が `.env` を参照し、`FACTOR2_AES_KEY_B64` や DB 接続情報を環境変数として `server-modernized-dev` コンテナへ渡す。  
   - Kubernetes: `Secret` → `envFrom` として WildFly コンテナへマウントし、`standalone.conf` の `-D` オプションへ変換する（`ops/modernized-server/k8s/overlays/prod/` を参照）。
4. **検証フェーズ**  
   - 起動前に `ops/check-secrets.sh` を実行し、必須キー欠落時は非ゼロ終了とする。  
   - 起動後は `server.log` に `Secrets pulled from Vault` ログが出力されているか、`/openDolphin/resources/dolphin` ヘルスチェックが 200 を返すかを確認。
5. **監査記録**  
   - Secrets へのアクセスは Vault 実行ログと CI/CD のジョブログに残る。ローテーション・配布完了後は本ドキュメントの「5. ドキュメント更新」を実施し、`docs/server-modernization/phase2/PHASE2_PROGRESS.md` へ記録する。

## 3. ロールバック

1. 2FA 関連の環境変数を旧値へ戻し、WildFly を再起動する。
2. CLI 設定を戻す場合は、`configure-wildfly.cli` の該当ブロックをコメントアウトし再適用するか、Git のリビジョンを指定して再ビルドする。
3. 監査ログが誤った状態で書き込まれた場合は、新旧ハッシュチェーンの整合性を `d_audit_event` の `previous_hash` で確認し、必要に応じて補正レコードを追加する（補正内容は監査担当へ報告）。

## 4. 権限分離

- **申請者**: 機能オーナー（プロダクトマネージャ）
- **レビュー担当**: SRE/セキュリティ担当
- **承認者**: プロダクトオーナー + セキュリティ責任者
- **実行担当**: SRE（本番適用時は 2 名体制で実施し、実行者と記録係を分離）

## 5. ドキュメント更新

- 変更後は必ず本ドキュメントと `docs/server-modernization/security/3_7-security-compliance.md` を更新し、実施内容と時刻、対応者を追記する。
- 監査ログに残る `action` 名称は `TOTP_*` / `FIDO2_*` を使用しているため、変更時は既存の命名規則を踏襲すること。
