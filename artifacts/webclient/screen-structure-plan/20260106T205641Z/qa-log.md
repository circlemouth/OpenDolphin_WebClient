# 50_主要導線の動作確認と回帰チェック

- RUN_ID: 20260106T205641Z
- 実施日時: 2026-01-06T21:14:32.064Z
- Base URL: https://localhost:4173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- セッションロール: admin
- VITE_DISABLE_MSW: 0

## 主要導線（Login → Reception → Charts → Patients → Administration）

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Login: 施設選択画面表示 | https://localhost:4173/login | 施設選択画面が表示される | OK | heading=OpenDolphin Web 施設選択 / screenshots/01-login-entry.png |
| Reception: 受付画面表示 | https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/reception | 受付画面が表示され、main に reception-page が存在する | OK | url=https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-01-06 / screenshots/02-reception.png |
| Charts: カルテ画面表示 | https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/charts | カルテ画面が表示され、charts-page が存在する | OK | url=https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/charts / screenshots/03-charts.png |
| Patients: 患者画面表示 | https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/patients | 患者画面が表示され、patients-page が存在する | OK | url=https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/patients?sort=time&date=2026-01-06 / screenshots/04-patients.png |
| Administration: 管理画面表示 | https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/administration | 管理画面が表示され、管理ページ要素が存在する | OK | url=https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/administration / screenshots/05-administration.png |

## デバッグ隔離/旧導線の確認

| 項目 | URL | 期待 | 結果 | 証跡/備考 |
| --- | --- | --- | --- | --- |
| Debug Hub: デバッグ導線はアクセス拒否 | https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/debug | アクセス拒否メッセージまたはログイン誘導 | OK | url=https://localhost:4173/login / screenshots/06-debug-hub-denied.png / ログイン誘導 |
| Debug Outpatient Mock: アクセス拒否 | https://localhost:4173/f/1.3.6.1.4.1.9414.72.103/debug/outpatient-mock | アクセス拒否メッセージまたはログイン誘導 | OK | url=https://localhost:4173/login / screenshots/07-debug-outpatient-denied.png / ログイン誘導 |
| Legacy /outpatient-mock: 旧導線の非表示/拒否 | https://localhost:4173/outpatient-mock | 旧導線の案内画面またはログイン誘導が表示される | OK | url=https://localhost:4173/login / screenshots/08-legacy-outpatient-mock.png |

## 備考
- ログインは施設選択画面の表示まで確認。実ログインはローカルDB未初期化のためセッション注入で代替。
- デバッグ導線は VITE_ENABLE_DEBUG_PAGES=0 のため拒否表示またはログイン誘導を確認。
