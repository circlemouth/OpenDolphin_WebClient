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
| `rest_error_stamp_data_exception` | `PARITY_HEADER_FILE=tmp/parity-headers/stamp_<RUN_ID>.headers` / `X-Trace-Id: parity-stamp-<RUN_ID>` | `PARITY_BODY_FILE=tmp/parity-letter/stamp_tree_payload.json` | `200 / 200`（Legacy=200 with Audit/JMS, Modern=200 + Audit/JMS） | `artifacts/parity-manual/stamp/<RUN_ID>/` | RUN_ID=`20251111TstampfixZ3`（helper コンテナ + `BASE_URL_{LEGACY,MODERN}=http://opendolphin-{server,server-modernized-dev}:8080/openDolphin/resources`）。`stamp_tree_payload.json` は GET `/stamp/tree/9001`（versionNumber=11）で同期し、`ops/db/local-baseline/stamp_tree_oid_cast.sql` ＋ `CREATE TABLE d_subscribed_tree` をモダナイズ DB へ適用してから PUT を実行。HTTP/headers/meta は `stamp_tree_user9001/`, `PUT_stamp_tree/`, `rest_error_stamp_data_exception/` へ格納し、Audit/JMS は `logs/d_audit_event_stamp_{legacy,modern}.tsv`（TraceId=`parity-stamp-20251111TstampfixZ3`）と `logs/jms_dolphinQueue_read-resource.txt`（`messages-added=4L`, `message-count=0L`）で確認。Legacy 側 `STAMP_TREE_PUT` も `AuditTrailService` へ記録されるようになった。 |

> 送信例: `PARITY_HEADER_FILE=tmp/parity-headers/letter_20251110TnewZ.headers PARITY_BODY_FILE=tmp/parity-letter/letter_put_payload.json PARITY_OUTPUT_DIR=artifacts/parity-manual/letter/20251110TnewZ RUN_ID=20251110TnewZ ./ops/tools/send_parallel_request.sh --profile compose PUT /odletter/letter rest_error_letter_fk`

> ヘッダー保管メモ: `tmp/parity-headers/*_20251110T234440Z.headers` と `*_20251110TnewZ.headers` は `RUN_ID=20251110TnewZ` の比較用テンプレとして残しているが、`20251111T091717Z` で再取得済みのケースは今後 `2025Q4` 棚卸し時に削除候補へ移す。削除前に `rest_error_scenarios.manual.csv` と `artifacts/parity-manual/<case>/20251110TnewZ/` の差分確認を完了させること。  

## JMS シナリオ（/20/adm/eht/sendClaim）

準備段階（ビルド・Docker 再実行なし）では `RUN_ID=20251111TrestfixZ` を想定し、テンプレの `tmp/claim-tests/{claim.headers,send_claim_success.json}` を最新 RUN に差し替えてから以下の手順を確認する。次 RUN でも `perl -0pi -e 's/20251111TrestfixZ/'"${RUN_ID}"'/' tmp/claim-tests/{claim.headers,send_claim_success.json}` を実行すれば置換漏れを防げる。CLI では `TRACE_RUN_ID=trace_jms_${RUN_ID}` を併用し、ヘッダー／`send_parallel_request.sh` 両方で同じ TraceId を参照させる。

実行時は下記 3 変数を必ずエクスポートし、すべて `tmp/claim-tests/` 配下のファイルを参照すること。

| 変数 | 値 | 備考 |
| --- | --- | --- |
| `PARITY_OUTPUT_DIR` | `artifacts/parity-manual/TRACEID_JMS/${RUN_ID}` | RUN_ID ごとにサブディレクトリを切り、HTTP/JMS/監査ログ一式を格納する。 |
| `PARITY_HEADER_FILE` | `tmp/claim-tests/claim_${RUN_ID}.headers` | `tmp/claim-tests/claim.headers` を `cp tmp/claim-tests/claim.headers tmp/claim-tests/claim_${RUN_ID}.headers` で複製し、`X-Trace-Id: trace-jms-${RUN_ID}`（=`TRACE_RUN_ID`）と `X-Run-Id: ${RUN_ID}` を含める。 |
| `PARITY_BODY_FILE` | `tmp/claim-tests/send_claim_success.json` | ChartEvent/Document/bundle 入りダミー請求。`20251111TrestfixZ` を RUN_ID に置換すれば再利用できる。 |

