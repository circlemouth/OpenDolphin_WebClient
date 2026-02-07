# chart-events MSW handler verification

- RUN_ID: 20260204T235603Z-chart-events-msw
- 実行: `pnpm vitest run src/mocks/handlers/chartEvents.test.ts --reporter=verbose`
- 結果: MSW handler が `/api/chart-events` を 200 (text/event-stream) で返却することを確認

## 証跡

- `OpenDolphin_WebClient/artifacts/verification/20260204T235603Z-chart-events-msw/chart-events-msw-test.log`

