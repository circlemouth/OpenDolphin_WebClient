# ORCA API Coverage (RUN_ID=20251121T153200Z)

- 接続先: `http://100.102.17.40:8000`（Basic: ormaster/change_me）。
- 取得日時: 2025-11-21T06:47Z〜06:52Z (UTC)。
- Evidence: `artifacts/orca-connectivity/20251121T153200Z/crud/` 以下の request/response/headers。

| ORCA API | Status | Notes |
| --- | --- | --- |
| `/api01rv2/acceptlstv2?class=01` | HTTP 200 / `Api_Result=13` | ドクター未登録。`crud/acceptlstv2/response_2025-11-21T06-47-07Z.xml`。 |
| `/api01rv2/appointlstv2?class=01` | HTTP 200 / `Api_Result=12` | ドクター未登録。`crud/appointlstv2/response_2025-11-21T06-48-07Z.xml`。 |
| `/api/api21/medicalmodv2?class=01` | HTTP 200 / `Api_Result=10` | 患者番号 `00000001` を参照できず。`crud/medicalmodv2/response_2025-11-21T06-49-11Z.xml`。 |
| `/orca11/acceptmodv2?class=01` | HTTP 405 (Allow: OPTIONS, GET) | POST 未開放。`crud/acceptmodv2/headers_2025-11-21T06-49-58Z.txt`。 |
| `/orca14/appointmodv2?class=01` | HTTP 405 (Allow: OPTIONS, GET) | POST 未開放。`crud/appointmodv2/headers_2025-11-21T06-50-48Z.txt`。 |
| `/orca06/patientmemomodv2` | HTTP 405 (Allow: OPTIONS, GET) | 患者メモ登録が無効。`crud/patientmemomodv2/headers_2025-11-21T06-51-39Z.txt`。 |
| `/orca42/receiptprintv3` | HTTP 405 (Allow: OPTIONS, GET) | 帳票印刷が無効（push/blobs 未構成）。`crud/receiptprintv3/headers_2025-11-21T06-52-22Z.txt`。 |
