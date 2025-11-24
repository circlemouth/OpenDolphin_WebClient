# ORCA マスター計測テンプレート (RUN_ID=20251124T171500Z)

配置ポリシー:
- Lighthouse / HAR / RUM スクリプトは本ディレクトリをコピーして RUN_ID ごとに再利用する。
- 生成物の保存先は `artifacts/perf/orca-master/<RUN_ID>/` 配下に統一する。

## 使い方
1. `npm run dev -- --host 0.0.0.0 --port 4173` で web-client を起動。
2. **Lighthouse CI**: 下記コマンド例でデスクトップ計測。
   - `npx @lhci/cli collect --config=./artifacts/perf/orca-master/20251124T171500Z/templates/lighthouse.config.js --url=http://localhost:4173/charts/72001?msw=1`
   - モバイル計測は `--preset=mobile` オプションを URL 末尾 `#mobile` で切替（config 参照）。
   - 出力された `.lighthouseci/` を `artifacts/perf/orca-master/<RUN_ID>/lhci/` へ移動。
3. **Web Vitals (RUM)**: `web-vitals-rum.js` を `public/` にコピーし、`<script defer src="/web-vitals-rum.js"></script>` を追加。
   - `window.__PERF_ENDPOINT__ = '/api/perf/vitals'` のように送信先を設定してからページをリロード。
   - CLS/LCP/INP/FCP/TTFB が `runId=20251124T171500Z` 付きで送信される。
4. **HAR 取得**: DevTools Network で「Save all as HAR with content」。`artifacts/perf/orca-master/<RUN_ID>/har/` へ保存。
5. **整形時間計測**: `performance.mark('orca-master:normalize:start/end')` を仕込んで Performance panel の Timings から計測。

命名規約:
- LHCI: `artifacts/perf/orca-master/<RUN_ID>/lhci/{desktop,mobile}/run-<n>.json`
- HAR: `artifacts/perf/orca-master/<RUN_ID>/har/<scenario>-<source>.har` （例: `search-msw.har`, `search-server.har`）
- RUM: 送信ログはバックエンドで保存し、同 RUN_ID でまとめる。

備考:
- Python スクリプトは禁止。Node/npm のみ使用。
- `VITE_DISABLE_MSW` と `VITE_DEV_PROXY_TARGET` を明示して MSW/実API を切替える。