1. **前提ヘッダー**  
   - テンプレは `tmp/claim-tests/claim_TEMPLATE.headers`（旧 `claim.headers`）に集約済み。`cp tmp/claim-tests/claim_TEMPLATE.headers tmp/claim-tests/claim_${RUN_ID}.headers` で複製し、`PARITY_HEADER_FILE` として指定する（`userName: doctor1`, `password: dolphin`, `facilityId: 1.3.6.1.4.1.9414.72.103`, `Content-Type: application/json`, `Accept: application/octet-stream` を同梱）。  
   - 最新 RUN（`20251111TclaimfixZ3`）では `tmp/claim-tests/claim_20251111TclaimfixZ3.headers` をそのまま使用できる。別 RUN では `perl -0pi -e "s/trace-jms-[0-9TZ]+/${TRACE_RUN_ID}/" tmp/claim-tests/claim_${RUN_ID}.headers` で `X-Trace-Id`, `X-Run-Id`, `X-Claim-Debug: enabled` を差し替える。

2. **送信ペイロードと実行コマンド**  
   - `PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_${RUN_ID}.json` を推奨（テンプレ: `send_claim_success.json`）。`issuerUUID` / `memo` / `docId` / `labtestOrderNumber` / bundle `memo` に含まれる旧 RUN_ID を置換し、JSON 内 `memo` にも `TRACE_RUN_ID` を埋め込んで `d_audit_event.request_id` と突合させる。  
   - 送信例（helper コンテナなし）:

```bash
RUN_ID=20251111TclaimfixZ3 \
TRACE_RUN_ID=trace-jms-${RUN_ID} \
PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/claim_send \
PARITY_HEADER_FILE=tmp/claim-tests/claim_${RUN_ID}.headers \
PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_${RUN_ID}.json \
./ops/tools/send_parallel_request.sh --profile compose PUT /20/adm/eht/sendClaim claim_send
```

- helper コンテナ経由（ホスト↔9080 復旧まで強制）:

```bash
RUN_ID=20251111TclaimfixZ3
TRACE_RUN_ID=trace-jms-${RUN_ID}
docker run --rm \
  --network legacy-vs-modern_default \
  -v "$PWD":/workspace -w /workspace \
  mcr.microsoft.com/devcontainers/base:jammy \
  bash -lc "PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/claim_send \
PARITY_HEADER_FILE=tmp/claim-tests/claim_${RUN_ID}.headers \
PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_${RUN_ID}.json \
BASE_URL_LEGACY=http://opendolphin-server:8080/openDolphin/resources \
BASE_URL_MODERN=http://opendolphin-server-modernized-dev:8080/openDolphin/resources \
./ops/tools/send_parallel_request.sh --profile modernized-dev PUT /20/adm/eht/sendClaim claim_send"
```

3. **証跡採取**  
   - HTTP 結果（`headers.txt` / `meta.json` / `response.json`）は `TRACEID_JMS/${RUN_ID}/claim_send/http/{legacy,modern}/` へ保存し、CLI ログや `d_audit_event_claim.tsv`・`jms_dolphinQueue_read-resource.{before,after}.txt` は `TRACEID_JMS/${RUN_ID}/logs/` にまとめる。  
   - シーケンス補正は `ops/db/local-baseline/reset_d_audit_event_seq_batch.sql`（公式パス `ops/db/local-baseline/`）を Legacy/Modern 双方へ適用し、`artifacts/parity-manual/db/${RUN_ID}/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` を転記する。  
   - `scripts/diff_d_audit_event_claim.sh ${RUN_ID} ${PREV_RUN_ID}` で `d_audit_event_claim.tsv` の TraceId 差分を抽出し、`TRACEID_JMS/${RUN_ID}/README.md` に結果を貼り付ける（RUN_ID=`20251111TclaimfixZ3` では `20251111TclaimfixZ2` と比較）。

4. **Runbook 連携**  
   - 取得結果は `docs/server-modernization/phase2/operations/TRACEID_JMS_RUNBOOK.md §5.6` / `PHASE2_PROGRESS.md 2025-11-11 節` / `docs/web-client/planning/phase2/DOC_STATUS.md` にリンクする。`messages-added>0L` の変化と `reset_d_audit_event_seq_batch.sql` 実行ログを併記し、Legacy への sendClaim 移植履歴を明文化しておく。

### StampTree GET variations テンプレ（public/shared/published, RUN 未実行）

