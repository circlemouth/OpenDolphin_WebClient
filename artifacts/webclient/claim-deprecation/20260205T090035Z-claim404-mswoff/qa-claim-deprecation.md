# CLAIM 廃止検証（/orca/claim/outpatient 呼び出しゼロ確認）

- RUN_ID: 20260205T090035Z-claim404-mswoff
- 実施日時: 2026-02-05T09:01:06.152Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- シナリオ: admin
- ORCAリクエスト数: 0
- ORCAレスポンス数: 0
- CLAIMリクエスト数: 0
- CLAIM検知: false

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Reception: 外来リスト表示 | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception | reception-page が表示され、CLAIM 呼び出しが存在しない | NG | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception
Call log:
[2m  - navigating to "http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/reception", waiting until "domcontentloaded"[22m
 |
| Charts: 外来カルテ表示 | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts | charts-page が表示され、CLAIM 呼び出しが存在しない | NG | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: /カルテ|Charts/i })[22m
 |

## ORCA Request URLs（重複除外）

- なし

## CLAIM Request URLs（検知時のみ）

- なし

## ORCA Responses（抜粋）

- なし
