# 病名/処方/オーダー CRUD 証跡（RUN_ID=20260127T200817Z）

## 実施概要
- 実施日: 2026-01-28 (JST)
- 対象: 病名/処方/オーダー束 CRUD（/orca/disease, /orca/order/bundles）
- 環境:
  - Modernized server: http://localhost:19282/openDolphin/resources
  - ORCA 接続先: Local WebORCA（http://localhost:8000/）
  - 認証: Basic `dolphindev` / `dolphindev`
  - Facility: `1.3.6.1.4.1.9414.10.1`
  - Stub endpoint: `OPENDOLPHIN_ENVIRONMENT=dev` + `OPENDOLPHIN_STUB_ENDPOINTS_MODE=allow`
- テスト患者:
  - patientId: `TX-20260127-CRUD-02`
  - name: `CRUD Test Patient 02`

## 実環境との差分と影響評価
- 標準接続は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従い WebORCA Trial を推奨。
- 本 CRUD は `/orca/disease` `/orca/order/bundles` の **ローカル DB 書き込みが主目的**であり、外部 ORCA API を直接呼び出さない。
- そのため Trial 接続の有無で CRUD 成否は変わらず、**診療反映の検証は local DB + medical records の突合で十分**と判断。
- 差分の影響:
  - Trial/本番の ORCA マスタ・運用ルールによる相互連携は未検証（ORCA 側にデータ反映するフローではないため）。
  - 実運用の外部 ORCA 反映を担保するには別途「ORCA 側のデータ登録確認」が必要。

## 結果サマリ
- 病名 CRUD: create/update/delete を 200 で完了し、`/orca/disease/import` で更新/削除の反映を確認。
- オーダー束 CRUD: create/update/delete を 200 で完了。
- 診療反映: `/orca/medical/records` が records=1 を返し、文書が存在することを確認。
- 注記: `/orca/order/bundles` fetch は `recordsReturned=0` のまま。
  - DB スナップショットで `d_document`/`d_module` に medOrder/generalOrder が反映されていることを確認。
  - `module-snapshot.tsv` では `bean_json` が OID 文字列となっており、fetch 側の payload 復元が失敗している可能性が高い。

## 診療反映の根拠
- `responses/medical-records-final.json` の records=1（診療履歴取得）
- `logs/document-snapshot.tsv` の doc status (F/D)
- `logs/module-snapshot.tsv` の entity (medOrder/generalOrder)

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
- `responses/order-bundles-after-update-from.{json,headers,status}`
- `responses/order-bundles-after-update-med.{json,headers,status}`
- `responses/order-bundles-after-update-general.{json,headers,status}`
- `responses/order-bundles-after-delete.{json,headers,status}`
- `responses/medical-records-final.{json,headers,status}`

### ログ/スナップショット
- `logs/created-ids.txt`（diagnosisId / documentId）
- `logs/audit-events.tsv`（runId=20260127T200817Z の監査ログ）
- `logs/audit-events-success.tsv`（成功分のみ抽出）
- `logs/document-snapshot.tsv`（d_document 反映）
- `logs/module-snapshot.tsv`（d_module 反映 / bean_json・beanbytes 参照）
