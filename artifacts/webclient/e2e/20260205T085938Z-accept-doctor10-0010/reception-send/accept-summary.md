# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260205T085938Z-accept-doctor10-0010
- 実施日時: 2026-02-05T08:59:41.747Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Session Role: admin
- 患者ID: 00005
- 診療科: 26
- 担当医: 0010
- 保険/自費: insurance
- 来院区分: 1
- Before: screenshots/01-reception-before-accept.png
- After: screenshots/02-reception-after-accept.png

## 送信結果

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260205T085938Z-accept-doctor10-0010 ｜ traceId: 97e0e202-bcc9-4621-b758-503c093c2777
- Api_Result: 14
- 所要時間: 69 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 200 http://localhost:5173/api/orca/queue
- 200 http://localhost:5173/orca/visits/mutation

## HAR

- /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260205T085938Z-accept-doctor10-0010/reception-send/har/network.har

## Console Warnings/Errors

- なし

## Page Errors

- なし
