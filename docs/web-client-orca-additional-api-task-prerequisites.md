# Webクライアント ORCA 追加API タスク前提ドキュメント

更新日: 2026-01-13
RUN_ID: 20260113T072212Z

## 目的
`docs/web-client-orca-additional-api-plan.md` に基づく各タスクの前提ドキュメント/参照先を整理し、実装時の迷いと重複作業を防止する。

## 共通前提
- 最新状況は `docs/DEVELOPMENT_STATUS.md` を正とする。
- 追加 API 仕様は `docs/server-modernization/orca-additional-api-implementation-notes.md` を正とする。
- ORCA 接続は `server-modernized` 経由で実施（Webクライアント直叩き禁止）。
- 監査/観測: `httpFetch` + `observability` + `auditLogger` を継承する。

## タスク別前提

### 01_API共通ユーティリティ設計
- 仕様/方針: `docs/server-modernization/orca-additional-api-implementation-notes.md`
- 参照コード: `web-client/src/libs/xml/xmlUtils.ts`, `web-client/src/libs/http/httpClient.ts`
- 既存の runId/traceId 付与規約: `web-client/src/libs/observability/*`

### 02_Patients画面追加API連携
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/features/patients/PatientsPage.tsx`, `web-client/src/features/patients/patientMemoApi.ts`, `web-client/src/features/patients/api.ts`
- 検証導線: `web-client/src/features/debug/OrcaApiConsolePage.tsx`

### 03_Charts原本と送信フロー拡張
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/features/charts/OrcaOriginalPanel.tsx`, `web-client/src/features/charts/ChartsActionBar.tsx`
- 既存 API: `web-client/src/features/charts/orcaDiseaseGetApi.ts`, `web-client/src/features/charts/orcaMedicalGetApi.ts`, `web-client/src/features/charts/orcaMedicalModApi.ts`

### 04_ChartsSOAP_オーダー_会計拡張
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/features/charts/soap/*`, `web-client/src/features/charts/OrderBundleEditPanel.tsx`, `web-client/src/features/charts/OrcaSummary.tsx`
- UI トーン統一: `web-client/src/features/charts/ChartsActionBar.tsx`

### 05_Administrationマスタ_システム連携
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/features/administration/*`
- 追加 API 仕様: `docs/server-modernization/orca-additional-api-implementation-notes.md`

### 06_Reception_Charts_PUSH通知連携
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/features/outpatient/orcaQueueStatus.ts`, `web-client/src/features/outpatient/orcaQueueApi.ts`
- 既存 UI トーン: `web-client/src/features/charts/DocumentTimeline.tsx`

### 07_Charts帳票出力_blobapi連携
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx`, `web-client/src/features/charts/pages/ChartsDocumentPrintPage.tsx`, `web-client/src/features/charts/printPreviewStorage.ts`
- API 仕様: `docs/server-modernization/orca-additional-api-implementation-notes.md`

### 08_MSWとUIテスト追加
- 計画: `docs/web-client-orca-additional-api-plan.md`
- 参照コード: `web-client/src/mocks/handlers/*`, `web-client/src/features/charts/*`, `web-client/src/features/patients/*`
- 既存テスト実装: `tests/`, `web-client/src/**/__tests__/*`
