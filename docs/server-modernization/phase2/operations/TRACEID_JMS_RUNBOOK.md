# TRACEID_JMS_RUNBOOK（Trace ID × JMS 伝搬検証手順）

`@SessionOperation` で開始したトレース ID が REST → セッションサービス → JMS → 監査ログまで一貫して伝搬するかを CLI だけで確認するための手順書。`TRACE_PROPAGATION_CHECK.md` の証跡作成や `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8のタスクを実施する際、本 Runbook を参照して共通フローでログを採取する。

---

## 1. 前提条件
- **実行環境**
  - Docker Desktop（または互換エンジン）をインストールし、対象 WSL ディストリビューションとの連携を有効化しておく。`docker ps` が失敗する状態では `--profile modernized-dev` で参照する `opendolphin-server(-modernized-dev)` ホスト名が解決できず、すべて `curl: (6)` で終了する（2025-11-10 RUN_ID=`20251110T035118Z` 参照）。
  - Postgres シードは `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` や `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` の手順で `d_users`, `d_facility`, `d_audit_event` など必要テーブルを投入済みであること。
  - `ops/tools/send_parallel_request.sh` および `ops/tests/api-smoke-test/headers/*.headers` を LF 化済み（`dos2unix` も可）。
- **依存コマンド**: `bash`, `curl`, `jq`, `rg`, `psql`, `docker`, `perl`, `tee`.
- **証跡格納ルール**: すべて `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/` 配下に保存し、`PHASE2_PROGRESS.md` へリンクを追記する。

---

## 2. プロファイルと URL の選定

`ops/tools/send_parallel_request.sh --profile <name>` で読み込む `send_parallel_request.profile.env.sample` の対応は以下の通り。

| Profile | 用途 | `BASE_URL_LEGACY` | `BASE_URL_MODERN` | 備考 |
| --- | --- | --- | --- | --- |
| `compose` | ホスト（WSL/WSA/裸の Linux）で docker compose を起動し localhost 経由でアクセス | `http://localhost:8080/openDolphin/resources` | `http://localhost:9080/openDolphin/resources` | もっとも単純。Docker Desktop が未導入でも OK。 |
| `modernized-dev` | `docker-compose.modernized.dev.yml` の helper コンテナや CI ランナーなど、Docker ネットワーク内から直接ホスト名でアクセス | `http://opendolphin-server:8080/openDolphin/resources` | `http://opendolphin-server-modernized-dev:8080/openDolphin/resources` | ホストで実行する場合は `/etc/hosts` への名前追加 or Docker Desktop 連携が必須。 |
| `legacy-only` | Legacy サーバーのみ収集したい場合 | 同上 | `http://localhost:9080/openDolphin/resources`（未応答でも可） | Modernized が停止していても進めたい調査向け。 |
| `remote-dev` | Modernized をリモート URL へ切り替える | 同上 | `MODERNIZED_REMOTE_BASE_URL` で差し替え | VPN 先での本番相当検証を想定。 |
| `custom` | 任意の URL を明示指定 | 手動設定 | 手動設定 | 例: Cloud 環境の LB。 |

> **注意:** `--profile modernized-dev` をホストで実行する場合は (1) Docker Desktop を導入して WSL 連携を有効化する、または (2) `/etc/hosts` に `opendolphin-server=127.0.0.1` 等を追記する。未設定のまま実行すると `curl: (6) Could not resolve host` になる。

> **補足:** ホスト側で名前解決を変更できない場合は、以下のように helper コンテナを `legacy-vs-modern_default` ネットワークへ参加させて CLI を実行できる。  
> `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy bash -lc 'PARITY_HEADER_FILE=... PARITY_OUTPUT_DIR=... ops/tools/send_parallel_request.sh --profile modernized-dev ...'`  
> これにより `opendolphin-server(-modernized-dev)` というコンテナ名をそのまま使用できる（RUN_ID=`20251110T122644Z` で確認）。

---

## 3. トレース ID 付き HTTP 実行

### 3.1 ケースとヘッダーテンプレ

| Case ID | API | 期待ステータス | ベースヘッダー | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` | `GET /serverinfo/jamri` | 200 | `ops/tests/api-smoke-test/headers/trace-anonymous.headers` | `X-Trace-Id: trace-http-200` のみで可。 |
| `trace_http_400` | `GET /dolphin/activity/2025,04` | 400 | `ops/tests/api-smoke-test/headers/trace-session.headers` | 3 番目のパラメータが欠落した BadRequest ケース。`X-Trace-Id` を `trace-http-400` に書き換える。 |
| `trace_http_401` | `GET /touch/user/doctor1,...` | 401 | `trace-session.headers` から `password` 行を削除したコピー | 認証ヘッダー欠落で 401 を狙う。`X-Trace-Id: trace-http-401`。 |
| `trace_http_500` | `GET /karte/pid/INVALID,%5Bdate%5D` | 500 | `trace-session.headers` | 無効 PID で `NumberFormatException` を誘発。`X-Trace-Id: trace-http-500`。 |

例: 401 用ヘッダーを生成

```bash
mkdir -p tmp/trace-headers
grep -v '^password' ops/tests/api-smoke-test/headers/trace-session.headers \
  | sed 's/trace-session-placeholder/trace-http-401/' \
  > tmp/trace-headers/trace_http_401.headers
```

### 3.2 CLI 実行テンプレ

```bash
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
OUTPUT_ROOT="artifacts/parity-manual/TRACEID_JMS/${RUN_ID}"
mkdir -p "${OUTPUT_ROOT}/logs"
export PARITY_OUTPUT_DIR="${OUTPUT_ROOT}"

log() { printf '%s %s\n' "$(date -Iseconds)" "$*" | tee -a "${OUTPUT_ROOT}/logs/send_parallel_request.log"; }

run_case() {
  local header_file="$1" method="$2" path="$3" request_id="$4"
  PARITY_HEADER_FILE="$header_file" \
    bash ops/tools/send_parallel_request.sh --profile modernized-dev "$method" "$path" "$request_id" \
    | tee -a "${OUTPUT_ROOT}/logs/send_parallel_request.log"
}

log "[INFO] RUN_ID=${RUN_ID}"
run_case ops/tests/api-smoke-test/headers/trace-anonymous.headers GET /serverinfo/jamri trace_http_200
run_case tmp/trace-headers/trace_http_400.headers GET '/dolphin/activity/2025,04' trace_http_400
run_case tmp/trace-headers/trace_http_401.headers GET '/touch/user/doctor1,1.3.6.1.4.1.9414.72.103,dolphin' trace_http_401
run_case tmp/trace-headers/trace_http_500.headers GET '/karte/pid/INVALID,%5Bdate%5D' trace_http_500
```

> `--include-trace --tags trace_http` のようなショートカットは現状未実装のため、上記のようにケースごとにコマンドを呼び出す。

---

## 4. WildFly・JMS・DB ログ採取

1. **WildFly application log**  
   - `docker logs opendolphin-server-modernized-dev | rg --text traceId= | perl -pe 's/\e\[[0-9;]*[A-Za-z]//g' > ${OUTPUT_ROOT}/logs/modern_trace_http.log`
   - Legacy 側も同様に `opendolphin-server` から取得（Trace ID 未対応だがステータス比較用に保管）。
2. **d_audit_event / JMS**  
   - `docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "select ... where trace_id='trace-http-400';" > ${OUTPUT_ROOT}/logs/d_audit_event_trace_http_400.sql`
   - `ops/tools/jms-probe.sh --dump --queue jms/queue/dolphinQueue --profile modernized-dev --output ${OUTPUT_ROOT}/logs/jms_dump.txt`
3. **メタ情報**  
   - `cp ops/tools/send_parallel_request.profile.env.sample ${OUTPUT_ROOT}/logs/profile.env`（使用した Base URL を記録）
   - `env | rg '^BASE_URL_' > ${OUTPUT_ROOT}/logs/env_base_url.txt`
4. **403 応答時 / 監査シーケンス健全性チェック**  
   - Modernized 側は 403 でも `X-Trace-Id` を返し `SessionTraceManager` が WARN を吐くため、`artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/trace_http_*/modern/headers.txt` と `logs/modern_trace_http.log` を必ず添付する（例: RUN_ID=`20251110T221659Z` では `trace_http_401/modern/headers.txt` に `X-Trace-Id: trace-http-401`、`logs/modern_trace_http.log` に `Unauthorized user: ... traceId=trace-http-*` が 8 行記録されている）。Legacy 側は `headers.txt` に `X-Trace-Id` が無く `logs/legacy_trace_http.log` も 0 バイトのため、Checklist #72 のブロッカー欄へ差分を残す。
   - `LogFilter` や `TouchRequestContextExtractor` の挙動で 403 が発生した RUN_ID では、`docker logs opendolphin-server-modernized-dev | rg --text 'LogFilter'` の結果と合わせて `logs/logfilter_fallback.txt` を保存し、fallback ログ（"LogFilter header fallback is enabled"）が出ているかを確認する。
   - `d_audit_event` の負 ID / シーケンス衝突を定点観測する。`docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "select min(id), max(id) from d_audit_event;"` と `... -c "select last_value, is_called from d_audit_event_id_seq;"` を `logs/d_audit_event_seq_status.txt` に保存し、`RUN_ID=20251110T221659Z` のように ID=-41〜-47 で停止している場合は `ALTER SEQUENCE ... RESTART` を実施しない旨を Runbook に記述する。再採番が必要なときは `setval` に相当する補正値と `d_audit_event` バックアップ手順を添えて `TRACE_PROPAGATION_CHECK.md` / `PHASE2_PROGRESS.md` にリンクする。

すべてのログは `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/` 以下に置き、HTTP 応答 (`trace_http_*/{legacy,modern}/`) との紐付けを保つ。

---

## 5. Audit/JMS ルート強化の設計準備

### 5.1 LogFilter の null-safe 化チェックリスト
- 対象: `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`（レガシー／モダナイズ双方）。`LOGFILTER_HEADER_AUTH_ENABLED` が `true` の場合にのみ `userName` / `password` ヘッダーへアクセスする構造を維持しつつ、`Optional.ofNullable` または `StringUtils.defaultString` で null ガードを入れる計画を明文化する。
- 変更前後を比較するため、`docker compose config | rg LOGFILTER` の結果を `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/logfilter_env.txt` に保存する。`LOGFILTER_FALLBACK_PRINCIPAL=doctor1@F001` のような既定値を `.env` に追記する際は、`TRACE_PROPAGATION_CHECK.md §7.3` へも同じ値を記録しておく。
- null-safe 化の設計では以下 3 点を Runbook に記述する: (1) `request.getHeader("password")` を直接比較せず `Objects.equals(password, expected)` を用いる、(2) 認証失敗時に `SessionTraceManager` へ TRACE ID を再設定し WARN を残す、(3) fallback principal を使用したかどうかを `LogFilter header fallback hit` として INFO/WARN に残し、`logs/logfilter_fallback.txt` へ採取できるようにする。
- 実装着手前に `TRACEID_JMS_RUNBOOK` へ、期待ログ例（`LogFilter null guard engaged for traceId=...`）と、NPE が再発した場合に参照する `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/logfilter_npe.txt` の保管先を追記する。

### 5.2 TouchRequestContext fallback 整備
- 対象クラス: `open.dolphin.touch.support.TouchRequestContextExtractor` / `TouchRequestContext` / `touch.session.*ServiceBean`。`TouchRequestContextExtractor#from(HttpServletRequest)` が `null` を返した際でも `SessionTraceManager` と JMS プロパティへ Trace ID を継続させるため、HTTP ヘッダー（`X-Trace-Id`）と `LogFilter` で解決した principal を fallback として受け取る設計を書く。
- CLI 検証では `touch/user/doctor1,...` を 401/403 で失敗させた RUN_ID を利用し、`artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/touch_request_context.txt` に以下情報を保存する: (1) `TouchRequestContextExtractor` の DEBUG ログ、(2) fallback が発火した証跡（例: `TouchRequestContext fallback principal=doctor1@F001 traceId=trace-http-401`）。
- JMS 連携への影響を整理するため、`ops/tools/jms-probe.sh --dump` の結果から `open.dolphin.traceId` プロパティ有無を確認し、未付与のケースは `TRACE_PROPAGATION_CHECK.md §8` に列挙する。fallback 設計では `MessagingGateway` への投入直前で `TouchRequestContext` を再評価し、null のままの場合は `TouchRequestContextFallback`（新規 DTO）を JMS ヘッダーへ書き込む手順を Runbook に明記する。

