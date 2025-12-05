# RUN_ID=20251205T133848Z Charts→Patients Stage Storyboard

1. 起動: `VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://stage.open-dolphin VITE_API_BASE_URL=http://stage.open-dolphin VITE_DEV_USE_HTTPS=1 npm run dev -- --host 0.0.0.0 --strictPort --port 4173`
2. Stage ルート確認: `https://localhost:4173/`（リージョン: Charts→Patients UX はまだログイン画面だが、`docs/web-client/ux/charts-claim-ui-policy.md` で示す tone/banner 系要件を Stage データで再現する準備）。
3. Stage 接続: `curl -I http://stage.open-dolphin` → DNS 解決失敗（`Could not resolve host`）。外来 API (`/api01rv2/claim/outpatient/*`, `/orca21/medicalmodv2/outpatient`) に繋がらないため、`missingMaster`/`cacheHit`/`dataSourceTransition=server` を含む banner を観測できず。キャッシュ/マスタ接続フラグは snapshot fallback のまま。今後 Stage host が復旧したタイミングで再検証。
4. 証跡: `artifacts/webclient/e2e/20251205T133848Z-charts/charts-stage.png`（Playwright screenshot）、`artifacts/webclient/e2e/20251205T133848Z-charts/charts-stage.log`（起動＋接続ログ）。
