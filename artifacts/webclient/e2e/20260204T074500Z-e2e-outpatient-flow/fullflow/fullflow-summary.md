# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T074500Z-e2e-outpatient-flow
- TRACE_ID: trace-20260204T074500Z-e2e-outpatient-flow
- 実施日時: 2026-02-04T07:36:15.313Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T074500Z-e2e-outpatient-flow ｜ traceId: c3aacb72-cf03-4a6e-9c82-fcef12b1a89a
- Reception Row: not-found
- Charts runId: 20260204T074500Z-e2e-outpatient-flow
- Charts traceId: aa6569ad-0bea-42ca-93da-88af666a70a1
- Order Result: 404 (http://localhost:5173/orca/order/bundles?patientId=01415&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20260204T074500Z-e2e-outpatient-flow / traceId=aa6569ad-0bea-42ca-93da-88af666a70a1 / requestId=aa6569ad-0bea-42ca-93da-88af666a70a1 / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T074500Z-e2e-outpatient-flow/fullflow/network
- Console errors: 4
- Page errors: 0
