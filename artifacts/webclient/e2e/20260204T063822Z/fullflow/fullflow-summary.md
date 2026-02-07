# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T063822Z
- TRACE_ID: trace-20260204T063822Z
- 実施日時: 2026-02-04T06:39:55.001Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01416
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T063822Z ｜ traceId: 7fae9f0e-5133-4cd6-9cde-0353f8d5c884
- Reception Row: not-found
- Charts runId: 20260204T063822Z
- Charts traceId: 0b91d5a1-2055-476a-bcaf-69618d889289
- Order Result: 404 (http://localhost:5173/orca/order/bundles?patientId=01416&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20260204T063822Z / traceId=0b91d5a1-2055-476a-bcaf-69618d889289 / requestId=0b91d5a1-2055-476a-bcaf-69618d889289 / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T063822Z/fullflow/network
- Console errors: 4
- Page errors: 0
