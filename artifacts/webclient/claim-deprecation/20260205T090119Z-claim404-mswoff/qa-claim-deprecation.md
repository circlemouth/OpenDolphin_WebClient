# CLAIM 廃止検証（/orca/claim/outpatient 呼び出しゼロ確認）

- RUN_ID: 20260205T090119Z-claim404-mswoff
- 実施日時: 2026-02-05T09:01:25.206Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- ORCAリクエスト数: 11
- ORCAレスポンス数: 5
- CLAIMリクエスト数: 0
- CLAIM検知: false

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト表示 | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、CLAIM 呼び出しが存在しない | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-05 / screenshots-claim-deprecation/01-reception-claim-deprecation.png |
| Charts: 外来カルテ表示 | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、CLAIM 呼び出しが存在しない | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-claim-deprecation/02-charts-claim-deprecation.png |

## ORCA Request URLs（重複除外）

- http://localhost:5173/api/orca/queue
- http://localhost:5173/orca/appointments/list
- http://localhost:5173/orca/visits/list
- http://localhost:5173/orca/deptinfo
- http://localhost:5173/orca21/medicalmodv2/outpatient

## CLAIM Request URLs（検知時のみ）

- なし

## ORCA Responses（抜粋）

- 200 http://localhost:5173/api/orca/queue
- 200 http://localhost:5173/orca/deptinfo
- 200 http://localhost:5173/orca/deptinfo
- 500 http://localhost:5173/orca/appointments/list
- 500 http://localhost:5173/orca/visits/list
