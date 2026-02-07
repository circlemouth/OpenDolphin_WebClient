# chart-events 500 解析ログ

- RUN_ID: 20260204T235000Z-chart-events-500
- 参照ログ: `OpenDolphin_WebClient/artifacts/webclient/update-depth/20260204T154158Z-update-depth-fix5/console.json`
- 抽出サンプル: `OpenDolphin_WebClient/artifacts/verification/20260204T235000Z-chart-events-500/chart-events-500-console-sample.json`

## 観測内容

- `/api/chart-events` が 500 を返し、`[chart-events] stream error` が繰り返し出力されている。
- 同 RUN の console には `/api/admin/config` `/api/orca/queue` `/api01rv2/pusheventgetv2` なども 500 が並行して発生しており、`/api/chart-events` 固有というより server-modernized 側の応答異常が疑われる。

## 経路メモ

- MSW は `onUnhandledRequest: 'bypass'` のため `/api/chart-events` は未ハンドルの場合に実サーバへ透過する。
- 現行 `web-client/src/mocks/handlers/index.ts` に `/api/chart-events` の MSW handler は存在しないため、MSW 有効時も server-modernized に到達する。
- `/api` は Vite proxy で `VITE_DEV_PROXY_TARGET`（既定: `http://localhost:8080/openDolphin/resources`）へ中継されるため、`/api/chart-events` は `server-modernized` の `ChartEventStreamResource` へ到達する。

