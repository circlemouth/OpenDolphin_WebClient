# 04B3 WEBクライアントCharts/Patients UX検証

- **RUN_ID=20251206T112050Z（ローカル mock 検証）／20251205T133848Z（Stage 試走・DNS未解決）**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、Charts/Patients の `missingMaster`/`cacheHit`/`dataSourceTransition=server` トーンを reception と整合させる QA を進行中。
- YAML ID: `src/outpatient_ux_modernization/04B3_WEBクライアントChartsPatientsUX検証.md`
- ステータス: in_progress（ガント progress 45%）。Stage 接続復旧待ち。

## 1. 目的
1. Reception→Charts→Patients の導線で `missingMaster`/`cacheHit`/`dataSourceTransition=server` バナーと `resolveMasterSource` 表示が `docs/web-client/ux/charts-claim-ui-policy.md` のトーン要件どおりかを検証する。
2. Patients タブで `cacheHit=false` → `true` の遷移時に `resolveMasterSource` バナーが消えるかを確認し、`OrcaSummary` とのトーン差分があれば `styles` 修正候補を洗い出す。
3. 遷移ストーリーボード・スクリーンショットを `artifacts/webclient/e2e/<RUN_ID>-charts/` に残し、operations log と DOC_STATUS へ紐づける。

## 2. 実施結果（現状の進捗）
- **20251206T112050Z（ローカル Outpatient mock / Playwright route.fulfill）**  
  - `missingMaster=true` → `cacheHit=true` → `dataSourceTransition=server` のトーン遷移を再現。`DocumentTimeline`・`Patients` で `ToneBanner` が `warning→info` に遷移し、`aria-live` は `assertive→polite` に切替できることを確認。  
  - 証跡: `artifacts/webclient/e2e/20251206T112050Z-charts/`（01-login-success.png, 02-outpatient-mock-overview.png, 03-reception-tone.png, 04-charts-tone.png, storyboard.md）。operations log は未発行（次アクションで `docs/server-modernization/phase2/operations/logs/20251206T112050Z-charts-qa.md` を作成予定）。
- **20251205T133848Z（Stage 試走）**  
  - `stage.open-dolphin` が DNS 解決できず `/api01rv2/claim/outpatient/*` / `/orca21/medicalmodv2/outpatient` へ到達不可。トーンバナーは接続未設定状態のまま。  
  - 証跡: `artifacts/webclient/e2e/20251205T133848Z-charts/`（charts-stage.png, charts-stage.log, storyboard.md）。operations log `docs/server-modernization/phase2/operations/logs/20251205T133848Z-charts-qa.md` は未作成。
- 依存タスク: 実装面は 04B2 完了済み（`docs/server-modernization/phase2/operations/logs/20251212T090000Z-charts-orca.md`）。本タスクは検証と DOC_STATUS 反映のみ残存。

## 3. 反映状況
- `.kamui/apps/webclient-ux-outpatient-modernization-plan.yaml` では status=in_progress / progress=45%。本ドキュメント新規作成で進捗を可視化。
- DOC_STATUS の Web クライアント UX/Features 行には Stage 試走／ローカル mock の結果が未反映。次アクションで RUN_ID と証跡パスを追記する。
- Manager checklist（`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`）の該当行も Stage 再実行後に更新予定。

## 4. 次のアクション
1. Stage DNS/ネットワーク復旧後、同 RUN_ID=20251205T133848Z を再利用して Reception→Charts→Patients を再走し、`dataSourceTransition=server` と `missingMaster` バナーを Stage 由来のレスポンスで確認。成功時に operations log を新規作成して上書き可。
2. ローカル mock 検証分として `docs/server-modernization/phase2/operations/logs/20251206T112050Z-charts-qa.md` を作成し、`artifacts/webclient/e2e/20251206T112050Z-charts/` へのリンク・観測メモを記載。
3. DOC_STATUS（`docs/web-client/planning/phase2/DOC_STATUS.md`）と UX 計画（`docs/web-client/ux/ux-documentation-plan.md`）へ両 RUN_ID の QA 結果を追記し、ガントの progress を 70–80% へ更新できる状態にする。
4. Patients タブの `cacheHit=false` で `resolveMasterSource` バナーが残留するケースがあれば、`web-client/src/features/charts/styles.ts` と `ux/charts/tones.ts` の追従修正案を artifacts へ記録し次回スプリントへ引き継ぐ。
