# 04B3 WEBクライアントCharts/Patients UX検証

- **RUN_ID=20251206T112050Z（ローカルモダナイズ版サーバー接続で実施予定）**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、`setup-modernized-env.sh` でローカル起動したモダナイズ版サーバー＋ Web クライアントを使って Charts/Patients の `missingMaster`/`cacheHit`/`dataSourceTransition=server` トーンを reception と整合させる QA を進行中。Stage での検証は 06_STAGE検証タスクへ移管。
- YAML ID: `src/outpatient_ux_modernization/04B3_WEBクライアントChartsPatientsUX検証.md`
- ステータス: in_progress（ガント progress 60%）。ローカル実接続での検証をこれから実施。

## 1. 目的
1. `setup-modernized-env.sh` で立ち上げたローカルモダナイズ版サーバーに Web クライアントを接続し、Reception→Charts→Patients の導線で `missingMaster`/`cacheHit`/`dataSourceTransition=server` バナーと `resolveMasterSource` 表示が `docs/web-client/ux/charts-claim-ui-policy.md` のトーン要件どおりかを検証する。
2. Patients タブで `cacheHit=false` → `true` に遷移した際、`resolveMasterSource` バナーが適切に消えるか、`OrcaSummary` とのトーン差分がないかを確認する。
3. ストーリーボード・スクリーンショットを `artifacts/webclient/e2e/20251206T112050Z-charts/` に残し、operations log と DOC_STATUS に紐づける。

## 2. 実施結果（現状の進捗）
- ローカルモダナイズ版サーバーへの実接続検証: 未実施（ガント切替後に着手予定）。
- 参考（旧計画の試走）
  - 20251206T112050Z: Playwright の `route.fulfill` でモックしたローカル検証を実施し、`missingMaster=true` → `cacheHit=true` → `dataSourceTransition=server` のトーン遷移を確認。証跡は `artifacts/webclient/e2e/20251206T112050Z-charts/`（01-login-success.png, 02-outpatient-mock-overview.png, 03-reception-tone.png, 04-charts-tone.png, storyboard.md）。operations log は未発行。
  - 20251205T133848Z: Stage 試走は DNS 解決不可で到達できず。証跡のみ `artifacts/webclient/e2e/20251205T133848Z-charts/` に保管（本タスクの達成条件外）。
- 依存タスク: 実装面は 04B2 完了済み（`docs/server-modernization/phase2/operations/logs/20251212T090000Z-charts-orca.md`）。本タスクはローカル実接続での検証と DOC_STATUS 反映が未了。

## 3. 反映状況
- `.kamui/apps/webclient/webclient-ux-outpatient-modernization-plan.yaml` では status=in_progress / progress=60%（ローカル実接続完了で 100% へ更新予定）。
- DOC_STATUS の Web クライアント UX/Features 行と `docs/web-client/ux/ux-documentation-plan.md` にはローカル実接続結果が未反映。完了後、RUN_ID と証跡パスを追加する。
- Manager checklist（`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`）の該当行はローカル QA 完了後に更新する。Stage 分は 06_STAGE検証タスクで扱う。

## 4. 次のアクション
1. `setup-modernized-env.sh` でモダナイズ版サーバー＋ Web クライアントをローカル起動し、Reception→Charts→Patients を実接続で走らせて `missingMaster`/`cacheHit`/`dataSourceTransition=server` の挙動とトーンを確認する。
2. 検証結果を `artifacts/webclient/e2e/20251206T112050Z-charts/` に追記し、operations log `docs/server-modernization/phase2/operations/logs/20251206T112050Z-charts-qa.md` を作成して条件・観測メモを整理する。
3. DOC_STATUS（`docs/web-client/planning/phase2/DOC_STATUS.md`）と `docs/web-client/ux/ux-documentation-plan.md` にローカル QA の結果と RUN_ID/証跡パスを反映し、ガント progress を完了相当へ更新する。
4. Patients タブで `cacheHit=false` 時に `resolveMasterSource` バナーが残留するケースがあれば、`web-client/src/features/charts/styles.ts` と `ux/charts/tones.ts` の修正案を artifacts に追記し次スプリントへ引き継ぐ。
