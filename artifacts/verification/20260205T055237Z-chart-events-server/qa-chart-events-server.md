# chart-events server-modernized 恒久対応 検証

- RUN_ID: 20260205T055237Z-chart-events-server
- 実行: `mvn -q -Dtest=ChartEventStreamResourceTest test`
- 対象: `ChartEventStreamResource` の例外捕捉 → 503 返却

## 結果

- `ChartEventSseSupport.register` が例外を投げた場合、`/chart-events` は 503 (service_unavailable) を返却することをテストで確認。

## 証跡

- `OpenDolphin_WebClient/artifacts/verification/20260205T055237Z-chart-events-server/open.dolphin.rest.ChartEventStreamResourceTest.txt`
- `OpenDolphin_WebClient/artifacts/verification/20260205T055237Z-chart-events-server/TEST-open.dolphin.rest.ChartEventStreamResourceTest.xml`

