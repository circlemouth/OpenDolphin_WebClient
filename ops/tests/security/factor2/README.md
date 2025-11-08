# ops/tests/security/factor2

Web クライアントの 2FA API (TOTP / FIDO2) を CLI から再現するための HTTP スクリプト置き場。VS Code REST Client や `curl $(cat file.http | sed ...)` で利用し、レスポンスと `d_audit_event` の整合を採取する。

## テンプレート一覧

| ファイル | 用途 |
| --- | --- |
| `totp-registration.http` | `/factor2/totp/registration` 登録開始。レスポンスから `credentialId` と `secret` を取得する。 |
| `totp-verification.http` | `/factor2/totp/verification` で 6 桁 TOTP を確認し、本登録 + バックアップコードを取得する。 |
| `fido-registration-options.http` | FIDO2 登録チャレンジ。戻り値の `requestId` を `fido-registration-finish.http` に差し込む。 |
| `fido-registration-finish.http` | WebAuthn クライアントレスポンスをサーバーへ送信し、`d_factor2_credential` に公開鍵を保存させる。 |
| `fido-assertion-options.http` | 認証時のチャレンジ払い出し。 |
| `fido-assertion-finish.http` | 認証器レスポンスを検証し、`d_audit_event` を作成する。 |

## 実行上の注意

1. `userName` / `password` / `facilityId` / `factor2-mode` は ADM20 管理者で実行すること。
2. `totp-verification.http` を送信する前に、`secret` から TOTP を計算する。Python が使えない環境では `node -e "require('otplib').authenticator.generate(secret)"` 等で代替する。
3. 登録・認証ごとに `X-Trace-Id`（`clientUUID` とは別）をヘッダーで送ると監査ログの突合が容易。
4. DB ベースライン (`d_user`, `d_factor2_*`, `d_audit_event`) が未作成の場合は 500 エラーとなる。`artifacts/parity-manual/db-restore/*` のメモに従って Flyway を実行し、実測前に `SELECT count(*) FROM d_audit_event;` が成功することを確認する。
