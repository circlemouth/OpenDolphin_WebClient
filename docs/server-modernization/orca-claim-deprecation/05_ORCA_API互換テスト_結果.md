# ORCA API 互換テスト結果

RUN_ID: 20260105T132625Z

## 目的
- API-only で診療フローが成立することを検証する。
- CLAIM 依存なしで ORCA API が完結することを確認する。

## 実行環境
- 接続先: WebORCA Trial (https://weborca-trial.orca.med.or.jp)
- 認証: Basic (trial / <MASKED>)
- 方式: API-only / XML UTF-8
- 証跡: artifacts/orca-connectivity/20260105T132625Z/

## 実施内容
### 正常系
- `system01dailyv2`（POST /api/api01rv2/system01dailyv2）
  - HTTP 200 / Api_Result=00
- `systeminfv2`（POST /api/api01rv2/systeminfv2）
  - Request_Date/Time を当日設定で実行
  - HTTP 200 / Api_Result=0000

### 異常系
- `system01dailyv2`（Request_Number=99）
  - HTTP 200 / Api_Result=91
- `systeminfv2`（テンプレ固定日時のまま送信）
  - HTTP 200 / Api_Result=0006
- `patientlst6v2`（Patient_ID=000019）
  - HTTP 200 / Api_Result=E10
- `patientgetv2`（id=000001 / 999999）
  - HTTP 200 / Api_Result=10
- `system01dailyv2`（Basic 認証エラー）
  - HTTP 401

## 結果
- 主要 API の正常系（system01dailyv2 / systeminfv2）と異常系（認証/パラメータ/存在しない患者）が通過。
- Trial 側の既存患者データが不明なため、患者・受診・診療行為の「正常系」は未確認。

## 補足
- 詳細ログ: docs/server-modernization/phase2/operations/logs/20260105T132625Z-orca-api-compat.md
