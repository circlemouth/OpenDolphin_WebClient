# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T075446Z
- TRACE_ID: trace-20260204T075446Z
- 実施日時: 2026-02-04T07:56:24.057Z
- Base URL: http://localhost:5174
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 1001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T075446Z ｜ traceId: 4eabdb81-8fa2-42c4-b4c2-8eba91cced53
- Reception Row: not-found
- Charts runId: 20260204T075446Z
- Charts traceId: a65d872c-7f5d-47ed-8c76-ad3691e678e3
- Order Result: 404 (http://localhost:5174/orca/order/bundles?patientId=01415&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20260204T075446Z / traceId=a65d872c-7f5d-47ed-8c76-ad3691e678e3 / requestId=a65d872c-7f5d-47ed-8c76-ad3691e678e3 / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T075446Z/fullflow/network
- Console errors: 4
- Page errors: 0
