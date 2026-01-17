# 04C3 WEBクライアントAPI接続検証（RUN_ID=20251207T130434Z／ローカルモダナイズ接続）

- 対象期間: 2025-12-07（JST）以降、ローカル接続で順次実施
- 優先度: high / 緊急度: medium
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- 関連ポリシー: `docs/web-client/ux/reception-schedule-ui-policy.md`（tone/banner/missingMaster）、`docs/web-client/ux/ux-documentation-plan.md`（検証観点・telemetry）、`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（接続・証跡方針）

## 1. 目的
1. ローカルで起動中のモダナイズ版サーバー（`http://localhost:${MODERNIZED_APP_HTTP_PORT:-9080}/openDolphin/resources`）に Web クライアントを接続し、Reception→Charts→Patients で `tone=server` バナーと `cacheHit`/`missingMaster`/`resolveMasterSource`/`dataSourceTransition` の整合を確認する。
2. `recordOutpatientFunnel('resolve_master' → 'charts_orchestration')` がローカル接続でも発火し、telemetry で `cacheHit`/`missingMaster`/`resolveMasterSource` を送出することを確認する（`window.datadogRum` 無効時は例外なく stub が動作することを含む）。
3. MSW ON/OFF で tone・telemetry・バナー表示が一致するかを比較し、結果を `artifacts/webclient/e2e/20251207T130434Z-integration/` に保存する。
4. Stage/Preview 接続は範囲外とし、必要時は別タスク「06_STAGE検証」で実施することを明記する（旧 RUN / Stage ログは参考のみ）。

## 2. スコープと非スコープ
- 対象: ローカルモダナイズ版サーバーへの接続検証（既存プロセスを停止・再起動せず、現状起動しているサービスを利用）。
- 対象外: Stage/Preview 直接接続、mac-dev 経由の接続。本ドキュメントでは手順とローカル観測のみを扱い、Stage 前提のログは「旧計画/参考」に隔離する。
- オペレーション制約: 「サーバーの再起動や停止はしない」指示に従い、起動中のプロセスを前提とした検証のみを行う。環境変更が必要な場合は別タスクで相談する。

## 3. 環境・前提
- Web クライアント: `VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources`、`VITE_API_BASE_URL` 同値。`VITE_DISABLE_MSW=1/0` を切り替えて挙動比較。Playwright/手動確認は `http://localhost:4173`（dev）または `npm run preview -- --port 4174`（MSW 無効プレビュー）。
- サーバー: `setup-modernized-env.sh` もしくは既存起動中のモダナイズ版サーバーを利用。再起動禁止のため、設定変更は実施しない。
- Telemetry: `web-client/src/libs/telemetry/telemetryClient.ts` の funnel を DevTools network/console で確認。`datadogRum` 非活性時は no-op でエラーが出ないことを確認する。
- 認証・証跡: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の運用に従い、秘密情報を扱わない。証跡は RUN_ID で統一する。

## 4. シナリオ
### 4.1 ベースライン（MSW ON）
1. Web クライアントを `VITE_DISABLE_MSW=0` で起動し、Reception で `tone=server` バナーと `resolveMasterSource` バッジが表示されることを確認。
2. Charts/Patients へ遷移し、`missingMaster`/`cacheHit` が Reception と一致して carry-over することを確認。
3. DevTools console で `resolve_master` → `charts_orchestration` telemetry のペイロードに `cacheHit`/`missingMaster`/`resolveMasterSource` が含まれることを記録。

### 4.2 実接続（MSW OFF）
1. `VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources` で起動（サーバーは既存プロセスを利用）。
2. Reception で `dataSourceTransition=server` のレスポンスを確認し、`tone=server` バナーと `ResolveMaster` バッジの値（`server|case|snapshot`）を記録。
3. Charts/Patients で `cacheHit=false` や `missingMaster` が遷移するケースを観測し、telemetry の差分を比較。
4. 必要に応じて `curl http://localhost:9080/openDolphin/resources/orca/claim/outpatient/...` で API 応答の `dataSourceTransition`/`cacheHit`/`missingMaster`/`resolveMasterSource` を取得し、UI 表示と突合。

### 4.3 tone / telemetry 整合チェック
- `tone=server` が Reception→Charts→Patients で一貫すること。
- `resolveMasterSource` が UI バッジと telemetry の両方で一致すること。
- `missingMaster=true` → `cacheHit=true/false` 遷移時にバナーがリセットされず carry-over すること。
- telemetry funnel で `resolve_master` → `charts_orchestration` の順序が崩れないこと。

## 5. 収集物（RUN_ID=20251207T130434Z）
- ログ: `artifacts/webclient/e2e/20251207T130434Z-integration/local.log`（MSW ON/OFF の起動ポートと結果を記載）
- Telemetry: `artifacts/webclient/e2e/20251207T130434Z-integration/telemetry.json`（MSW ON/OFF の `resolve_master`→`charts_orchestration` ログ）
- スクリーンショット: `artifacts/webclient/e2e/20251207T130434Z-integration/reception-tone.png`, `charts-tone.png`, `patients-tone.png`
- QA メモ: `docs/server-modernization/phase2/operations/logs/20251207T130434Z-integration-qa.md`
- HAR/console: `artifacts/webclient/e2e/20251207T130434Z-integration/network.har`（msw-off HAR, on/off 版も別ファイル）、`console.txt`

