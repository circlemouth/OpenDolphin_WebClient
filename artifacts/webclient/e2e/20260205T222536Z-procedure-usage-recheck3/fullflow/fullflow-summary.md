# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260205T222536Z-procedure-usage-recheck3
- TRACE_ID: trace-20260205T222536Z-procedure-usage-recheck3
- 実施日時: 2026-02-05T22:28:38.955Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 00005
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260205T222536Z-procedure-usage-recheck3 ｜ traceId: 103bd0e5-b2b7-456f-9daa-2b1b317a7f0b
- Reception Row: not-found
- Charts runId: 20251202T090000Z
- Charts traceId: 907750d6-1cd2-4186-952b-c8ee93c93df8
- Order Result: 500 (http://localhost:5173/orca/order/bundles)
- Finish Toast: 
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: ガード理由（短文）印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
- ORCA Send Dialog: shown
- ORCA Send Toast: 
- Billing: clicked (http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-05)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260205T222536Z-procedure-usage-recheck3/fullflow/network
- Console errors: 201
- Page errors: 0
