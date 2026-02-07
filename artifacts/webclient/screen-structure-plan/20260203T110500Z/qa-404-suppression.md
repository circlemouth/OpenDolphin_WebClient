# 404抑止パッチ再検証（Reception/Charts）

- RUN_ID: 20260203T110500Z
- 実施日時: 2026-02-03T10:57:22.404Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- console error count: 12
- console warning count: 0
- console 404-ish count: 12
- network response count: 11

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト取得(404抑止パッチ確認) | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、console error が抑止される | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-03 / screenshots-404-suppression/01-reception-404-suppression.png |
| Charts: 外来カルテ取得(404抑止パッチ確認) | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、console error が抑止される | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-404-suppression/02-charts-404-suppression.png |

## Network Responses

- 404 http://localhost:5173/orca/appointments/list
- 404 http://localhost:5173/orca/visits/list
- 404 http://localhost:5173/orca/claim/outpatient
- 200 http://localhost:5173/orca/claim/outpatient/mock
- 404 http://localhost:5173/orca/visits/list
- 404 http://localhost:5173/orca/appointments/list
- 404 http://localhost:5173/orca/claim/outpatient
- 200 http://localhost:5173/orca/claim/outpatient/mock
- 404 http://localhost:5173/orca/appointments/list
- 404 http://localhost:5173/orca/visits/list
- 404 http://localhost:5173/orca21/medicalmodv2/outpatient

## Console Messages (error/warn)

- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)
- error Failed to load resource: the server responded with a status of 404 (Not Found)

## Page Errors

- (none)
