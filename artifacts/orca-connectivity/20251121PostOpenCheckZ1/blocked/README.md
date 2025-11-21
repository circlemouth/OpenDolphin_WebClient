# POST 開放確認 (RUN_ID=20251121PostOpenCheckZ1)

- 対象: `/orca11/acceptmodv2`, `/orca14/appointmodv2`, `/orca06/patientmemomodv2`, `/orca42/receiptprintv3`
- 接続先: `http://100.102.17.40:8000`（Basic: ormaster/change_me）。設定変更は実施せず、POST 可否のみ再確認。
- 参考: 前回 RUN_ID=`20251121T153200Z` でも同4 API が `Allow: OPTIONS, GET` で拒否。

## HTTP405 継続（設定変更前→後で差分なし）
- `/orca11/acceptmodv2?class=01` → HTTP405, Allow=`OPTIONS, GET`. Evidence: `../crud/acceptmodv2/headers_2025-11-21T11-26-33Z.txt`。
- `/orca14/appointmodv2?class=01` → HTTP405, Allow=`OPTIONS, GET`. Evidence: `../crud/appointmodv2/headers_2025-11-21T11-26-57Z.txt`。
- `/orca06/patientmemomodv2` → HTTP405, Allow=`OPTIONS, GET`. Evidence: `../crud/patientmemomodv2/headers_2025-11-21T11-27-15Z.txt`。
- `/orca42/receiptprintv3` → HTTP405, Allow=`OPTIONS, GET`. Evidence: `../crud/receiptprintv3/headers_2025-11-21T11-27-31Z.txt`。

### Follow-ups
- POST を許可する `receipt_route.ini` / `API_ENABLE_*` 相当の設定確認または開放依頼が必要。現状は 2025-11-21 時点で 405 継続。
- 設定変更を実施する場合は再実測し、Allow/ステータスの変化を本ファイルとログへ追記する。
