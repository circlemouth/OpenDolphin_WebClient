# JavaTime Stage サンプル (2025-11-07)

- 現状: Stage Bearer トークン未共有のため `ops/monitoring/scripts/java-time-sample.sh --dry-run` のみ実行済み。
- Dry-Run ログ: ../logs/java-time-sample-20251107-dry-run.log
- 次のアクション: Stage トークンを `ops/tests/api-smoke-test/headers/javatime-stage.headers` に設定し、`JAVA_TIME_OUTPUT_DIR=tmp/java-time/20240620` で本実行して `audit-20251107.sql` / `orca-response-20251107.json` / `touch-response-20251107.json` を保存する。
