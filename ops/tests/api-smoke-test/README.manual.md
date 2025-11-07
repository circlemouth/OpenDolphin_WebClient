# API スモークテスト（Python 非使用時の手順）

1. `test_config.manual.csv` から対象ケースを選び、`headers/` 配下のプロファイルを `PARITY_HEADER_FILE` に設定する。
2. レガシー/モダナイズ双方の URL を `BASE_URL_LEGACY` / `BASE_URL_MODERN` で指定し、`./ops/tools/send_parallel_request.sh METHOD PATH [ID]` を実行する。
3. レスポンスは `artifacts/parity-manual/<ID>/<legacy|modern>/response.json` に保存され、`meta.json` / `headers.txt` で HTTP 情報を確認できる。
4. `diff -u artifacts/parity-manual/<ID>/legacy/response.json artifacts/parity-manual/<ID>/modern/response.json` で差分を取得し、必要に応じて `tmp/manual-smoke/` や `artifacts/manual/` へ転記する。
5. 監査ログが必要なケース (`test_config.manual.csv` の expectation を参照) は `psql` で `d_audit_event` を採取し、`artifacts/manual/audit_log.txt` へ追記する。
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
