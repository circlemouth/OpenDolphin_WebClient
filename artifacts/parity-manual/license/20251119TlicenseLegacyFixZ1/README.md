# RUN_ID=20251119TlicenseLegacyFixZ1 Legacy ライセンス REST 再検証

## 1. 実施手順
- `tmp/license/system_license_post_body.txt` に `legacy-device-20251119TlicenseLegacyFixZ1` を投入し、`ops/tests/api-smoke-test/run.sh --scenario license --profile compose --run-id 20251119TlicenseLegacyFixZ1` を実行。
- `opendolphin-server`（Legacy）/`opendolphin-server-modernized-dev` へ同一ヘッダー（`ops/tests/api-smoke-test/headers/sysad-license.headers`）を送信し、POST→GET→GET-system の 3 ケースを連続採取。
- 取得した HTTP/headers/meta を `artifacts/parity-manual/license/20251119TlicenseLegacyFixZ1/` 以下へ整理し、`metadata.json` にはリクエスト統計を転記。

## 2. HTTP 応答
| Case | Legacy (8080) | Modernized (8080) | 備考 |
| --- | --- | --- | --- |
| `POST /dolphin/license` | **200 / body=\"0\"** | **200 / body=\"0\"** | 新規 UID を Legacy/Modernized 双方へ登録。
| `GET /dolphin/license` | 405 Method Not Allowed | 405 Method Not Allowed | 旧来 404→405 へ整合。
| `GET /system/license` | 405 Method Not Allowed | 405 Method Not Allowed | scope=system でも REST 層へルーティング。

## 3. 保存物
- `post/{legacy,modernized}/`: `POST /dolphin/license` の `headers.txt` / `response.json` / `meta.json`
- `get/{legacy,modernized}/`: `GET /dolphin/license`
- `get-system/{legacy,modernized}/`: `GET /system/license`
- `metadata.json`: run.sh が出力したサマリ
