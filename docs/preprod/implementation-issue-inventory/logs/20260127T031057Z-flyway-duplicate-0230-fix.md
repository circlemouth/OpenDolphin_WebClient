# Flyway duplicate version 0230 fix（RUN_ID=20260127T031057Z）

## 背景
- `setup-modernized-env.sh` 実行時に Flyway が `version 0230` の重複で停止した。
- 重複していた migration:
  - `server-modernized/tools/flyway/sql/V0230__chart_event_history.sql`
  - `server-modernized/tools/flyway/sql/V0232__letter_lab_stamp_tables.sql`

## 対応
- `letter_lab_stamp_tables` 側を `V0232` へ改番して重複を解消。
  - 変更後: `server-modernized/tools/flyway/sql/V0232__letter_lab_stamp_tables.sql`

## 再実行
- 次のコマンドで Flyway が `v0232` まで到達することを確認した。
  - `WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19092 MODERNIZED_APP_ADMIN_PORT=19997 MODERNIZED_POSTGRES_PORT=55460 MINIO_API_PORT=19112 MINIO_CONSOLE_PORT=19113 ORCA_API_HOST=host.docker.internal ORCA_API_PORT=8000 ORCA_API_PORT_ALLOW_8000=1 ORCA_API_USER=ormaster ORCA_API_PASSWORD=change_me ORCA_MODE=weborca ORCA_API_SCHEME=http ./setup-modernized-env.sh`
- Flyway ログ:
  - `artifacts/preprod/flyway/flyway-20260127T031955Z.log`
  - `artifacts/preprod/flyway/flyway-20260127T032309Z.log`

## 備考
- 本修正は insprogetv2 の localhost 実測を完遂するための前提解消として実施した。
