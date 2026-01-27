# 10 JSON/内製ラッパー実環境テスト

- RUN_ID: 20260127T113046Z
- 作業日: 2026-01-27
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/10_JSON内製ラッパー実環境テスト.md
- 対象IC: IC-57
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`（本RUNでは 8000 競合のため `http://localhost:18000/` を使用）
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する（本RUNでは compose project 名を分離）。

## Trial正常証跡の採用（スキップ対象）
- `/orca/appointments/list`（証跡: `artifacts/orca-connectivity/20260111T213428Z/orca_appointments_list.{status,headers,json}`）
- `/orca/patient/mutation`（証跡: `artifacts/orca-connectivity/20260111T213428Z/orca_patient_mutation.{status,headers,json}`）

## localhost 実測結果（Trial未確認 or Trial異常系）
- 実測セッション: Modernized base URL=`http://localhost:19282/openDolphin/resources`
- 実測セッション: Local WebORCA=`http://localhost:18000/`
- 実測セッション: 証跡ルート=`artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/`

| 区分 | Endpoint | localhost結果 | 証跡 |
| --- | --- | --- | --- |
| JSONラッパー | `/orca/patients/local-search` | 200 / `apiResult=00` / recordsReturned=1 | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_patients_local_search.{status,headers,json}` |
| JSONラッパー | `/orca12/patientmodv2/outpatient` | 200 / `apiResult=00` / operation=update | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca12_patientmodv2_outpatient_update.{status,headers,json}` |
| 内製ラッパー | `/orca/medical/records` | 200 / `apiResult=00` / records=1 | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_medical_records.{status,headers,json}` |
| 内製ラッパー | `/orca/chart/subjectives` | 200 / `apiResult=00`（実登録） | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_chart_subjectives.{status,headers,json}` |
| 内製ラッパー | `/orca/medical-sets` | 200 / `apiResult=79`（stub継続） | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_medical-sets.{status,headers,json}` |
| 内製ラッパー | `/orca/tensu/sync` | 200 / `apiResult=79`（stub継続） | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_tensu_sync.{status,headers,json}` |
| 内製ラッパー | `/orca/birth-delivery` | 200 / `apiResult=79`（stub継続） | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_birth-delivery.{status,headers,json}` |

## 差分一覧（Trial → localhost）
- 差分サマリ: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff-summary.md`
- 個別diff `/orca/medical/records`: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_medical_records.diff`
- 個別diff `/orca/chart/subjectives`: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_chart_subjectives.diff`
- 個別diff `/orca/medical-sets`: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_medical_sets.diff`
- 個別diff `/orca/tensu/sync`: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_tensu_sync.diff`
- 個別diff `/orca/birth-delivery`: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_birth_delivery.diff`

## 実装・検証で判明した事項
- `/orca/tensu/sync` は `/orca/tensu` の alias リソースがより優先マッチされるため 404 になっていた。
- 対応として `/orca/tensu/sync` を alias 側で受けて stub 実装へ委譲する修正を追加した（変更: `server-modernized/src/main/java/open/orca/rest/OrcaTensuAliasResource.java`）。
