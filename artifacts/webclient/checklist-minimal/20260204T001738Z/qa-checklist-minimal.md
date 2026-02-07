# チェックリスト最小検証（遷移/リロード）

- RUN_ID: 20260204T001738Z
- 実施日時: 2026-02-04T00:17:52.355Z
- Base URL: http://localhost:5174
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- console error count: 0
- console warning count: 0
- page error count: 0

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 初回表示 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示される | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04 / screenshots-checklist-minimal/01-reception.png |
| Reception: reload | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception | reload 後も reception-page が表示される | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04 / screenshots-checklist-minimal/02-reception-reload.png |
| Charts: 遷移 | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示される | OK | url=http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts / screenshots-checklist-minimal/03-charts.png |
| Charts: back/forward | http://localhost:5174/f/1.3.6.1.4.1.9414.72.103/charts | back で reception、forward で charts が表示される | OK | back=screenshots-checklist-minimal/04-back-to-reception.png / forward=screenshots-checklist-minimal/05-forward-to-charts.png |

## Console Errors/Warnings

- なし

## Page Errors

- なし
