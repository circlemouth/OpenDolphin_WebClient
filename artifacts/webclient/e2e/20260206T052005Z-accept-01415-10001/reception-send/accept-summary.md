# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260206T052005Z-accept-01415-10001
- 実施日時: 2026-02-06T05:20:09.684Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Session Role: admin
- 患者ID: 01415
- 診療科: 01
- 担当医: 10001
- 保険/自費: insurance
- 来院区分: 1
- Before: screenshots/01-reception-before-accept.png
- After: screenshots/02-reception-after-accept.png

## 送信結果

- Tone: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Api_Result: 00
- 所要時間: 36 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 200 http://127.0.0.1:5173/api/orca/queue
- 200 http://127.0.0.1:5173/orca/visits/mutation/mock

## HAR

- なし

## Console Warnings/Errors

- なし

## Page Errors

- なし
