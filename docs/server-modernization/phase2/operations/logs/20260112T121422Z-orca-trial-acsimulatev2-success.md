# RUN_ID=20260112T121422Z WebORCA Trial acsimulatev2 Api_Result=00 検証

## 目的
- medicationgetv2 で有効な診療行為コードを確認し、acsimulatev2 を Api_Result=00 で通す
- patientlst2v2 の保険情報を acsimulatev2 に反映する
- server-modernized 経由で Api_Result=00 を確認する

## 実測結果 (Trial 直叩き)
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/medicationgetv2`
  - Request_Number=02 / Request_Code=112007410 / Base_Date=2026-01-11
  - HTTP 200 / Api_Result=000 / Medication_Name=再診料
  - req: `artifacts/orca-connectivity/20260112T121422Z/request/medicationgetv2.xml`
  - res: `artifacts/orca-connectivity/20260112T121422Z/response/medicationgetv2.xml`
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/patientlst2v2?class=01`
  - Patient_ID=00001 で保険情報取得（国保 060）
  - req: `artifacts/orca-connectivity/20260112T121422Z/request/patientlst2v2.xml`
  - res: `artifacts/orca-connectivity/20260112T121422Z/response/patientlst2v2.xml`
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/acsimulatev2?class=01`
  - 医療行為: 112007410（再診料）+ 国保保険情報
  - HTTP 200 / Api_Result=00
  - req: `artifacts/orca-connectivity/20260112T121422Z/request/acsimulatev2.xml`
  - res: `artifacts/orca-connectivity/20260112T121422Z/response/acsimulatev2.xml`

## 実測結果 (server-modernized 経由)
- `POST http://localhost:9080/openDolphin/resources/orca/billing/estimate`
  - patientId=00001 / departmentCode=01 / performDate=2026-01-11 / medicalCode=112007410
  - HTTP 200 / apiResult=00
  - res: `artifacts/orca-connectivity/20260112T121422Z/server/billing_estimate.json`
  - headers: `artifacts/orca-connectivity/20260112T121422Z/headers/server_acsimulatev2.headers`

## 証跡
- `artifacts/orca-connectivity/20260112T121422Z/`
