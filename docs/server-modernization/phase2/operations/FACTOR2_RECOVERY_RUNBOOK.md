# FACTOR2 Secrets Recovery Runbook（2026-06-16 Draft）

## 1. 目的
- `FACTOR2_AES_KEY_B64` および `FIDO2_*` 環境変数が欠落した状態で WildFly/Server-Modernized を起動した場合、Jakarta EE 初期化が `IllegalStateException` で停止することを確認し、復旧手順と証跡採取ポイントをまとめる。
- 監査／セキュリティレビュー用に、「欠落 → 起動失敗 → Secrets 復旧 → 起動成功」の流れを再現する。

## 2. 事前確認
| 項目 | 状況 | メモ |
| --- | --- | --- |
| スクリプト | `scripts/start_wildfly_headless.sh` を追加済み。`start/stop/restart/status/logs/down` を備え、モダナイズ版 (db-modernized / server-modernized-dev のみ) を単体で起動できる。 | 例: `scripts/start_wildfly_headless.sh --env-file tmp/env.missing start` で Secrets 欠落ケースを再現。 |
| 実行環境 | WSL2 + Docker Desktop (Compose v2.40.3) で実測。`artifacts/parity-manual/secrets/wildfly-missing-secrets.log` と `wildfly-normal.log` に `docker logs` を保存済み。 | Codex サンドボックス単体では Docker が無いため、ホスト OS の Docker で実行する。 |
| DB / Secrets | `.env` から `FACTOR2_AES_KEY_B64` を空白化すると `SecondFactorSecurityConfig` が `IllegalStateException("Environment variable FACTOR2_AES_KEY_B64 is required...")` を送出し、2FA API が 500 で失敗する。現状 DB には `d_user` / `d_factor2_*` / `d_audit_event` が存在せず、Secrets 復旧後も登録が通らない。 | `docker exec opendolphin-postgres-modernized psql ... SELECT count(*) FROM d_audit_event;` が `relation does not exist`（証跡: `artifacts/parity-manual/audit/d_audit_event_missing.log`）。 |

## 3. 再現手順
1. `.env` から `FACTOR2_AES_KEY_B64` を削除するか、検証用に `tmp/env.missing` を作成して空白文字を設定する。  
   - 例: `cat > tmp/env.missing <<'EOF'\nFACTOR2_AES_KEY_B64=\" \"\nLOGFILTER_HEADER_AUTH_ENABLED=false\nEOF`
2. `ops/tools/logfilter_toggle.sh --env-file .env status` でヘッダフォールバック状態を取得し、必要に応じて `disable`。
3. サーバー起動:
   ```bash
   scripts/start_wildfly_headless.sh --env-file tmp/env.missing start \
     > artifacts/parity-manual/secrets/wildfly-missing-secrets.log 2>&1
   ```
4. TOTP API で例外を誘発（`ops/tests/security/factor2/totp-registration.http` を流用可）:
   ```bash
   curl -sS -X POST \
     -H 'Content-Type: application/json' \
     -H 'userName: adm20admin' \
     -H 'password: dolphin' \
     -H 'clientUUID: manual-smoke-client' \
     -H 'facilityId: 1.3.6.1.4.1.9414.72.103' \
     -H 'factor2-mode: admin' \
     -d '{"userPk":20,"accountName":"adm20admin","issuer":"OpenDolphin Dev","label":"ADM20"}' \
     http://localhost:9080/openDolphin/resources/20/adm/factor2/totp/registration \
     > artifacts/parity-manual/secrets/totp-registration-missing.log
   ```
5. 期待されるログ:
   ```
   ERROR [open.dolphin.security.SecondFactorSecurityConfig] FACTOR2_AES_KEY_B64 must be provided via Secrets Manager. Raw key fallback has been removed.
   java.lang.IllegalStateException: Environment variable FACTOR2_AES_KEY_B64 is required for TOTP encryption
   ```
   - WildFly 自体はブート完了するが、2FA API 呼び出し時に 500（`WELD-000049...IllegalStateException`）となりログへ証跡が残る。
   - `docker exec opendolphin-server-modernized-dev printenv FACTOR2_AES_KEY_B64` で空白が渡っていることを確認する。

## 4. 復旧手順
1. Secrets 復元  
   - `FACTOR2_AES_KEY_B64`: 32 byte ランダム値を Base64 エンコード（例: `openssl rand 32 | base64`）。  
   - `FIDO2_ALLOWED_ORIGINS`: `https://` 始まりのカンマ区切り。  
   - `.env` を手動編集するか `ops/tools/logfilter_toggle.sh --env-file .env enable` で `LOGFILTER_HEADER_AUTH_ENABLED=true` を戻す。
2. `ops/check-secrets.sh` を実行し、形式チェックをパスすることを確認。
3. WildFly 再起動 (`scripts/start_wildfly_headless.sh restart`。必要に応じて `--env-file` で本番 Secrets を指定)。
4. `/20/adm/factor2/totp/registration` / `verification`、`/factor2/fido2/*` を `ops/tests/security/factor2/*.http` で実行し、レスポンスと `X-Trace-Id` を保存する。
   - 現状は DB ベースライン欠落のため `artifacts/parity-manual/factor2_totp_registration/registration_failure_no_data.log` など 500 応答のみ取得。
   - Flyway を適用後に `node` などで TOTP を計算し、成功レスポンスと `d_audit_event` の `TOTP_REGISTER_INIT` を採取する。
5. 証跡の整理:
   - 欠落時ログ: `artifacts/parity-manual/secrets/wildfly-missing-secrets.log`
   - 復旧後ログ: `artifacts/parity-manual/secrets/wildfly-normal.log`
   - 監査ログ: `artifacts/parity-manual/audit/d_audit_event_missing.log`（現状はテーブル欠落を示す `psql` エラー。復旧次第、`SELECT action,details FROM d_audit_event ORDER BY event_time DESC LIMIT 20;` の結果へ差し替える）

## 5. 今後の課題
- `scripts/start_wildfly_headless.sh` の `--env-file` で Secrets を切り替えられるようになったため、CI でも `FACTOR2_AES_KEY_B64` 未設定を検出するジョブを追加する。
- `SecondFactorSecurityConfig` の例外は 2FA API 呼び出し時に必ず発生する。Micrometer / `/metrics/application` へ健康状態をエクスポートし、Prometheus 側で Secrets 欠落を検知できるようタグ設計を追加する。
- `ops/tests/security/factor2/*.http` をベースに、Flyway ベースライン適用後の成功レスポンス＋`d_audit_event` SQL を `docs/server-modernization/phase2/notes/test-data-inventory.md` へ追記する。
