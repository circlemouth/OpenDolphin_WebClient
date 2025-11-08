# /20/adm/factor2/* Audit Capture Plan (2026-06-16)
- HTTP request driver: `ops/tools/send_parallel_request.sh --loop` （2026-06-16 版でループ実行に対応）。
- ヘッダー: `ops/tests/api-smoke-test/headers/adm20-admin.headers` をベースに `clientUUID` / `X-Trace-Id` をケース毎に固有化。
- 期待監査イベント:
  - `/totp/registration` → `TOTP_REGISTER_INIT`
  - `/totp/verification` → `TOTP_REGISTER_COMPLETE`
  - `/fido2/assertion/finish` → `FIDO2_ASSERT_COMPLETE`
- 取得手順（DB）:
 1. `docker compose` もしくは手動で PostgreSQL を起動し、`d_audit_event`, `d_factor2_credential`, `d_factor2_challenge`, `d_factor2_backupkey` テーブルを確認。
 2. `psql` で `SELECT event_time, action, request_id, payload FROM d_audit_event WHERE action LIKE 'TOTP_%' OR action LIKE 'FIDO2_%' ORDER BY event_time DESC LIMIT 20;`
 3. 生データは `tmp/manual-audit/<timestamp>/`、マスク済ログを本ディレクトリへ保存。
- 現状: サンドボックスに WildFly / PostgreSQL が存在しないため API 実行不可（`curl: (7) Failed to connect`）。`artifacts/parity-manual/factor2_*/*/meta.json` へ失敗コード (exit_code=7) を記録済み。
