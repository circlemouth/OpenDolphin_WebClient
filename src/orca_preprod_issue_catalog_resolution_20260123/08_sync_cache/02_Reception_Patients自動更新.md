# 02_Reception_Patients自動更新

- RUN_ID: 20260124T231620Z
- 作業日: 2026-01-24
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/02_Reception_Patients自動更新.md
- 対象IC: IC-50 / IC-51
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/web-client/operations/reception-billing-flow-status-20260120.md
  - docs/web-client/architecture/web-client-api-mapping.md
  - docs/preprod/implementation-issue-inventory/webclient-sync-cache.md

## 実施内容
- Reception/Patients の一覧取得に共通の `refetchInterval` を設定し、放置時の stale 発生を防止した。
- `refetchInterval` と `staleTime` を同一値に統一し、`cacheHit`/`dataSourceTransition` 表示の意味を揃えた。
- 自動更新が止まった場合に警告バナーを表示する共通ルールを追加した。

## 自動更新設計
- 共通間隔: `OUTPATIENT_AUTO_REFRESH_INTERVAL_MS = 90,000`（90秒）
- 対象クエリ:
  - Reception: `/orca/appointments/list`（受付一覧）
  - Reception: `/orca/claim/outpatient`（受付連動フラグ）
  - Patients: `/orca/patients/local-search`（患者一覧）
- `refetchOnWindowFocus=false` を明示し、フォーカス復帰時の再取得は自動更新/手動再取得で統一。
- E2E では `window.__AUTO_REFRESH_INTERVAL_MS__` を設定すると dev 環境のみ間隔を上書きできる。

## UI通知ルール
- `dataUpdatedAt` が 2 * interval を超過し、かつ `isFetching=false` / `isError=false` の場合のみ警告バナーを表示。
- 文言は Reception/Patients 共通で「自動更新が遅れている」ことを通知し、次アクションを「再取得」に統一。

## 変更ファイル
- web-client/src/features/shared/autoRefreshNotice.ts
- web-client/src/features/reception/pages/ReceptionPage.tsx
- web-client/src/features/patients/PatientsPage.tsx

## 検証
- 実行コマンド:
  - npm test -- PatientsPage.test.tsx
  - npm run build
  - npx playwright test tests/e2e/outpatient-auto-refresh-banner.spec.ts
- 結果: パス
