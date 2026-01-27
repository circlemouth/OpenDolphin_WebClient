# Flyway resources V0232 同期（RUN_ID=20260127T040043Z）

## 目的
- `server-modernized/tools/flyway/sql` と `server-modernized/src/main/resources/db/migration` の
  migration バージョンを同期し、`V0230`/`V0232` のズレを解消する。

## 対応内容
- resources 側の migration を `V0232` に改番した。
  - 変更前: `server-modernized/src/main/resources/db/migration/V0230__letter_lab_stamp_tables.sql`
  - 変更後: `server-modernized/src/main/resources/db/migration/V0232__letter_lab_stamp_tables.sql`

## 参照更新
- `docs/preprod/implementation-issue-inventory/logs/20260124T143904Z-flyway-ddl-sync.md`
- `docs/preprod/implementation-issue-inventory/logs/20260127T031057Z-flyway-duplicate-0230-fix.md`

## 検証結果
- `mvn -pl server-modernized -DskipTests compile`：成功（BUILD SUCCESS）。
- `setup-modernized-env.sh` 再実行：成功。
  - Flyway: `Successfully validated 17 migrations` / `Schema \"opendolphin\" is up to date. No migration necessary.`
  - ログ: `artifacts/preprod/flyway/flyway-20260127T040307Z.log`
