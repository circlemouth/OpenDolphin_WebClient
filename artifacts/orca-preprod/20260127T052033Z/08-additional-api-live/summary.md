# 08 追加API 実環境テスト（localhost WebORCA）サマリ

- RUN_ID: 20260127T052033Z
- 実施日 (UTC): 2026-01-27T05:46:40Z
- 接続先: http://localhost:8000 （WebORCA docker）
- modernized server: http://localhost:19082/openDolphin/resources
- 認証 (server): Basic user=dolphindev / password=<MASKED>
- 認証 (server): X-Facility-Id=1.3.6.1.4.1.9414.10.1
- 認証 (master guard): ORCA_MASTER_BASIC_USER=dolphindev / ORCA_MASTER_BASIC_PASSWORD=<MASKED>

## Trial正常応答済みのためスキップ
- 既存証跡を採用: system01dailyv2 / medicationgetv2 ほか（docs/server-modernization/phase2/operations/logs/ 配下）

## Trial未確認/不安定APIのlocalhost実測

### patientmodv2（前提データ作成）
- request: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/requests/patientmodv2_request_minimal.xml
- response headers: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmodv2_minimal.headers
- response body: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmodv2_minimal.body.xml
- HTTP status: 200
- Api_Result: K0
- Api_Result_Message: 登録終了
- Patient_ID: 00010

### patientmemomodv2（Trial未確認の代表）
- request: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/requests/patientmemomodv2_request.xml
- response headers: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmemomodv2.headers
- response body: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmemomodv2.body.xml
- HTTP status: 200
- Api_Result: 000
- Api_Result_Message: メモ登録終了

### /orca/tensu/etensu（Trial未確認の例）
- request URL: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/requests/orca_tensu_etensu.url.txt
- response headers: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/orca_tensu_etensu.headers
- response body: artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/orca_tensu_etensu.body.json
- HTTP status: 404
- 備考: localhost環境では etensu が 404（マスタデータ未投入/ヒットなしの可能性）

## 参考ログ
- Flyway: artifacts/preprod/flyway/flyway-20260127T053518Z.log
- API health: artifacts/preprod/api-health/api-health-20260127T053856Z.log
