# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260205T061000Z-fullflow-01449
- TRACE_ID: trace-20260205T061000Z-fullflow-01449
- 実施日時: 2026-02-05T06:06:40.183Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01449
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: found
- Charts runId: 20251202T090000Z
- Charts traceId: 8413cfcd-bd17-4b69-81bc-886a7500b00d
- Order Result: 404 (http://127.0.0.1:5173/orca/order/bundles?patientId=01449&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20251202T090000Z / traceId=trace-20251202T090000Z / requestId=req-20251202T090000Z / outcome=SUCCESS閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: ガード理由（短文）印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
- ORCA Send Dialog: shown
- ORCA Send Toast: 
- Billing: clicked (http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-05)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260205T061000Z-fullflow-01449/fullflow/network
- Console errors: 4
- Page errors: 0