### 5.3 `d_audit_event_id_seq` 再採番プロトコル
1. **事前バックアップ**
   - `docker exec opendolphin-postgres-modernized bash -lc "psql -U opendolphin -d opendolphin_modern -c \"\\copy (select * from d_audit_event order by id) to '/tmp/d_audit_event_before_seq_reset.csv' csv header\""`
   - `docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_before_seq_reset.csv artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/` に退避。legacy 側も同様のファイルを取得して diff を取る。
2. **シーケンス現状把握**
   - `psql -U opendolphin -d opendolphin_modern -c "select min(id), max(id), count(*) from d_audit_event;"`
   - `psql -U opendolphin -d opendolphin_modern -c "select last_value, is_called from d_audit_event_id_seq;"`
   - 必要に応じて `select coalesce(max(id),0)+1 as next_id;` を取得し、`logs/d_audit_event_seq_status.txt` にまとめる。
3. **LOCK & ALTER**
   - 実行前に `docker exec ... psql ... -c "begin; lock table d_audit_event in exclusive mode; select pg_sleep(5);"` でアクティブセッションを排除してから ALTER を行う。
   - `psql ... -c "select setval('d_audit_event_id_seq', <next_id>, true);"` を推奨。`ALTER SEQUENCE ... RESTART WITH <next_id>;` を使用する場合も同 RUN_ID で `setval` 実行ログを残す。
