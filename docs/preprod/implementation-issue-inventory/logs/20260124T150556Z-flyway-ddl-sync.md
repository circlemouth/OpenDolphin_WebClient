# Flyway/DDL 同期 実測ログ

- RUN_ID: 20260124T150556Z
- 作業日: 2026-01-24
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769265461073-30fab0
- 実行コマンド:
  - `FLYWAY_MIGRATE_ON_BOOT=1 WEB_CLIENT_MODE=npm DB_INIT_RUN_ID=20260124T150556Z ORCA_API_USER= ORCA_API_PASSWORD= MINIO_API_PORT=19110 MINIO_CONSOLE_PORT=19111 MODERNIZED_POSTGRES_PORT=55490 MODERNIZED_APP_HTTP_PORT=19292 MODERNIZED_APP_ADMIN_PORT=20297 WEB_CLIENT_DEV_PORT=5179 ./setup-modernized-env.sh`
- Flywayログ: `artifacts/preprod/flyway/flyway-20260124T150556Z.log`

## Flyway migrate 実行ログ（抜粋）
1:A more recent version of Flyway is available. Find out more about Flyway 11.20.2 at https://rd.gt/3rXiSlV
3:Flyway OSS Edition 10.17.3 by Redgate
8:Current version of schema "opendolphin": 0226
9:Migrating schema "opendolphin" to version "0227 - audit event payload text"
10:Migrating schema "opendolphin" to version "0227.1 - audit event trace id"
13:Migrating schema "opendolphin" to version "0228 - phr key and async job"
17:Migrating schema "opendolphin" to version "0229 - module model json column"
19:Migrating schema "opendolphin" to version "0230 - letter lab stamp tables"
33:Successfully applied 5 migrations to schema "opendolphin", now at version v0230 (execution time 00:00.114s)

## flyway_schema_history / 監査・モジュール列確認
```text
## flyway_schema_history
 version |        description         | success 
---------+----------------------------+---------
 0001    | baseline tag               | t
 0002    | performance indexes        | t
 0003    | security phase3 stage7     | t
 0220    | phr async job              | t
 0221    | doc module flag columns    | t
 0222    | diagnosis legacy tables    | t
 0223    | schedule appo tables       | t
 0224    | document module tables     | t
 0225    | alter module add json      | t
 0226    | audit event sequence owned | t
 0227    | audit event payload text   | t
 0227.1  | audit event trace id       | t
 0228    | phr key and async job      | t
 0229    | module model json column   | t
 0230    | letter lab stamp tables    | t
(15 rows)


## audit/module column checks
  table_name   | column_name |     data_type     
---------------+-------------+-------------------
 d_audit_event | payload     | text
 d_audit_event | trace_id    | character varying
 d_module      | bean_json   | text
(3 rows)

```
