# CLAIM 廃止検証（/orca/claim/outpatient 呼び出しゼロ確認）

- RUN_ID: 20260203T214629Z
- 実施日時: 2026-02-03T21:46:41.193Z
- Base URL: http://localhost:5174
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- ORCAリクエスト数: 12
- ORCAレスポンス数: 11
- CLAIMリクエスト数: 0
- CLAIM検知: false

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト表示 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、CLAIM 呼び出しが存在しない | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-03 / screenshots-claim-deprecation/01-reception-claim-deprecation.png |
| Charts: 外来カルテ表示 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、CLAIM 呼び出しが存在しない | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-claim-deprecation/02-charts-claim-deprecation.png |

## ORCA Request URLs（重複除外）

- http://localhost:5174/api/orca/queue
- http://localhost:5174/orca/appointments/list
- http://localhost:5174/orca/visits/list
- http://localhost:5174/orca/deptinfo
- http://localhost:5174/orca21/medicalmodv2/outpatient

## CLAIM Request URLs（検知時のみ）

- なし

## ORCA Responses（抜粋）

- 200 http://localhost:5174/api/orca/queue
- 200 http://localhost:5174/orca/deptinfo
- 200 http://localhost:5174/orca/deptinfo
- 200 http://localhost:5174/orca/visits/list
- 200 http://localhost:5174/orca/appointments/list
- 200 http://localhost:5174/orca/visits/list
- 200 http://localhost:5174/orca21/medicalmodv2/outpatient
- 200 http://localhost:5174/orca/appointments/list
- 200 http://localhost:5174/orca/appointments/list
- 200 http://localhost:5174/orca21/medicalmodv2/outpatient
- 200 http://localhost:5174/orca/visits/list
