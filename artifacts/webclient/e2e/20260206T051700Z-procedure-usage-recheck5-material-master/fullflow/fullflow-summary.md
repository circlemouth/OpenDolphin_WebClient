# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260206T051700Z-procedure-usage-recheck5-material-master
- TRACE_ID: trace-20260206T051700Z-procedure-usage-recheck5-material-master
- 実施日時: 2026-02-06T05:18:20.867Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 00001
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260206T051700Z-procedure-usage-recheck5-material-master ｜ traceId: 758035e5-5f70-4110-aae1-81bc6754f4e5
- Reception Row: not-found
- Charts runId: 20260206T051700Z-procedure-usage-recheck5-material-master
- Charts traceId: 0cb17956-e9da-4ec5-b735-a441c850a04e
- Order Result: 404 (http://localhost:5173/orca/order/bundles)
- Finish Toast: 診療終了を完了runId=20251202T090000Z / traceId=trace-20251202T090000Z / requestId=req-20251202T090000Z / outcome=SUCCESS閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: ガード理由（短文）印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
- ORCA Send Dialog: shown
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-06)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260206T051700Z-procedure-usage-recheck5-material-master/fullflow/network
- Console errors: 70
- Page errors: 0
