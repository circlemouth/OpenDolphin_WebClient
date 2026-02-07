# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T224700Z-accept-row-fix5
- TRACE_ID: trace-20260204T224700Z-accept-row-fix5
- 実施日時: 2026-02-04T22:46:50.774Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T224700Z-accept-row-fix5 ｜ traceId: 140b763e-9e5d-466c-b653-c4fe7d629eda
- Reception Row: not-found
- Charts runId: 20260204T224700Z-accept-row-fix5
- Charts traceId: 03dfeeaf-99e4-4063-a87c-c9490f2a75b1
- Order Result: 500 (http://127.0.0.1:5173/orca/order/bundles)
- Finish Toast: 診療終了を完了runId=20251202T090000Z / traceId=trace-20251202T090000Z / requestId=req-20251202T090000Z / outcome=SUCCESS閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: ガード理由（短文）印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
- ORCA Send Dialog: shown
- ORCA Send Toast: 
- Billing: clicked (http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T224700Z-accept-row-fix5/fullflow/network
- Console errors: 173
- Page errors: 0
