# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260204T055000Z-acceptmodv2-webclient
- 実施日時: 2026-02-04T05:47:37.355Z
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

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T055000Z-acceptmodv2-webclient ｜ traceId: fe9425f1-8228-48b9-955c-f6e63faf5dd5
- Api_Result: 16
- 所要時間: 718 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 200 http://localhost:5173/api/orca/queue
- 200 http://localhost:5173/orca/visits/mutation
- 200 http://localhost:5173/orca/visits/mutation
- 200 http://localhost:5173/orca/visits/mutation
- 200 http://localhost:5173/orca/visits/mutation

## Console Warnings/Errors

- なし

## Page Errors

- なし
