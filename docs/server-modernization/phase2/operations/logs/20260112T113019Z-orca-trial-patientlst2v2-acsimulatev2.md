# RUN_ID=20260112T113019Z WebORCA Trial patientlst2v2 / acsimulatev2 500 修正検証

## 目的
- patientlst2v2 / acsimulatev2 を xml2 + class=01 + /api prefix で送信し、HTTP 500 を解消する
- ORCA Trial が HTTP 200 + xmlio2 を返すことを確認する
- server-modernized 経由でも 500 にならないことを確認する

## 起動
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- コンテナ名: `opendolphin-server-modernized-dev-task-1768217310278-4c12de`

## 認証
- OpenDolphin REST: `userName=dolphindev` / `password=md5(dolphindev)=1cc2f4c06fd32d0a6e2fa33f6e1c9164` + `X-Facility-Id=1.3.6.1.4.1.9414.10.1`
- ORCA Trial (直叩き): Basic `trial/weborcatrial`

## 実測結果 (ORCA Trial 直叩き)
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/patientlst2v2?class=01`
  - HTTP 200 / Api_Result=00（患者 000001 は未登録のため氏名は「患者番号がありません」）
  - req: `artifacts/orca-connectivity/20260112T113019Z/request/patientlst2v2.xml`
  - res: `artifacts/orca-connectivity/20260112T113019Z/response/patientlst2v2.xml`
  - headers: `artifacts/orca-connectivity/20260112T113019Z/headers/patientlst2v2.headers`
  - trace: `artifacts/orca-connectivity/20260112T113019Z/trace/patientlst2v2.trace`
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/acsimulatev2?class=01`
  - HTTP 200 / Api_Result=10（患者番号に該当する患者が存在しません）
  - req: `artifacts/orca-connectivity/20260112T113019Z/request/acsimulatev2.xml`
  - res: `artifacts/orca-connectivity/20260112T113019Z/response/acsimulatev2.xml`
  - headers: `artifacts/orca-connectivity/20260112T113019Z/headers/acsimulatev2.headers`
  - trace: `artifacts/orca-connectivity/20260112T113019Z/trace/acsimulatev2.trace`

## 実測結果 (server-modernized 経由)
- `POST http://localhost:9080/openDolphin/resources/orca/patients/batch`
  - HTTP 200 / apiResult=00
  - res: `artifacts/orca-connectivity/20260112T113019Z/server/patients_batch.json`
  - headers: `artifacts/orca-connectivity/20260112T113019Z/headers/server_patientlst2v2.headers`
- `POST http://localhost:9080/openDolphin/resources/orca/billing/estimate`
  - HTTP 200 / apiResult=10（患者番号に該当する患者が存在しません）
  - res: `artifacts/orca-connectivity/20260112T113019Z/server/billing_estimate.json`
  - headers: `artifacts/orca-connectivity/20260112T113019Z/headers/server_acsimulatev2.headers`

## 証跡
- `artifacts/orca-connectivity/20260112T113019Z/`
