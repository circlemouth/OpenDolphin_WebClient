# タスク前提ドキュメント一覧（ORCA 実運用前・実装棚卸し）

- 作成日: 2026-01-22
- RUN_ID: 20260122T102944Z
- 対象ガント: `.kamui/apps/orca-preprod-implementation-issue-inventory-plan-20260122.yaml`
- 目的: 各タスクの前提ドキュメントを明文化し、棚卸し時に参照すべき根拠へ直結させる。
- 注意: Phase2 文書は Legacy/Archive。**現行ルールの正本ではない**が、実施証跡として参照する場合がある。

---

## 00_context/00_RUN_IDとスコープ固定
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/00_context/00_RUN_IDとスコープ固定.md`
- 参照（正本）:
  - `docs/DEVELOPMENT_STATUS.md`
  - `AGENTS.md`
  - `setup-modernized-env.sh`
- 参照（補助）:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`

---

## 01_webclient_review/01_画面遷移と患者フロー棚卸し
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/01_画面遷移と患者フロー棚卸し.md`
- 参照（正本）:
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`
  - `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`
  - `docs/web-client/architecture/web-client-navigation-hardening-prerequisites-20260119.md`
- 参照（補助）:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`
  - `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`

## 01_webclient_review/02_APIクライアントと型整合棚卸し
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/02_APIクライアントと型整合棚卸し.md`
- 参照（正本）:
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `docs/server-modernization/api-architecture-consolidation-plan.md`
  - `docs/web-client-orca-additional-api-plan.md`
- 参照（補助）:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `docs/server-modernization/api-architecture-consolidation-plan.md`

## 01_webclient_review/03_監査ログと権限ガードUI棚卸し
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/03_監査ログと権限ガードUI棚卸し.md`
- 参照（正本）:
  - `docs/web-client/architecture/future-web-client-design.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`

## 01_webclient_review/04_エラーハンドリングと復旧導線
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/04_エラーハンドリングと復旧導線.md`
- 参照（正本）:
  - `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`
  - `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`
- 参照（補助）:
  - `docs/web-client/planning/phase2/logs/20251217T125828Z-charts-error-handling.md`（Legacy）

## 01_webclient_review/05_同期キャッシュとリアルタイム更新
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/05_同期キャッシュとリアルタイム更新.md`
- 参照（正本）:
  - `docs/web-client/architecture/doctor-workflow-status-20260120.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `docs/web-client/architecture/future-web-client-design.md`

---

## 02_server_modernized_review/01_API実装一覧と仕様差分
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/01_API実装一覧と仕様差分.md`
- 参照（正本）:
  - `docs/server-modernization/api-architecture-consolidation-plan.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
- 参照（補助）:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `docs/server-modernization/api-architecture-consolidation-plan.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`

## 02_server_modernized_review/02_ドメインモデルとDB永続化整合性
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/02_ドメインモデルとDB永続化整合性.md`
- 参照（正本）:
  - `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`
  - `docs/server-modernization/rest-api-modernization.md`
- 参照（補助）:
  - `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
  - `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md`

## 02_server_modernized_review/03_入力バリデーションとエラー変換
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/03_入力バリデーションとエラー変換.md`
- 参照（正本）:
  - `src/validation/入力バリデーション妥当性確認.md`
  - `src/validation/入力バリデーション差分再確認と文書更新.md`
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `src/validation/入力バリデーション妥当性確認.md`
  - `src/validation/入力バリデーション差分再確認と文書更新.md`

## 02_server_modernized_review/04_監査ログとトレーサビリティ
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/04_監査ログとトレーサビリティ.md`
- 参照（正本）:
  - `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`

