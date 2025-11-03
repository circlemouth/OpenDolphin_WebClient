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

