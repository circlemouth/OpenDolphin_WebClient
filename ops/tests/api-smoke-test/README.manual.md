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

### REST エラーケース再現テンプレ（RUN_ID=`20251110TnewZ` ひな形）

1. `tmp/parity-headers/<case>_<RUN_ID>.headers` を `cp tmp/parity-headers/<case>_20251110TnewZ.headers tmp/parity-headers/<case>_<new RUN_ID>.headers` で複製し、`X-Trace-Id: parity-<case>-<new RUN_ID>` へ置換する。`password: 632080fabdb968f9ac4f31fb55104648`（Legacy LogFilter の MD5）と `facilityId: 1.3.6.1.4.1.9414.72.103` は固定値のため書き換え不要。`PUT` 系は `Content-Type: application/json` を残す。  
2. `PARITY_HEADER_FILE` と（必要に応じて）`PARITY_BODY_FILE` を以下のテンプレに合わせて設定し、`PARITY_OUTPUT_DIR=artifacts/parity-manual/<case>/<RUN_ID>` を指定して `ops/tools/send_parallel_request.sh` を実行する。証跡が揃ったら `rest_error_scenarios.manual.csv` に記載の TraceId で `send_parallel_request.log` / `headers.txt` / `response.json` を保管する。

| CSV `id` | ヘッダー / TraceId | ペイロード | 期待ステータス (Legacy / Modernized) | 証跡配置（例） | メモ |
| --- | --- | --- | --- | --- | --- |
| `rest_error_letter_fk` | `PARITY_HEADER_FILE=tmp/parity-headers/letter_<RUN_ID>.headers` / `X-Trace-Id: parity-letter-<RUN_ID>` | `PARITY_BODY_FILE=tmp/parity-letter/letter_put_payload.json` | `200 / 500` (`fk_d_letter_module_karte`) | `artifacts/parity-manual/letter/<RUN_ID>/` | `d_karte.id` を揃えるまで Modern 側 500 想定。 |
| `rest_error_lab_empty` | `PARITY_HEADER_FILE=tmp/parity-headers/lab_<RUN_ID>.headers` / `X-Trace-Id: parity-lab-<RUN_ID>` | - | `200 / 200` （`list=null`） | `artifacts/parity-manual/lab/<RUN_ID>/` | `d_nlabo_module`⇔`d_nlabo_item` の紐付け調査と Audit/JMS 採取を TODO。 |
| `rest_error_stamp_data_exception` | `PARITY_HEADER_FILE=tmp/parity-headers/stamp_<RUN_ID>.headers` / `X-Trace-Id: parity-stamp-<RUN_ID>` | `PARITY_BODY_FILE=tmp/parity-letter/stamp_tree_payload.json` | `500 / 500`（Legacy: First Commit Win, Modern: `Bad value for type long ... treeBytes`） | `artifacts/parity-manual/stamp/<RUN_ID>/` | 排他制御と `StampTreeModelConverter` 修正後に再取得。 |

> 送信例: `PARITY_HEADER_FILE=tmp/parity-headers/letter_20251110TnewZ.headers PARITY_BODY_FILE=tmp/parity-letter/letter_put_payload.json PARITY_OUTPUT_DIR=artifacts/parity-manual/letter/20251110TnewZ RUN_ID=20251110TnewZ ./ops/tools/send_parallel_request.sh --profile compose PUT /odletter/letter rest_error_letter_fk`
