# missingMaster 異常系注入（RUN_ID=20251209T211707Z）
- YAML ID: `src/modernized_outpatient_debug/anomaly-injection/missingMaster異常系注入.md`
- ステータス: done（MSW/fixture 注入で missingMaster=true / cacheHit=false の UI・telemetry を採取）
- 証跡: `artifacts/webclient/debug/20251209T150000Z-bugs/`（`outpatient-missing-master.png`, `telemetry.json`, `ui-state.json`, `console.log` ほか既存レスポンス HAR）

## 1. 目的
- Reception→Charts のトーン／バッジ／telemetry が missingMaster 異常時に一致しているかを MSW モックで確認する。
- 期待との差分を operations ログ（`docs/server-modernization/phase2/operations/logs/20251209T094600Z-debug.md`）へ追記する下準備とする。

## 2. 実施手順
1. RUN_ID=`20251209T211707Z` を環境変数に設定し、`tests/e2e/outpatient-missing-master-debug.spec.ts` を Playwright で実行（Vite dev server 自動起動、MSW=ON）。
2. `/api/user/**` を route.fulfill してログイン成功を固定。
3. `/orca/claim/outpatient/**` / `/orca21/medicalmodv2/outpatient` を payload `{runId, dataSourceTransition=server, cacheHit=false, missingMaster=true, fallbackUsed=false}` で fulfill。
4. `/reception`→`/outpatient-mock` 遷移後、ToneBanner・ResolveMasterBadge・status-badge と `window.__OUTPATIENT_FUNNEL__` を採取し、スクリーンショットを保存。

## 3. 結果サマリ
- ToneBanner: `aria-live=assertive` / `data-run-id=20251209T211707Z`。文面は missingMaster 警告（再取得待ち）。
- ResolveMasterBadge: `tone=server` を表示（data-run-id は null のまま）。
- Badges: `missingMaster=true`（warning copy）/`cacheHit=false`（warning copy）を表示。
- Telemetry: `resolve_master`→`charts_orchestration` の 2 本。いずれも `dataSourceTransition=server`, `cacheHit=false`, `missingMaster=true`, `runId=20251209T211707Z`。
- 証跡ファイル: `outpatient-missing-master.png`, `telemetry.json`, `ui-state.json`, `console.log` を `artifacts/webclient/debug/20251209T150000Z-bugs/` に保存。既存の `claim-response.*`/`medical-response.*`/`outpatient.har` は従前からの参照用とし、上書きなし。

## 4. メモ/フォローアップ
- ResolveMasterBadge に `data-run-id` が付与されていない（null）。バッジ系の runId carry-over が必要かは設計者へ確認。
- ToneBanner まわりのメッセージは「再取得待ち」のみで nextAction が固定。missingMaster 解除後の copy との差分を検証するには cacheHit=true シナリオの再取得が必要。
- DOC_STATUS 更新時は本 RUN_ID と証跡パスを備考に併記する。
