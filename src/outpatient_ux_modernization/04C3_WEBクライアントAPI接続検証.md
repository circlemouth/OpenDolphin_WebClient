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
4. 必要に応じて `curl http://localhost:9080/openDolphin/resources/api01rv2/claim/outpatient/...` で API 応答の `dataSourceTransition`/`cacheHit`/`missingMaster`/`resolveMasterSource` を取得し、UI 表示と突合。

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
- 進捗更新: 04C4（RUN_ID=20251208T124645Z）で `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` の stub 実装が server-modernized に追加され、`dataSourceTransition/cacheHit/missingMaster/resolveMasterSource/auditEvent` を返す状態になった。証跡: `docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md`。
- 所感: ローカル接続で 404 は解消している前提。MSW OFF での再検証により、UI バナー／telemetry が reception→charts→patients で carry-over するか確認可能な状態。
- 再検証タスク（このドキュメントを見たワーカー向け手順）
  1. 環境: server-modernized を 20251208T124645Z 時点の実装に更新または該当ブランチをチェックアウト済みで起動した状態を使う（再起動禁止の場合は現行プロセスで応答に stub が含まれることを curl で事前確認）。
  2. 起動: `VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources npm run dev -- --host --port 4173`（例）。MSW ON との比較は任意だが、差分取得するとギャップ確認が早い。
  3. 検証シナリオ: Reception → Charts → Patients を通し、`tone=server` バナーと `resolveMasterSource` バッジが `server` で維持されること、`cacheHit`/`missingMaster` が telemetry (`resolve_master`→`charts_orchestration`) に反映されることを DevTools で確認。
  4. API 実応答確認: `curl http://localhost:9080/openDolphin/resources/api01rv2/claim/outpatient/mock` および `/orca21/medicalmodv2/outpatient` で `recordsReturned` / `dataSourceTransition=server` / `telemetryFunnelStage` が含まれることをローカルログに記録。UI 表示との突合を実施。
  5. 証跡保存: `artifacts/webclient/e2e/20251208T124645Z-integration-gap/` にスクリーンショットと HAR/console、`docs/server-modernization/phase2/operations/logs/20251208T124645Z-integration-qa.md` に観察結果を追記。必要に応じ `docs/web-client/planning/phase2/DOC_STATUS.md` の Web クライアント UX/Features 行を更新。
- Stage/Preview: 06_STAGE検証タスクで扱う。ローカル再検証で問題がなければ 04C5（再検証タスク）へ進み、MSW OFF でギャップ解消を確認して DOC_STATUS/manager checklist を更新する。

## 7. 旧計画/参考（Stage 前提、混同禁止）
- RUN_ID=`20251214T090000Z` で Stage 前提の計画を記載していたが、本タスクでは採用しない。ログ・証跡は参考資料としてのみ参照する。
- Stage 接続試行（参考）: `docs/server-modernization/phase2/operations/logs/20251207T120529Z-integration-qa.md`、`artifacts/webclient/e2e/20251207T120529Z-integration/`（DNS/タイムアウトで未接続）。Stage での再検証は 06_STAGE検証タスクに委譲し、本 RUN の成果とは分離する。
- MSW 事前検証（参考）: RUN_ID=`20251205T171500Z` `docs/server-modernization/phase2/operations/logs/20251205T171500Z-outpatient-mock.md`、`artifacts/webclient/e2e/20251205T171500Z-outpatient-mock/`。