## 02_server_modernized_review/05_バッチキューとイベント処理
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/05_バッチキューとイベント処理.md`
- 参照（正本）:
  - `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md`
  - `src/modernized_review/モダナイズ版実装範囲整理.md`
- 参照（補助）:
  - `src/validation/ORCA実環境連携検証.md`

---

## 03_orca_integration_review/01_ORCA公式APIカバレッジ
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/01_ORCA公式APIカバレッジ.md`
- 参照（正本）:
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `docs/web-client-orca-additional-api-plan.md`
- 参照（補助）:
  - `docs/server-modernization/phase2/operations/logs/20260111T213428Z-orca-trial-coverage.md`（Legacy）
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `docs/server-modernization/phase2/operations/logs/20260111T213428Z-orca-trial-coverage.md`（Legacy）
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`

## 03_orca_integration_review/02_XMLプロキシと変換ロジック
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/02_XMLプロキシと変換ロジック.md`
- 参照（正本）:
  - `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
  - `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`
- 参照（補助）:
  - `docs/DEVELOPMENT_STATUS.md`
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
  - `docs/DEVELOPMENT_STATUS.md`

## 03_orca_integration_review/03_JSONラッパーと内製ラッパー
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/03_JSONラッパーと内製ラッパー.md`
- 参照（正本）:
  - `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
  - `src/orca_wrapper_json/02_患者同期_JSONラッパー実装.md`
  - `src/orca_internal_wrapper/04_ORCA内製ラッパー_stub混在対応.md`
- 完了根拠:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
  - `src/orca_wrapper_json/02_患者同期_JSONラッパー実装.md`
  - `src/orca_internal_wrapper/04_ORCA内製ラッパー_stub混在対応.md`

## 03_orca_integration_review/04_マスタ同期とキャッシュ戦略
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/04_マスタ同期とキャッシュ戦略.md`
- 参照（正本）:
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
- 参照（補助）:
  - `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`（Legacy）

## 03_orca_integration_review/05_認証接続設定と環境切替
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/05_認証接続設定と環境切替.md`
- 参照（正本）:
  - `setup-modernized-env.sh`
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `docs/web-client/operations/debugging-outpatient-bugs.md`
- 参照（補助）:
  - `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md`（正本）
  - `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（Legacy）

---

## 04_data_quality_review/01_初期データとマイグレーション
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/04_data_quality_review/01_初期データとマイグレーション.md`
- 参照（正本）:
  - `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`
  - `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
- 参照（補助）:
  - `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md`
  - `src/validation/ORCA実環境連携検証.md`

## 04_data_quality_review/02_トランザクション境界と整合性
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/04_data_quality_review/02_トランザクション境界と整合性.md`
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
- 参照（補助）:
  - `docs/server-modernization/phase2/notes/domain-transaction-parity.md`（Legacy）

## 04_data_quality_review/03_参照整合とID採番制約
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/04_data_quality_review/03_参照整合とID採番制約.md`
- 参照（正本）:
  - `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
  - `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md`
- 参照（補助）:
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_前提ドキュメント整備.md`

---

## 05_testing_review/01_テストカバレッジと未実施一覧
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/01_テストカバレッジと未実施一覧.md`
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`

## 05_testing_review/02_E2E診療シナリオ棚卸し
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/02_E2E診療シナリオ棚卸し.md`
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
  - `src/validation/ORCA実環境連携検証.md`
  - `docs/web-client/operations/reception-billing-flow-status-20260120.md`

## 05_testing_review/03_性能負荷と回復性テスト
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/03_性能負荷と回復性テスト.md`
- 参照（正本）:
  - `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`
  - `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`

## 05_testing_review/04_テストデータと自動化基盤
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/04_テストデータと自動化基盤.md`
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
- 参照（補助）:
  - `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
  - `ops/db/local-baseline/local_synthetic_seed.sql`

---

## 06_docs_consolidation/01_問題点カタログ統合
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/06_docs_consolidation/01_問題点カタログ統合.md`
- 参照（正本）:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- 参照（補助）:
  - 各棚卸し成果物（`docs/preprod/implementation-issue-inventory/*.md`）

## 06_docs_consolidation/02_優先度別バックログ
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/06_docs_consolidation/02_優先度別バックログ.md`
- 参照（正本）:
  - `docs/preprod/implementation-issue-inventory/issue-catalog.md`（前タスク成果物）
  - `src/webclient_productionization/02_本番運用DoDと受け入れ基準.md`
- 参照（補助）:
  - `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`

## 06_docs_consolidation/03_修正ロードマップ
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/06_docs_consolidation/03_修正ロードマップ.md`
- 参照（正本）:
  - `docs/preprod/implementation-issue-inventory/prioritized-backlog.md`（前タスク成果物）
  - `src/implementation_planning/後続実装タスク分割とロードマップ.md`

## 06_docs_consolidation/04_実装着手チェックリスト
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/06_docs_consolidation/04_実装着手チェックリスト.md`
- 参照（正本）:
  - `docs/preprod/implementation-issue-inventory/roadmap.md`（前タスク成果物）
  - `src/predeploy_readiness/00_inventory/開発ドキュメント総点検.md`
  - `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`
  - `src/predeploy_readiness/01_api_implementation/監査・ログAPI要件ドキュメント整備.md`
