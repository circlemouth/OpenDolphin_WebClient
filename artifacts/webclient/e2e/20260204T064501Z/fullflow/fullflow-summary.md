# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T064501Z
- TRACE_ID: trace-20260204T064501Z
- 実施日時: 2026-02-04T06:46:34.568Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01417
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: not-found
- Charts runId: 20260204T064501Z
- Charts traceId: a670f75e-f113-4cab-87bc-2adc27855277
- Order Result: 404 (http://localhost:5173/orca/order/bundles?patientId=01417&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20260204T064501Z / traceId=a670f75e-f113-4cab-87bc-2adc27855277 / requestId=a670f75e-f113-4cab-87bc-2adc27855277 / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T064501Z/fullflow/network
- Console errors: 4
- Page errors: 0
