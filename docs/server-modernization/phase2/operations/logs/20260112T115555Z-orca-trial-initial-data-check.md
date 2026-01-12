# RUN_ID=20260112T115555Z WebORCA Trial 初期データ確認

## 目的
- Trial 公開ページに記載された初期データ（患者 00001〜00011 等）を API で確認する
- patientlst2v2 / acsimulatev2 が HTTP 500 を出さないことを確認する

## 参照
- 初期データの一次情報: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`

## 実測結果 (Trial 直叩き)
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/patientlst2v2?class=01`
  - HTTP 200 / Api_Result=00 / Target_Patient_Count=011
  - 患者 `00001`〜`00011` が全件ヒットし、氏名が「事例 一〜十一」で返却
  - req: `artifacts/orca-connectivity/20260112T115555Z/request/patientlst2v2.xml`
  - res: `artifacts/orca-connectivity/20260112T115555Z/response/patientlst2v2.xml`
  - headers: `artifacts/orca-connectivity/20260112T115555Z/headers/patientlst2v2.headers`
  - trace: `artifacts/orca-connectivity/20260112T115555Z/trace/patientlst2v2.trace`
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/acsimulatev2?class=01`
  - HTTP 200 / Api_Result=50（点数マスター未登録: `110000001`）
  - 患者 `00001` の氏名・保険情報が返却され、HTTP 500 は発生せず
  - req: `artifacts/orca-connectivity/20260112T115555Z/request/acsimulatev2.xml`
  - res: `artifacts/orca-connectivity/20260112T115555Z/response/acsimulatev2.xml`
  - headers: `artifacts/orca-connectivity/20260112T115555Z/headers/acsimulatev2.headers`
  - trace: `artifacts/orca-connectivity/20260112T115555Z/trace/acsimulatev2.trace`

## 補足
- acsimulatev2 は診療行為コードに対する点数マスター不足で業務エラーになったが、患者情報は取得できたため Trial 初期データの存在を確認できた。

## 証跡
- `artifacts/orca-connectivity/20260112T115555Z/`
