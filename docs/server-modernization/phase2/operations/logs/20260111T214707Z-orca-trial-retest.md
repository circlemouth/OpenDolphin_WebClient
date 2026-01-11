# ORCA Trial 追加実測（失敗系再確認）
- RUN_ID: 20260111T214707Z
- 実施日: 2026-01-11
- 対象: 20260111T213428Z で 500 となったエンドポイントの再測（患者作成後に実行）

## 実施内容
1. `POST /orca/patient/mutation` で `MOCK-002` を作成。
2. 以下の API を再実行。
   - `/orca/medical/records`
   - `/orca/disease`
   - `/orca/disease/v3`
   - `/orca/billing/estimate`
   - `/orca/patients/batch`

## 結果
| HTTP | Path | 結果 | 証跡 |
| --- | --- | --- | --- |
| POST | `/orca/patient/mutation` | 200 | `artifacts/orca-connectivity/20260111T214707Z/orca_patient_mutation.{status,headers,json}` |
| POST | `/orca/medical/records` | 500 | `artifacts/orca-connectivity/20260111T214707Z/orca_medical_records.{status,headers,json}` |
| POST | `/orca/disease` | 500 | `artifacts/orca-connectivity/20260111T214707Z/orca_disease.{status,headers,json}` |
| POST | `/orca/disease/v3` | 500 | `artifacts/orca-connectivity/20260111T214707Z/orca_disease_v3.{status,headers,json}` |
| POST | `/orca/billing/estimate` | 500 | `artifacts/orca-connectivity/20260111T214707Z/orca_billing_estimate.{status,headers,json}` |
| POST | `/orca/patients/batch` | 500 | `artifacts/orca-connectivity/20260111T214707Z/orca_patients_batch.{status,headers,json}` |

## 所見
- 患者作成後も 500 が継続したため、データ不足だけでなくセッション/実装側の例外が残存している可能性が高い。
- サーバーログ: `artifacts/orca-connectivity/20260111T214707Z/server-modernized-dev.log`
