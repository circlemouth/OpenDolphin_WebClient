# ORCA-05/06/08 スキーマドリフト報告テンプレート
- RUN_ID: `20251124T214500Z`（親 `20251124T000000Z`）
- 実行者: 未実行（DSN 未提供）
- 実行環境: 未実行（接続先待ち）
- 比較対象: DB 実体 vs 定義書(2024-04-26) vs OpenAPI `orca-master-orca05-06-08.yaml`
- 出力ファイル: `schema-drift/results/<RUN_ID>-*.{csv,json}`

## サマリ
- 実施日時: 未実施（DSN 不明のため保留）
- 対象マスター: ORCA-05 / ORCA-06 / ORCA-08
- 総件数: missing= / extra= / type= / nullability= / default= / validity=
- 判定: PENDING
- 次アクション: 接続情報を受領後に `check_orca05/06/08_columns.sql` を実行し CSV/JSON を本 RUN_ID 名で保存

## 差分一覧
| master | table_name | column_name | diff_kind | expected_type | actual_type | expected_len | actual_len | expected_nullable | actual_nullable | expected_default | actual_default | source_version | 優先度 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORCA-05 |  |  |  |  |  |  |  |  |  |  |  | 2024-04-26 |  |

> 差分はテンプレート出力を貼り付けて利用（CSV→表変換または JSON を要約）

## 影響と対応
- UI/監査影響: 
- API/DTO 影響: 
- データ移行・seed 影響: 
- 推奨対応優先度: P0/P1/P2
- 依存タスク/オーナー: 

## エビデンス
- psql コマンド:  
- 出力ファイル: `artifacts/api-stability/20251124T161500Z/schema-drift/results/`
- ログ追記先: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md`
