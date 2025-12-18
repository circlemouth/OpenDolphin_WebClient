# 50 Playwright：外来カルテ主要シナリオ（RUN_ID=`20251218T180331Z`）

- 期間: 2025-01-28 09:00 〜 2025-02-02 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: cursor cli
- YAML ID: `src/charts_production_outpatient/quality/50_Playwright外来カルテ主要シナリオ.md`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ドキュメント

## ゴール
- “受付→Charts→患者確認→送信→会計” の主要導線を Playwright で自動化し、`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed` の透過と tone（aria-live）の仕様通り表示を検証する。
- MSW ON/OFF 双方で同じ RUN_ID を使った証跡（HAR/スクリーンショット/trace）を `artifacts/webclient/e2e/<RUN_ID>/<mode>/` に残す運用を固定する。
- missingMaster / fallbackUsed を fixture で注入し、送信ボタン・会計 CTA のガード理由が UI 属性 (`data-disabled-reason`) に残ることを確認する。

## シナリオ（自動テストで担保）
- `cacheHit=true / dataSourceTransition=server` : tone=info（aria-live=polite）、送信/会計が有効で toast.detail に `transition=server` が残る。
- `missingMaster=true / dataSourceTransition=snapshot` : tone=warning（aria-live=assertive）、送信/会計が disable で `data-disabled-reason` に missing が入る。
- `fallbackUsed=true / dataSourceTransition=fallback` : tone=error（aria-live=assertive）、送信/会計が disable で fallback 理由を保持。

## 自動テスト実装
- テスト: `tests/e2e/charts-outpatient-mainflow.spec.ts`
  - MSW ON: `x-msw-scenario` と `__OUTPATIENT_SCENARIO__.update({runId})` で RUN_ID を注入し、Reception の「再取得」で meta を最新化。送信後の toast に transition/runId が含まれることを確認。
  - MSW OFF: Playwright `route.fulfill` で外来 API（claim/appointment/medical/patient）と `/api/orca/queue` をスタブし、同じ3シナリオを再現。
  - 共通: reception meta / charts topbar meta の `data-*` 属性検証、ToneBanner の `aria-live`、送信ボタン / 会計CTA の guard 属性、会計導線で reception へ戻る URL（`section=billing`）を確認。
- アーティファクト: 共通フィクスチャ（`tests/playwright/fixtures.ts`）が HAR とスクリーンショットを `artifacts/webclient/e2e/<RUN_ID>/<mode>/` に保存（成功時も最終スクリーンショットを保存）。

## 運用・実行手順
1. （MSW ON）`RUN_ID=20251218T180331Z npm run test -- charts-outpatient-mainflow`  
   - `PLAYWRIGHT_DISABLE_MSW` 未設定 / `VITE_DISABLE_MSW=0` 前提。  
2. （MSW OFF）`RUN_ID=20251218T180331Z VITE_DISABLE_MSW=1 PLAYWRIGHT_DISABLE_MSW=1 npm run test -- charts-outpatient-mainflow`  
   - Playwright のルートスタブで外来 API を返す。  
3. 失敗時は `artifacts/webclient/e2e/20251218T180331Z/<mode>/` を添付して報告（HAR + screenshots + runtime-errors）。

## 証跡
- ログ: `docs/web-client/planning/phase2/logs/20251218T180331Z-charts-outpatient-playwright-main.md`
