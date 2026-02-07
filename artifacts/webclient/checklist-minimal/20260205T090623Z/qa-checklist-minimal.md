# チェックリスト最小検証（遷移/リロード）

- RUN_ID: 20260205T090623Z
- 実施日時: 2026-02-05T09:16:30.726Z
- Base URL: http://localhost:4173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: msw-on
- console error count: 0
- console warning count: 0
- page error count: 0

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 初回表示 | http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示される | OK | url=http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-05 / screenshots-checklist-minimal/01-reception.png |
| Reception: reload | http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/reception | reload 後も reception-page が表示される | OK | url=http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-05 / screenshots-checklist-minimal/02-reception-reload.png |
| Charts: 遷移 | http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示される | OK | url=http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/charts?patientId=01415&appointmentId=APT-1415&visitDate=2026-02-05&runId=20251212T143720Z / screenshots-checklist-minimal/03-charts.png |
| Charts: back/forward | http://localhost:4173/f/1.3.6.1.4.1.9414.72.103/charts | back で reception、forward で charts が表示される | OK | back=screenshots-checklist-minimal/04-back-to-reception.png / forward=screenshots-checklist-minimal/05-forward-to-charts.png |

## Console Errors/Warnings

- なし

## Page Errors

- なし
