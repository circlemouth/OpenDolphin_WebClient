# 追加API localhost実測サマリ（RUN_ID=20260127T075253Z）

## 前提
- modernized server: http://localhost:19082
- ORCA API: http://localhost:8000/api
- 認証: dolphindev/dolphindev + X-Facility-Id

## 正常応答を確認できたAPI
- systeminfv2: HTTP 200 / Api_Result=0000
  - request: requests/systeminfv2.xml
  - response: responses/systeminfv2.body.xml
  - headers: responses/systeminfv2.headers
  - status: responses/systeminfv2.status
- masterlastupdatev3: HTTP 200 / Api_Result=000
  - request: requests/masterlastupdatev3.xml
  - response: responses/masterlastupdatev3.body.xml
  - headers: responses/masterlastupdatev3.headers
  - status: responses/masterlastupdatev3.status
- insuranceinf1v2: HTTP 200 / Api_Result=00
  - request: requests/insuranceinf1v2.xml
  - response: responses/insuranceinf1v2.body.xml
  - headers: responses/insuranceinf1v2.headers
  - status: responses/insuranceinf1v2.status

## 未達/注意
- etensu: HTTP 404（条件を絞ってもヒットせず）
  - request: requests/etensu.url.txt / requests/etensu_no_asof.url.txt
  - response: responses/etensu.body.json / responses/etensu_no_asof.body.json
  - status: responses/etensu.status / responses/etensu_no_asof.status
