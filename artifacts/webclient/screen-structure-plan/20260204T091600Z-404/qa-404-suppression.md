# 404抑止パッチ再検証（Reception/Charts）

- RUN_ID: 20260204T091600Z-404
- 実施日時: 2026-02-04T00:18:52.616Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: msw-off
- console error count: 0
- console warning count: 0
- console 404-ish count: 0
- network response count: 7

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト取得(404抑止パッチ確認) | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、console error が抑止される | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04 / screenshots-404-suppression/01-reception-404-suppression.png |
| Charts: 外来カルテ取得(404抑止パッチ確認) | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、console error が抑止される | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-404-suppression/02-charts-404-suppression.png |
| Patients: サムネイル 404 抑止確認 | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/patients | patients-page が表示され、console error が抑止される | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/patients?sort=time&date=2026-02-04 / screenshots-404-suppression/03-patients-404-suppression.png |

## Network Responses

- 200 http://localhost:5173/orca/visits/list
- 200 http://localhost:5173/orca/appointments/list
- 200 http://localhost:5173/orca/visits/list
- 200 http://localhost:5173/orca/appointments/list
- 200 http://localhost:5173/orca/appointments/list
- 200 http://localhost:5173/orca/visits/list
- 200 http://localhost:5173/orca21/medicalmodv2/outpatient

## Console Messages (error/warn)

- (none)

## Page Errors

- (none)
