# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T145002Z
- TRACE_ID: trace-20260204T145002Z
- 実施日時: 2026-02-04T14:51:16.588Z
- Base URL: http://localhost:5175
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: found
- Charts runId: 20251212T143720Z
- Charts traceId: e68d5b74-3c03-4522-ac86-58b74c3cf1bf
- Order Result: 200 (http://localhost:5175/orca/order/bundles)
- Finish Toast: 診療終了を完了runId=20251212T143720Z / traceId=trace-20251212T143720Z / requestId=req-20251212T143720Z / outcome=SUCCESS閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: —
- ORCA Send Dialog: shown
- ORCA Send Toast: ORCA送信を完了runId=20251212T143720Z / traceId=trace-20251212T143720Z / Api_Result=00 / Invoice_Number=INV-000001 / Data_Id=DATA-000001閉じる
- Billing: clicked (http://localhost:5175/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T145002Z/fullflow/network
- Console errors: 5
- Page errors: 0
