# StampTree GET shared (RUN_ID=20251111TstampfixZ5)

## 実行メモ
- variation: `shared`
- ヘッダーファイル: `tmp/parity-headers/stamp_tree_shared_20251111TstampfixZ5.headers`（X-Trace-Id=`parity-stamp-tree-shared-20251111TstampfixZ5`）
- コマンド: ``PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_shared_20251111TstampfixZ5.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/20251111TstampfixZ5/stamp_tree_shared ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/shared stamp_tree_shared``
- 証跡: `stamp_tree_shared/{legacy,modern}/` に HTTP headers/meta/response、`logs/` に send_parallel_request ログ・`d_audit_event_stamp_shared_{legacy,modern}.tsv`・`jms_dolphinQueue_read-resource{,_legacy}.{before,txt}`

## HTTP 結果
- Legacy: `404 Not Found`（`meta.json` で `status_code=404` / `time_total=0.093s`、`response.json` は 0 byte）。
- Modernized: `404 Not Found`（`status_code=404` / `time_total=0.021s`、`response.json` は 0 byte）。

## Audit / JMS 観測
- `d_audit_event_stamp_shared_{legacy,modern}.tsv` は TraceId=`parity-stamp-tree-shared-20251111TstampfixZ5` の行が存在せず、GET では監査レコードが発火していない。
- `logs/jms_dolphinQueue_read-resource*` は前後で `message-count=0L`・`messages-added=5L`・`consumer-count=15` で差異なし。404 応答時に JMS が変化しないことを確認。

## 次 RUN への引き継ぎ
- 再実装後は shared も `200 OK` + 共有 StampTree JSON を返す想定。Header テンプレは `_TEMPLATE` 版をコピーし、`artifacts/parity-manual/stamp/<next>/stamp_tree_shared/` へ同構成で格納する。
- Legacy/Modern いずれかが 404 のままの場合は Appendix A の手順を再確認し、`domain-transaction-parity.md` Appendix A に両面の HTTP ステータスと JMS ログ差分を追記する。
