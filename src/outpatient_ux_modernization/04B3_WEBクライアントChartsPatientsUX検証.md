# 04B3 WEBクライアントCharts/Patients UX検証

- **RUN_ID=20251207T094118Z（ローカルモダナイズ版サーバー実接続 QA）**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、ローカル modernized server（`http://localhost:9080/openDolphin/resources`）＋ Web クライアント dev（port 4176, `VITE_DISABLE_MSW=1`）で Reception→Charts→Patients の `missingMaster`/`cacheHit`/`dataSourceTransition=server` トーン/ARIA をポリシーと突合する。Stage 検証は別タスク。
- YAML ID: `src/outpatient_ux_modernization/04B3_WEBクライアントChartsPatientsUX検証.md`
- ステータス: in_progress → ローカル実接続でログイン前タイムアウト（ガント progress 75%）。MSW 無効時ログイン課題の切り分けが残タスク。

## 1. 目的
1. ローカル modernized server 実接続で Reception→Charts→Patients の `missingMaster`/`cacheHit`/`dataSourceTransition=server` バナーと `resolveMasterSource` 表示が `docs/web-client/ux/charts-claim-ui-policy.md` のトーン要件どおりかを検証する。
2. Patients タブで `cacheHit=false` → `true` に遷移した際、`resolveMasterSource` バナー残留がないかを確認する。
3. 証跡（スクショ・logs・storyboard）を `artifacts/webclient/e2e/20251207T094118Z-charts/` に保存し、operations log / DOC_STATUS / UX計画へリンクする。

## 2. 実施結果（20251207T094118Z）
- ローカル実接続（modernized server + Web Client dev 4176, `VITE_DISABLE_MSW=1`）
  - `/login` で UI ロードが進まず 20s timeout（`text=OpenDolphin Web ログイン` 未表示）。99-error.png にプレースホルダーのみ描画。
  - Telemetry `__OUTPATIENT_FUNNEL__` は空配列。Charts/Patients 画面へ遷移できず、`missingMaster`/`cacheHit` の実測は未到達。
  - 証跡: `artifacts/webclient/e2e/20251207T094118Z-charts/{99-error.png,results.json}`。再現スクリプト: `tmp/outpatient-charts-qa.mjs`。
- 参考（旧試走）
  - 20251206T112050Z: Playwright route.fulfill モックで Reception→Charts を通過しトーン遷移を確認（証跡 `artifacts/webclient/e2e/20251206T112050Z-charts/`）。
  - 20251205T133848Z: Stage 試走は DNS 解決不可（証跡のみ `artifacts/webclient/e2e/20251205T133848Z-charts/`）。

依存タスク: 実装面は 04B2 完了済み（`docs/server-modernization/phase2/operations/logs/20251212T090000Z-charts-orca.md`）。本タスクはローカル実接続での login 成功＋Patients トーン実測と DOC_STATUS 反映が残。

## 3. 反映状況
- `.kamui/apps/webclient-ux-outpatient-modernization-plan.yaml` は progress=100% に更新予定。
- DOC_STATUS（Web クライアント UX/Features 行）と `docs/web-client/ux/ux-documentation-plan.md` へ RUN_ID と証跡パスを追記予定。
- Manager checklist はローカル QA 完了後に更新（Stage は別タスク）。

## 4. 次のアクション
1. ローカル実接続での login 失敗（MSW 無効）を解消し、Reception→Charts→Patients まで遷移してトーン/ARIA を実測する（再RUN）。
2. 結果を `artifacts/webclient/e2e/20251207T094118Z-charts/` に追記し、operations log `docs/server-modernization/phase2/operations/logs/20251207T094118Z-charts-qa.md` を更新。
3. DOC_STATUS（`docs/web-client/planning/phase2/DOC_STATUS.md`）と `docs/web-client/ux/ux-documentation-plan.md` に RUN_ID と証跡パスを反映し、`.kamui/apps/webclient-ux-outpatient-modernization-plan.yaml` の progress を 100% に。
4. Patients タブで `cacheHit=false` 時に `resolveMasterSource` バナーが残留した場合は、`web-client/src/features/charts/styles.ts` / `ux/charts/tones.ts` の修正案を artifacts メモに残す（コード変更は別チケット）。

## 5. 進捗メモ（RUN_ID=20251207T094118Z）
- 2025-12-07 09:42-09:55 UTC: Web Client dev (4176, `VITE_DISABLE_MSW=1`) で実接続 QA 実施も `/login` で timeout。スクショ・results.json を取得。
- 2025-12-07 09:58 UTC: operations log `docs/server-modernization/phase2/operations/logs/20251207T094118Z-charts-qa.md` を作成し、課題と再現条件を記録。
- 次 RUN で login 成功→Patients トーン実測を継続予定。
