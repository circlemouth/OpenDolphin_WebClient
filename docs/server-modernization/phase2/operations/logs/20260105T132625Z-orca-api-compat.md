# RUN_ID=20260105T132625Z ORCA API 互換テスト（API-only）

## 実行概要
- 実行日: 2026-01-05
- 接続先: WebORCA Trial (https://weborca-trial.orca.med.or.jp)
- 認証: Basic (trial / <MASKED>)
- 方式: API-only / XML UTF-8
- 証跡: artifacts/orca-connectivity/20260105T132625Z/

## 実行結果
### 正常系
- POST /api/api01rv2/system01dailyv2
  - HTTP 200 / Api_Result=00
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/trial/system01dailyv2/
- POST /api/api01rv2/systeminfv2（Request_Date/Time を当日へ更新）
  - HTTP 200 / Api_Result=0000
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/trial/systeminfv2_ok/

### 異常系
- POST /api/api01rv2/system01dailyv2（Request_Number=99）
  - HTTP 200 / Api_Result=91（リクエスト番号無し）
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/trial/system01dailyv2_error/
- POST /api/api01rv2/systeminfv2（テンプレ固定日時）
  - HTTP 200 / Api_Result=0006（時刻ずれ）
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/trial/systeminfv2/
- POST /api/api01rv2/patientlst6v2（Patient_ID=000019）
  - HTTP 200 / Api_Result=E10（患者なし）
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/trial/patientlst6v2/
- GET /api/api01rv2/patientgetv2?id=000001 / 999999
  - HTTP 200 / Api_Result=10（患者なし）
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/trial/patientgetv2_000001/ / errors/patientgetv2_404/
- POST /api/api01rv2/system01dailyv2（Basic 認証 NG）
  - HTTP 401
  - 証跡: artifacts/orca-connectivity/20260105T132625Z/errors/system01dailyv2_401/

## 所見
- API-only (XML/UTF-8) の疎通は `system01dailyv2` / `systeminfv2` で正常応答を確認。
- Trial 既定の患者 ID が不明なため、患者関連 API は「患者なし」エラーまでを確認。
