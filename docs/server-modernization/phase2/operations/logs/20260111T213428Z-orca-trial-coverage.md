# ORCA Trial API カバレッジ実測ログ
- RUN_ID: 20260111T213428Z
- 実施日: 2026-01-11
- 対象: モダナイズ版サーバー経由の ORCA Trial 連携（/api/orca/master/*, /orca/master/*, /orca/tensu/etensu, /orca/appointments/*, /orca/visits/*, /orca/patients/*, /orca/insurance/combinations, /orca/billing/estimate, /orca/medical/*, /orca/disease*, /orca/patient/mutation, /orca/chart/subjectives, /orca/report/print, /orca/system/*）

## Trial 制約
- 公開環境のため実在情報は入力しない（MOCK-001 など疑似 ID を使用）。
- 登録内容は定期リセット前提。
- CLAIM 通信不可（CLAIM サーバ未稼働）。
- 印刷不可（/orca/report/print）。

## 実測環境
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - 追加: 起動スクリプト側で Legacy schema dump を適用し DB 初期化。
- 主要ポート: `MODERNIZED_APP_HTTP_PORT=29080`, `MODERNIZED_APP_ADMIN_PORT=29081`, `MODERNIZED_POSTGRES_PORT=65432`, `MINIO_API_PORT=29001`, `MINIO_CONSOLE_PORT=29002`
- ベース URL: `http://localhost:29080/openDolphin/resources`
- 認証: `userName=LOCAL.FACILITY.0001:dolphin` / `password=36cdf8b887a5cffc78dcd5c08991b993` / `clientUUID=MOCK-CLIENT-001`

## 実測サマリ
- 正常レスポンス確認:
  - /orca/appointments/*, /orca/visits/*, /orca/patients/id-list, /orca/patients/name-search, /orca/patients/former-names, /orca/insurance/combinations, /orca/patient/mutation
- Trial制約で不可（stub 応答 200 / Api_Result=79）:
  - /orca/medical-sets, /orca/tensu/sync, /orca/birth-delivery, /orca/chart/subjectives
- 未開放/認証方式不一致:
  - /api/orca/master/*, /orca/tensu/etensu は Basic 認証必須のため 401
  - /orca/master/*, /orca/report/print, /orca/system/{management,users} は 404
- 構成不足/データ不足:
  - /orca/billing/estimate, /orca/disease, /orca/disease/v3, /orca/medical/records, /orca/patients/batch は Session layer failure（患者/施設紐付けのデータ不足）

## 対象 API 一覧（HTTP / Path / 期待 / 結果 / 証跡）
> 結果区分: 正常レスポンス確認 / Trial制約で不可 / 未開放・認証不一致 / 構成不足(500)

### ORCA Master
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| GET | `/api/orca/master/generic-class` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_generic_class.{status,headers,json}` |
| GET | `/api/orca/master/generic-price` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_generic_price.{status,headers,json}` |
| GET | `/api/orca/master/youhou` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_youhou.{status,headers,json}` |
| GET | `/api/orca/master/material` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_material.{status,headers,json}` |
| GET | `/api/orca/master/kensa-sort` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_kensa_sort.{status,headers,json}` |
| GET | `/api/orca/master/hokenja` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_hokenja.{status,headers,json}` |
| GET | `/api/orca/master/address` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_api_master_address.{status,headers,json}` |
| GET | `/orca/master/generic-class` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_generic_class.{status,headers,json}` |
| GET | `/orca/master/generic-price` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_generic_price.{status,headers,json}` |
| GET | `/orca/master/youhou` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_youhou.{status,headers,json}` |
| GET | `/orca/master/material` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_material.{status,headers,json}` |
| GET | `/orca/master/kensa-sort` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_kensa_sort.{status,headers,json}` |
| GET | `/orca/master/hokenja` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_hokenja.{status,headers,json}` |
| GET | `/orca/master/address` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_master_address.{status,headers,json}` |
| GET | `/orca/tensu/etensu` | 200 JSON | 未開放・認証不一致(401) | `artifacts/orca-connectivity/20260111T213428Z/orca_tensu_etensu.{status,headers,json}` |

### ORCA Wrapper（予約/来院/患者/保険/請求）
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/appointments/list` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_appointments_list.{status,headers,json}` |
| POST | `/orca/appointments/patient` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_appointments_patient.{status,headers,json}` |
| POST | `/orca/appointments/mutation` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_appointments_mutation.{status,headers,json}` |
| POST | `/orca/visits/list` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_visits_list.{status,headers,json}` |
| POST | `/orca/visits/mutation` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_visits_mutation.{status,headers,json}` |
| POST | `/orca/patients/id-list` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_patients_id_list.{status,headers,json}` |
| POST | `/orca/patients/batch` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T213428Z/orca_patients_batch.{status,headers,json}` |
| POST | `/orca/patients/name-search` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_patients_name_search.{status,headers,json}` |
| POST | `/orca/patients/former-names` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_patients_former_names.{status,headers,json}` |
| POST | `/orca/insurance/combinations` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_insurance_combinations.{status,headers,json}` |
| POST | `/orca/billing/estimate` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T213428Z/orca_billing_estimate.{status,headers,json}` |

### ORCA Medical / Chart
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/medical/records` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T213428Z/orca_medical_records.{status,headers,json}` |
| POST | `/orca/medical-sets` | Trial制約で不可 | Trial制約で不可(200/Api_Result=79) | `artifacts/orca-connectivity/20260111T213428Z/orca_medical_sets.{status,headers,json}` |
| POST | `/orca/tensu/sync` | Trial制約で不可 | Trial制約で不可(200/Api_Result=79) | `artifacts/orca-connectivity/20260111T213428Z/orca_tensu_sync.{status,headers,json}` |
| POST | `/orca/birth-delivery` | Trial制約で不可 | Trial制約で不可(200/Api_Result=79) | `artifacts/orca-connectivity/20260111T213428Z/orca_birth_delivery.{status,headers,json}` |
| POST | `/orca/disease` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T213428Z/orca_disease.{status,headers,json}` |
| POST | `/orca/disease/v3` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T213428Z/orca_disease_v3.{status,headers,json}` |
| POST | `/orca/patient/mutation` | 200 JSON | 正常レスポンス確認(200) | `artifacts/orca-connectivity/20260111T213428Z/orca_patient_mutation.{status,headers,json}` |
| POST | `/orca/chart/subjectives` | Trial制約で不可 | Trial制約で不可(200/Api_Result=79) | `artifacts/orca-connectivity/20260111T213428Z/orca_chart_subjectives.{status,headers,json}` |

### 印刷 / System
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/report/print` | Trial制約で不可（印刷） | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_report_print.{status,headers,json}` |
| POST | `/orca/system/management` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_system_management.{status,headers,json}` |
| POST | `/orca/system/users` | 200 JSON | 未開放(404) | `artifacts/orca-connectivity/20260111T213428Z/orca_system_users.{status,headers,json}` |

## 正常レスポンス確認できなかった理由
- /api/orca/master/* と /orca/tensu/etensu: Basic 認証が必須だがヘッダ認証で実行したため 401。
- /orca/master/*, /orca/report/print, /orca/system/*: 現状ルート未開放のため 404。
- /orca/billing/estimate, /orca/disease, /orca/disease/v3, /orca/medical/records, /orca/patients/batch: facility/patient 紐付け不足による NoResultException（詳細はサーバーログ参照）。

## 証跡
- Request/Response: `artifacts/orca-connectivity/20260111T213428Z/*`
- サーバーログ: `artifacts/orca-connectivity/20260111T213428Z/server-modernized-dev.log`

## 参考にした既存証跡
- `docs/server-modernization/phase2/operations/logs/20251226T061010Z-orca-wrapper-e2e.md`
- `docs/server-modernization/phase2/operations/logs/20251226T061010Z-orca-master-e2e.md`
- `docs/server-modernization/phase2/operations/logs/20251226T062842Z-orca08-e2e.md`
- `docs/server-modernization/phase2/operations/logs/20251121PostOpenCheckZ1-api-contract.md`
