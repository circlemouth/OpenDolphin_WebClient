# オーダー画面（薬剤/処置マスタ）UI確認

- RUN_ID: 20260204T073200Z-order-master-ui
- 実施日時: 2026-02-04T07:05:36.362Z
- Base URL: http://localhost:5174
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- master response count: 3
- http error count: 3
- console error count: 3
- console warning count: 0
- page error count: 0

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Charts: 薬剤マスタ表示と入力 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415 | 処方編集で薬剤マスタ表示・選択・用量/用法入力が可能 | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415 / screenshots-order-master/01-med-master-input.png |
| Charts: 処置マスタ表示と入力 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415 | オーダー編集で処置マスタ表示・選択・数量入力が可能 | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415 / screenshots-order-master/02-treatment-master-input.png |

## Master Responses

- 200 http://localhost:5174/orca/master/generic-class?keyword=%E3%83%86%E3%82%B9%E3%83%88%E8%96%AC%E5%89%A4&page=1&size=50
- 200 http://localhost:5174/orca/master/youhou?keyword=1%E6%97%A51%E5%9B%9E
- 200 http://localhost:5174/orca/master/material?keyword=%E5%87%A6%E7%BD%AE%E3%83%86%E3%82%B9%E3%83%88

## HTTP Errors

- 404 http://localhost:5174/orca/disease/import/01415
- 404 http://localhost:5174/orca/order/bundles?patientId=01415&entity=medOrder
- 404 http://localhost:5174/orca/order/bundles?patientId=01415&entity=generalOrder

## Console Errors/Warnings

- error: Failed to load resource: the server responded with a status of 404 (Not Found)
- error: Failed to load resource: the server responded with a status of 404 (Not Found)
- error: Failed to load resource: the server responded with a status of 404 (Not Found)

## Page Errors

- なし
