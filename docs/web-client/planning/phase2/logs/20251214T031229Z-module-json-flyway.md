# 証跡ログ: module_json Flyway スクリプト追加（RUN_ID=`20251214T031229Z`）

- RUN_ID: `20251214T031229Z`（親 RUN: `20251214T022944Z`）
- 作業種別: module_json Flyway マイグレーション追加
- 期間: 2025-12-17 09:00 〜 2025-12-18 09:00 (JST)

## 参照チェーン
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/Flywayスクリプト追加.md`

## 実施内容
- `d_module.beanBytes` の NOT NULL 制約を解除し、`bean_json` 列を追加する Flyway マイグレーション `V0225__alter_module_add_json.sql` を作成。
- マイグレーションを CLI 用 `server-modernized/tools/flyway/sql/` と runtime 用 `server-modernized/src/main/resources/db/migration/` の双方へ配置。

## 変更ファイル
- `server-modernized/tools/flyway/sql/V0225__alter_module_add_json.sql`
- `server-modernized/src/main/resources/db/migration/V0225__alter_module_add_json.sql`
- `src/modernization/module_json/Flywayスクリプト追加.md`

## テスト
- なし（DDL 追加のみ、Flyway migrate 未実行）

## 次のアクション
- module_json 系タスクで Flyway migrate 実行時に `flyway_schema_history` への適用を確認し、必要なら `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へ証跡を保存する。