4. **整合性検証**
   - `insert into d_audit_event(id, action, status, resource) values (default, 'SEQ_SMOKE', 'PENDING', '{"path":"/internal/seq-check"}') returning id;` を発行し、ID が `next_id` から連番となるかを確認。検証結果は `logs/d_audit_event_seq_validation.txt` に保存する。
5. **復旧パス**
   - 再採番後に異常を検知した場合は、取得済み `*_before_seq_reset.csv` を `\copy d_audit_event from '/tmp/d_audit_event_before_seq_reset.csv' csv header` で戻す。戻す際は `truncate d_audit_event restart identity cascade;` を先に実行し、`setval` で元の `max(id)+1` に戻すこと。

この節の内容を `TRACE_PROPAGATION_CHECK.md` / `PHASE2_PROGRESS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の関連タスクにリンクし、「Audit/JMS ルート強化：設計準備完了、実装待ち」ステータスの根拠とする。

---

## 6. 失敗時のフォールバック

| 現象 | 原因 | 対処 |
| --- | --- | --- |
| `curl: (6) Could not resolve host: opendolphin-server` | Docker Desktop / WSL 連携が無効。`--profile modernized-dev` は Docker ネットワーク内のホスト名を前提にしている。 | Docker Desktop をインストールし対象ディストリを有効化、または `compose` プロファイルへ切替えて `localhost` を使用。Runbook 冒頭の前提条件と `TRACE_PROPAGATION_CHECK.md §5.2` を参照。 |
| `relation "d_users" does not exist` | Modernized DB に初期データが入っていない。 | `LOCAL_BACKEND_DOCKER.md` / `POSTGRES_BASELINE_RESTORE.md` でシード投入 → 再実行。 |
| Legacy 側 WildFly ビルド失敗 (`org.wildfly.extension.micrometer`) | Legacy イメージが Micrometer 拡張を含まない。 | Legacy ビルド時は `ops/legacy-server/docker/configure-wildfly.cli` から該当拡張を外すか、Legacy 側の Trace 取得を後回しにする。 |

---

## 7. 証跡の保存と報告

1. `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/trace_http_*` に HTTP 応答、`logs/` に WildFly / JMS / SQL を保存。
2. `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` の「CLI シナリオ」「実行ログ」節へ RUN_ID、結果、ブロッカー、参照パスを追記。
3. `docs/server-modernization/phase2/PHASE2_PROGRESS.md` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` に同 Run ID の状況を要約。
4. 追加の Runbook 更新があれば `docs/web-client/planning/phase2/DOC_STATUS.md` の該当欄を Active で維持する。

---

## 8. 関連ドキュメント
- `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md`
- `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`
- `docs/server-modernization/phase2/PHASE2_PROGRESS.md`
- `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`
- RUN_ID=`20251110T221659Z`（`artifacts/parity-manual/TRACEID_JMS/20251110T221659Z/`）の Compose 実行ログでは、Modernized 側に `traceId=trace-http-*` WARN / Legacy 側に LogFilter NPE を再確認。`logs/d_audit_event_trace-http-*.sql` は 0 行、`jms_dolphinQueue_read-resource.txt` は `messages-added=0L` だったため、JMS 伝搬や AuditTrail Trace ID が未達の場合の記録例として参照する。
