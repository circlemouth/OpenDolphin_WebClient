# 病名/処方/オーダー CRUD 証跡（RUN_ID=20260127T193045Z）

## 実施概要
- 実施日: 2026-01-28 (JST)
- 対象: 病名/処方/オーダー束 CRUD（/orca/disease, /orca/order/bundles）
- 環境:
  - Modernized server: http://localhost:19282/openDolphin/resources
  - Local WebORCA: http://localhost:8000/ (既存の `jma-receipt-docker-orca-1` を利用)
  - 認証: Basic `dolphindev` / `dolphindev`
  - Facility: `1.3.6.1.4.1.9414.10.1`
  - Stub endpoint: `OPENDOLPHIN_ENVIRONMENT=dev` + `OPENDOLPHIN_STUB_ENDPOINTS_MODE=allow`
- テスト患者:
  - patientId: `TX-20260127-CRUD-01`
  - name: `CRUD Test Patient`

## 結果サマリ
- 病名 CRUD: create/update/delete を 200 で完了し、`/orca/disease/import` で更新/削除の反映を確認。
- オーダー束 CRUD: create/update/delete を 200 で完了。
- 診療反映: `/orca/medical/records` が records=1 を返し、文書が存在することを確認。
- 注記: `/orca/order/bundles` の fetch は `recordsReturned=0` のまま。DB スナップショットで `d_document`/`d_module` の反映（medOrder/generalOrder）を確認。

## 証跡ファイル
### リクエスト
- `requests/patient-create.json`
- `requests/disease-create.json`
- `requests/disease-update.json`
- `requests/disease-delete.json`
- `requests/order-bundles-create.json`
- `requests/order-bundles-update.json`
- `requests/order-bundles-delete.json`
- `requests/medical-records-final.json`

### レスポンス（JSON/Headers/Status）
- `responses/patient-create.{json,headers,status}`
- `responses/disease-create.{json,headers,status}`
- `responses/disease-update.{json,headers,status}`
- `responses/disease-delete.{json,headers,status}`
- `responses/disease-import-after-update.{json,headers,status}`
- `responses/disease-import-after-delete.{json,headers,status}`
- `responses/order-bundles-create.{json,headers,status}`
- `responses/order-bundles-update.{json,headers,status}`
- `responses/order-bundles-delete.{json,headers,status}`
- `responses/order-bundles-after-update.{json,headers,status}`
- `responses/order-bundles-after-delete.{json,headers,status}`
- `responses/order-bundles-after-update-from.{json,headers,status}`
- `responses/order-bundles-after-update-med.{json,headers,status}`
- `responses/order-bundles-after-update-general.{json,headers,status}`
- `responses/medical-records-final.{json,headers,status}`

### ログ/スナップショット
- `logs/created-ids.txt`（diagnosisId / documentId）
- `logs/audit-events.tsv`（runId=20260127T193045Z の監査ログ）
- `logs/audit-events-success.tsv`（成功分のみ抽出）
- `logs/document-snapshot.tsv`（d_document 反映）
- `logs/module-snapshot.tsv`（d_module 反映）

## 補足
- `order-bundles` の fetch が 0 件のため、DB 反映と `medical-records` の records で診療反映を確認。
