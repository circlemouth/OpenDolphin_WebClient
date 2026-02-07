# オーダー画面（薬剤/処置マスタ）UI確認

- RUN_ID: 20260204T065706Z-order-master-ui
- 実施日時: 2026-02-04T06:58:18.262Z
- Base URL: http://localhost:5174
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- master response count: 0
- console error count: 1
- console warning count: 0
- page error count: 0

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Charts: 薬剤マスタ表示と入力 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415 | 処方編集で薬剤マスタ表示・選択・用量/用法入力が可能 | NG | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: '処方編集' })[22m
 |
| Charts: 処置マスタ表示と入力 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415 | オーダー編集で処置マスタ表示・選択・数量入力が可能 | NG | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'オーダー編集' })[22m
 |

## Master Responses

- なし

## Console Errors/Warnings

- error: Failed to load resource: the server responded with a status of 404 (Not Found)

## Page Errors

- なし