1. `tmp/parity-headers/stamp_tree_{public,shared,published}_TEMPLATE.headers` をベースに、`cp tmp/parity-headers/stamp_tree_public_TEMPLATE.headers tmp/parity-headers/stamp_tree_public_<RUN_ID>.headers` のように RUN_ID 付きファイルへ複製する。`perl -0pi -e 's/{{RUN_ID}}/<RUN_ID>/g' tmp/parity-headers/stamp_tree_public_<RUN_ID>.headers` で TraceId とコメントのプレースホルダーを一括更新する。  
2. `X-Trace-Id` は variation ごとに `parity-stamp-tree-public-<RUN_ID>` / `parity-stamp-tree-shared-<RUN_ID>` / `parity-stamp-tree-published-<RUN_ID>` を割り当てる。`PARITY_HEADER_FILE` は複製後のファイルを指定し、`ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/public stamp_tree_public` などで 3 バリエーションを順番に取得する。  
3. HTTP/headers/meta は `artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_<variation>/{legacy,modern}/` へ保存し、`TRACEID_JMS_RUNBOOK.md §4.1` の要領で `logs/d_audit_event_stamp_<variation>.tsv` と `logs/jms_dolphinQueue_read-resource{,_legacy}.txt`（before/after）を同ディレクトリに配置する。Legacy `message-count=0L` が既知事象である旨を JMS ログへ併記しておく。  
4. 取得前に `PHASE2_PROGRESS.md` backlog と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 を「テンプレ準備済み／RUN 未実行」で更新し、完了後は `domain-transaction-parity.md` 付録Aの StampTree GET 行に RUN_ID・期待ステータス・証跡を追記する。  

| variation | テンプレ | 推奨 `PARITY_HEADER_FILE` (RUN_ID=`<next>`) | 推奨 `PARITY_OUTPUT_DIR` |
| --- | --- | --- | --- |
| public | `tmp/parity-headers/stamp_tree_public_TEMPLATE.headers` | `tmp/parity-headers/stamp_tree_public_<next>.headers` | `artifacts/parity-manual/stamp/<next>/stamp_tree_public/` |
| shared | `tmp/parity-headers/stamp_tree_shared_TEMPLATE.headers` | `tmp/parity-headers/stamp_tree_shared_<next>.headers` | `artifacts/parity-manual/stamp/<next>/stamp_tree_shared/` |
| published | `tmp/parity-headers/stamp_tree_published_TEMPLATE.headers` | `tmp/parity-headers/stamp_tree_published_<next>.headers` | `artifacts/parity-manual/stamp/<next>/stamp_tree_published/` |

## Appendix A. StampTree GET variations 再取得クイックリファレンス

| variation | Header テンプレ | 実行コマンド例 (Modernized profile) | 証跡格納ルート | 追加ログ |
| --- | --- | --- | --- | --- |
| public | `tmp/parity-headers/stamp_tree_public_TEMPLATE.headers` | ``PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_public_<RUN_ID>.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_public ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/public stamp_tree_public`` | `artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_public/{legacy,modern}/` | `artifacts/parity-manual/stamp/<RUN_ID>/logs/d_audit_event_stamp_public_{legacy,modern}.tsv`, `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,txt}` |
| shared | `tmp/parity-headers/stamp_tree_shared_TEMPLATE.headers` | ``PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_shared_<RUN_ID>.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_shared ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/shared stamp_tree_shared`` | `artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_shared/{legacy,modern}/` | `artifacts/parity-manual/stamp/<RUN_ID>/logs/d_audit_event_stamp_shared_{legacy,modern}.tsv`, `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,txt}` |
| published | `tmp/parity-headers/stamp_tree_published_TEMPLATE.headers` | ``PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_published_<RUN_ID>.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_published ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/published stamp_tree_published`` | `artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_published/{legacy,modern}/` | `artifacts/parity-manual/stamp/<RUN_ID>/logs/d_audit_event_stamp_published_{legacy,modern}.tsv`, `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,txt}` |

### Appendix A-1. RUN_ID 差し替え手順

1. `cp tmp/parity-headers/stamp_tree_<variation>_TEMPLATE.headers tmp/parity-headers/stamp_tree_<variation>_<RUN_ID>.headers`
2. `perl -0pi -e 's/{{RUN_ID}}/<RUN_ID>/g' tmp/parity-headers/stamp_tree_<variation>_<RUN_ID>.headers`
3. `PARITY_HEADER_FILE` と `PARITY_OUTPUT_DIR` を上記テーブルに合わせて export し、`ops/tools/send_parallel_request.sh` を実行
4. HTTP 成果物のほか Audit / JMS ログを `artifacts/parity-manual/stamp/<RUN_ID>/logs/` へ格納し、`domain-transaction-parity.md` Appendix の StampTree 行を更新

> ℹ️ GET が 404 の場合でも再取得テンプレと証跡パスだけはこの手順で即時に揃え、サーバー修正後は同じ RUN_ID 末尾 (`<next+1>`) で再実施する。
