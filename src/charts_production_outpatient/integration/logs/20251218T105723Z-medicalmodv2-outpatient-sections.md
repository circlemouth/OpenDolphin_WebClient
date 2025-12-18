# 証跡ログ: 42 `/orca21/medicalmodv2/outpatient` 表示セクション分割（医療記録）

- RUN_ID: `20251218T105723Z`
- 対象: Charts（外来・本番品質）/ 外来医療記録のセクション分割表示
- 成果物: `src/charts_production_outpatient/integration/42_medicalmodv2_outpatient表示セクション分割.md`

---

## 実施内容
1. Charts に「医療記録」カードを追加し、診断/処方/検査/処置/メモの 5 セクションで表示できるようにした。  
2. セクションごとに `SUCCESS/MISSING/ERROR/PARTIAL` を扱い、欠落やエラーがあっても他セクションを表示して全体停止を避けるようにした。  
3. `recordsReturned/outcome` を UI（OrcaSummary/医療記録カード）と監査ログ（`logUiState`/`logAuditEvent`）へ反映した。  
4. MSW fixture を更新し、`fallbackUsed`/`missingMaster` で部分欠落/エラーを再現できるようにした。  

---

## 変更点（主要ファイル）
- `web-client/src/features/charts/pages/ChartsPage.tsx`（医療記録カード追加）
- `web-client/src/features/charts/MedicalOutpatientRecordPanel.tsx`（新規）
- `web-client/src/features/charts/medicalOutpatient.ts`（新規：パース/集計）
- `web-client/src/features/charts/api.ts`（監査ログ・outcome 補完）
- `web-client/src/features/charts/OrcaSummary.tsx`（outcome/requestId 表示）
- `web-client/src/mocks/fixtures/outpatient.ts`（medical fixture を sections/outcome 対応）
- `web-client/src/features/charts/styles.ts`（医療記録パネルのスタイル追加）

---

## 検証
- ユニットテスト: `npm -C web-client test` を実行し成功（`medicalOutpatient.test.ts` 追加）。
- MSW fixture で `fallbackUsed=true` のとき、処方=未取得、検査=エラー表示、overall=PARTIAL になることを確認できる状態にした。

---

## 監査ログ（期待する観測ポイント）
- `window.__AUDIT_UI_STATE__`:
  - `action='outpatient_fetch'` の `details.outcome` と `details.recordsReturned`
- `window.__AUDIT_EVENTS__`:
  - `payload.action='ORCA_MEDICAL_OUTPATIENT_FETCH'`
  - `payload.details.recordsReturned/outcome/sectionOutcomes/sourcePath/httpStatus`

