# 証跡: 43 `/orca12/patientmodv2/outpatient` 編集導線（患者更新）

- RUN_ID: `20251218T115400Z`（親 RUN_ID=`20251212T130647Z`）
- 目的: Charts 患者サイドペインから患者基本/保険更新を安全に実施（差分確認/監査/巻き戻し/再試行/validation 統一）。
- 対象: Web クライアントのみ（Legacy `server/` は不変更）

## 変更点サマリ
- Charts:
  - PatientsTab に「基本を編集（Charts）」「保険を編集（Charts）」を追加し、`FocusTrapDialog` で編集→差分確認→保存を提供。
  - ガード条件（role/受付ステータス/tone/ロック/未保存ドラフト）を満たさない場合は UI でブロック。
- Patients:
  - `savePatient()` を API 層で監査/telemetry/UI state ログを必ず残すように強化（operation/changedKeys/endpoint/status を details に格納）。
  - 入力検証・エラー表示を共通化し、失敗時の再試行/巻き戻し導線を追加。

## 実装ファイル
- `web-client/src/features/charts/PatientsTab.tsx`
- `web-client/src/features/charts/PatientInfoEditDialog.tsx`
- `web-client/src/features/patients/api.ts`
- `web-client/src/features/patients/patientValidation.ts`
- `web-client/src/features/patients/patientDiff.ts`
- `web-client/src/features/patients/PatientFormErrorAlert.tsx`
- `web-client/src/features/patients/PatientsPage.tsx`
- `web-client/src/features/charts/styles.ts`
- `web-client/src/features/patients/patients.css`

## テスト
- Unit: `npm -C web-client test`

## 補足
- 本 RUN では ORCA 実環境接続や server-modernized の操作は実施していない（接続ログは不要）。

