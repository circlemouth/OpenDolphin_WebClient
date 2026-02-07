# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T073114Z
- TRACE_ID: trace-20260204T073114Z
- 実施日時: 2026-02-04T07:30:52.145Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01416
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T073114Z ｜ traceId: b32c3748-4702-4ced-8631-728e0b468c84
- Reception Row: not-found
- Charts runId: 20260204T073114Z
- Charts traceId: 20202575-8263-46fe-a38e-05d6edeff7cf
- Order Result: 404 (http://localhost:5173/orca/order/bundles?patientId=01416&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20260204T073114Z / traceId=20202575-8263-46fe-a38e-05d6edeff7cf / requestId=20202575-8263-46fe-a38e-05d6edeff7cf / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T073114Z/fullflow/network
- Console errors: 4
- Page errors: 0