## 6. 現状と次アクション（2025-12-08 更新）
- RUN_ID=`20251208T180500Z`: `web.xml` に `open.dolphin.orca.rest.OrcaClaimOutpatientResource` / `open.dolphin.rest.orca.OrcaMedicalModV2Resource` を登録し再ビルド。MD5 認証 (facility=dolphindev) で `/orca/claim/outpatient/mock`・`/orca21/medicalmodv2/outpatient` とも **200 OK** を確認（traceId=35e16c4c-3c69-4ea5-adc5-e09916b0785f / 1910d88f-ea86-43bd-9f31-e984e5b1e96a、cacheHit / missingMaster / dataSourceTransition=server を返却）。MSW OFF UI 巡回で tone=server と telemetry `resolve_master`→`charts_orchestration` を取得。証跡: `docs/server-modernization/phase2/operations/logs/20251208T180500Z-integration-qa.md`, `artifacts/webclient/e2e/20251208T180500Z-integration/`。
 - RUN_ID=`20251209T150000Z`（parent=20251209T071955Z）: ローカル MSW OFF で curl POST。`/orca/claim/outpatient/mock` **200**（cacheHit=false, missingMaster=false, dataSourceTransition=server, runId=20251208T124645Z, traceId=96e647c3-a8a2-4726-9829-d32edc06f883）、`/orca21/medicalmodv2/outpatient` **200**（cacheHit=true, missingMaster=false, traceId=deb71516-4910-4a3d-8831-58e7617e55fb）。dev proxy 100.102.17.40 の 8000/443/8443 はすべて TCP timeout（curl exit 28）。証跡: `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md`, `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`。UI/HAR 取得は Stage/Preview 復旧後に同 RUN_ID で実施。
 - RUN_ID=`20251209T071955Z`: 再検証（MSW OFF dev）。`WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources ./setup-modernized-env.sh` で起動し、curl POST にて `/orca/claim/outpatient/mock`（`dataSourceTransition=server`, `cacheHit=false`, `missingMaster=false`, `runId=20251208T124645Z`）と `/orca21/medicalmodv2/outpatient`（`cacheHit=true`, `missingMaster=false`）が **200 OK**（X-Trace-Id=`00fd5c2f-...` / `1bd08bdc-...`）。dev proxy 先 `http://100.102.17.40:8000/...` および `https://100.102.17.40:{443,8443}/` はいずれも TCP タイムアウト（HTTP 000, ボディなし）。証跡: `artifacts/webclient/e2e/20251209T071955Z-outpatient-gap/`（stage_connectivity_20251209T0730Z.txt、ログ内容は 20251209T150000Z-integration-gap-qa.md へ集約）。UI 巡回は未実施（dev server 起動済み、後続タスクで取得）。
- RUN_ID=`20251208T170000Z`/`20251208T163000Z`: 認証・リソース未登録により 401/404 が発生したが、上記修正で解消済み（経緯保持のみ）。
- 進捗: ローカル接続で 04C3 の目的（tone/telemetry 整合 + API 応答取得）を達成。MSW ON 差分は任意で未実施だが、04C3 の完了条件外とする。
- RUN_ID=`20251208T124645Z`（Stage/Preview dev proxy 再検証）: `VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources` で curl POST を実施したが、両エンドポイントとも TCP timeout（curl exit 28）。`stage.open-dolphin` は NXDOMAIN。`auditEvent/runId/dataSourceTransition` は取得できず、ネットワーク開通後に同 RUN_ID で再試行が必要。証跡: `docs/server-modernization/phase2/operations/logs/20251208T124645Z-dev-proxy-validation.md`、スクショ: `artifacts/webclient/e2e/20251208T124645Z-stage/outpatient-stage.png`。
- 次アクション: Stage/Preview 検証は別タスク（06_STAGE検証）。本 RUN_ID=20251208T180500Z をもってローカル接続検証は完了。

## 7. 旧計画/参考（Stage 前提、混同禁止）
- RUN_ID=`20251214T090000Z` で Stage 前提の計画を記載していたが、本タスクでは採用しない。ログ・証跡は参考資料としてのみ参照する。
- Stage 接続試行（参考）: `docs/server-modernization/phase2/operations/logs/20251207T120529Z-integration-qa.md`、`artifacts/webclient/e2e/20251207T120529Z-integration/`（DNS/タイムアウトで未接続）。Stage での再検証は 06_STAGE検証タスクに委譲し、本 RUN の成果とは分離する。
- MSW 事前検証（参考）: RUN_ID=`20251205T171500Z` `docs/server-modernization/phase2/operations/logs/20251205T171500Z-outpatient-mock.md`、`artifacts/webclient/e2e/20251205T171500Z-outpatient-mock/`。
