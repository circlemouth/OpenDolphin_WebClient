# Blocked summary (RUN_ID=20251121T231000Z)

- 2025-11-21T14:38Z `patientgetv2?id=00001` は HTTP200 / `Api_Result=00` で患者データ取得済み（`crud/patientgetv2/response_20251121T143808Z.xml`）。患者 `00001` は登録済み。
- 同時刻に `acceptlstv2` は `Api_Result=21`（受付なし, `crud/acceptlstv2/response_20251121T143851Z.xml`）、`appointlstv2` も `Api_Result=21`（予約なし, `crud/appointlstv2/response_20251121T143931Z.xml`）。医師コード `00001`, 科 `01` を指定してもデータなし。
- `medicalmodv2` は `Api_Result=14`（ドクターが存在しません, `crud/medicalmodv2/response_20251121T144026Z.xml`）。患者は存在するが医師マスタ不足で診療行為登録不可。
- `/orca11/acceptmodv2` と `/orca14/appointmodv2` は POST でいずれも HTTP 405（Allow=`OPTIONS, GET`。headers `_20251121T144107Z.txt`, `_20251121T144146Z.txt`）。POST 開放は未反映。
- 以前観測の通り、ORCA 側の route/`API_ENABLE` 設定には触れられず、GUI も未使用。把握済みの 405/マスタ欠落状態が継続している。
- Physician_Code=`0000` / Department_Code=`01` を再確認したところ、`acceptlstv2` は `Api_Result=13`（ドクターが存在しません, `crud/acceptlstv2/response_20251121T150054Z.xml`）、`appointlstv2` は `Api_Result=12`（ドクターが存在しません, `crud/appointlstv2/response_20251121T150138Z.xml`）、`medicalmodv2` も `Api_Result=14`（`crud/medicalmodv2/response_20251121T150200Z.xml`）。医師コード `0000` も未登録と判定。
- 2025-11-21T15:13–15:15Z に Physician_Code=`0001` / `00011` で `acceptlstv2` / `appointlstv2` / `medicalmodv2` を再実行したが、すべて `curl: (52) Empty reply from server` で HTTP/Api_Result を取得できず（trace: `trace/*_{0001,00011}_*.trace`）。サーバ側で無応答状態になっており、医師マスタ有無の追加確認は未完了。
- 提示された system01lstv2（Request_Number=02, class=02）でドクター一覧を取得しようとしたが、同様に `curl: (52) Empty reply from server`（trace: `trace/system01lstv2_20251121T152438Z.trace`）。doctor list を API から取得できない状態。

## 必要な seed / 対応案
- `tbl_list_doctor` 等へ Physician_Code=`00001`, Department_Code=`01` の医師マスタを投入し、POST 405 を解消後に `acceptlstv2` → `appointlstv2` → `medicalmodv2` を再測する。
- 医師 seed 完了後、患者 `00001` を使って受付/予約/診療行為の Api_Result=00 を採取し、Evidence を同 RUN_ID 配下に追記する。
