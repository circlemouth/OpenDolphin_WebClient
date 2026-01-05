# RUN_ID=20260105T132625Z ORCA API 互換テスト Evidence

## 実行条件
- 接続先: WebORCA Trial (https://weborca-trial.orca.med.or.jp)
- 認証: Basic (user=trial / pass=<MASKED>)
- 方式: API-only (XML/UTF-8)
- 実行日時: 2026-01-05

## 実行結果サマリ
- system01dailyv2: HTTP 200 / Api_Result=00
- system01dailyv2 (Request_Number=99): HTTP 200 / Api_Result=91
- systeminfv2 (現在時刻): HTTP 200 / Api_Result=0000
- systeminfv2 (テンプレ時間): HTTP 200 / Api_Result=0006
- patientlst6v2 (Patient_ID=000019): HTTP 200 / Api_Result=E10
- patientgetv2 (id=000001/999999): HTTP 200 / Api_Result=10
- system01dailyv2 (invalid password): HTTP 401

## Evidence
- trial/ 配下に request/response/headers/status.txt を保存
- trace/ 配下に curl trace を保存
- errors/ 配下に 401 / patientgetv2 の証跡を保存
