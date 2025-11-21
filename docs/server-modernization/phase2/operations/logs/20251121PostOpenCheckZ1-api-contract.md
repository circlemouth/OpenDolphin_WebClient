# 2025-11-21 POST 開放確認（RUN_ID=20251121PostOpenCheckZ1）

- 接続先: `<DEV_ORCA_HOST>`（Basic: <DEV_ORCA_BASIC>）。Python 不使用、`curl` のみ。
- 対象 API: `/orca11/acceptmodv2`, `/orca14/appointmodv2`, `/orca06/patientmemomodv2`, `/orca42/receiptprintv3`。
- 目的: 11/21 早朝（RUN_ID=`20251121T153200Z`）に確認した HTTP405 が解消されたかを再測。設定変更は未実施。
- 証跡: `artifacts/orca-connectivity/20251121PostOpenCheckZ1/{crud,blocked}`。

## 1. サマリ
- `/orca11/acceptmodv2?class=01` → HTTP405 `Allow: OPTIONS, GET`。前回 RUN から変化なし。
- `/orca14/appointmodv2?class=01` → HTTP405 `Allow: OPTIONS, GET`。前回 RUN から変化なし。
- `/orca06/patientmemomodv2` → HTTP405 `Allow: OPTIONS, GET`。前回 RUN から変化なし。
- `/orca42/receiptprintv3` → HTTP405 `Allow: OPTIONS, GET`。前回 RUN から変化なし。
- 4 API すべて POST 未開放のまま。Route/API_ENABLE 相当の設定変更が必要。

## 2. 詳細
### <a id="orca11acceptmodv2"></a>`/orca11/acceptmodv2`
- コマンド: `curl -D headers_... -o response_... -u ormaster:******** -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @request_2025-11-21T11-25-28Z.xml <DEV_ORCA_HOST>/orca11/acceptmodv2?class=01`
- Evidence: `artifacts/orca-connectivity/20251121PostOpenCheckZ1/crud/acceptmodv2/headers_2025-11-21T11-26-33Z.txt`（Allow=`OPTIONS, GET`）, `response_2025-11-21T11-26-33Z.xml`（`Code=405`）。

### <a id="orca14appointmodv2"></a>`/orca14/appointmodv2`
- コマンド: `curl -D headers_... -o response_... -u ormaster:******** -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @request_2025-11-21T11-25-40Z.xml <DEV_ORCA_HOST>/orca14/appointmodv2?class=01`
- Evidence: `.../crud/appointmodv2/headers_2025-11-21T11-26-57Z.txt`（Allow=`OPTIONS, GET`）, `response_2025-11-21T11-26-57Z.xml`（`Code=405`）。

### <a id="orca06patientmemomodv2"></a>`/orca06/patientmemomodv2`
- コマンド: `curl -D headers_... -o response_... -u ormaster:******** -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @request_2025-11-21T11-25-53Z.xml <DEV_ORCA_HOST>/orca06/patientmemomodv2`
- Evidence: `.../crud/patientmemomodv2/headers_2025-11-21T11-27-15Z.txt`（Allow=`OPTIONS, GET`）, `response_2025-11-21T11-27-15Z.xml`（`Code=405`）。

### <a id="orca42receiptprintv3"></a>`/orca42/receiptprintv3`
- コマンド: `curl -D headers_... -o response_... -u ormaster:******** -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary @request_2025-11-21T11-26-07Z.json <DEV_ORCA_HOST>/orca42/receiptprintv3`
- Evidence: `.../crud/receiptprintv3/headers_2025-11-21T11-27-31Z.txt`（Allow=`OPTIONS, GET`）, `response_2025-11-21T11-27-31Z.json`（`Code=405`）。

## 3. 所見 / 次アクション
- POST 未開放が継続しているため、開発用 ORCA 側の route/API_ENABLE 設定を開放するか、開放不可の場合は Blocker（HTTP405(Local)）としてステータス維持。
- 設定変更後は同リクエストで再測し、`blocked/README.md` と本ログへ Allow/ステータスの差分を追記する。
