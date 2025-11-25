# ORCA-05/06/08 スキーマドリフト監視ドラフト

- RUN_ID: `20251124T161500Z`（親=`20251124T000000Z`）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 本ドキュメント
- 対象: ORCA マスター系（ORCA-05 薬効/最低薬価/用法/特定器材/検査分類、ORCA-06 保険者・住所、ORCA-08 電子点数表）における **DB 実スキーマ** と **定義書(2024-04-26)**、**OpenAPI 正式版 `orca-master-orca05-06-08.yaml`** の乖離検出
- 関連資産:  
  - 定義書 PDF: `docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/database-table-definition-edition-20240426.pdf`  
  - OpenAPI: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`  
  - Drift チェック用 SQL 雛形: `artifacts/api-stability/20251124T161500Z/schema-drift/templates/`  
  - レポート雛形: `artifacts/api-stability/20251124T161500Z/schema-drift/schema-drift-report.md`

## 1. 目的とゴール
- DB 実体（`information_schema`/`pg_catalog`）と定義書・OpenAPI の差異を定期検知し、**不足カラム/余剰カラム/型・桁長・NOT NULL・デフォルト差分/有効期間カラム欠落**を把握する。
- 差異を優先度付きでエスカレーションし、OpenAPI/実装/seed/テストのどこを修正すべきか即時判断できる状態にする。
- 出力は CSV/JSON いずれかで保存し、RUN_ID を一意キーとして証跡ディレクトリに残す。

## 2. 判定軸と優先度
| diff_kind | 内容 | 優先度 | 初期対応 |
| --- | --- | --- | --- |
| missing_column | 定義書/OPENAPI にあるカラムが DB に存在しない | P0 | サーバー実装/DDL のブロッカー。即エスカレート |
| extra_column | DB に余剰カラムが存在（定義書/OPENAPI 不在） | P1 | 影響調査。OpenAPI 追記 or DDL クリーンアップを検討 |
| type_mismatch | 型/精度/スケール/桁長の不一致 | P0 | Cast が必要か、DDL/DTO どちらを正とするか合意する |
| nullability_mismatch | NOT NULL/NULL 差分 | P0 | UI/監査で必須制約が変わるため、即調整 |
| default_mismatch | デフォルト値差分 | P1 | 監査/TTL に影響。必要ならマイグレーション |
| validity_missing | `valid_from`/`valid_to` 等有効期間カラム欠落 | P0 | マスタ切替の追跡不可。追加が必要 |

## 3. 実行手順（共通）
1. **パラメータ設定**  
   - `\set run_id 20251124T161500Z`  
   - `\set schema orca`（環境に応じて変更）  
   - `\set output './results/<RUN_ID>-orca05.csv'` など  
2. **テンプレート実行**  
   - `psql -v run_id=$RUN_ID -v schema=orca -f artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca05_columns.sql > $OUTPUT`
   - ORCA-06/08 も同様に実行。  
3. **結果保管**  
   - 保存先: `artifacts/api-stability/20251124T161500Z/schema-drift/results/`（未作成の場合は事前に作成）  
   - 形式: `\pset format csv` を既定。JSON にしたい場合はテンプレ内 `\pset format json` を有効化。  
4. **レポート作成**  
   - `schema-drift-report.md` のテンプレートへ結果を貼り、影響/対応優先度/担当を記入。  
5. **通知**  
   - DOC_STATUS 備考に RUN_ID と「スキーマドリフト監視 draft」を追記（本 RUN では更新済）。  
   - ログ: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` に RUN セクションを追加。

## 4. 環境別実行例
- **ローカル（mac-dev ORCA）**  
  ```bash
  RUN_ID=20251124T161500Z
  psql "postgres://ormaster:change_me@localhost:5432/orca" \
    -v run_id=$RUN_ID -v schema=public \
    -f artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca05_columns.sql \
    > artifacts/api-stability/$RUN_ID/schema-drift/results/${RUN_ID}-orca05.csv
  ```
- **docker-compose (orca-db コンテナ)**  
  ```bash
  RUN_ID=20251124T161500Z
  docker exec -e PAGER=cat orca-db \
    psql -U ormaster -d orca \
    -v run_id=$RUN_ID -v schema=public \
    -f /workspace/artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca06_columns.sql \
    > artifacts/api-stability/$RUN_ID/schema-drift/results/${RUN_ID}-orca06.csv
  ```
- **CI (psql available)**  
  - 事前に DB 接続情報を CI Secret に設定し、`schema`/`run_id`/出力パスを env 経由で渡す。
  - CI では JSON 出力を推奨（差分可視化のため）。`check_orca08_columns.sql` 冒頭の `\pset format json` を有効化して実行。

## 5. 期待アウトプット形式（共通）
| run_id | master | table_name | column_name | diff_kind | expected_type | actual_type | expected_length | actual_length | expected_nullable | actual_nullable | expected_default | actual_default | source_version |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20251124T161500Z | ORCA-05 | tbl_medical | code | missing_column | varchar(7) | null | 7 | null | NOT NULL | null | null | null | 2024-04-26 |

## 6. リンク
- Drift SQL 雛形: `artifacts/api-stability/20251124T161500Z/schema-drift/templates/`
- レポート雛形: `artifacts/api-stability/20251124T161500Z/schema-drift/schema-drift-report.md`
- OpenAPI/定義書: `docs/server-modernization/phase2/operations/assets/openapi/README.md`
- ブリッジ計画（参照資料への導線）: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`

## 7. 今後の ToDo
- [ ] 定義書 2024-04-26 版から ORCA-05/06/08 各テーブルの期待カラムを SQL 雛形の `expected_columns` CTE に書き出す。
- [ ] CI での JSON 差分比較ジョブを `artifacts/api-stability/<RUN_ID>/schema-drift/results/*.json` に保存するワークフローを追加。
- [ ] OpenAPI 更新時は本計画の `source_version` を同日に更新し、`DOC_STATUS` 備考も同時に差し替える。***
