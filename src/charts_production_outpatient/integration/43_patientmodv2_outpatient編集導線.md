# 43 `/orca12/patientmodv2/outpatient` 編集導線（患者更新）

- RUN_ID: `20251218T115400Z`（親 RUN_ID=`20251212T130647Z`）
- 期間: 2026-01-20 09:00 〜 2026-01-24 09:00（JST） / 優先度: medium / 緊急度: low / エージェント: codex
- YAML ID: `src/charts_production_outpatient/integration/43_patientmodv2_outpatient編集導線.md`
- 証跡: `src/charts_production_outpatient/integration/logs/20251218T115400Z-patientmodv2-outpatient-edit.md`

## 目的
- Charts の患者サイドペインから、患者基本/保険情報を **安全に** 更新できる導線を整備する。
- `/orca12/patientmodv2/outpatient` 更新で `operation=create/update/delete` を監査ログへ残す。
- 失敗時の巻き戻し/再試行と、入力検証・エラー表示（`role=alert`）を統一する。

## 実装（要点）
### 1) Charts → 患者更新導線
- `web-client/src/features/charts/PatientsTab.tsx` に「基本を編集（Charts）」「保険を編集（Charts）」を追加。
- ガード条件:
  - role（受付系のみ可）
  - 受付ステータス（会計待ち以降は不可）
  - tone ガード（`missingMaster`/`fallbackUsed`/`dataSourceTransition!=server`）
  - Charts の患者切替ロック中（`switchLocked`）・未保存ドラフト（`draftDirty`）
- `FocusTrapDialog` で編集→差分確認→保存の 2 ステップ。

### 2) 監査ログ（operation/差分キー）
- `web-client/src/features/patients/api.ts` の `savePatient()` を強化。
  - 送信 body に `operation` と `auditEvent`（source/section/changedKeys など）を付与。
  - `logAuditEvent()` / `logUiState()` / telemetry を API 層で必ず実行し、成功/失敗の両方を記録。

### 3) 巻き戻し/再試行
- Charts ダイアログ:
  - 変更を「編集開始時点」へ巻き戻すボタンを提供。
  - 失敗後に「直前の内容で再試行」を提供（監査/telemetry へも記録）。
- Patients 画面:
  - 失敗時に「再試行」「巻き戻し（直近取得値へ復元）」「再取得」を提供。

### 4) 入力検証・エラー表示統一
- `validatePatientMutation()`（`web-client/src/features/patients/patientValidation.ts`）で形式/必須/マスタ依存（masterOk）を統一。
- `PatientFormErrorAlert`（`role=alert`）でフォームエラーの見せ方とフォーカス誘導を統一。

## DoD（最低限）
- Charts から患者基本/保険更新の導線がある（ガード含む）。
- 差分確認を通らないと保存できない。
- `operation` と `changedKeys` が監査ログへ残る（Charts の保存履歴で追える）。
- エラー表示は `role=alert` で統一され、フィールドフォーカスへ誘導できる。

