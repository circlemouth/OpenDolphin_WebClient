# Touch/ADM/PHR API Trial 実測（RUN_ID=20260115T061613Z）

- 実行日時: 2026-01-15 07:16:27Z
- 環境: WebORCA Trial
- ユーザー: 1.3.6.1.4.1.9414.72.103:doctor1（role=admin / system_admin 相当）
- 施設ID: 1.3.6.1.4.1.9414.72.103
- patientPk: 4 / patientId: 00002
- UI runId: 20260115T061613Z
- UI traceId: 7782b731-046e-4d0f-80ef-9f7bc5935718

## エンドポイント結果

| # | endpoint | status | runId | traceId | stub |
|---|---|---|---|---|---|
| 1 | /touch/user/doctor1,1.3.6.1.4.1.9414.72.103,632080fabdb968f9ac4f31fb55104648 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 2 | /touch/patient/4 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 3 | /touch/patientPackage/4 | 400 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 4 | /touch/patients/name/1.3.6.1.4.1.9414.72.103,テスト,0,10 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 5 | /touch/patient/visit?facility=1.3.6.1.4.1.9414.72.103&offset=0&limit=10&sort=pvtDate&order=desc | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 6 | /jtouch/patients/count | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 7 | /jtouch/patients/name/テスト,0,10 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 8 | /jtouch/user/1.3.6.1.4.1.9414.72.103:doctor1 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 9 | /10/eht/serverinfo | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 10 | /10/adm/jtouch/patients/count | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 11 | /10/adm/jtouch/patients/name/テスト,0,10 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 12 | /20/adm/jtouch/patients/count | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 13 | /20/adm/eht/serverinfo | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 14 | /20/adm/carePlan/4 | 200 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 15 | /20/adm/phr/accessKey/ACCESS-KEY | 404 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 16 | /20/adm/phr/patient/00002 | 404 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | - |
| 17 | /demo/user/doctor1 | 406 | 20260115T061613Z | 7782b731-046e-4d0f-80ef-9f7bc5935718 | stub表示あり |

## スクリーンショット
- artifacts/orca-connectivity/20260115T061613Z/touch-adm-phr-admin.png
