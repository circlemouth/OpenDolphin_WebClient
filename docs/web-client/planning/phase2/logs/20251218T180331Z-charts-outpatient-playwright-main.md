# Charts 外来カルテ主要シナリオ Playwright 実装ログ（RUN_ID=`20251218T180331Z`）

## 目的
- 受付→Charts→患者確認→送信→会計 の主要導線を自動化し、`dataSourceTransition` と tone（aria-live）が仕様通り伝播することを MSW ON/OFF 両方で確認可能にする。
- missingMaster / cacheHit / fallbackUsed を fixture から切り替え、送信ボタンと会計 CTA がガード理由を `data-disabled-reason` に保持することを検証する。
- 失敗時の HAR/スクリーンショット/runId を同一パスに残す（`artifacts/webclient/e2e/<RUN_ID>/<mode>/`）。

## 実装
### 1) Playwright シナリオ追加
- `tests/e2e/charts-outpatient-mainflow.spec.ts`
  - `cacheHit/server`・`missingMaster/snapshot`・`fallback/fallback` の3パターンをパラメータ化。
  - Reception meta → Charts topbar meta の `data-*` 属性（runId/transition/cacheHit/missingMaster/fallbackUsed）を確認。
  - ToneBanner の `aria-live` が tone に応じて `polite` / `assertive` となることを確認。
  - 送信ボタン: 有効ケースは confirm→toast.detail に `transition=` を確認。ガードケースは `data-disabled-reason` に missing/fallback が含まれることを確認。
  - 会計 CTA: 有効ケースはクリックで Reception（`section=billing`）へ戻ること、ガードケースは disabled + 理由保持を確認。

### 2) MSW ON/OFF 両対応
- MSW ON: `x-msw-scenario` と `__OUTPATIENT_SCENARIO__.update({ runId })` で RUN_ID を注入、Reception の「再取得」で meta を更新。`X-Run-Id`/`X-Trace-Id` も全リクエストへ付与。
- MSW OFF: Playwright `route.fulfill` で `/api01rv2/claim/` `/api01rv2/appointment/` `/api01rv2/patient/` `/orca21/medicalmodv2/` `/api/orca/queue` をスタブし、同じ3パターンを再現（患者/受付/診療日を含む）。

### 3) 証跡運用
- 共通フィクスチャ（`tests/playwright/fixtures.ts`）が HAR/スクリーンショットを `artifacts/webclient/e2e/20251218T180331Z/<mode>/` へ保存（成功時も最終スクリーンショットを保存、runtime-errors を attachment 出力）。

## 使い方
- MSW ON: `RUN_ID=20251218T180331Z npm run test -- charts-outpatient-mainflow`
- MSW OFF: `RUN_ID=20251218T180331Z VITE_DISABLE_MSW=1 PLAYWRIGHT_DISABLE_MSW=1 npm run test -- charts-outpatient-mainflow`
- 失敗時は該当 mode 配下の HAR + screenshots + runtime-errors を添付して報告する。

## 関連ドキュメント
- 手順/期待値: `src/charts_production_outpatient/quality/50_Playwright外来カルテ主要シナリオ.md`
