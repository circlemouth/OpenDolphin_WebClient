# 追加画面の動作確認（残り画面）

- RUN_ID: 20260204T091200Z-extras
- 実施日時: 2026-02-04T00:18:26.403Z
- Base URL: http://localhost:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: system_admin
- シナリオ: system_admin

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Charts Print: 外来印刷プレビュー | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts/print/outpatient | charts-print 画面が表示される（状態欠落の場合はエラーバナー） | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts/print/outpatient / screenshots-extra/01-charts-print-outpatient.png / charts-print=true |
| Charts Print: 文書印刷プレビュー | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts/print/document | charts-print 画面が表示される（状態欠落の場合はエラーバナー） | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/charts/print/document / screenshots-extra/02-charts-print-document.png / charts-print=true |
| Debug ORCA API Console | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/debug/orca-api | アクセス拒否または ORCA API Console が表示 | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/debug/orca-api / screenshots-extra/03-debug-orca-api.png / denied=true / console=false |
| Debug Legacy REST Console | http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/debug/legacy-rest | アクセス拒否または Legacy REST コンソールが表示 | OK | url=http://localhost:5173/f/1.3.6.1.4.1.9414.72.103/debug/legacy-rest / screenshots-extra/04-debug-legacy-rest.png / denied=true / console=false |
