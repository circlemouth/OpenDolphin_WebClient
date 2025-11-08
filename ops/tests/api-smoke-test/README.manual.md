# API スモークテスト（Python 非使用時の手順）

1. `test_config.manual.csv` から対象ケースを選び、`headers/` 配下のプロファイルを `PARITY_HEADER_FILE` に設定する。
2. レガシー/モダナイズ双方の URL を `BASE_URL_LEGACY` / `BASE_URL_MODERN` で指定し、`./ops/tools/send_parallel_request.sh METHOD PATH [ID]` を実行する。
3. レスポンスは `artifacts/parity-manual/<ID>/<legacy|modern>/response.json` に保存され、`meta.json` / `headers.txt` で HTTP 情報を確認できる。
4. `diff -u artifacts/parity-manual/<ID>/legacy/response.json artifacts/parity-manual/<ID>/modern/response.json` で差分を取得し、必要に応じて `tmp/manual-smoke/` や `artifacts/manual/` へ転記する。
5. 監査ログが必要なケース (`test_config.manual.csv` の expectation を参照) は `psql` で `d_audit_event` を採取し、`artifacts/manual/audit_log.txt` へ追記する。

> ℹ️ `test_config.manual.csv` の `trace-id` 列は `X-Trace-Id` ヘッダーに設定する推奨値。`headers/*.headers` をコピーして `X-Trace-Id: <trace-id>` 行を追加すると、HTTP/JMS/Session ログの突合せが容易になる。  

6. 取得結果と課題は `docs/server-modernization/phase2/notes/test-data-inventory.md` と `PHASE2_PROGRESS.md` に反映する。

## JavaTime 手動ケースの準備

1. `ops/tests/api-smoke-test/headers/javatime-stage.headers.template` を Stage 用の Bearer トークンで編集し、同じディレクトリに `javatime-stage.headers` という名前で保存する（`.gitignore` 済みのためトークンはリポジトリへ反映されない）。  
2. `test_config.manual.csv` に追加済みの `JAVATIME_ORCA_001` / `JAVATIME_TOUCH_001` を選択し、`PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/javatime-stage.headers` を指定して `ops/tools/send_parallel_request.sh` を実行する。  
3. 取得したレスポンスと `tmp/java-time/*` に保存したサンプルを `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` §4.3 および `notes/touch-api-parity.md` §9 の証跡としてリンクする。  
4. Stage で自動採取する場合は `ops/monitoring/scripts/java-time-sample.sh --dry-run` でログを確認し、`ENV`（BASE_URL/AUTH など）をセットして本実行する。

### Stage 実行時の注意

- Bearer トークンは `headers/javatime-stage.headers` にのみ保存し、Git へコミットしない（`.gitignore` 済み）。2025-11-07 時点では Stage トークンが未共有のため Dry-Run ログ `tmp/java-time/logs/java-time-sample-20251107-dry-run.log` を Evidence へ控え、トークン取得後に同ファイルへ上書き実行する。  
- `ops/tests/api-smoke-test/payloads/javatime_*.json` の `issuedAt` は `date --iso-8601=seconds` を用いて再生成し、Stage 送付時に手動編集しない。  
- JavaTime エビデンス（`tmp/java-time/audit-YYYYMMDD.sql`, `tmp/java-time/orca-response-YYYYMMDD.json`, `tmp/java-time/touch-response-YYYYMMDD.json`）は 30 日以内に Evidence ストレージへ転記し、`docs/server-modernization/phase2/notes/worker-directives-20260614.md` へリンクを記録する。

## REST 例外ハーネス（SessionOperation / TRACE）

- `test_config.manual.csv` 先頭に `trace_http_*` シナリオを追加し、200/400/401/500 の最小経路と推奨 `X-Trace-Id` を定義した。400/401/500 は `ops/tests/api-smoke-test/headers/trace-session.headers` を複製しつつ `X-Trace-Id` を書き換えて運用する。  
- `rest_error_scenarios.manual.csv` ではエラーパス専用の定義ファイルを提供し、`expected_status` と再現ノートを明記した。CLI 実行時は `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/<timestamp>` を指定し、`docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` へ証跡リンクを追記する。  
- `ops/tools/send_parallel_request.sh --profile compose ...` を使うと `send_parallel_request.profile.env.sample` を自動読込して URL を切り替えられる。`BASE_URL_LEGACY` を一時的に Modernized 側へ上書きしたい場合は `BASE_URL_LEGACY=http://localhost:9080/openDolphin/resources` をコマンドに付与する。
