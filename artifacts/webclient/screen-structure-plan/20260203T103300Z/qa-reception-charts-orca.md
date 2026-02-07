# Reception/Charts ORCA 404 解消確認（VITE_ORCA_API_PATH_PREFIX=off）

- RUN_ID: 20260203T103300Z
- 実施日時: 2026-02-03T10:34:52.205Z
- Base URL: http://localhost:5174
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト取得(ORCA off) | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、/orca/appointments/list が 404 にならない | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-03 / screenshots-orca-off/01-reception-orca-off.png / appointments=1 |
| Charts: 外来カルテ取得(ORCA off) | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、/orca21/medicalmodv2/outpatient が 404 にならない | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-orca-off/02-charts-orca-off.png / medical=1 |

## Network Responses

- 401 http://localhost:5174/orca/visits/list
- 401 http://localhost:5174/orca/appointments/list
- 401 http://localhost:5174/orca/visits/list
- 401 http://localhost:5174/orca/appointments/list
- 401 http://localhost:5174/orca/appointments/list
- 401 http://localhost:5174/orca/visits/list
- 401 http://localhost:5174/orca21/medicalmodv2/outpatient
