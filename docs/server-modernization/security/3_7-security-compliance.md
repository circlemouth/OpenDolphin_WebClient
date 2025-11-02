# Phase 3.7 セキュリティ / コンプライアンス実施内容

本ドキュメントはサーバーモダナイズ計画 Phase 3.7 における実装内容と運用上の留意点をまとめる。

## 1. 多要素認証の刷新

- `AdmissionResource` に以下の API を追加し、TOTP と FIDO2(WebAuthn) の両方式をサポートした。
  - `POST /20/adm/factor2/totp/registration`：TOTP 秘密鍵生成（`otpauth://` URI とバックアップコードを返却）。
  - `POST /20/adm/factor2/totp/verification`：TOTP コード検証・本登録。`Factor2Credential` に暗号化済みシークレットを保存。
  - `POST /20/adm/factor2/fido2/registration/options` / `finish`：WebAuthn 登録開始・完了。公開鍵や署名カウンタは `d_factor2_credential` に格納。
  - `POST /20/adm/factor2/fido2/assertion/options` / `finish`：WebAuthn 認証フロー。`Factor2Challenge` でチャレンジを管理し、有効期限切れも検知。
- TOTP シークレットは `TotpSecretProtector` により AES-GCM で暗号化。鍵は環境変数 `FACTOR2_AES_KEY_B64`（Base64）から読み込む。
- 既存のバックアップコードはマイグレーション時に削除しているため、初回ログインで再登録が必要。SMS ワンタイムパスワード経由の従来フローも互換性のため残置したが、保存されるバックアップコードは `SHA-256` ハッシュへ移行済み。
- WebAuthn の Relying Party 情報は `FIDO2_RP_ID` / `FIDO2_RP_NAME` / `FIDO2_ALLOWED_ORIGINS` で外部化。認証器の登録・認証ごとに監査ログへ書き出す。

## 2. 通信経路とヘッダ強化

- `docker/server-modernized/configure-wildfly.cli` に以下の設定を追加。
  - HTTP→HTTPS リダイレクトを有効化し、`Strict-Transport-Security` を `max-age=63072000; includeSubDomains` で送出。
  - `Content-Security-Policy: default-src 'self'` と `X-Content-Type-Options: nosniff`、`Referrer-Policy: no-referrer` を Undertow フィルタとして設定。
- WAF との連携はリバースプロキシ（例: AWS WAF + ALB、もしくは ModSecurity）を前段に置き、`X-Forwarded-*` ヘッダを WildFly 側で受け入れる構成を推奨。導入手順と監査証跡への統合方針は下記参照。
  - `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md` に承認フローと WAF 例外申請手順を記載。

## 3. 監査ログ（Audit Trail）

- `AuditTrailService` と `d_audit_event` テーブルを新設し、操作内容を JSON 化して保存。ペイロードハッシュと直前レコードのハッシュを連結した `event_hash` を持つことで改ざん検出を可能にしている。
- 2FA 登録・認証成功/失敗、バックアップコード再発行、FIDO2 チャレンジ等の重要イベントは `AdmissionResource` から `AuditTrailService` を呼び出し自動で記録。
- 監査ログは `event_time` と `action` で検索できるようインデックスを追加。`api-smoke-test.md` の監査観点と整合させ、結果のレビュー手順を `DEPLOYMENT_WORKFLOW.md` に追記した。

## 4. 個人情報保護と第三者提供記録

- `ThirdPartyDisclosureRecord` エンティティと `d_third_party_disclosure` テーブルを追加。外部提供先、目的、法的根拠、提供日時を履歴として保持する。
- 当面は API 実装を行っていないが、運用部門からの記録・参照要求に備えて Flyway マイグレーションとデータモデルを整備。今後は外部連携ワークフローから `ThirdPartyDisclosureRecord` を作成する想定。
- `docs/web-client/architecture/SERVER_MODERNIZATION_PLAN.md` における個人情報保護要件 (R-501/502) と整合。アクセス制御は FIDO2/TOTP の導入と監査ログで担保する。

## 5. 環境変数とデフォルト値

| 項目 | 環境変数 | 既定値 (docker-compose) | 説明 |
| --- | --- | --- | --- |
| TOTP シークレット暗号鍵 | `FACTOR2_AES_KEY_B64` | `b3BlbmRvbHBoaW4tZGV2LWZhY3RvcjIta2V5LTMyYnl0ZXM=` | AES-GCM 256bit 鍵 (Base64)。本番では Secret Manager 等で安全に配布すること。 |
| FIDO2 Relying Party ID | `FIDO2_RP_ID` | `localhost` | WebAuthn レジストレーション／認証で使用する RP ID。 |
| FIDO2 Relying Party Name | `FIDO2_RP_NAME` | `OpenDolphin Dev` | UI 表示用名称。 |
| FIDO2 許可オリジン | `FIDO2_ALLOWED_ORIGINS` | `https://localhost:8443,http://localhost:8080` | カンマ区切りで許可する Origin を指定。 |

※ 運用互換性のため `FACTOR2_AES_KEY` (プレーン文字列) も受け付ける。与えられた値が 128/192/256bit 以外の場合は SHA-256 で 256bit 鍵を導出して AES-GCM に利用する。

## 6. 既存ユーザーへの移行手順

1. 本マイグレーション適用後、`d_factor2_backupkey` は空になるため最初のログインでバックアップコード再登録を促す。
2. 旧 SMS OTP のみ利用していたユーザーは、新フローで TOTP または FIDO2 認証器を登録する。
3. Web クライアント側では `/factor2/fido2/*` および `/factor2/totp/*` API を使用するよう設定を更新し、登録完了後に新しい JWT クレーム (`factor2`) を参照して UI を制御する。
4. 監査証跡の検証として、最低限「登録成功」「登録失敗」「認証成功」「認証失敗」の 4 件が `d_audit_event` に記録されることを確認。

## 7. 関連ドキュメント

- `docs/server-modernization/rest-api-modernization.md`：2FA API のセキュリティ要件更新。
- `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md`：設定変更・レビュー・リリースの標準プロセス。
- `docs/server-modernization/api-smoke-test.md`：監査観点とログ確認フローの追記。

