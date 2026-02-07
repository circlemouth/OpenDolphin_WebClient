# /orca/order/bundles network memo

- RUN_ID: 20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1
- baseURL: http://127.0.0.1:5176

## 1. request GET /orca/order/bundles?patientId=01415&entity=generalOrder

## 2. request POST /orca/order/bundles

```json
{"patientId":"01415","operations":[{"operation":"create","entity":"generalOrder","bundleName":"MVP一般-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","bundleNumber":"1","admin":"","adminMemo":"","memo":"","startDate":"2026-02-07","items":[{"name":"MVP一般-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","quantity":"1","unit":"回","memo":""}]}]}
```

## 3. response POST 200 /orca/order/bundles

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","createdDocumentIds":[9230],"updatedDocumentIds":[],"deletedDocumentIds":[]}
```

## 4. response GET 200 /orca/order/bundles?patientId=01415&entity=generalOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","patientId":"01415","recordsReturned":13,"bundles":[{"documentId":9060,"moduleId":9061,"entity":"generalOrder","bundleName":"代表オーダー 20260204T235200Z-order-bundle-ui-save","bundleNumber":"1","className":"代表オーダー 20260204T235200Z-order-bundle-ui-save","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9076,"moduleId":9077,"entity":"generalOrder","bundleName":"代表オーダー 20260204T220019Z","bundleNumber":"1","className":"代表オーダー 20260204T220019Z","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9087,"moduleId":9088,"entity":"generalOrder","bundleName":"代表オーダー 20260204T230400Z-fullflow-proxy-fix","bundleNumber":"1","className":"代表オーダー 20260204T230400Z-fullflow-proxy-fix","admin":"","adminMemo":"","memo":"","started":"2026-02-04","items":[{"name":"テストオーダー項目","quantity":"1","unit":"","memo":""}]},{"documentId":9090,"moduleId":9091,"entity":"generalOrder","bundleName":"代表オーダー 20260204T233400Z-fullflow-acceptpush-...
```

## 5. request GET /orca/order/bundles?patientId=01415&entity=treatmentOrder

## 6. response GET 200 /orca/order/bundles?patientId=01415&entity=treatmentOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","patientId":"01415","recordsReturned":0,"bundles":[]}
```

## 7. request POST /orca/order/bundles

```json
{"patientId":"01415","operations":[{"operation":"create","entity":"treatmentOrder","bundleName":"MVP処置-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","bundleNumber":"1","admin":"","adminMemo":"","memo":"","startDate":"2026-02-07","items":[{"name":"MVP処置-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","quantity":"1","unit":"回","memo":""}]}]}
```

## 8. response POST 200 /orca/order/bundles

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","createdDocumentIds":[9233],"updatedDocumentIds":[],"deletedDocumentIds":[]}
```

## 9. request GET /orca/order/bundles?patientId=01415&entity=treatmentOrder

## 10. response GET 200 /orca/order/bundles?patientId=01415&entity=treatmentOrder

```
{"apiResult":"00","apiResultMessage":"処理終了","runId":"20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","patientId":"01415","recordsReturned":1,"bundles":[{"documentId":9233,"moduleId":9234,"entity":"treatmentOrder","bundleName":"MVP処置-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","bundleNumber":"1","className":"MVP処置-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","admin":"","adminMemo":"","memo":"","started":"2026-02-07","items":[{"name":"MVP処置-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1","quantity":"1","unit":"回","memo":""}]}]}
```
