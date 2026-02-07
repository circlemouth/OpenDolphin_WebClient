# Reception/Charts ORCA 404 解消確認（VITE_ORCA_API_PATH_PREFIX=off）

- RUN_ID: 20260204T091800Z-orca
- 実施日時: 2026-02-04T00:19:04.382Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: msw-off

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト取得(ORCA off) | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、/orca/appointments/list が 404 にならない | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04 / screenshots-orca-off/01-reception-orca-off.png / appointments=1 |
| Charts: 外来カルテ取得(ORCA off) | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、/orca21/medicalmodv2/outpatient が 404 にならない | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-orca-off/02-charts-orca-off.png / medical=2 |

## Network Responses

- 200 http://localhost:5173/orca/appointments/list
- 200 http://localhost:5173/orca/visits/list
- 200 http://localhost:5173/orca/appointments/list
- 200 http://localhost:5173/orca21/medicalmodv2/outpatient
- 200 http://localhost:5173/orca/visits/list
- 200 http://localhost:5173/orca/appointments/list
- 200 http://localhost:5173/orca/visits/list
- 200 http://localhost:5173/orca21/medicalmodv2/outpatient
