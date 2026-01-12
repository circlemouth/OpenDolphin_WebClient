# 未解放/認証不一致 API 再送結果

- RUN_ID: 20260111T231621Z
- 実施日: 2026-01-11
- 目的: 以前「未解放/認証不一致」と判定された API へ再送し、現状を記録

## 送信条件
- ベース URL: `http://localhost:19082/openDolphin`
- 実在情報は未使用
- 認証方式
  - `/api/orca/master/*`, `/orca/tensu/etensu`: **Basic 認証**（user/pass は <MASKED>）
  - `/orca/master/*`, `/orca/system/*`, `/orca/report/print`: **ヘッダー認証**（`userName`/`password` は <MASKED>）

## 結果（ステータス）
| API | Method | 認証 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| `/api/orca/master/generic-class` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_generic-class.*` |
| `/api/orca/master/generic-price` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_generic-price.*` |
| `/api/orca/master/youhou` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_youhou.*` |
| `/api/orca/master/material` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_material.*` |
| `/api/orca/master/kensa-sort` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_kensa-sort.*` |
| `/api/orca/master/hokenja` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_hokenja.*` |
| `/api/orca/master/address` | GET | Basic | 404 | `artifacts/orca-connectivity/20260111T231621Z/api_orca_master_address.*` |
| `/orca/tensu/etensu` | GET | Basic | 401 | `artifacts/orca-connectivity/20260111T231621Z/orca_tensu_etensu.*` |
| `/orca/master/generic-class` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_generic-class.*` |
| `/orca/master/generic-price` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_generic-price.*` |
| `/orca/master/youhou` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_youhou.*` |
| `/orca/master/material` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_material.*` |
| `/orca/master/kensa-sort` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_kensa-sort.*` |
| `/orca/master/hokenja` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_hokenja.*` |
| `/orca/master/address` | GET | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_master_address.*` |
| `/orca/system/management` | POST | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_system_management.*` |
| `/orca/system/users` | POST | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_system_users.*` |
| `/orca/report/print` | POST | Header | 404 | `artifacts/orca-connectivity/20260111T231621Z/orca_report_print.*` |

## メモ
- `/orca/tensu/etensu` は Basic 認証を付与しても 401 のまま。
- `/api/orca/master/*` は Basic 認証でも 404 になっており、現在のルーティング/公開状態は未開放のまま。
