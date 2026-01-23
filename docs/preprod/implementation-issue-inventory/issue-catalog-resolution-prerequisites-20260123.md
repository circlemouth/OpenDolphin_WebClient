# 課題解消ガント 前提ドキュメント一覧（issue-catalog対応）

- 作成日: 2026-01-23
- RUN_ID: 20260123T141232Z
- 対象ガント: `.kamui/apps/orca-preprod-issue-catalog-resolution-plan-20260123.yaml`
- 目的: issue-catalog の解消タスクに対する前提ドキュメントを整理する。

## 共通前提（全タスク共通）
- `docs/preprod/implementation-issue-inventory/issue-catalog.md`
- `docs/DEVELOPMENT_STATUS.md`
- `AGENTS.md`

---

## 00_context/00_issue_catalog_scope
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/00_context/00_issue_catalog_scope.md`
- 追加前提:
  - `docs/preprod/implementation-issue-inventory/issue-catalog.md`
  - `docs/DEVELOPMENT_STATUS.md`

## 01_db_foundation/01_DB初期化基盤整備
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/01_DB初期化基盤整備.md`
- 追加前提:
  - `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`
  - `setup-modernized-env.sh`

## 01_db_foundation/02_FlywayとDDL同期
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/02_FlywayとDDL同期.md`
- 追加前提:
  - `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`

## 01_db_foundation/03_seed拡張
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/03_seed拡張.md`
- 追加前提:
  - `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`
  - `src/validation/E2E_統合テスト実施.md`

## 01_db_foundation/04_Karte前提バリデーション
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/04_Karte前提バリデーション.md`
- 追加前提:
  - `docs/server-modernization/rest-api-modernization.md`
  - `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`

## 01_db_foundation/05_患者冪等性と複合更新
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/05_患者冪等性と複合更新.md`
- 追加前提:
  - `docs/server-modernization/rest-api-modernization.md`
  - `src/validation/入力バリデーション妥当性確認.md`

---

## 02_orca_connection/01_接続先と認証設定統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/02_orca_connection/01_接続先と認証設定統一.md`
- 追加前提:
  - `setup-modernized-env.sh`
  - `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`
  - `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md`

## 02_orca_connection/02_WebORCA判定とdev proxy
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/02_orca_connection/02_WebORCA判定とdev proxy.md`
- 追加前提:
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `docs/web-client/operations/debugging-outpatient-bugs.md`

---

## 03_orca_master/01_マスタ提供範囲と経路統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/03_orca_master/01_マスタ提供範囲と経路統一.md`
- 追加前提:
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_前提ドキュメント整備.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`

## 03_orca_master/02_キャッシュ検証と判定仕様
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/03_orca_master/02_キャッシュ検証と判定仕様.md`
- 追加前提:
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_E2E_証跡.md`

## 03_orca_master/03_実環境フォールバック検証
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/03_orca_master/03_実環境フォールバック検証.md`
- 追加前提:
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_E2E_証跡.md`
  - `docs/web-client/operations/reception-billing-flow-status-20260120.md`

---

## 04_audit_logging/01_監査schema拡張とoutcome正規化
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/04_audit_logging/01_監査schema拡張とoutcome正規化.md`
- 追加前提:
  - `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`

## 04_audit_logging/02_runId付与と送出経路統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/04_audit_logging/02_runId付与と送出経路統一.md`
- 追加前提:
  - `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`

---

## 05_webclient_guard/01_Administrationガード統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/05_webclient_guard/01_Administrationガード統一.md`
- 追加前提:
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`
  - `docs/web-client/architecture/web-client-navigation-hardening-prerequisites-20260119.md`
  - `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`

## 05_webclient_guard/02_ブロック監査と要約統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/05_webclient_guard/02_ブロック監査と要約統一.md`
- 追加前提:
  - `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`
  - `docs/web-client/architecture/future-web-client-design.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`

---

## 06_error_handling/01_runId_traceId可視化
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/01_runId_traceId可視化.md`
- 追加前提:
  - `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`

## 06_error_handling/02_汎用エラー復旧導線
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/02_汎用エラー復旧導線.md`
- 追加前提:
  - `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`
  - `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`

## 06_error_handling/03_missingMaster復旧導線
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/03_missingMaster復旧導線.md`
- 追加前提:
  - `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
  - `docs/web-client/architecture/future-web-client-design.md`

---

