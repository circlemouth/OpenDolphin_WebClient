# ORCA Trial 500 継続 API 解析
- RUN_ID: 20260111T215124Z
- 実施日: 2026-01-11
- 目的: ORCA Trial で 500 継続中の API の原因を特定し、修正方針/代替手段を提示

## 前提
- 実在情報は使用せず、患者 ID は `MOCK-500` を使用。
- CLAIM/印刷は未実施。
- 認証は `userName: LOCAL.FACILITY.0001:dolphin` / `password: 36cdf8...` を使用。
- 実測は `setup-modernized-env.sh` 起動済みの Modernized サーバーに対して実施。

## 実測対象と結果
| HTTP | Path | 結果 | 例外/原因 | 証跡 |
| --- | --- | --- | --- | --- |
| POST | `/orca/patient/mutation` | 200 | ローカル DB に患者登録成功 | `artifacts/orca-connectivity/20260111T215124Z/orca_patient_mutation.{status,headers,json}` |
| POST | `/orca/patients/batch` | 500 | ORCA Trial 側 `/api01rv2/patientlst2v2` が HTTP 500 | `artifacts/orca-connectivity/20260111T215124Z/orca_patients_batch.{status,headers,json}` / `artifacts/orca-connectivity/20260111T215124Z/server-modernized-dev.log` |
| POST | `/orca/disease` | 500 | `d_diagnosis.karte_id` が NULL で INSERT 失敗（Karte 未生成） | `artifacts/orca-connectivity/20260111T215124Z/orca_disease.{status,headers,json}` / `artifacts/orca-connectivity/20260111T215124Z/server-modernized-dev.log` |
| POST | `/orca/disease/v3` | 500 | `d_diagnosis.karte_id` が NULL で INSERT 失敗（Karte 未生成） | `artifacts/orca-connectivity/20260111T215124Z/orca_disease_v3.{status,headers,json}` / `artifacts/orca-connectivity/20260111T215124Z/server-modernized-dev.log` |
| POST | `/orca/medical/records` | 500 | `karte` が null のまま `karte.getId()` 参照で NPE | `artifacts/orca-connectivity/20260111T215124Z/orca_medical_records.{status,headers,json}` / `artifacts/orca-connectivity/20260111T215124Z/server-modernized-dev.log` |
| POST | `/orca/billing/estimate` | 500 | ORCA Trial 側 `/api01rv2/acsimulatev2` が HTTP 500 | `artifacts/orca-connectivity/20260111T215124Z/orca_billing_estimate.{status,headers,json}` / `artifacts/orca-connectivity/20260111T215124Z/server-modernized-dev.log` |

## 原因の詳細
- `/orca/patients/batch`
  - ORCA Trial 実行時に `RestOrcaTransport` が `/api01rv2/patientlst2v2` へ送信するが、HTTP 500 を返却。
  - `server-modernized-dev.log` に `ORCA_HTTP response status 500` として記録。
- `/orca/billing/estimate`
  - `/api01rv2/acsimulatev2` への ORCA Trial リクエストが HTTP 500。
  - `ORCA_FAILURE` としてログに記録。
- `/orca/disease` `/orca/disease/v3`
  - 患者は登録済みだが、患者に紐づく `KarteBean` が未生成。
  - `d_diagnosis` への INSERT で `karte_id` が NULL となり制約違反 → 500。
- `/orca/medical/records`
  - `karteServiceBean.getKarte()` が null を返し、`karte.getId()` 参照で NPE → 500。

## 修正方針 / 代替手段
- 患者カルテ未生成による 500（`/orca/disease`, `/orca/disease/v3`, `/orca/medical/records`）
  - 方針A: `/orca/patient/mutation` で患者登録時に `KarteBean` を自動生成する（`PatientServiceBean.addPatient` または `OrcaPatientResource` 側で生成）。
  - 方針B: `OrcaDiseaseResource` / `OrcaMedicalResource` で `karte == null` を検知し、
    - 新規カルテを作成して処理を継続する、または
    - 404/空配列で返却して 500 を回避。
- ORCA Trial 側 500（`/orca/patients/batch`, `/orca/billing/estimate`）
  - Trial では ORCA 側が 500 を返すため正常レスポンスが得られない。
  - 代替案: Trial 専用で `StubOrcaTransport` を利用する構成に切替（`RestOrcaTransport` を使わない選択肢を追加）。
  - 代替案: ORCA 側に登録済みのテスト患者を使う必要があるが、実在情報禁止のため本検証では不可。

