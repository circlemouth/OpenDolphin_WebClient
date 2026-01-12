# Webクライアント ORCA Trial プロキシ疎通ログ

- RUN_ID: 20260111T235603Z
- 実施日: 2026-01-11
- 目的: Webクライアントが ORCA Trial エンドポイントへ到達できることを確認

## 設定
- Vite dev proxy:
  - `VITE_DEV_PROXY_TARGET=https://weborca-trial.orca.med.or.jp`
  - Basic 認証: `ORCA_PROD_BASIC_USER=trial` / `ORCA_PROD_BASIC_KEY=<MASKED>`
- 追加対応: `web-client/vite.config.ts` に `/orca` プロキシを追加
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（環境変数は上記）

## 実測（Webクライアント dev server 経由）
- ベース: `http://localhost:5173`

| Path | Method | 結果 | 証跡 |
| --- | --- | --- | --- |
| `/orca/master/generic-class` | GET | 404 | `artifacts/orca-connectivity/20260111T235603Z/webclient_orca_master_generic-class.*` |
| `/orca/master/generic-price` | GET | 404 | `.../webclient_orca_master_generic-price.*` |
| `/orca/master/youhou` | GET | 404 | `.../webclient_orca_master_youhou.*` |
| `/orca/master/material` | GET | 404 | `.../webclient_orca_master_material.*` |
| `/orca/master/kensa-sort` | GET | 404 | `.../webclient_orca_master_kensa-sort.*` |
| `/orca/master/hokenja` | GET | 404 | `.../webclient_orca_master_hokenja.*` |
| `/orca/master/address` | GET | 404 | `.../webclient_orca_master_address.*` |
| `/orca/tensu/etensu` | GET | 404 | `.../webclient_orca_tensu_etensu.*` |
| `/orca/system/management` | POST | 405 | `.../webclient_orca_system_management.*` |
| `/orca/system/users` | POST | 405 | `.../webclient_orca_system_users.*` |
| `/orca/report/print` | POST | 405 | `.../webclient_orca_report_print.*` |
| `/api/orca/master/generic-class` | GET | 404 | `.../webclient_api_orca_master_generic-class.*` |
| `/api/orca/master/generic-price` | GET | 404 | `.../webclient_api_orca_master_generic-price.*` |
| `/api/orca/master/youhou` | GET | 404 | `.../webclient_api_orca_master_youhou.*` |
| `/api/orca/master/material` | GET | 404 | `.../webclient_api_orca_master_material.*` |
| `/api/orca/master/kensa-sort` | GET | 404 | `.../webclient_api_orca_master_kensa-sort.*` |
| `/api/orca/master/hokenja` | GET | 404 | `.../webclient_api_orca_master_hokenja.*` |
| `/api/orca/master/address` | GET | 404 | `.../webclient_api_orca_master_address.*` |

## メモ
- Webクライアント dev server 経由で ORCA Trial まで到達することを確認（ステータスは Trial 側の 404/405 をそのまま受領）。
