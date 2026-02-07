# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T064239Z
- TRACE_ID: trace-20260204T064239Z
- 実施日時: 2026-02-04T06:44:12.197Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01417
- Department Code: 01
- Physician Code: 0001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T064239Z ｜ traceId: edcd73c9-2065-49cb-82bc-e53ad84c8674
- Reception Row: not-found
- Charts runId: 20260204T064239Z
- Charts traceId: ffcb2ba3-3679-4ad6-a941-1a95ec489f86
- Order Result: 404 (http://localhost:5173/orca/order/bundles?patientId=01417&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20260204T064239Z / traceId=ffcb2ba3-3679-4ad6-a941-1a95ec489f86 / requestId=ffcb2ba3-3679-4ad6-a941-1a95ec489f86 / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T064239Z/fullflow/network
- Console errors: 4
- Page errors: 0
