# Reception 受付送信（acceptmodv2）

- RUN_ID: 20260205T101740Z
- 実施日時: 2026-02-05T10:17:45.640Z
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

- Tone: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260205T101740Z ｜ traceId: 1183211b-0edd-43bc-8bca-e85101a1d8bf
- Api_Result: 16
- 所要時間: 145 ms
- XHR Debug: lastAttemptAt: —
status: —
error: —

## Network

- 200 http://localhost:5173/api/orca/queue
- 200 http://localhost:5173/orca/visits/mutation

## HAR

- /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260205T101740Z/reception-send/har/network.har

## Console Warnings/Errors

- なし

## Page Errors

- なし
