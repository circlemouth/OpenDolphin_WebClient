# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260206T072728Z-procedure-usage-recheck19
- TRACE_ID: trace-20260206T072728Z-procedure-usage-recheck19
- 実施日時: 2026-02-06T07:29:03.634Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: found
- Charts runId: 20251212T143720Z
- Charts traceId: 6fbe17b4-cdca-4f0a-a070-f63f8719371c
- Order Result: 200 (http://127.0.0.1:5173/orca/order/bundles)
- Finish Toast: 診療終了を完了runId=20251212T143720Z / traceId=trace-20251212T143720Z / requestId=req-20251212T143720Z / outcome=SUCCESS閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: —
- ORCA Send Dialog: shown
- ORCA Send Toast: ORCA送信を完了runId=20260206T072728Z-procedure-usage-recheck19 / traceId=trace-20251212T143720Z / Api_Result=00 / Invoice_Number=INV-000001 / Data_Id=DATA-000001閉じる
- Billing: error (TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/reception**" until "load"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
  navigated to "http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-06&runId=20251212T143720Z&sort=time&date=2026-02-06"
============================================================)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png
- screenshots/07a-charts-orca-send-dialog.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260206T072728Z-procedure-usage-recheck19/fullflow/network
- Console errors: 71
- Page errors: 0
