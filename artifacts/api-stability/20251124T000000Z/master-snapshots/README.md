# API master snapshots (RUN_ID=20251124T000000Z)

- Base: `artifacts/api-stability/20251123T130134Z/master-snapshots/`（リポジトリ内に実体なし）
- 取得日: 2025-11-24 10:47 JST
- 接続先: mac dev ORCA (`http://100.102.17.40:8000`)、Basic auth `ormaster/<redacted>`
- コマンド: curl -s/-v で REST を直接取得（Python 不使用）
- 保存方針: HTTP 200/JSON は body + headers を保存、非200 は body を保存し、空応答は `*_error.txt` に curl ログを残す。

## 結果概要
- GET /orca/master/address?zip=1000001 → 404 Not Found（JSON body 保存）
- GET /api/orca/master/address?zip=1000001 → Empty reply (status=000、body なし、`api_orca_master_address_error.txt` のみ)
- GET /orca/tensu/ten?min=110000000&max=110000099 → 404 Not Found（JSON body 保存）
- GET /api/orca/tensu/ten?min=110000000&max=110000099 → Empty reply (status=000、body なし、`api_orca_tensu_ten_error.txt` のみ)

## ファイル一覧
- address/
  - orca_master_address_headers.txt / response.json / status.txt
  - api_orca_master_address_headers.txt (空) / status.txt / error.txt
- tensu/
  - orca_tensu_ten_headers.txt / response.json / status.txt
  - api_orca_tensu_ten_headers.txt (空) / status.txt / error.txt

差分比較: 基点ディレクトリが存在しないため、比較対象なし。今回も 200 応答が得られず、実体スナップショットは未取得。
