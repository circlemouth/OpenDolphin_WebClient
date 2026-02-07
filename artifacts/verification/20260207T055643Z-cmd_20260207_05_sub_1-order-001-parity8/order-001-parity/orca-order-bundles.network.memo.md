# /orca/order/bundles network memo

- RUN_ID: 20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8
- baseURL: http://127.0.0.1:5176

## 1. request GET /orca/order/bundles?patientId=01415&entity=medOrder

## 2. request POST /orca/order/bundles

```json
{"patientId":"01415","operations":[{"operation":"create","entity":"medOrder","bundleName":"ORDER-001 処方 20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","startDate":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]}]}
```

## 3. response GET 200 /orca/order/bundles?patientId=01415&entity=medOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","patientId":"01415","recordsReturned":0,"bundles":[]}
```

## 4. response POST 200 /orca/order/bundles

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","createdDocumentIds":[9212],"updatedDocumentIds":[],"deletedDocumentIds":[]}
```

## 5. request GET /orca/order/bundles?patientId=01415&entity=medOrder

## 6. response GET 200 /orca/order/bundles?patientId=01415&entity=medOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","patientId":"01415","recordsReturned":1,"bundles":[{"documentId":9212,"moduleId":9213,"entity":"medOrder","bundleName":"ORDER-001 処方 20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]}]}
```
