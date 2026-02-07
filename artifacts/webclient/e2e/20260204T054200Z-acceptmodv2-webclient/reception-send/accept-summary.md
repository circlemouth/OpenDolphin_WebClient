# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260204T054200Z-acceptmodv2-webclient
- 実施日時: 2026-02-04T05:38:43.098Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Session Role: admin
- 患者ID: 01414
- 診療科: 01
- 担当医: 10001
- 保険/自費: insurance
- 来院区分: 0
- Before: screenshots/01-reception-before-accept.png
- After: screenshots/02-reception-after-accept.png

## 送信結果

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T054200Z-acceptmodv2-webclient ｜ traceId: e31af11c-0aaa-4db9-9ded-5f34f4ee1cc2
- Api_Result: 30
- 所要時間: 410 ms
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
