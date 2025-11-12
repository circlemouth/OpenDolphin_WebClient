# StampTree GET published (RUN_ID=20251111TstampfixZ6)

## 実行メモ
- variation: `published`
- ヘッダーファイル: `tmp/parity-headers/stamp_tree_published_20251111TstampfixZ6.headers`（X-Trace-Id=`parity-stamp-tree-published-20251111TstampfixZ6`）
- コマンド: ``PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_published_20251111TstampfixZ6.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/20251111TstampfixZ6/stamp_tree_published ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/published stamp_tree_published``
- 証跡: `stamp_tree_published/{legacy,modern}/` に HTTP headers/meta/response、`logs/` に send_parallel_request ログ・`d_audit_event_stamp_published_{legacy,modern}.tsv`・`jms_dolphinQueue_read-resource{,_legacy}.{before,txt}`

## HTTP 結果
- Legacy: `404 Not Found`（`status_code=404`、`response.json` 0 byte）。
- Modernized: `404 Not Found`（`status_code=404`、`response.json` 0 byte）。

## Audit / JMS 観測
- `d_audit_event_stamp_published_{legacy,modern}.tsv` に TraceId=`parity-stamp-tree-published-20251111TstampfixZ6` の行は無く、GET 実行では監査が飛ばない状態。
- `logs/jms_dolphinQueue_read-resource*` は前後とも `message-count=0L` / `messages-added=5L` で一致し、404 時の JMS 非連動を確認済み。

## 次 RUN への引き継ぎ
- StampTree API 再実装後は published も `200 OK` が期待値。Appendix A のテンプレを利用し、公開前チェックでレスポンス JSON が versionNumber=11 かつ `published=true` であること、Audit/JMS に GET 履歴が残ることを確認して差し替える。
