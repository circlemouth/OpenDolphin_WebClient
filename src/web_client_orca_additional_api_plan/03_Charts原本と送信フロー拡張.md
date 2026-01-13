# 03 Charts原本と送信フロー拡張

- RUN_ID: `20260113T080259Z`
- 期間: 2026-01-15 17:00 〜 2026-01-17 17:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/web_client_orca_additional_api_plan/03_Charts原本と送信フロー拡張.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-orca-additional-api-plan.md`
- `docs/web-client/architecture/orca-disease-api-mapping.md`
- `docs/server-modernization/orca-additional-api-implementation-notes.md`
- `web-client/src/features/charts/OrcaOriginalPanel.tsx`
- `web-client/src/features/charts/orcaMedicalGetApi.ts`
- `web-client/src/features/charts/orcaMedicalModApi.ts`
- `web-client/src/features/charts/orcaDiseaseGetApi.ts`
- `web-client/src/features/charts/ChartsActionBar.tsx`

---

## 1. 目的
- Charts の ORCA 原本パネルを拡張し、**tmedicalgetv2（中途/最新）**の取得を確認できるようにする。
- 診療終了（finish）時に **medicalmodv23** を追加更新として接続し、監査ログへ結果/blocked 理由を残す。
- 病名編集（`/orca/disease`）と ORCA 原本 API（`diseasegetv2`/`diseasev3`）の対応表を更新する。

---

## 2. 実装方針

### 2-1. 原本パネル（OrcaOriginalPanel）
- `tmedicalgetv2` の XML テンプレを追加。
- `Api_Result`/`missingTags` を ToneBanner で可視化。
- 既存 `diseasegetv2/medicalgetv2` と同様の監査ログ・観測ログを残す。

### 2-2. 診療終了時の追加更新（medicalmodv23）
- `ChartsActionBar` の `finish` 成功後に `medicalmodv23` を追加送信。
- 必須パラメータ（`Patient_ID`/`First_Calculation_Date`/`LastVisit_Date`/`Department_Code`）が欠損する場合は **blocked** として記録し、バナーで理由を表示する。
- `Api_Result`/`missingTags` を監査ログに記録し、異常時は警告バナーを表示する。

### 2-3. 病名対応表
- `docs/web-client/architecture/orca-disease-api-mapping.md` に整理済みの対応表を参照。
- Charts 病名編集の正規経路を明文化し、原本パネルは検証用途であることを強調。

---

## 3. Done 条件
- 原本パネルで `tmedicalgetv2` の取得が可能である。
- `ChartsActionBar` の診療終了後に `medicalmodv23` の追加更新が試行され、blocked 理由がログ/表示に残る。
- 病名対応表ドキュメントが更新済みである。