## 07_queue_jobs/01_CLAIM送信状態仕様
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/07_queue_jobs/01_CLAIM送信状態仕様.md`
- 追加前提:
  - `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md`
  - `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`

## 07_queue_jobs/02_送信キューliveと再送
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/07_queue_jobs/02_送信キューliveと再送.md`
- 追加前提:
  - `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`

## 07_queue_jobs/03_PHRジョブ運用改善
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/07_queue_jobs/03_PHRジョブ運用改善.md`
- 追加前提:
  - `src/touch_adm_phr/06_Touch_ADM_PHR_API整備.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`

## 07_queue_jobs/04_ChartEvent履歴永続化
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/07_queue_jobs/04_ChartEvent履歴永続化.md`
- 追加前提:
  - `docs/web-client/architecture/doctor-workflow-status-20260120.md`
  - `docs/web-client/architecture/future-web-client-design.md`

---

## 08_sync_cache/01_AdminBroadcast整合と再描画
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/01_AdminBroadcast整合と再描画.md`
- 追加前提:
  - `docs/web-client/architecture/doctor-workflow-status-20260120.md`
  - `docs/web-client/architecture/future-web-client-design.md`

## 08_sync_cache/02_Reception_Patients自動更新
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/02_Reception_Patients自動更新.md`
- 追加前提:
  - `docs/web-client/operations/reception-billing-flow-status-20260120.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`

## 08_sync_cache/03_masterSource切替キャッシュ更新
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/03_masterSource切替キャッシュ更新.md`
- 追加前提:
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `docs/web-client/architecture/doctor-workflow-status-20260120.md`

## 08_sync_cache/04_queueStatus画面間統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/04_queueStatus画面間統一.md`
- 追加前提:
  - `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md`
  - `docs/web-client/architecture/doctor-workflow-status-20260120.md`

---

## 09_test_data_validation/01_再現用seedデータ整備
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/01_再現用seedデータ整備.md`
- 追加前提:
  - `src/validation/E2E_統合テスト実施.md`
  - `src/validation/ORCA実環境連携検証.md`

## 09_test_data_validation/02_ORCAデータ準備手順
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/02_ORCAデータ準備手順.md`
- 追加前提:
  - `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`
  - `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md`

## 09_test_data_validation/03_MSW差分吸収
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/03_MSW差分吸収.md`
- 追加前提:
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `src/validation/E2E_統合テスト実施.md`

## 09_test_data_validation/04_証跡保存フォーマット統一
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/04_証跡保存フォーマット統一.md`
- 追加前提:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/DEVELOPMENT_STATUS.md`

## 09_test_data_validation/05_E2E_CI自動化
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/05_E2E_CI自動化.md`
- 追加前提:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/web-client/operations/reception-billing-flow-status-20260120.md`

## 09_test_data_validation/06_性能指標と負荷計画
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/06_性能指標と負荷計画.md`
- 追加前提:
  - `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`
  - `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`

## 09_test_data_validation/07_回復性テスト計画
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/07_回復性テスト計画.md`
- 追加前提:
  - `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`
  - `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`

## 09_test_data_validation/08_追加API実環境テスト
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/08_追加API実環境テスト.md`
- 追加前提:
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `docs/web-client-orca-additional-api-plan.md`

## 09_test_data_validation/09_XMLプロキシ実環境テスト
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/09_XMLプロキシ実環境テスト.md`
- 追加前提:
  - `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
  - `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`

## 09_test_data_validation/10_JSON内製ラッパー実環境テスト
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/10_JSON内製ラッパー実環境テスト.md`
- 追加前提:
  - `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
  - `src/orca_internal_wrapper/04_ORCA内製ラッパー_stub混在対応.md`

## 09_test_data_validation/11_主要E2E証跡
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/11_主要E2E証跡.md`
- 追加前提:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/web-client/operations/reception-billing-flow-status-20260120.md`

## 09_test_data_validation/12_病名処方オーダーCRUD証跡
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/12_病名処方オーダーCRUD証跡.md`
- 追加前提:
  - `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`
  - `src/validation/ORCA実環境連携検証.md`

## 09_test_data_validation/13_会計帳票PDF証跡
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/13_会計帳票PDF証跡.md`
- 追加前提:
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `src/validation/ORCA実環境連携検証.md`

## 09_test_data_validation/14_例外系フロー証跡
- 対象タスク: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/14_例外系フロー証跡.md`
- 追加前提:
  - `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`
  - `src/validation/ORCA実環境連携検証.md`
