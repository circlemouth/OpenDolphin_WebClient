# RUN_ID=20251120TrialAppointWriteZ1 予約 CRUD

- 参照: `ORCA_CONNECTIVITY_VALIDATION.md` §4.3 (API #4) / `trialsite.md` Snapshot Summary (2025-11-15 08:24 JST)。
- 目的: `POST /orca14/appointmodv2?class=01` を `trial/weborcatrial` で実行し、予約登録が許可されるか確認。payload は `payloads/appoint_insert.json` を `crud/appointmodv2/payload.appoint_insert.json` として保存。
- 環境: WSL2 Ubuntu 24.04.3 LTS。DNS/TLS 事前チェックは RUN_ID=`20251120TrialConnectivityWSLZ1` を共用。

## HTTP 応答
| タイムスタンプ (JST) | リクエスト | 応答 | 所見 |
| --- | --- | --- | --- |
| 13:16:03 | `curl_2025-11-15T131603+0900.log` | `POST /orca14/appointmodv2` → HTTP 405 / `Allow: OPTIONS, GET` | `class` 未指定でも nginx フロントで POST ブロック。 |
| 13:16:12 | `curl_class01_2025-11-15T131612+0900.log` | `POST /orca14/appointmodv2?class=01` → HTTP 405 / `Allow: OPTIONS, GET` | `--data-binary` + `class=01` でも 405 のまま。 |

`docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md#trial-crud-logging` のテンプレに沿って httpdump/trace エントリを作成する必要がある。現状は nginx レイヤーで POST が禁止されており、`trialsite` の「一部の管理業務を除き自由に使える」「新規登録／更新／削除 OK」の記載と整合しないため Blocker として `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` へ記録。

## 補足
- `ui/`: GUI 端末が無いためスクリーンショット未取得。`ui/README.md` で不足理由を説明済み。別端末で UI before/after を採取し本 RUN_ID へ格納する。
- `trace/`: httpdump/trace テンプレのみ確保（未収集）。405 が解消されたら `curl --trace-ascii` で保存する。
- 「新規登録／更新／削除 OK（トライアル環境でのみ）」と「登録情報は定期的に消去」を README に明記し、実データ投入を防止する。
