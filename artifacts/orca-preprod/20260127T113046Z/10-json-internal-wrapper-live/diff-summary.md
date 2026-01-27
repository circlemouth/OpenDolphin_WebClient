# JSON/内製ラッパー localhost 実測差分サマリ（RUN_ID=20260127T113046Z）

## 実測セッション
- RUN_ID: 20260127T113046Z
- Modernized base URL: `http://localhost:19282/openDolphin/resources`
- Local WebORCA: `http://localhost:18000/`（port 8000 競合のため 18000 を使用）
- 認証: `dolphindev / dolphindev`（Basic） + `X-Facility-Id: 1.3.6.1.4.1.9414.10.1`
- 主要ログ: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/command-log.txt`

## Trial 正常応答が既存証跡で確認済み（本タスクではスキップ）
- `/orca/appointments/list`
  - Trial証跡: `artifacts/orca-connectivity/20260111T213428Z/orca_appointments_list.{status,headers,json}`
- `/orca/patient/mutation`
  - Trial証跡: `artifacts/orca-connectivity/20260111T213428Z/orca_patient_mutation.{status,headers,json}`

## localhost 実測 + Trial差分一覧
| Endpoint | Trial証跡（20260111T213428Z） | localhost実測（20260127T113046Z） | 差分要点 | diff |
| --- | --- | --- | --- | --- |
| `/orca/patients/local-search` | 証跡なし（正常応答未確認） | 200 / `apiResult=00` / `recordsReturned=1` | Trial正常証跡が無いため localhost を新規採用 | （差分なし） |
| `/orca12/patientmodv2/outpatient` | 証跡なし（正常応答未確認） | 200 / `apiResult=00` / `operation=update` | Trial正常証跡が無いため localhost を新規採用 | （差分なし） |
| `/orca/medical/records` | 500（Session layer failure） | 200 / `apiResult=00` / records=1 | 500→200へ改善 | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_medical_records.diff` |
| `/orca/chart/subjectives` | 200 / `apiResult=79`（stub） | 200 / `apiResult=00`（実登録） | stub79→実登録00 | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_chart_subjectives.diff` |
| `/orca/medical-sets` | 200 / `apiResult=79`（stub） | 200 / `apiResult=79`（stub） | runId差分のみ | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_medical_sets.diff` |
| `/orca/tensu/sync` | 200 / `apiResult=79`（stub） | 200 / `apiResult=79`（stub） | runId差分のみ（404を解消） | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_tensu_sync.diff` |
| `/orca/birth-delivery` | 200 / `apiResult=79`（stub） | 200 / `apiResult=79`（stub） | runId差分のみ | `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/diff/orca_birth_delivery.diff` |

## localhost 証跡
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_patients_local_search.{status,headers,json}`
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca12_patientmodv2_outpatient_update.{status,headers,json}`
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_medical_records.{status,headers,json}`
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_chart_subjectives.{status,headers,json}`
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_medical-sets.{status,headers,json}`
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_tensu_sync.{status,headers,json}`
- `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/orca_birth-delivery.{status,headers,json}`
