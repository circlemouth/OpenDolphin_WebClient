# 04C3 WEBクライアントAPI接続検証（RUN_ID=20251207T120529Z）

- 期間: 2025-12-07 21:05 - 2025-12-08 21:05（JST）
- 優先度: high / 緊急度: medium
- 関連ドキュメント: `docs/web-client/ux/reception-schedule-ui-policy.md`（tone=server および missingMaster/banner 要件）、`docs/web-client/ux/ux-documentation-plan.md`（検証観点）、`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（接続ポリシー）

## 1. 目的
1. Reception→Charts→Patients の一連のステージシナリオで、外来 API（`/api01rv2/claim/outpatient/*`、`/orca21/medicalmodv2/outpatient`）が `dataSourceTransition=server` ルートで稼働し、`tone=server` banner（`docs/web-client/ux/reception-schedule-ui-policy.md` 参照）と `cacheHit`/`missingMaster`/`resolveMasterSource` 表示が一貫していることを確認。
2. Telemetry funnel に `cacheHit`/`missingMaster`/`resolveMasterSource('server')` イベントを含め、`docs/web-client/ux/ux-documentation-plan.md` で示した telemetry ステージ設計（resolve_master → charts_orchestration）が Stage/Preview 上でも記録されていることを確認。
3. `artifacts/webclient/e2e/20251207T120529Z-integration/` にステージログ・スクリーンショットを残し、`docs/server-modernization/phase2/operations/logs/20251207T120529Z-integration-qa.md` で接続安定性・バナー表示・telemetry フラグの観測結果を整理。

## 2. 環境と前提
- Stage 環境: `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources`（例）／`VITE_DISABLE_MSW=1` を設定し、実際の ORCA/modernized API を `npx vite preview` または Playwright から叩く。
- Stage ブラウザ: `http://localhost:4173`（Playwright の `PLAYWRIGHT_BASE_URL` か任意の手動ブラウザ）
- ORCA 接続: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従い、証明書を安全に扱いながら接続。実行者はステージ環境へのアクセス権限と証跡出力の手順を確認すること。
- Telemetry: `web-client/src/libs/telemetry/telemetryClient.ts` で `recordOutpatientFunnel('resolve_master', …)` → `charts_orchestration` が Stage でも実行されるよう `window.datadogRum` / `telem` を有効化。

## 3. シナリオ手順
1. Reception 画面にアクセスし、外来患者を一覧で開く。
2. 各患者で `dataSourceTransition=server` を返す ORCA/claim への POST をトリガーし、tone=server banner（`docs/web-client/ux/reception-schedule-ui-policy.md` のとおり）と `missingMaster`/`cacheHit` の各表示が互いに矛盾しないかを確認。
3. `resolveMasterSource('case')` などで `dataSourceTransition=server` に至るフラグ（`missingMaster`=true→false、`cacheHit`=true/false）の変化を観測し、Playwright console か DevTools Network で telemetry funnel events を見る。
4. Charts へ遷移し、DocumentTimeline/OrderConsole で `cacheHit`/`missingMaster`/`resolveMasterSource` の表示と `tone=server` banner が同一の tonechain で carry over されることを確認。
5. Patients へ移動し、フィルタや保険モードを保持したまま戻る途中でも telemetry が `resolve_master`→`charts_orchestration` の順序で記録されるか（Request header も含め）を見る。
6. Playwright や curl で `/api01rv2/claim/outpatient/*` および `/orca21/medicalmodv2/outpatient` を叩き、HTTP レスポンスに `dataSourceTransition=server`/`cacheHit`/`missingMaster` などメタ情報が含まれていることをログする。

## 4. 収集対象
- Stage log: `artifacts/webclient/e2e/20251207T120529Z-integration/stage.log`（Reception→Charts→Patients の HTTP リクエスト＆telemetry トリガーの断面）。
- Screenshot: `artifacts/webclient/e2e/20251207T120529Z-integration/reception-tone.png` / `charts-tone.png` / `patients-tone.png`（tone=server banner + `resolveMasterSource` badge + funnel step）。
- Telemetry snapshot: `artifacts/webclient/e2e/20251207T120529Z-integration/telemetry.json`（resolve_master → charts_orchestration で記録された flag set）。
- QA log: `docs/server-modernization/phase2/operations/logs/20251207T120529Z-integration-qa.md` に接続安定性・バナー表示・telemetry flag などの検証メモ。

## 5. 本回の状況
- RUN_ID を `20251207T120529Z` に更新し、Stage 接続 QA を再試行。
- Stage エンドポイント `100.102.17.40:8000/openDolphin/resources` への curl は 10 秒でタイムアウト。`stage.open-dolphin` も DNS 解決不可。既存フロント `http://localhost:4173` は LISTEN なしのため UI 操作・スクリーンショット・telemetry 取得は未実施。
- 成果物: `artifacts/webclient/e2e/20251207T120529Z-integration/` にタイムアウト/DNS ログと未取得理由付きプレースホルダー（reception/charts/patients tone, telemetry.json）を保存。詳細は `docs/server-modernization/phase2/operations/logs/20251207T120529Z-integration-qa.md` を参照。
- 次回以降: Stage/DNS 復旧およびフロント起動後に同手順を再実行し、`dataSourceTransition=server`/`tone=server`/`resolveMasterSource` の実測を上記成果物に上書きする。
- RUN_ID=`20251205T171500Z` の MSW 事前検証結果は参考として維持しつつ、ステージ権限取得後に server ルートで再検証する。
