# StampTree GET public (RUN_ID=20251111TstampfixZ4)

## 実行メモ
- variation: `public`（facilityId=9001）
- ヘッダーファイル: `tmp/parity-headers/stamp_tree_public_20251111TstampfixZ4.headers`（X-Trace-Id=`parity-stamp-tree-public-20251111TstampfixZ4`）
- コマンド: ``PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_public_20251111TstampfixZ4.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/20251111TstampfixZ4/stamp_tree_public ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/public stamp_tree_public``
- 証跡: `stamp_tree_public/{legacy,modern}/` に HTTP headers/meta/response、`logs/` に send_parallel_request ログ・`d_audit_event_stamp_public_{legacy,modern}.tsv`・`jms_dolphinQueue_read-resource{,_legacy}.{before,txt}`

## HTTP 結果
- Legacy (`http://localhost:8080/openDolphin/resources/stamp/tree/9001/public`): `404 Not Found`（`meta.json` の `status_code=404`、`response.json` は 0 byte）。
- Modernized (`http://localhost:9080/openDolphin/resources/stamp/tree/9001/public`): `404 Not Found`（`meta.json` の `status_code=404`、`response.json` は 0 byte）。

## Audit / JMS 観測
- `d_audit_event_stamp_public_{legacy,modern}.tsv` には本 RUN の TraceId での GET ログは出現せず、直前の PUT (`RUN_ID=20251111TstampfixZ3`) の記録のみであることを確認。
- `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,txt}` では前後とも `message-count=0L` / `messages-added=5L` で変化なし。GET 404 に伴いキューへ新規メッセージが enqueue されない既知事象を再確認。

## 次 RUN への引き継ぎ
- 2025-11-12 時点では Legacy/Modern 両方で 404 が揃っており、再実装後は `200 OK` で公開用 StampTree JSON (versionNumber=11) が返る想定。
- 再取得時は Appendix A のテンプレ差し替え→同一コマンドで再実行し、`artifacts/parity-manual/stamp/<next>/stamp_tree_public/` へ保存する。完了後に `docs/server-modernization/phase2/notes/domain-transaction-parity.md` の StampTree GET(public) 行を更新すること。
