# module_json Flyway スクリプト追加

- RUN_ID: `20251214T031229Z`
- 期間: 2025-12-17 09:00 〜 2025-12-18 09:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/modernization/module_json/Flywayスクリプト追加.md`

## 目的
- module_json モダナイズで ModuleModel を JSON 併用保存できるようにするため、Flyway マイグレーションを追加する。
- `d_module` の `beanBytes` NOT NULL 制約を解除し、JSON 用 `bean_json` 列を追加する。

## 参照チェーン
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. 本ドキュメント（`src/modernization/module_json/Flywayスクリプト追加.md`）

## 作業内容
- Flyway マイグレーション `V0225__alter_module_add_json.sql` を追加（`server-modernized/tools/flyway/sql` および runtime 用 `server-modernized/src/main/resources/db/migration` に配置）。
  - `beanBytes` の NOT NULL 制約を解除。
  - `bean_json` 列（TEXT, IF NOT EXISTS）を追加。

## 証跡
- `docs/web-client/planning/phase2/logs/20251214T031229Z-module-json-flyway.md`

## 備考
- 親 RUN_ID: `20251214T022944Z`（module_json ガント起点）。本 RUN_ID は派生。
- Legacy 資産（`server/`, `client/`, `common/`, `ext_lib/`）は参照専用。サーバーモダナイズ側の Flyway のみ変更。
