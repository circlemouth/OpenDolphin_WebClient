# Touch/ADM/PHR API Trial 実測（RUN_ID=20260115T052303Z）

- 実行日時(UTC): 2026-01-15T05:32:59Z
- 環境: WebORCA Trial
- ログイン: system_admin（role=admin） / user=LOCAL.FACILITY.0001:admin
- 実行導線: Administration → Touch/ADM/PHR API パネル → 各「疎通確認」
- UI runId/traceId: runId=20260115T053123Z / traceId=4dc58877-9597-46b3-befa-aef8641367cb

## 実測結果

| Group | Endpoint | HTTP | runId | traceId | stub |
| --- | --- | --- | --- | --- | --- |
| Touch | /touch/user/LOCAL.FACILITY.0001:admin,LOCAL.FACILITY.0001,password | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /touch/patient/1 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /touch/patientPackage/1 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /touch/patients/name/LOCAL.FACILITY.0001,テスト,0,10 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /touch/patient/visit?facility=LOCAL.FACILITY.0001&offset=0&limit=10&sort=pvtDate&order=desc | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /jtouch/patients/count | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /jtouch/patients/name/テスト,0,10 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /jtouch/user/LOCAL.FACILITY.0001:admin | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Touch | /10/eht/serverinfo | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| ADM10 | /10/adm/jtouch/patients/count | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| ADM10 | /10/adm/jtouch/patients/name/テスト,0,10 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| ADM20 | /20/adm/jtouch/patients/count | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| ADM20 | /20/adm/eht/serverinfo | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| ADM20 | /20/adm/carePlan/1 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| PHR | /20/adm/phr/accessKey/ACCESS-KEY | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| PHR | /20/adm/phr/patient/00002 | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | - |
| Demo | /demo/user/LOCAL.FACILITY.0001:admin | 404 (4xx) | 20260115T053123Z | 4dc58877-9597-46b3-befa-aef8641367cb | stub=demo固定 表示 |

## 補足
- Demo endpoint は UI に `stub=demo固定` が表示されることを確認。
