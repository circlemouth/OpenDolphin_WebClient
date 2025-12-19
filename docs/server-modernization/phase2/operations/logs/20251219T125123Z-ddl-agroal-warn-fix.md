# DDL 変換警告と Agroal クラスロード解消ログ（RUN_ID=20251219T125123Z）

## 目的
- Hibernate の DDL 変換 WARN（`d_factor2_*` / `d_stamp_tree` の `oid/bytea` 変換失敗）と、Weld の `DatasourceMetricsRegistrar` クラスロード WARN を解消する。

## 事前確認（既存ログ）
- `artifacts/webclient/e2e/20251208T170000Z-auth-fix/docker-logs.txt`
  - `alter table if exists d_factor2_challenge alter column challenge_payload set data type oid` → `cannot be cast automatically`
  - `alter table if exists d_factor2_credential alter column {metadata/public_key/secret/transports} set data type oid` → `cannot be cast automatically`
  - `alter table if exists d_stamp_tree alter column treeBytes set data type bytea` → `cannot be cast automatically`
  - `WELD-000119: Not generating any bean definitions from open.dolphin.metrics.DatasourceMetricsRegistrar ... AgroalDataSource ... not found`

## 対応内容
- `server-modernized/src/main/resources/META-INF/persistence.xml`
  - `jakarta.persistence.schema-generation.database.action=update` → `none`
- `server-modernized/src/main/webapp/WEB-INF/jboss-deployment-structure.xml`
  - `<module name="io.agroal.api"/>` を追加

## 実行ログ
- Docker/WildFly の再起動は指示が無いため未実施。
- 再起動時に WARN が再現しないことを確認し、このログに追記する。

## 次アクション
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動後、`docker compose -f docker-compose.modernized.dev.yml logs --no-color server-modernized-dev | rg -n "WELD-000119|d_factor2_|d_stamp_tree|oid"` を確認し、WARN が消えていることを記録する。
