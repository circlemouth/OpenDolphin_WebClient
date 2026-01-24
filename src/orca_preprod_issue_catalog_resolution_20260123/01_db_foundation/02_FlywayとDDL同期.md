# 02_FlywayとDDL同期

- RUN_ID: 20260124T143904Z
- 作業日: 2026-01-24
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/02_FlywayとDDL同期.md
- 対象IC: IC-07 / IC-08 / IC-09
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md
  - docs/server-modernization/server-modernized-code-review-20260117.md

## 実施内容
- Flyway SQL を `server-modernized/tools/flyway/sql` と `server-modernized/src/main/resources/db/migration` で同期。
- 重複バージョンの解消:
  - `V0227__audit_event_trace_id.sql` → `V0227_1__audit_event_trace_id.sql`
  - `V0225__letter_lab_stamp_tables.sql` → `V0230__letter_lab_stamp_tables.sql`
- `d_module.bean_json` 追加（`V0225__alter_module_add_json.sql` / `V0229__module_model_json_column.sql`）を resources 側へ反映。
- 監査 payload の OID→text 変換（`V0227__audit_event_payload_text.sql`）と trace_id 追加（`V0227_1__audit_event_trace_id.sql`）を resources 側へ反映。
- `setup-modernized-env.sh` に Flyway migrate 自動適用とログ出力（`artifacts/preprod/flyway`）を追加。

## Migration 適用確認手順
1. `FLYWAY_MIGRATE_ON_BOOT=1 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を実行。
2. `artifacts/preprod/flyway/flyway-<RUN_ID>.log` で `migrate` の成功を確認。
3. DB 確認（例）:
   - `\d d_module` → `bean_json` 列が存在し、`beanbytes` が NULL 許容。
   - `\d d_audit_event` → `payload` が `text`、`trace_id` が存在。
   - `\d d_patient_visit` / `\d d_appo` / `\d d_document` / `\d d_module` の作成済みを確認。
   - `SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;`

## 変更ファイル
- setup-modernized-env.sh
- server-modernized/tools/flyway/flyway.conf
- server-modernized/tools/flyway/sql/V0227_1__audit_event_trace_id.sql
- server-modernized/tools/flyway/sql/V0230__letter_lab_stamp_tables.sql
- server-modernized/src/main/resources/db/migration/*
- server-modernized/tools/flyway/README.md
- docs/preprod/implementation-issue-inventory/server-data-model.md
- src/validation/入力バリデーション妥当性確認.md
- docs/preprod/implementation-issue-inventory/logs/20260124T143904Z-flyway-ddl-sync.md

## 検証
- `bash -n setup-modernized-env.sh`
- `diff -qr server-modernized/tools/flyway/sql server-modernized/src/main/resources/db/migration`
  - 差分なしを確認。
