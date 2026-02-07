# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260204T052600Z-acceptmodv2-webclient
- 実施日時: 2026-02-04T05:22:56.742Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Session Role: admin
- 患者ID: 01414
- 診療科: 01
- 担当医: 10001
- 保険/自費: insurance
- 来院区分: 1
- Before: screenshots/01-reception-before-accept.png
- After: screenshots/02-reception-after-accept.png

## 送信結果

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T052600Z-acceptmodv2-webclient ｜ traceId: a6d5acac-c052-483f-8361-c07b062a42ee
- Api_Result: —
- 所要時間: 110 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 200 http://localhost:5173/api/orca/queue
- 500 http://localhost:5173/orca/visits/mutation
- 404 http://localhost:5173/orca/visits/mutation/mock
- 500 http://localhost:5173/orca/visits/mutation
- 500 http://localhost:5173/orca/visits/mutation
- 500 http://localhost:5173/orca/visits/mutation

## Console Warnings/Errors

- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 404 (Not Found)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- [error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)

## Page Errors

- なし
