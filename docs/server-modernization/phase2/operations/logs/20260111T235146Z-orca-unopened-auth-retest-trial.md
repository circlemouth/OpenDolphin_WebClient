# 未解放/認証不一致 API 再送（WebORCA Trial）

- RUN_ID: 20260111T235146Z
- 実施日: 2026-01-11
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic (trial / <MASKED>)
- 実在情報は未使用

## 送信条件
- `/api/orca/master/*` / `/orca/tensu/etensu`: GET + Basic
- `/orca/master/*`: GET + Basic
- `/orca/system/*` / `/orca/report/print`: POST + Basic + JSON `{}`

## 結果（ステータス）
| API | Method | 結果 | 証跡 |
| --- | --- | --- | --- |
| `/api/orca/master/generic-class` | GET | 502 | `artifacts/orca-connectivity/20260111T235146Z/api_orca_master_generic-class.*` |
| `/api/orca/master/generic-price` | GET | 502 | `.../api_orca_master_generic-price.*` |
| `/api/orca/master/youhou` | GET | 502 | `.../api_orca_master_youhou.*` |
| `/api/orca/master/material` | GET | 502 | `.../api_orca_master_material.*` |
| `/api/orca/master/kensa-sort` | GET | 502 | `.../api_orca_master_kensa-sort.*` |
| `/api/orca/master/hokenja` | GET | 502 | `.../api_orca_master_hokenja.*` |
| `/api/orca/master/address` | GET | 502 | `.../api_orca_master_address.*` |
| `/orca/tensu/etensu` | GET | 404 | `.../orca_tensu_etensu.*` |
| `/orca/master/generic-class` | GET | 404 | `.../orca_master_generic-class.*` |
| `/orca/master/generic-price` | GET | 404 | `.../orca_master_generic-price.*` |
| `/orca/master/youhou` | GET | 404 | `.../orca_master_youhou.*` |
| `/orca/master/material` | GET | 404 | `.../orca_master_material.*` |
| `/orca/master/kensa-sort` | GET | 404 | `.../orca_master_kensa-sort.*` |
| `/orca/master/hokenja` | GET | 404 | `.../orca_master_hokenja.*` |
| `/orca/master/address` | GET | 404 | `.../orca_master_address.*` |
| `/orca/system/management` | POST | 405 | `.../orca_system_management.*` |
| `/orca/system/users` | POST | 405 | `.../orca_system_users.*` |
| `/orca/report/print` | POST | 405 | `.../orca_report_print.*` |

## メモ
- `/api/orca/master/*` は 502 (nginx) で応答。Trial 側のルーティング/バックエンド未提供の可能性。
- `/orca/system/*` `/orca/report/print` は 405 (Method Not Allowed)。
- `/orca/tensu/etensu` は 404。
