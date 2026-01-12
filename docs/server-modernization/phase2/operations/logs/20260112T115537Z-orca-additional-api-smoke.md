# ORCA追加API疎通（RUN_ID=20260112T115537Z）

## 実施概要
- 目的: 追加API（patientgetv2/patientmodv2/patientlst7v2/patientmemomodv2/diseasegetv2/diseasev3/medicalgetv2/medicalmodv2）の疎通確認
- 接続先: WebORCA Trial (https://weborca-trial.orca.med.or.jp)
- 経路: modernized server -> ORCA API
- 実施日: 2026-01-12

## 事前準備
- 起動: WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19082 MODERNIZED_APP_ADMIN_PORT=19996 MODERNIZED_POSTGRES_PORT=55440 MINIO_API_PORT=19102 MINIO_CONSOLE_PORT=19103 ./setup-modernized-env.sh
- ベース: http://localhost:19082/openDolphin/resources

## 疎通結果
(下にコマンドとレスポンスを貼り付け)

## 疎通コマンド/結果

### Health check
- Command:
  - curl -H 'userName: 1.3.6.1.4.1.9414.10.1:dolphin' -H 'password: <MASKED>' http://localhost:19082/openDolphin/resources/dolphin
- Result:
  - HTTP 200
  - artifacts/orca-connectivity/20260112T115537Z/responses/health.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/health.body

### patientgetv2 (GET)
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    'http://localhost:19082/openDolphin/resources/api01rv2/patientgetv2?id=000001'
- Result:
  - HTTP 200 / Api_Result=10 / 患者番号に該当する患者が存在しません
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientgetv2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientgetv2.body

### patientmodv2 (class=01)
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/patientmodv2_request.xml \
    'http://localhost:19082/openDolphin/resources/orca12/patientmodv2?class=01'
- Result:
  - HTTP 200 / Api_Result=00 / 登録終了
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientmodv2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientmodv2.body

### patientlst7v2
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/patientlst7v2_request.xml \
    'http://localhost:19082/openDolphin/resources/api01rv2/patientlst7v2'
- Result:
  - HTTP 200 / Api_Result=E10 / 患者番号に該当する患者が存在しません
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientlst7v2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientlst7v2.body

### patientmemomodv2
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/patientmemomodv2_request.xml \
    'http://localhost:19082/openDolphin/resources/orca06/patientmemomodv2'
- Result:
  - HTTP 500 (server) / ORCA HTTP response status 502
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientmemomodv2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/patientmemomodv2.body

### diseasegetv2 (class=01)
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/diseasegetv2_request.xml \
    'http://localhost:19082/openDolphin/resources/api01rv2/diseasegetv2?class=01'
- Result:
  - HTTP 200 / Api_Result=10 / 患者番号に該当する患者が存在しません
  - artifacts/orca-connectivity/20260112T115537Z/responses/diseasegetv2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/diseasegetv2.body

### diseasev3 (class=01)
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/diseasev3_request.xml \
    'http://localhost:19082/openDolphin/resources/orca22/diseasev3?class=01'
- Result:
  - HTTP 200 / Api_Result=E10 / 患者番号に該当する患者が存在しません
  - artifacts/orca-connectivity/20260112T115537Z/responses/diseasev3.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/diseasev3.body

### medicalgetv2 (class=01)
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/medicalgetv2_request.xml \
    'http://localhost:19082/openDolphin/resources/api01rv2/medicalgetv2?class=01'
- Result:
  - HTTP 200 / Api_Result=10 / 患者番号に該当する患者が存在しません
  - artifacts/orca-connectivity/20260112T115537Z/responses/medicalgetv2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/medicalgetv2.body

### medicalmodv2 (class=01)
- Command:
  - curl -H 'userName: dolphindev' -H 'password: <MASKED>' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
    -X POST --data-binary @artifacts/orca-connectivity/20260112T115537Z/requests/medicalmodv2_request.xml \
    'http://localhost:19082/openDolphin/resources/api21/medicalmodv2?class=01'
- Result:
  - HTTP 200 / Api_Result=01 / 患者番号が未設定です
  - artifacts/orca-connectivity/20260112T115537Z/responses/medicalmodv2.headers
  - artifacts/orca-connectivity/20260112T115537Z/responses/medicalmodv2.body
