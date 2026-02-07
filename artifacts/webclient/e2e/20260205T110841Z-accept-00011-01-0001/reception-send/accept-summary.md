# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260205T110841Z-accept-00011-01-0001
- 実施日時: 2026-02-05T11:10:12.130Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Session Role: admin
- 患者ID: 00011
- 診療科: 01
- 担当医: 0001
- 保険/自費: insurance
- 来院区分: 1
- Before: screenshots/01-reception-before-accept.png
- After: screenshots/02-reception-after-accept.png

## 送信結果

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260205T110841Z-accept-00011-01-0001 ｜ traceId: 051a9075-f7e4-49ec-92ee-9d4176766353
- Api_Result: —
- 所要時間: 3834 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 200 http://localhost:5173/api/orca/queue
- 500 http://localhost:5173/orca/visits/mutation
- 404 http://localhost:5173/orca/visits/mutation/mock

## HAR

- /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260205T110841Z-accept-00011-01-0001/reception-send/har/network.har

## Console Warnings/Errors

- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 404 (Not Found)

## Page Errors

- なし
