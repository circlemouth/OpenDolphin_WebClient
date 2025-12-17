# 証跡ログ: 41 `/api01rv2/appointment/outpatient/*` 統合（予約/来院）

- RUN_ID: `20251217T234312Z`
- 対象: `web-client`（Charts/Reception の予約/来院データ統合）
- 参照: `src/charts_production_outpatient/integration/41_appointment_outpatient統合.md`

---

## 実施内容
1. `slots/reservations/visits` を `ReceptionEntry` に正規化し、`visits.voucherNumber` を `receptionId` として保持。
2. 重複排除（visits > slots > reservations）を追加し、Charts が参照する患者行を安定化。
3. 空データ時に **サンプル注入してしまう挙動**を廃止（MSW fixture のみがサンプル提供）。
4. 予約/来院データの未取得/不整合の表示を `tone=info/warning` に統一し、Charts 複数ビューで共通利用。
5. 頻発操作（予約変更/キャンセル）は Charts から Reception へ遷移する導線として実装し、`intent` バナーで目的を明示。

---

## 変更点（主要ファイル）
- `web-client/src/features/outpatient/types.ts`
- `web-client/src/features/outpatient/transformers.ts`
- `web-client/src/features/reception/api.ts`
- `web-client/src/features/outpatient/appointmentDataBanner.ts`
- `web-client/src/features/charts/pages/ChartsPage.tsx`
- `web-client/src/features/charts/DocumentTimeline.tsx`
- `web-client/src/features/charts/PatientsTab.tsx`
- `web-client/src/features/charts/audit.ts`
- `web-client/src/features/reception/pages/ReceptionPage.tsx`
- `web-client/src/mocks/fixtures/outpatient.ts`

---

## 検証
- `npm --prefix web-client run typecheck` → OK
- `npm --prefix web-client run test` → OK（`src/features/charts/__tests__/chartsAccessibility.test.tsx`）

---

## 補足
- `npm ci` は lockfile 不整合のため失敗したため、`npm install --cache ./tmp/npm-cache` で `web-client/package-lock.json` を同期してから検証を実施。

