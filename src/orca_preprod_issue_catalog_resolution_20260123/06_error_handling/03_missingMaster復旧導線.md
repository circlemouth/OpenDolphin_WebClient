# 03_missingMaster復旧導線

- RUN_ID: 20260126T100939Z
- 作業日: 2026-01-26
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/03_missingMaster復旧導線.md
- 対象IC: IC-47
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md
  - docs/web-client/architecture/future-web-client-design.md

## 実施内容
- missingMaster/fallbackUsed の復旧導線を「再取得 / Reception / 管理者共有」に統一し、共通文言を定義した。
- 復旧ガイド UI（MissingMasterRecoveryGuide）を追加し、Charts/Patients の警告表示に適用した。
- Tone/StatusBadge/出力ガードの nextAction を共通ステップに更新し、フォールバック時の案内を画面横断で統一した。

## 変更ファイル
- web-client/src/features/shared/missingMasterRecovery.ts
- web-client/src/features/shared/MissingMasterRecoveryGuide.tsx
- web-client/src/ux/charts/tones.ts
- web-client/src/features/shared/StatusBadge.tsx
- web-client/src/features/charts/DocumentTimeline.tsx
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/features/charts/OrcaSummary.tsx
- web-client/src/features/charts/ChartsActionBar.tsx
- web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx
- web-client/src/features/charts/pages/ChartsDocumentPrintPage.tsx
- web-client/src/features/reception/pages/ReceptionPage.tsx
- web-client/src/features/outpatient/OutpatientMockPage.tsx
- web-client/src/features/patients/PatientsPage.tsx

## 検証
- 実行コマンド:
  - npm --prefix web-client test -- src/features/charts/__tests__/chartsAccessibility.test.tsx src/features/patients/__tests__/PatientsPage.test.tsx
- 結果: パス
