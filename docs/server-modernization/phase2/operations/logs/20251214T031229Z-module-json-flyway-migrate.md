# RUN_ID: 20251214T031229Z (module_json Flyway migrate)

## 目的
- `V0225__alter_module_add_json.sql`（bean_json 追加・beanBytes NULL 許容）を Flyway で適用し、結果を記録する。

## 参照チェーン
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/Flywayスクリプト追加.md`

## 実行手順
1. `docker run --name od-flyway-temp ... postgres:15` で一時 Postgres を起動予定。
2. `flyway/flyway:10.17 -configFiles=server-modernized/tools/flyway/flyway.conf migrate` を想定（環境変数 `DB_HOST=localhost` `DB_PORT=55432` `DB_NAME=opendolphin` `DB_USER=opendolphin` `DB_PASSWORD=pass`）。

## 実行結果
- `docker run --name od-flyway-temp ... postgres:15` を実行したが、Docker デーモン未起動のため失敗。
  - 出力: `Cannot connect to the Docker daemon at unix:///Users/Hayato/.docker/run/docker.sock. Is the docker daemon running?`
- このため Flyway migrate は未実施。

## 対応案
- ホストで Docker を起動したうえで再実行するか、既存 DB 接続情報を設定して `flyway migrate` を再試行する。

## 変更ファイル
- `server-modernized/tools/flyway/sql/V0225__alter_module_add_json.sql`
- `server-modernized/src/main/resources/db/migration/V0225__alter_module_add_json.sql`
- `server-modernized/tools/flyway/sql/V0229__module_model_json_column.sql`
- `common/src/main/java/open/dolphin/infomodel/ModuleModel.java`

## 備考
- 本 RUN_ID は親 RUN `20251214T022944Z`（module_json ガント）配下。***
