# DDL 変換警告と Agroal クラスロード解消（RUN_ID=20251219T125123Z）

## 背景
- WildFly 起動ログで Hibernate の `schema-generation.database.action=update` が `d_factor2_*` と `d_stamp_tree` に対して OID/bytea 変換 DDL を発行し、PostgreSQL 側で `cannot be cast automatically` WARN が出ていた。
- Weld 起動ログで `DatasourceMetricsRegistrar` の `AgroalDataSource` クラスが見つからず、`WELD-000119` が継続発生していた。

## 対応内容
1. **DDL 変換 WARN の抑止**
   - `server-modernized/src/main/resources/META-INF/persistence.xml` の `jakarta.persistence.schema-generation.database.action` を `update` → `none` に変更。
   - Flyway を前提に Hibernate の自動 DDL 生成を停止し、`oid/bytea` 変換 WARN が出ない状態にする。

2. **Agroal クラスロード WARN の解消**
   - `server-modernized/src/main/webapp/WEB-INF/jboss-deployment-structure.xml` に `io.agroal.api` の module dependency を追加。
   - Weld が `io.agroal.api.AgroalDataSource` を解決できるようにして `WELD-000119` を解消する。

## 参照した既存ログ（抜粋）
- `artifacts/webclient/e2e/20251208T170000Z-auth-fix/docker-logs.txt`
  - `alter table if exists d_factor2_* ... set data type oid` → `cannot be cast automatically` WARN
  - `alter table if exists d_stamp_tree ... set data type bytea` → `cannot be cast automatically` WARN
  - `WELD-000119: Not generating any bean definitions from open.dolphin.metrics.DatasourceMetricsRegistrar ... Type io.agroal.api.AgroalDataSource ... not found`

## 検証（未実施）
- Docker/WildFly を起動する実行検証は指示が無いため未実施。
- 次回起動時に `d_factor2_*` / `d_stamp_tree` の DDL WARN と `WELD-000119` が出ないことをログで確認する。

## 変更ファイル
- `server-modernized/src/main/resources/META-INF/persistence.xml`
- `server-modernized/src/main/webapp/WEB-INF/jboss-deployment-structure.xml`

## 証跡
- `docs/server-modernization/phase2/operations/logs/20251219T125123Z-ddl-agroal-warn-fix.md`
