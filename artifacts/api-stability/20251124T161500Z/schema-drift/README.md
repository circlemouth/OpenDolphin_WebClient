# Schema Drift Check (ORCA-05/06/08) — RUN_ID=20251124T161500Z

本ディレクトリは ORCA マスター系（ORCA-05/06/08）の **DB 実スキーマ** と **定義書 2024-04-26** / **OpenAPI 正式版** の乖離検出用テンプレートを集約する。

## 構成
- `templates/check_orca05_columns.sql` — 薬効/最低薬価/用法/特定器材/検査分類向け
- `templates/check_orca06_columns.sql` — 保険者・住所向け
- `templates/check_orca08_columns.sql` — 電子点数表向け
- `schema-drift-report.md` — 結果貼り付け用 Markdown 雛形

## 使い方（共通）
1. パラメータをセット  
   ```psql
   \set run_id 20251124T161500Z
   \set schema public      -- 接続先スキーマに合わせて変更
   ```
2. 実行  
   ```bash
   psql -v run_id=$RUN_ID -v schema=public \
     -f artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca05_columns.sql \
     > artifacts/api-stability/20251124T161500Z/schema-drift/results/${RUN_ID}-orca05.csv
   ```
3. 結果を `results/` 配下へ保存し、`schema-drift-report.md` に貼り付ける。

## 出力形式
- 既定: CSV (`\pset format csv` / `\pset tuples_only on` / `\pset footer off`)
- JSON で欲しい場合は各テンプレート冒頭のコメントに従い `\pset format json` に切り替える。

## 参考
- 計画・優先度: `docs/server-modernization/phase2/operations/orca-master-schema-drift-plan.md`
- OpenAPI: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`
- 定義書 PDF: `docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/database-table-definition-edition-20240426.pdf`
