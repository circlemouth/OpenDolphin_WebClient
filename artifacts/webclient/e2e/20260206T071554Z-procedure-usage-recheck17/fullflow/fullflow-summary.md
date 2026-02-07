# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260206T071554Z-procedure-usage-recheck17
- TRACE_ID: trace-20260206T071554Z-procedure-usage-recheck17
- 実施日時: 2026-02-06T07:17:38.976Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01416
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: not-found
- Charts runId: 20251212T143720Z
- Charts traceId: e9f1e875-a557-4c3d-b4bc-90a5ca755655
- Order Result: 404 (http://127.0.0.1:5173/orca/order/bundles?patientId=01416&entity=generalOrder)
- Finish Toast: 診療終了を完了runId=20251212T143720Z / traceId=trace-20251212T143720Z / requestId=req-20251212T143720Z / outcome=SUCCESS閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: ガード理由（短文）印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
- ORCA Send Dialog: shown
- ORCA Send Toast: 
- Billing: clicked (http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-06)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260206T071554Z-procedure-usage-recheck17/fullflow/network
- Console errors: 4
- Page errors: 0
