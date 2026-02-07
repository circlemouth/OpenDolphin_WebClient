# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260206T051259Z-accept-00005
- 実施日時: 2026-02-06T05:13:04.113Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Session Role: admin
- 患者ID: 00005
- 診療科: 01
- 担当医: 10001
- 保険/自費: insurance
- 来院区分: 1
- Before: screenshots/01-reception-before-accept.png
- After: screenshots/02-reception-after-accept.png

## 送信結果

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260206T051259Z-accept-00005 ｜ traceId: cc5f8bcb-6da8-4ff6-be7c-c63b4ccb863c
- Api_Result: —
- 所要時間: 33 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 500 http://127.0.0.1:5173/api/orca/queue
- 500 http://127.0.0.1:5173/orca/visits/mutation
- 500 http://127.0.0.1:5173/orca/visits/mutation/mock

## HAR

- なし

## Console Warnings/Errors

- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [warning] [chart-events] stream error Error: chart-events stream failed: 500
    at run (http://127.0.0.1:5173/src/libs/sse/chartEventStream.ts:170:17)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)

## Page Errors

- なし
