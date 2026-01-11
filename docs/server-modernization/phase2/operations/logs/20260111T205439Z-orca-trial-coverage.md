# ORCA Trial API カバレッジ実測ログ
- RUN_ID: 20260111T205439Z
- 実施日: 2026-01-11
- 対象: モダナイズ版サーバー経由の ORCA Trial 連携（/api/orca/master/*, /orca/master/*, /orca/tensu/etensu, /orca/appointments/*, /orca/visits/*, /orca/patients/*, /orca/insurance/combinations, /orca/billing/estimate, /orca/medical/*, /orca/disease*, /orca/patient/mutation, /orca/chart/subjectives, /orca/report/print, /orca/system/*）

## Trial 制約
- 公開環境のため実在情報は入力しない（MOCK-001 など疑似 ID を使用）。
- 登録内容は定期リセット前提。
- CLAIM 通信不可（CLAIM サーバ未稼働）。
- 印刷不可（/orca/report/print）。

## 実測環境
- 起動: `OPENDOLPHIN_SCHEMA_ACTION=create WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- 主要ポート: `MODERNIZED_APP_HTTP_PORT=29080`, `MODERNIZED_APP_ADMIN_PORT=29081`, `MODERNIZED_POSTGRES_PORT=65432`, `MINIO_API_PORT=29001`, `MINIO_CONSOLE_PORT=29002`
- ベース URL: `http://localhost:29080/openDolphin/resources`
- 認証: `userName` / `password(MD5)` / `clientUUID` ヘッダ（ログ内はマスク）

## 実測サマリ
- 全 API が HTTP 500（Internal Server Error）。
- 原因: DB スキーマ未初期化で `d_audit_event` 等が存在せず、監査ログ書き込みで例外発生。
  - 証跡: `artifacts/orca-connectivity/20260111T205439Z/server-modernized-dev.log`

## 対象 API 一覧（HTTP / Path / 期待 / 結果 / 証跡）
> 結果区分: 正常レスポンス確認 / Trial制約で不可 / 構成不足(500)

### ORCA Master
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| GET | `/api/orca/master/generic-class` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_generic_class.{status,headers,json}` |
| GET | `/orca/master/generic-class` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_generic_class.{status,headers,json}` |
| GET | `/api/orca/master/generic-price` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_generic_price.{status,headers,json}` |
| GET | `/orca/master/generic-price` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_generic_price.{status,headers,json}` |
| GET | `/api/orca/master/youhou` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_youhou.{status,headers,json}` |
| GET | `/orca/master/youhou` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_youhou.{status,headers,json}` |
| GET | `/api/orca/master/material` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_material.{status,headers,json}` |
| GET | `/orca/master/material` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_material.{status,headers,json}` |
| GET | `/api/orca/master/kensa-sort` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_kensa_sort.{status,headers,json}` |
| GET | `/orca/master/kensa-sort` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_kensa_sort.{status,headers,json}` |
| GET | `/api/orca/master/hokenja` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_hokenja.{status,headers,json}` |
| GET | `/orca/master/hokenja` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_hokenja.{status,headers,json}` |
| GET | `/api/orca/master/address` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_api_master_address.{status,headers,json}` |
| GET | `/orca/master/address` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_master_address.{status,headers,json}` |
| GET | `/orca/tensu/etensu` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_tensu_etensu.{status,headers,json}` |

### ORCA Wrapper（予約/来院/患者/保険/請求）
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/appointments/list` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_appointments_list.{status,headers,json}` |
| POST | `/orca/appointments/patient` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_appointments_patient.{status,headers,json}` |
| POST | `/orca/appointments/mutation` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_appointments_mutation.{status,headers,json}` |
| POST | `/orca/visits/list` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_visits_list.{status,headers,json}` |
| POST | `/orca/visits/mutation` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_visits_mutation.{status,headers,json}` |
| POST | `/orca/patients/id-list` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_patients_id_list.{status,headers,json}` |
| POST | `/orca/patients/batch` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_patients_batch.{status,headers,json}` |
| POST | `/orca/patients/name-search` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_patients_name_search.{status,headers,json}` |
| POST | `/orca/patients/former-names` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_patients_former_names.{status,headers,json}` |
| POST | `/orca/insurance/combinations` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_insurance_combinations.{status,headers,json}` |
| POST | `/orca/billing/estimate` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_billing_estimate.{status,headers,json}` |

### ORCA Medical / Chart
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/medical/records` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_medical_records.{status,headers,json}` |
| POST | `/orca/medical-sets` | Trial制約で不可 | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_medical_sets.{status,headers,json}` |
| POST | `/orca/tensu/sync` | Trial制約で不可 | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_tensu_sync.{status,headers,json}` |
| POST | `/orca/birth-delivery` | Trial制約で不可 | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_birth_delivery.{status,headers,json}` |
| POST | `/orca/disease` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_disease.{status,headers,json}` |
| POST | `/orca/disease/v3` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_disease_v3.{status,headers,json}` |
| POST | `/orca/patient/mutation` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_patient_mutation.{status,headers,json}` |
| POST | `/orca/chart/subjectives` | Trial制約で不可 | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_chart_subjectives.{status,headers,json}` |

### 印刷 / System
| HTTP | Path | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/report/print` | Trial制約で不可（印刷） | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_report_print.{status,headers,json}` |
| POST | `/orca/system/management` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_system_management.{status,headers,json}` |
| POST | `/orca/system/users` | 200 JSON | 構成不足(500) | `artifacts/orca-connectivity/20260111T205439Z/orca_system_users.{status,headers,json}` |

## 正常レスポンス確認できなかった理由
- DB スキーマ未初期化（`d_audit_event` を含むテーブルが存在しないため、監査ログ書き込みで例外が発生）。
- これにより全 API が HTTP 500 を返却し、Trial 制約判定や Api_Result の確認に到達できなかった。

## 参考にした既存証跡
- `docs/server-modernization/phase2/operations/logs/20251226T061010Z-orca-wrapper-e2e.md`（/orca/chart/subjectives ほかの正常レスポンス確認済み）
- `docs/server-modernization/phase2/operations/logs/20251226T061010Z-orca-master-e2e.md`（/api/orca/master/* 503）
- `docs/server-modernization/phase2/operations/logs/20251226T062842Z-orca08-e2e.md`（/orca/tensu/etensu 404）
- `docs/server-modernization/phase2/operations/logs/20251121PostOpenCheckZ1-api-contract.md`（/orca/appointments|visits|report/print 405）
