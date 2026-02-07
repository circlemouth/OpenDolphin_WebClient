# /orca/order/bundles network memo

- RUN_ID: 20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10
- baseURL: http://127.0.0.1:5176

## 1. request GET /orca/order/bundles?patientId=01415&entity=medOrder

## 2. request POST /orca/order/bundles

```json
{"patientId":"01415","operations":[{"operation":"create","entity":"medOrder","bundleName":"ORDER-001 処方 20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","startDate":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]}]}
```

## 3. response GET 200 /orca/order/bundles?patientId=01415&entity=medOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","patientId":"01415","recordsReturned":2,"bundles":[{"documentId":9212,"moduleId":9213,"entity":"medOrder","bundleName":"ORDER-001 処方 20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]},{"documentId":9215,"moduleId":9216,"entity":"medOrder","bundleName":"ORDER-001 処方 20260207T055950Z-cmd_20260207_05_sub_1-order-001-parity9","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]}]}
```

## 4. response POST 200 /orca/order/bundles

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","createdDocumentIds":[9218],"updatedDocumentIds":[],"deletedDocumentIds":[]}
```

## 5. request GET /orca/order/bundles?patientId=01415&entity=medOrder

## 6. response GET 200 /orca/order/bundles?patientId=01415&entity=medOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","patientId":"01415","recordsReturned":3,"bundles":[{"documentId":9212,"moduleId":9213,"entity":"medOrder","bundleName":"ORDER-001 処方 20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]},{"documentId":9215,"moduleId":9216,"entity":"medOrder","bundleName":"ORDER-001 処方 20260207T055950Z-cmd_20260207_05_sub_1-order-001-parity9","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"アムロジピン","quantity":"1","unit":"錠","memo":""}]},{"documentId":9218,"moduleId":9219,"entity":"medOrder","bundleName":"ORDER-001 処方 20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","bundleNumber":"1","classCode":"212","classCodeSystem":"Claim007","className":"内服薬剤（院外処方）","admin":"1日1回","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"アムロジピン...
```

## 7. request GET /orca/order/bundles?patientId=01415&entity=generalOrder

## 8. response GET 200 /orca/order/bundles?patientId=01415&entity=generalOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","patientId":"01415","recordsReturned":11,"bundles":[{"documentId":9060,"moduleId":9061,"entity":"generalOrder","bundleName":"代表オーダー 20260204T235200Z-order-bundle-ui-save","bundleNumber":"1","className":"代表オーダー 20260204T235200Z-order-bundle-ui-save","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9076,"moduleId":9077,"entity":"generalOrder","bundleName":"代表オーダー 20260204T220019Z","bundleNumber":"1","className":"代表オーダー 20260204T220019Z","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9087,"moduleId":9088,"entity":"generalOrder","bundleName":"代表オーダー 20260204T230400Z-fullflow-proxy-fix","bundleNumber":"1","className":"代表オーダー 20260204T230400Z-fullflow-proxy-fix","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9090,"moduleId":9091,"entity":"generalOrder","bundleName":"代表オーダー 20260204T233400Z-fullflow-acceptp...
```

## 9. request POST /orca/order/bundles

```json
{"patientId":"01415","operations":[{"operation":"create","entity":"generalOrder","bundleName":"ORDER-001 オーダー 20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","bundleNumber":"1","admin":"","adminMemo":"","memo":"","startDate":"2026-02-07","items":[{"name":"処置A","quantity":"1","unit":"回","memo":""}]}]}
```

## 10. response POST 200 /orca/order/bundles

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","createdDocumentIds":[9221],"updatedDocumentIds":[],"deletedDocumentIds":[]}
```

## 11. request GET /orca/order/bundles?patientId=01415&entity=generalOrder

## 12. response GET 200 /orca/order/bundles?patientId=01415&entity=generalOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T060224Z-cmd_20260207_05_sub_1-order-001-parity10","patientId":"01415","recordsReturned":12,"bundles":[{"documentId":9060,"moduleId":9061,"entity":"generalOrder","bundleName":"代表オーダー 20260204T235200Z-order-bundle-ui-save","bundleNumber":"1","className":"代表オーダー 20260204T235200Z-order-bundle-ui-save","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9076,"moduleId":9077,"entity":"generalOrder","bundleName":"代表オーダー 20260204T220019Z","bundleNumber":"1","className":"代表オーダー 20260204T220019Z","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9087,"moduleId":9088,"entity":"generalOrder","bundleName":"代表オーダー 20260204T230400Z-fullflow-proxy-fix","bundleNumber":"1","className":"代表オーダー 20260204T230400Z-fullflow-proxy-fix","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9090,"moduleId":9091,"entity":"generalOrder","bundleName":"代表オーダー 20260204T233400Z-fullflow-acceptp...
```
