# Telemetryフラグ検証（RUN_ID=20251209T192814Z）
- YAML ID: `src/modernized_outpatient_debug/telemetry/Telemetryフラグ検証.md`
- ステータス: done（ローカル stub での UI/telemetry 整合のみ実施）
- 証跡: `artifacts/webclient/debug/20251209T192814Z-telemetry/`（Playwright ログ・スクリーンショット）

## 1. 実行条件
- 環境: ローカル Vite dev (`npm run dev -- --host --port 5173`, `VITE_DEV_PROXY_TARGET=http://localhost:4000`, `VITE_DEV_USE_HTTPS=0`, `VITE_RUM_RUN_ID=20251208T124645Z`)。
- stub: `tmp/outpatient-stub.js` を 4000 番ポートで起動し、`artifacts/api-stability/20251208T124645Z/outpatient/*.json` をそのまま返却。
- Playwright: `tmp/run-telemetry-check.mjs`（headless）でログイン→`/outpatient-mock` 遷移を自動化。headless Chrome で React Refresh が落ちないよう `__ALLOW_REACT_DEVTOOLS__=true` を注入。

## 2. 確認手順の抜粋
1. ログインフォームに任意の facility/user/password を入力し、/reception へ遷移することを確認。
2. ナビゲーションから **Outpatient Mock** を開き、MSW OFF + stub 200 で旗を取得。
3. `[data-test-id="telemetry-log"]` の li が `resolve_master` → `charts_orchestration` の順で 2 本生成されるかを収集（`telemetry-log.json`）。
4. ステータス行・ToneBanner・ResolveMasterBadge のテキストを取得し、`dataSourceTransition/cacheHit/missingMaster/runId` が UI と funnel ログで一致するか比較。
5. スクリーンショット `outpatient-telemetry.png` を保存（tone=server 表示の一致確認用）。

## 3. 結果
- funnel: `resolve_master` → `charts_orchestration` の 2 段が順序通り記録（いずれも `dataSourceTransition=server`, `cacheHit=false`, `missingMaster=false`, `runId=20251208T124645Z`）。`window.__OUTPATIENT_FUNNEL__` も同内容で 2 本のみ。`telemetry-log.json` 参照。
- UI 整合: ステータス行と ToneBanner 両方で `dataSourceTransition=server / cacheHit=false / missingMaster=false / runId=20251208T124645Z` を表示。ResolveMasterBadge は `tone=server` マーカーを表示（masterSource は `mock` のまま）。
- 画面キャプチャ: `artifacts/webclient/debug/20251209T192814Z-telemetry/outpatient-telemetry.png` に tone=server / badge 表示を保存済み。
- ログ: コンソールに `[telemetry] Record outpatient funnel {...}` が 2 本出力。SubtleCrypto が http 環境で MD5 を拒否したため、LoginScreen が CryptoJS フォールバックに切り替わった旨の warning が出るが、ログイン・telemetry 記録には影響なし。

## 4. 差分/課題メモ
- masterSource 表示は stub 値により `mock` のまま。cacheHit=true を含むパスを別途 stub/Stage で再現し、`resolveMasterSource=server` への遷移を確認する余地あり。
- traceId は stub レスポンスに含まれておらず未検証。Stage/Preview または server-modernized dev proxy で `X-Trace-Id` と telemetry funnel の突き合わせが必要。
- 本 RUN_ID（20251209T192814Z）で DOC_STATUS/manager checklist への追記を行う場合は備考に証跡パスを併記すること。
