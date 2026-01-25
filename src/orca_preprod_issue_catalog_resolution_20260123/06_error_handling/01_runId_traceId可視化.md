# 01_runId_traceId可視化

- RUN_ID: 20260125T084729Z
- 作業日: 2026-01-25
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/01_runId_traceId可視化.md
- 対象IC: IC-48
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md
  - docs/web-client/architecture/web-client-api-mapping.md

## 実施内容
- ApiFailureBanner のエラーバナーに runId/traceId を表示し、data-trace-id を付与した。
- エラーバナーから runId/traceId をコピーできる「ログ共有」CTA を追加した。
- クリップボード共有処理を共通化し、RUN_ID 以外のログIDも共有できるようにした。

## 変更ファイル
- web-client/src/features/shared/ApiFailureBanner.tsx
- web-client/src/features/reception/components/ToneBanner.tsx
- web-client/src/libs/observability/observability.ts
- web-client/src/libs/observability/runIdCopy.ts

## 検証
- 実行コマンド:
  - npm test -- chartsAccessibility.test.tsx
- 結果: パス
