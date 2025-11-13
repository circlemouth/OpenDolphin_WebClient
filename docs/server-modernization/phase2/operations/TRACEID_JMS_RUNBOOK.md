# TRACEID_JMS_RUNBOOK（Trace ID × JMS 伝搬検証手順）

`@SessionOperation` で開始したトレース ID が REST → セッションサービス → JMS → 監査ログまで一貫して伝搬するかを CLI だけで確認するための手順書。`TRACE_PROPAGATION_CHECK.md` の証跡作成や `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8のタスクを実施する際、本 Runbook を参照して共通フローでログを採取する。Modernized サーバーと新 Web クライアントの連携が完了すれば Gate 達成とし、Legacy サーバーは比較ログを取得したい場合のみ参照する。

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

> **運用指示 (2025-11-12)**: `docker compose --profile modernized-dev` で立ち上げたホストが `localhost:9080` へ到達しない間は、上記 helper コンテナ経由で Claim/JMS を取得すること。**ホスト↔9080 が復旧するまで helper で運用**し、`PARITY_HEADER_FILE=tmp/claim-tests/claim_<RUN_ID>.headers` / `PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_<RUN_ID>.json` を helper 側から参照する。

---

## 3. トレース ID 付き HTTP 実行

### 3.1 ケースとヘッダーテンプレ

| Case ID | API | 期待ステータス | ベースヘッダー | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` | `GET /serverinfo/jamri` | 200 | `ops/tests/api-smoke-test/headers/trace-anonymous.headers` | `X-Trace-Id: trace-http-200` のみで可。 |
| `trace_http_400` | `GET /dolphin/activity/2025,04` | 400 | `tmp/trace_http_400.headers` | `trace-session.headers` をベースに `password: doctor2025` と `X-Trace-Id: trace-http-400-{{RUN_ID}}` を設定済み。 |
| `trace_http_401` | `GET /touch/user/doctor1,...` | 401 | `tmp/trace_http_401.headers` | `trace-session.headers` から `password` 行のみ削除したバージョン。`X-Trace-Id: trace-http-401-{{RUN_ID}}`。 |
| `trace_http_500` | `GET /karte/pid/INVALID,%5Bdate%5D` | 500 | `tmp/trace_http_500.headers` | `trace_http_400` と同じ構成で `X-Trace-Id: trace-http-500-{{RUN_ID}}`。 |

> **補足:** `tmp/trace_http_{200,400,401,500}.headers` の `{{RUN_ID}}` プレースホルダは `TRACE_RUN_ID` 環境変数で自動置換される。Legacy の Basic 認証は平文パスワード `doctor2025` を期待するため、`tmp/trace_http_400.headers` / `tmp/trace_http_500.headers` も平文で保持している。

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
run_case tmp/trace_http_200.headers GET /serverinfo/jamri trace_http_200
run_case tmp/trace_http_400.headers GET '/dolphin/activity/2025,04' trace_http_400
run_case tmp/trace_http_401.headers GET '/touch/user/doctor1,1.3.6.1.4.1.9414.72.103,dolphin' trace_http_401
run_case tmp/trace_http_500.headers GET '/karte/pid/INVALID,%5Bdate%5D' trace_http_500
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

### 4.1 Legacy JMS チェックリスト（message-count=0L の整理）

- **現象**: Legacy WildFly 10 の `jms.queue.dolphinQueue` は `consumer-count=0` / `messages-added=0L` のまま（RUN_ID=`20251111TstampfixZ3` 時点の `artifacts/parity-manual/stamp/20251111TstampfixZ3/logs/jms_dolphinQueue_read-resource_legacy.txt` 参照）。スタンプ PUT/GET を実行しても Legacy サーバーは同期処理で完結するため JMS へ publish されず、queue depth も増えない。一方 Modernized 側は `consumer-count=15` / `messages-added=4L` / `message-count=0L` で、`StampServiceBean` からの enqueue が `logs/jms_dolphinQueue_read-resource.txt` に記録される。
- **目的**: `message-count=0L` をエラーではなく「Legacy server は MessagingGateway を経由していない」既知事象として扱えるよう、証跡化と backlog 管理を統一する。
- **手順**:
  1. helper コンテナまたはホストから `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec opendolphin-server /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)' > artifacts/parity-manual/<case>/<RUN_ID>/logs/jms_dolphinQueue_read-resource_legacy.txt` を実行し、`consumer-count`, `messages-added`, `message-count` を採取する。
     - `localhost:8080` へ到達できない状況では helper コンテナから CLI を実行する。テンプレート:
       ```bash
       RUN_ID=20251112T090930Z
       CASE=stamp
       docker compose --profile modernized-dev run --rm helper bash -lc '
         set -euo pipefail
         cd /workspace
         docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec opendolphin-server \
           /opt/jboss/wildfly/bin/jboss-cli.sh \
           --connect --commands="/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)" \
           > artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/jms_dolphinQueue_read-resource_legacy.txt
       '
       ```
       helper は `legacy-vs-modern_default` ネットワークに常時参加しているため、追加の `docker network connect` は不要。`RUN_ID` と `CASE` を差し替えれば artifacts 直下に保管できる。
  2. 同じコマンドを `opendolphin-server-modernized-dev` に対して実行し、`.../logs/jms_dolphinQueue_read-resource.txt` に保存する。Modern 側では `messages-added` が PUT 実行直後に増分して `message-count=0L` へ戻る（即時 drain）点をコメントで残す。
     - Modern 側も helper コンテナ経由に統一すれば、ホスト OS の Docker ソケット権限や `/var/run/docker.sock` マウント不要で `docker compose exec` を再利用できる。
  3. 取得した 2 ファイルを `git diff` で比較し、Legacy=0L / Modern=>0L の差を `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 残課題、および `PHASE2_PROGRESS.md` backlog へ転記する。
  4. `consumer-count=0` が続く場合は、Legacy 側で JMS MDB を起動していないことを示す補足コメント（例: `# Legacy queue stays idle; no MessageDrivenBean registered in WildFly10 profile`）を `logs/jms_dolphinQueue_read-resource_legacy.txt` の末尾に追記する。
  5. **ログ閲覧・現状確認**: `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/jms_dolphinQueue_read-resource_legacy.txt` を `rg -n 'messages|consumer'` や `less -N` で開き、`# Legacy queue stays idle …` コメントと `messages-added=0L`, `consumer-count=0` がセットで残っていることを確認する。同フォルダに `jms_dolphinQueue_read-resource.txt`（Modern）を並べ、`diff -u logs/jms_dolphinQueue_read-resource_legacy.txt logs/jms_dolphinQueue_read-resource.txt` で `messages-added` の増分が説明できる状態を維持する。
  6. **StampSenderMDB 再起動コマンド（指示が出るまで実行禁止）**: `messages-added` が 0L のまま変化しない場合は、マネージャーのみ以下 CLI コマンドで Legacy WildFly の MDB を停止→起動する。実行ログは `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/legacy_mdb_restart.log` に保存し、ワーカーはコマンド列挙のみ行う。
     ```bash
     # Manager only / do-not-run メモ
     docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec opendolphin-server \
       /opt/jboss/wildfly/bin/jboss-cli.sh --connect <<'EOF' | tee artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/legacy_mdb_restart.log
     /deployment=opendolphin.war/subsystem=ejb3/message-driven-bean=StampSenderMDB:stop
     /deployment=opendolphin.war/subsystem=ejb3/message-driven-bean=StampSenderMDB:start
     EOF
     ```
     - 再起動後は `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/{before,after}_jms_dolphinQueue_read-resource_legacy.txt` を採取し、`messages-added` の変化と `consumer-count` が 1 以上へ戻るかを追跡する。
  7. **standalone-full.xml の JMS 設定差分確認（閲覧のみ）**: Legacy WildFly が参照する `/opt/jboss/wildfly/standalone/configuration/standalone-full.xml` を `docker compose exec opendolphin-server cat ... | rg -n 'dolphinQueue\|StampSender'` で抜粋し、`server/standalone-full.xml` へ保存したローカルコピーと diff を取得する。`messaging-activemq` セクションと `jms-queue name="dolphinQueue"`、`pooled-connection-factory` を事前に確認し、`server/src/main/resources/META-INF/ejb-jar.xml`（StampSenderMDB の `activation-config-property` 設定）との齟齬が無いかを Appendix へリンクする。
- **期待アウトプット**: すべての RUN_ID で `logs/jms_dolphinQueue_read-resource{,_legacy}.txt` が対になっており、`messages-added` の差分と `consumer-count` の有無をもって Legacy JMS 未実装の根拠とする。Stamp parity 以外（Appo/Schedule/Lab/Letter）の REST ケースでも同じ形式で before/after を採取し、`message-count=0L` が続いても「JMS 未到達」ではなく「JMS 未接続」の証跡であることを記録する。

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

### 5.3 `d_audit_event.trace_id` 列の追加
- サーバー/Legacy 双方の `d_audit_event` に Trace ID を永続化するため、Flyway では `server-modernized/tools/flyway/sql/V0227__audit_event_trace_id.sql` を新設し、`ops/db/local-baseline/reset_d_audit_event_seq*.sql` の INSERT 文にも `trace_id` 列を追加した。
- compose 環境を再現する際は、Flyway 適用前でも以下コマンドで列を追加しておく:  
  `docker exec opendolphin-postgres{-modernized} psql -U opendolphin -d opendolphin{_modern} -c "ALTER TABLE d_audit_event ADD COLUMN IF NOT EXISTS trace_id VARCHAR(64);"`
- 以後の Trace Harness では `SELECT event_time,action,trace_id,request_id FROM d_audit_event WHERE trace_id='trace-http-400-<RUN_ID>';` を `logs/d_audit_event_trace_http_*.sql` に保存し、0 行であっても「列は存在するが AuditTrail へ到達していない」ことを明示する。Legacy 側の照会結果は `..._legacy.sql` へ分けて置き、Checklist #120 の審査に流用する。

### 5.3 `d_audit_event_id_seq` 再採番プロトコル
> **2025-11-11 追記**: `ops/db/local-baseline/reset_d_audit_event_seq.sql` を `psql` から実行すれば、バックアップ／LOCK／`setval`／検証行挿入／ログ採取までを 1 コマンドで完了できる。  
> 例:  
> ```bash
> RUN_ID=${RUN_ID:-20251111TrestfixZ}
> mkdir -p artifacts/parity-manual/db/${RUN_ID}/{modern,legacy}
> docker exec opendolphin-postgres-modernized bash -lc '
>   cd /workspace
>   psql -U opendolphin -d opendolphin_modern \
>     -v audit_event_backup_file="/tmp/d_audit_event_before_seq_reset_${RUN_ID}.csv" \
>     -v audit_event_validation_log="/tmp/d_audit_event_seq_validation_${RUN_ID}.txt" \
>     -v audit_event_status_log="/tmp/d_audit_event_seq_status_${RUN_ID}.txt" \
>     -f ops/db/local-baseline/reset_d_audit_event_seq.sql
> '
> docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_before_seq_reset_${RUN_ID}.csv artifacts/parity-manual/db/${RUN_ID}/modern/audit_event_backup.csv
> docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_seq_validation_${RUN_ID}.txt artifacts/parity-manual/db/${RUN_ID}/modern/audit_event_validation_log.txt
> docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_seq_status_${RUN_ID}.txt artifacts/parity-manual/db/${RUN_ID}/modern/audit_event_status_log.txt
> ```  
> Legacy 側も同じ手順で取得し、コピー先を `artifacts/parity-manual/db/${RUN_ID}/legacy/` 以下の `audit_event_*` ファイルに揃える。最新 RUN_ID を `TRACE_PROPAGATION_CHECK.md` / `PHASE2_PROGRESS.md` にも記載し、Evidence 名称を統一する。以下は従来フロー（参考用）。
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

### 5.4 RUN_ID=20251111TrestfixZ Audit/JMS 採取ログ
- **シーケンス整合性**: Legacy/Modern 両方の Postgres コンテナで `reset_d_audit_event_seq.sql` の処理を手動再現し、`\copy` バックアップ → `LOCK` → `setval` → `SEQ_SMOKE` 検証まで完了。生成物は `artifacts/parity-manual/db/20251111TrestfixZ/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` としてコピー済みで、`d_audit_event_seq_status_20251111TrestfixZ.txt` には補正後の `max_id` / `last_value` が記録されている。
- **rest_error 3 ケース**: `rest_error_{letter_fk,lab_empty,stamp_data_exception}` を `TRACE_RUN_ID=20251111TrestfixZ`・`--profile modernized-dev` で helper コンテナ実行し、HTTP/Evidence を `artifacts/parity-manual/{letter,lab,stamp}/20251111TrestfixZ/` へ格納。各ディレクトリの `logs/` 配下に `legacy_trace_http.log` / `modern_trace_http.log` / `d_audit_event_{legacy,modern}.txt` / `d_audit_event_{letter|lab|stamp}.tsv` / `d_audit_event_latest.tsv` / `jms_dolphinQueue_read-resource.txt` をまとめ、`message-count=0L`, `messages-added=0L` が変化しないことも記録した。Stamp については `TRACE_RUN_ID=20251111TstampfixZ3`（helper コンテナ + `BASE_URL_{LEGACY,MODERN}=http://opendolphin-{server,server-modernized-dev}:8080/openDolphin/resources`）で再取得し、`ops/db/local-baseline/stamp_tree_oid_cast.sql` と Modern DB の `d_subscribed_tree` を適用したうえで Legacy/Modern=200 + Audit/JMS（TraceId=`parity-stamp-20251111TstampfixZ3`）を確認済み（証跡: `artifacts/parity-manual/stamp/20251111TstampfixZ3/`）。
- **JMS claim_send 試行**: `tmp/claim-tests/claim_20251111TrestfixZ.headers`（`X-Trace-Id: trace-jms-20251111TrestfixZ`, `X-Run-Id` / `X-Claim-Debug` 付き）と `tmp/claim-tests/send_claim_success.json` を用い、helper コンテナから `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/20251111TrestfixZ/claim_send` で再送。結果は Legacy=401 / Modern=403 のままで `claim_send/http/{legacy,modern}/meta.json` に保存され、CLI 出力は `logs/send_parallel_request.log` に追記した。JMS キューは `logs/jms_dolphinQueue_read-resource.before.txt` → `logs/jms_dolphinQueue_read-resource.txt` でどちらも `message-count=0L`, `messages-added=0L` を示し、`logs/d_audit_event_claim.tsv` も 2025-11-10 の既存 `EHT_CLAIM_SEND` 1 行のみとなっている。
- **残課題**: `sendClaim` が 401/403 で止まる理由（Legacy: Basic 認証, Modern: WildFly セキュリティドメイン）の切り分けと、JMS メトリクスに変化が出た RUN_ID の取得が引き続き必要。次回はヘッダー差し替え・ORCA 側資格情報の再確認後、`messages-added>0L` に変化したタイミングを `PHASE2_PROGRESS.md` / `TRACE_PROPAGATION_CHECK.md` / 本節へ追記する。

### 5.5 RUN_ID=20251111TstampfixZ3（StampTree parity）
> **補足:** Legacy ビルドで `LOGGER.log(Level, () -> "...", ex)` を呼び出していた `StampResource` / `StampServiceBean` のバックポート差分は `patches/legacy_stamp_logger_fix.diff` に保存済み。`mvn -f pom.server-classic.xml -pl server -am -Plegacy-wildfly10 -DskipTests package` のレスキューログは `artifacts/parity-manual/build/legacy_war_missing/mvn-package-stamp-logger.log` を参照。
- **実行概要**: helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy`）を `--network legacy-vs-modern_default` で起動し、`BASE_URL_{LEGACY,MODERN}=http://opendolphin-{server,server-modernized-dev}:8080/openDolphin/resources` / `PARITY_HEADER_FILE=tmp/parity-headers/stamp_20251111TstampfixZ3.headers` / `TRACE_RUN_ID=20251111TstampfixZ3` で `ops/tools/send_parallel_request.sh PUT /stamp/tree` を送信。PUT 前に GET `/stamp/tree/9001` を取得して payload（versionNumber=11 / treeBytes）を同期し、Evidence は `artifacts/parity-manual/stamp/20251111TstampfixZ3/{stamp_tree_user9001,PUT_stamp_tree,rest_error_stamp_data_exception}` に集約した。
- **DB 調整**: Legacy/Modern Postgres へ `ops/db/local-baseline/stamp_tree_oid_cast.sql` を適用し、Modern 側には欠損していた `d_subscribed_tree`（id, treeId, user_id）を新規作成。作業ログは `logs/d_stamp_tree_cast_migration.txt` と `logs/d_subscribed_tree_migration.txt` に追記した。
- **Audit/JMS**: Legacy/Modern とも `logs/d_audit_event_stamp_{legacy,modern}.tsv` に TraceId=`parity-stamp-20251111TstampfixZ3` の `STAMP_TREE_PUT` が残り、`logs/jms_dolphinQueue_read-resource*.txt` で `messages-added=4L`, `message-count=0L` を確認。`rest_error_scenarios.manual.csv` / README.manual.md / `PHASE2_PROGRESS.md` / `notes/domain-transaction-parity.md` / `DOC_STATUS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` も同 RUN_ID へ更新済み。


### 5.6 RUN_ID=20251111TclaimfixZ3 Claim/JMS 完了ログ
- **sendClaim 移植とシーケンス正式化**: 2025-11-12 に Legacy 側 `server/src/main/java/open/dolphin/adm20/rest/EHTResource.java` へ `/20/adm/eht/sendClaim` を移植し、Modern 側と同等の JMS/Audit ルートを復元した。これに伴い `IDocInfo` の保険モデル null ガードと `ClaimSender` の `Logger` 初期化を null-safe 化し、Modern 側も `common/src/main/java/open/dolphin/infomodel/AuditEvent.java` を `@SequenceGenerator` で揃えた。シーケンス補正は公式保存先である `ops/db/local-baseline/reset_d_audit_event_seq_batch.sql` を Legacy/Modern 両 Postgres へ投入し、`artifacts/parity-manual/db/20251111TclaimfixZ3/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` に証跡を残した（SEQ_SMOKE=Legacy:13, Modern:73）。
- **Claim 送信**: helper コンテナ（`--network legacy-vs-modern_default`）で `PARITY_HEADER_FILE=tmp/claim-tests/claim_20251111TclaimfixZ3.headers`・`PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_20251111TclaimfixZ3.json`・`TRACE_RUN_ID=20251111TclaimfixZ3` を指定し `ops/tools/send_parallel_request.sh --profile compose PUT /20/adm/eht/sendClaim claim_send` を実行。Legacy/Modern とも `HTTP/1.1 200` となり、Evidence は `TRACEID_JMS/20251111TclaimfixZ3/claim_send/claim_send/{legacy,modern}/` および `logs/send_parallel_request.log` に保存した。
- **JMS / Audit**: `jboss-cli :read-resource(include-runtime=true,recursive=true)` を前後で採取し、`logs/jms_dolphinQueue_read-resource.before.txt` → `after.txt` で `messages-added=4L→5L` / `message-count=0L` を確認。`d_audit_event` は `TRACEID_JMS/20251111TclaimfixZ3/logs/d_audit_event_claim.tsv` に `id=80/79/78` の `EHT_CLAIM_SEND` が追記され、RUN 実行時刻（2025-11-12 08:37 JST）と一致する。DLQ 流入や `delivering-count` の増加はなし。TraceId 差分は `scripts/diff_d_audit_event_claim.sh 20251111TclaimfixZ3 20251111TclaimfixZ2` で確認し、結果を `artifacts/parity-manual/TRACEID_JMS/20251111TclaimfixZ3/README.md` に記録する。

#### RUN_ID=20251111TclaimfixZ Claim/JMS 再取得（2025-11-12 JST）
- **`reset_d_audit_event_seq.sql` の適用**: `ops/db/local-baseline/reset_d_audit_event_seq_batch.sql`（`/tmp` に `d_audit_event_before_seq_reset_${RUN_ID}.csv` などを直接書き出す tee 無し版）を `docker exec opendolphin-postgres{,-modernized}` で流し、Legacy/Modern それぞれ `audit_event_{backup.csv,status_log.txt,validation_log.txt}` を `artifacts/parity-manual/db/20251111TclaimfixZ/{legacy,modern}/` へ取得。`setval(..., next_id, true)` 後に `SEQ_SMOKE` 行が `id=67`（Modern）/`id=7`（Legacy）で採番できることを確認した。
- **helper コンテナ経由の HTTP**: `docker run --network legacy-vs-modern_default mcr.microsoft.com/devcontainers/base:jammy` 内で `BASE_URL_LEGACY=http://server:8080/...`, `BASE_URL_MODERN=http://server-modernized-dev:8080/...`, `TRACE_RUN_ID=trace-jms-20251111TclaimfixZ` を指定し `ops/tools/send_parallel_request.sh --profile modernized-dev PUT /20/adm/eht/sendClaim claim_send` を実行。`claim_send/http/{legacy,modern}/headers.txt` にはどちらも `HTTP/1.1 401 Unauthorized` と `WWW-Authenticate: Basic realm="OpenDolphin"` が保存され、Modern 側は `Strict-Transport-Security`／`Content-Security-Policy` など追加ヘッダーも確認できた。
- **JMS / Audit 採取**: 事前後で `logs/jms_dolphinQueue_read-resource.before.txt` / `.../jms_dolphinQueue_read-resource.txt` を更新したが、`message-count=0L`, `messages-added=0L`, `delivering-count=0` のまま変化なし。`logs/d_audit_event_claim.tsv` も 2025-11-10 05:18 JST の `EHT_CLAIM_SEND` 既存 1 行のみで、新規 `trace-jms-20251111TclaimfixZ` 行は出力されなかった。

#### RUN_ID=20251111TclaimfixZ2 Claim/JMS 再検証（2025-11-12 JST）
- **ヘッダー整備 / Audit シーケンス再取得**: Legacy/Modern 共通で `userName=1.3.6.1.4.1.9414.72.103:doctor1`、`password=632080fabdb968f9ac4f31fb55104648`、`Authorization: Basic RjAwMTptYW5hZ2VyMDE6cGFzc3dvcmQ=` に置き換えた `tmp/claim-tests/claim_20251111TclaimfixZ2.headers` と、`send_claim_success_20251111TclaimfixZ2.json`（RUN_ID 文字列のみ更新）を作成。`ops/db/local-baseline/reset_d_audit_event_seq_batch.sql` は `docker exec opendolphin-postgres{,-modernized}` で適用し、`artifacts/parity-manual/db/20251111TclaimfixZ2/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` へ証跡を保存した。検証 INSERT は Legacy=ID9 / Modern=ID69 で通過。
- **HTTP 応答**: helper コンテナ (`buildpack-deps:curl`) から `docker run --network legacy-vs-modern_default ... ops/tools/send_parallel_request.sh --profile compose PUT /20/adm/eht/sendClaim claim_send` を実行。Basic 認証が通るようになったものの、Legacy 側は `/20/adm/eht/sendClaim` が見つからず `HTTP/1.1 404 Not Found` のまま（`claim_send/claim_send/legacy/headers.txt`）。Modern 側は JMS enqueue 直後に `d_audit_event` へ書き込むタイミングで `ERROR: duplicate key value violates unique constraint "d_audit_event_pkey" (id=59)` が発生し `HTTP/1.1 500 Internal Server Error`（`claim_send/claim_send/modern/{headers.txt,response.json}`）。
- **JMS / Audit の実測値**: 実行前後で `logs/jms_dolphinQueue_read-resource.{before,after}.txt` を採取したところ、`messages-added` が `2L → 3L` へ増加し JMS 側で 1 件は受理された一方、`message-count`/`delivering-count` は 0 のまま（即時処理で積み残し無し）。`logs/d_audit_event_claim.tsv` には引き続き 2025-11-10 の `EHT_CLAIM_SEND`（id=1）と 06:31 JST の成功試行（id=56）のみが出力され、今回 RUN_ID 向けの `EHT_CLAIM_SEND` 行は生成されなかった。
- **既知のブロッカー**: Legacy 404 は `/20/adm/eht/sendClaim` 実装未対応が原因。Modern 側は `AuditTrailService#record` が同一 PK を払い出してしまう（`d_audit_event_pkey` 衝突）ため、200 応答と `d_audit_event` 追記が成立しない。`messages-added>0L` は満たせたが、Audit 連鎖の復旧と Legacy 側のエンドポイント整備が完了するまで RUN_ID=`20251111TclaimfixZ2` は証跡ドラフト扱いとする。
- **フォローアップ**: Legacy/Modern とも 401 応答を得つつ `X-Trace-Id` が維持された点は確認できたが、JMS/Audit 連携は依然未発火。次 RUN では Basic 認証ヘッダーの整合性と ORCA 側 credential の再確認、`logs/jms_dolphinQueue_read-resource.txt` で `messages-added>0L` を記録したタイミングの証跡化（`PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/<next>/claim_send`）を最優先で実施する。

### 5.5 StampTree REST（フォローアップ完了）
- **コード差分の前提**: `server` / `server-modernized` 双方に `persistPersonalTree` + `LockModeType.PESSIMISTIC_WRITE`、`StampTreeModelConverter` の bytea 変換、`StampResource` の AuditTrail 連携を導入済み。RUN_ID=`20251111TstampfixZ3` では helper コンテナから GET→payload 同期→PUT の順に実行し、`rest_error_stamp_data_exception` も同 payload で 200/200 を確認した。
- **Audit/JMS 採取**: Legacy/Modern いずれも `ops/db/local-baseline/stamp_tree_oid_cast.sql` / `reset_d_audit_event_seq.sql` を適用したうえで `logs/d_audit_event_stamp_{legacy,modern}.tsv` に TraceId=`parity-stamp-20251111TstampfixZ3` を記録。`logs/jms_dolphinQueue_read-resource*.txt` では `messages-added=4L`, `message-count=0L` を確認し、GET `/stamp/tree/9001` も `d_subscribed_tree` 作成で 500 → 200 へ回復した。
- **今後のフォロー**: Stamp parity は RUN_ID=`20251111TstampfixZ3` を最新基準とし、後続タスクは Letter FK/JMS・Lab DTO/Audit・Claim JMS の証跡更新に移行する。

#### 参考: RUN_ID=20251111T110107Z（0L 調査ログ）
- `artifacts/parity-manual/TRACEID_JMS/20251111T110107Z/logs/jms_dolphinQueue_read-resource.txt` では `message-count=0L` / `messages-added=0L` のまま 15 コンシューマーがぶら下がっており、Queue へ投入する API を実行していなかったことが原因である。
- 同 RUN_ID の `logs/send_parallel_request.log` には `trace_http_{400,401,500}` しか記録されていない。`logs/legacy_trace_http.log` / `logs/modern_trace_http.log` も同 3 ケースのみで、JMS 発火ケースが存在しないことを裏付けている。
- そのため `logs/d_audit_event_latest.tsv` も `SYSTEM_ACTIVITY_SUMMARY` のみ増加し、`EHT_CLAIM_SEND` の最新行は 2025-11-10 05:18 (+09:00) に留まった。

#### 再取得前のチェックリスト（RUN_ID=`TRACE_RUN_ID`）
- [ ] **ヘッダー差し替え**: `tmp/claim-tests/claim_${RUN_ID}.headers` を `cp tmp/claim-tests/claim_TEMPLATE.headers tmp/claim-tests/claim_${RUN_ID}.headers` で複製し、`X-Trace-Id: trace-jms-${RUN_ID}` / `X-Run-Id: ${RUN_ID}` / `X-Claim-Debug: enabled` を追記する。`PARITY_HEADER_FILE` / `TRACE_RUN_ID` を `ops/tests/api-smoke-test/README.manual.md` の手順と揃える。
- [ ] **payload 更新**: `tmp/claim-tests/send_claim_success.json` の `issuerUUID` / `memo` / `labtestOrderNumber` / `docId` / bundle `memo` 内に残っている旧 RUN_ID（例: `20251111TrestfixZ`）を `RUN_ID` へ置換し、`d_audit_event.request_id` にも同じ Trace ID が入るよう整合させる。
- [ ] **シーケンス正常化**: Legacy/Modernized 両方の Postgres コンテナで `ops/db/local-baseline/reset_d_audit_event_seq.sql` を実行し、`artifacts/parity-manual/db/${RUN_ID}/{legacy,modern}/audit_event_{backup.csv,validation_log.txt,status_log.txt}` を取得する。`logs/d_audit_event_latest.tsv` で `EHT_CLAIM_SEND` が 2025-11-10 05:18 JST 以前で止まっていないか確認する。
- [ ] **事前メトリクス取得**: `/subsystem=messaging-activemq/.../dolphinQueue:read-resource` を事前取得して `logs/jms_dolphinQueue_read-resource.before.txt` に保存し、`message-count` / `messages-added` が 0L の初期値であることを明示する。
- [ ] **API 実行計画**: `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}` を作成し、`ops/tools/send_parallel_request.sh --profile modernized-dev PUT /20/adm/eht/sendClaim` を 1 回送出する。CLI 実行ログ（`logs/send_parallel_request.log`）と HTTP ファイル群は `claim_send/` サブディレクトリへ整理する。
- [ ] **証跡リンク更新**: 取得後に `PHASE2_PROGRESS.md` 2025-11-11 節、`TRACE_PROPAGATION_CHECK.md §6`、`docs/web-client/planning/phase2/DOC_STATUS.md` の対象行へ RUN_ID と Evidence パスを追記し、`message-count` / `messages-added` に差分が出たことを明記する。

---

### 5.5 Appo/Schedule チェックリスト（手順整備のみ）

`docs/server-modernization/phase2/notes/domain-transaction-parity.md §3` および `PHASE2_PROGRESS.md` の Appo/Schedule 節で整理されている通り、`@SessionOperation` は HTTP 200 まで達しても `AuditTrailService` 連携が欠落しており、`d_audit_event` と JMS Queue が空のままになっている。以下のチェックリストで HTTP/Audit/JMS の期待値と証跡テンプレートを明確化し、改修後すぐに再取得できる状態を維持する。

| ケース | HTTP 期待値 | AuditTrail 期待値 | JMS 期待値 | 証跡テンプレ |
| --- | --- | --- | --- | --- |
| `PUT /appo` | Legacy/Modernized とも 200（`{"response":1}`）。`/tmp/reseed_appo.sql` で `id=8001` を復元してから実行。 | Legacy/Modernized の `d_audit_event` に `APPOINTMENT_DELETE`（仮称）を 1 行記録。現状は `SYSTEM_ACTIVITY_SUMMARY` のみなので、RUN_ID メモへ「Audit/JMS 空（SessionOperation→AuditTrailService 未連携）」と明記。 | `message-count` / `messages-added` が +1 になることを `logs/jms_dolphinQueue_read-resource.{before,after}.txt` で確認。現状は 0L 継続。 | `artifacts/parity-manual/appo/<RUN_ID>/` 配下に `headers/`, `http/`, `logs/d_audit_event_{legacy,modern}.txt`, `logs/jms_dolphinQueue_read-resource.{before,after}.txt` を保存。 |
| `GET /schedule/pvt/<DATE>` | Legacy/Modernized とも 200。Modernized 側は `{"list":null}` から `list` に 1 件以上（例: `架空 花子`）が復帰することがゴール。 | `d_audit_event` に `SCHEDULE_FETCH`（仮称）を 1 行記録。現状は `remoteUser=anonymous` 継続のため 0 行。 | JMS は enqueue されない想定だが、`consumer-count` と `messages-added` が変化しないことを証跡として残す。 | `artifacts/parity-manual/schedule/<RUN_ID>/` に HTTP/headers/JMS/Audit ログを集約し、`logs/schedule_trace_context.log` へ `SessionOperationInterceptor` → `AuditTrailService` 呼び出し有無を記録。 |

#### 実行計画（helper コンテナ + `--profile compose`）
1. `RUN_ID=${RUN_ID:-20251115TappoSchedPlanZ}` を定義し、`PARITY_HEADER_FILE=tmp/parity-headers/{appo|schedule}_${RUN_ID}.headers` をテンプレートから複製。`X-Trace-Id` / `X-Run-Id` / 認証ヘッダーを更新し、`PARITY_OUTPUT_DIR=artifacts/parity-manual/{appo|schedule}/${RUN_ID}` を作成。
2. helper コンテナをホスト Docker に接続し、`localhost:{8080,9080}` へアクセスできるよう `--network host`（WSL の場合は `--add-host host.docker.internal:host-gateway`）を指定。例:  
   ```bash
   docker run --rm --network host -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy \
     bash -lc 'set -eu
       RUN_ID=${RUN_ID:-20251115TappoSchedPlanZ}
       export PARITY_HEADER_FILE=tmp/parity-headers/appo_${RUN_ID}.headers
       export PARITY_OUTPUT_DIR=artifacts/parity-manual/appo/${RUN_ID}
       ops/tools/send_parallel_request.sh --profile compose PUT /appo
     '
   ```
3. 同じ手順で Schedule を取得する。`PARITY_HEADER_FILE=tmp/parity-headers/schedule_${RUN_ID}.headers`、`PARITY_OUTPUT_DIR=artifacts/parity-manual/schedule/${RUN_ID}` を指定し、`ops/tools/send_parallel_request.sh --profile compose GET /schedule/pvt/2025-11-09`（日付は最新シードに合わせて調整）を実行計画として記録。
4. 現時点では **実行せず**、`AuditTrailService` 連携や `SessionOperationInterceptor` cleanup が完了した時点で再走する。RUN_ID 確定後に `PHASE2_PROGRESS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` / `DOC_STATUS.md` の備考を更新し、証跡は前表のパスへ保存する。

## 6. 失敗時のフォールバック

| 現象 | 原因 | 対処 |
| --- | --- | --- |
| `curl: (6) Could not resolve host: opendolphin-server` | Docker Desktop / WSL 連携が無効。`--profile modernized-dev` は Docker ネットワーク内のホスト名を前提にしている。 | Docker Desktop をインストールし対象ディストリを有効化、または `compose` プロファイルへ切替えて `localhost` を使用。Runbook 冒頭の前提条件と `TRACE_PROPAGATION_CHECK.md §5.2` を参照。 |
| `relation "d_users" does not exist` | Modernized DB に初期データが入っていない。 | `LOCAL_BACKEND_DOCKER.md` / `POSTGRES_BASELINE_RESTORE.md` でシード投入 → 再実行。 |
| Legacy 側 WildFly ビルド失敗 (`org.wildfly.extension.micrometer`) | Legacy イメージが Micrometer 拡張を含まない。 | Legacy ビルド時は `ops/legacy-server/docker/configure-wildfly.cli` から該当拡張を外すか、Legacy 側の Trace 取得を後回しにする。 |

---

### 5.7 Legacy JMS 再起動テンプレ整備（2025-11-12 追記）
- `scripts/jms/legacy_mdb_restart_template.sh` に StampSenderMDB の stop/start を `docker compose exec opendolphin-server /opt/jboss/wildfly/bin/jboss-cli.sh --commands='…'` で実行するコメントテンプレを格納した。**実行はマネージャー指示下のみ**とし、RUN_ID を `TRACEID_JMS_RUNBOOK` と同じ UTC 文字列で揃える。
- Run ID ごとの証跡ディレクトリを `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/` に掘り、`legacy_mdb_restart.log` に stop/start/read-resource の順で CLI 出力を追記。`before_jms_dolphinQueue_read-resource(_legacy).txt` / `after_*.txt` を同階層へ保存し、`messages-added`, `message-count`, `consumer-count`, `consumer-created-count` をコメントでメモする。
- 再起動直後は `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md §3.4` を参照し、`docker compose cp opendolphin-server:/opt/jboss/wildfly/standalone/configuration/standalone-full.xml artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/standalone-full_${RUN_ID}.xml` と `docker compose cp opendolphin-server:/opt/jboss/wildfly/standalone/deployments/opendolphin.war/WEB-INF/ejb-jar.xml artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/ejb-jar_${RUN_ID}.xml` を取得。ローカルにコピーしたファイルは `diff -u artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/standalone-full_${RUN_ID}_before.xml artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/standalone-full_${RUN_ID}_after.xml` のように差分化し、`StampSenderMDB` の `destinationLookup`, `acknowledgeMode`, `maxSession` が変わっていないことを確認する。
- `server.log` は `artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/server.log` へコピーし、`StampSenderMDB Stopping` / `Starting` 行の UTC タイムスタンプを `domain-transaction-parity.md Appendix A.6` の参照表へ反映する。`legacy_mdb_restart.log` に記録したコマンドと server.log の時刻差を 1 分以内に収めることを acceptance とし、乖離が大きい場合は docker compose exec の再実行を控えて原因を整理する。

### 5.8 Letter/Lab 監査チェックリスト（rest_error parity）

| Case ID | API | RUN_ID テンプレ | ヘッダーテンプレ | 証跡保存先 | 期待 HTTP | Audit/JMS チェック |
| --- | --- | --- | --- | --- | --- | --- |
| `rest_error_letter_audit` | `PUT /odletter/letter` | `20251115TletterAuditZ1`（`TRACE_RUN_ID={{RUN_ID}}`） | `tmp/parity-headers/letter_<RUN_ID>.headers` ＋ `PARITY_BODY_FILE=tmp/parity-letter/letter_put_payload.json` | `artifacts/parity-manual/letter/<RUN_ID>/` | Legacy=200（ID=18） / Modern=200（ID=-38） | ① Modern `logs/d_audit_event_letter_modern.tsv` に `LETTER_CREATE` が TraceId=`trace-letter-audit-<RUN_ID>` で追加される ② Modern `logs/jms_dolphinQueue_read-resource.{before,after}.txt` の `messages-added` が 0L→1L。Legacy は Audit/JMS 0 行を Known Issue として Evidence に記録。|
| `rest_error_lab_audit` | `GET /lab/module/WEB1001,0,5` | `20251115TlabAuditZ1`（`TRACE_RUN_ID={{RUN_ID}}`） | `tmp/parity-headers/lab_<RUN_ID>.headers` | `artifacts/parity-manual/lab/<RUN_ID>/` | Legacy=404（seed 未適用） / Modern=200（`{"list":[]}`） | ① Modern `logs/d_audit_event_lab_modern.tsv` に `LAB_TEST_READ`（`patientId`/`labCode`/`resultCount`）が追記される ② Modern `messages-added` が 1L→2L。Legacy seed を適用した RUN では 200/200 を目指す。|

- いずれのケースも **RUN_ID=`20251115TletterAuditZ1` / `20251115TlabAuditZ1` で Audit/JMS 取得済み**。`ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の `letter_lab_audit_status` 列に DONE を記載し、`PARITY_OUTPUT_DIR=artifacts/parity-manual/{letter,lab}/<RUN_ID>` 配下に HTTP/Audit/JMS/CLI ログを集約した。
- `RUN_ID` 命名規則は Letter/Lab 共通で UTC ベースの `YYYYMMDDThhmmssZ` を使用し、TraceId は `trace-letter-audit-<RUN_ID>` / `trace-lab-audit-<RUN_ID>` 形式に統一する。Legacy seed 適用後の再取得（Lab=404→200）を行う場合も同じプレフィックスを継承する。

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
- RUN_ID=`20251117TtraceAuditZ1`（`artifacts/parity-manual/TRACEID_JMS/20251117TtraceAuditZ1/`）では、401 ケースで `REST_UNAUTHORIZED_GUARD` が `d_audit_event_trace_http_401.sql` に 3 行残り、Modernized queue `messages-added=9L` / Legacy 0L のギャップを `logs/jms_dolphinQueue_read-resource{,_legacy}.txt` に保存。`TRACE_PROPAGATION_CHECK.md` §8.5・`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8-1 にもリンク済み。

---

## Appendix A. StampTree GET variations（helper + `--profile compose`）

### A.1 準備フロー
- RUN_ID を variation ごとに割り当て（例: public=`20251111TstampfixZ4`, shared=`20251111TstampfixZ5`, published=`20251111TstampfixZ6`）、「`tmp/parity-headers/stamp_tree_<variation>.headers` → `tmp/parity-headers/stamp_tree_<variation>_<RUN_ID>.headers`」で複製する。
- `perl -0pi -e 's/{{RUN_ID}}/<RUN_ID>/g' tmp/parity-headers/stamp_tree_<variation>_<RUN_ID>.headers` で `X-Trace-Id: parity-stamp-tree-<variation>-<RUN_ID>` を埋め込み、`PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/<RUN_ID>` を作成して `logs/` を先に掘っておく。
- helper から `docker exec opendolphin-server{,-modernized-dev}` を叩く想定で、`logs/jms_dolphinQueue_read-resource{,_legacy}.{before,txt}` と `logs/d_audit_event_stamp_<variation>_{legacy,modern}.tsv` の出力先を決めておく（Appendix A.3 のコマンドを参照）。

### A.2 helper 実行例（9020 問題回避）
Docker ホスト（WSL/裸 Linux）で 9080/TCP が塞がっている間は helper コンテナを `--network host` で起動し、`--profile compose` から localhost:8080/9080 経由でアクセスする。

```bash
RUN_ID=${RUN_ID:-20251111TstampfixZ4}
VARIATION=${VARIATION:-public}
docker run --rm --network host \
  -v "$PWD":/workspace -w /workspace \
  mcr.microsoft.com/devcontainers/base:jammy \
  bash -lc "set -euo pipefail
    export PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_${VARIATION}_${RUN_ID}.headers
    export PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/${RUN_ID}
    export TRACE_RUN_ID=${RUN_ID}
    ./ops/tools/send_parallel_request.sh --profile compose GET /stamp/tree/9001/${VARIATION} stamp_tree_${VARIATION}
  "
```

> **メモ:** `VARIATION` は `public` / `shared` / `published` を切り替えて 3 回実行する。`stamp_tree_<variation>/<legacy|modern>/` に `headers.txt` / `meta.json` / `response.json` が生成されるので、`artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_<variation>/` ごとに Run ID を分ける。

### A.3 JMS / Audit 採取コマンド
1. **JMS before/after**（Legacy, Modern 共通）  
   ```bash
   # before
   docker exec opendolphin-server \
     /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
     --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)' \
     > artifacts/parity-manual/stamp/${RUN_ID}/logs/jms_dolphinQueue_read-resource_legacy.before.txt
   docker exec opendolphin-server-modernized-dev \
     /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
     --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)' \
     > artifacts/parity-manual/stamp/${RUN_ID}/logs/jms_dolphinQueue_read-resource.before.txt
   # after
   docker exec opendolphin-server \
     /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
     --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)' \
     > artifacts/parity-manual/stamp/${RUN_ID}/logs/jms_dolphinQueue_read-resource_legacy.txt
   docker exec opendolphin-server-modernized-dev \
     /opt/jboss/wildfly/bin/jboss-cli.sh --connect \
     --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)' \
     > artifacts/parity-manual/stamp/${RUN_ID}/logs/jms_dolphinQueue_read-resource.txt
   ```
   `messages-added` の差分と Legacy `message-count=0L` をコメントに残す。

2. **Audit (`d_audit_event`)**  
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec -T db \
     psql -U opendolphin -d opendolphin -f - \
     < tmp/d_audit_event_stamp.sql \
     > artifacts/parity-manual/stamp/${RUN_ID}/logs/d_audit_event_stamp_${VARIATION}_legacy.tsv
   docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec -T db-modernized \
     psql -U opendolphin -d opendolphin_modern -f - \
     < tmp/d_audit_event_stamp.sql \
     > artifacts/parity-manual/stamp/${RUN_ID}/logs/d_audit_event_stamp_${VARIATION}_modern.tsv
   ```
   出力 TSV に `TraceId=parity-stamp-tree-<variation>-<RUN_ID>` を含む行が追加されたことを確認し、`domain-transaction-parity.md` Appendix A.5 と `PHASE2_PROGRESS.md` の該当節へリンクする。

3. **報告テンプレ**  
   - (a) HTTP Legacy/Modern のステータス  
   - (b) Audit/JMS の引用パス (`artifacts/parity-manual/stamp/<RUN_ID>/...`)  
   - (c) 追加課題（Audit 未記録や JMS 変化無しなど）は `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 と `PHASE2_PROGRESS.md` backlog に記載。

-### A.4 Stamp 公開 GET RUN テンプレ（RUN_ID=`20251113TstampPublicPlanZ1` / `Z1` / `20251113TstampPublishedPlanZ1`）
- `seed`: `ops/db/local-baseline/stamp_public_seed.sql` を Legacy/Modern DB に適用（`docker exec -i opendolphin-postgres{,-modernized} psql -U opendolphin -d {opendolphin|opendolphin_modern} < ops/db/local-baseline/stamp_public_seed.sql`）。同スクリプトは facility=`9001` / user=`9001:doctor1` / `d_roles` を `NOT EXISTS` で補完するため、`publishType in ('9001','9002','global')` と購読サンプルが揃う。結果を `artifacts/parity-manual/stamp/20251113TstampPublicPlanZ1/logs/seed_stamp_public_{legacy,modern}.log` に保存。
- `headers`: `tmp/parity-headers/stamp_tree_{public,shared,published}_20251113TstampPublicPlanZ1.headers`（`userName=9001:doctor1`, `facilityId=9001`, `X-Trace-Id=parity-stamp-tree-<variation>-20251113Tstamp<Variation>PlanZ1`）を使用。将来 RUN_ID を差し替える場合は `perl -0pi -e 's/20251113TstampPublicPlanZ1/<新 RUN_ID>/g' ...` で一括置換する。
- `helper` 実行例:
  ```bash
  RUN_ID=20251113TstampPublicPlanZ1
  VARIATION=${VARIATION:-public}
  docker run --rm --network legacy-vs-modern_default \
    -v "$PWD":/workspace -w /workspace \
    mcr.microsoft.com/devcontainers/base:jammy \
    bash -lc "set -euo pipefail
      export PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_${VARIATION}_${RUN_ID}.headers
      export PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/${RUN_ID}
      export TRACE_RUN_ID=${RUN_ID}
      ./ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/${VARIATION} stamp_tree_${VARIATION}
    "
  ```
- `証跡`: `artifacts/parity-manual/stamp/20251113Tstamp<Variation>PlanZ1/` に Legacy/Modern の HTTP/headers/meta と `logs/d_audit_event_stamp_<variation>_{legacy,modern}.tsv`（`STAMP_TREE_<VIS>_GET`, `resultCount={2,1,3}`）, `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt`, `logs/send_parallel_request.log` を集約。`docs/server-modernization/phase2/notes/domain-transaction-parity.md` Appendix A.5 / `PHASE2_PROGRESS.md` / `patches/stamp_get_public_plan.md` へ RUN_ID をリンクする。facility ミスマッチ検証用には `RUN_ID=20251113TstampPublicPlanZ4` を割り当て、`/stamp/tree/9002/public`（403）実行後の WARN ログを `artifacts/parity-manual/stamp/20251113TstampPublicPlanZ4/logs/{legacy,modern}_warn.log` に保存する。

### A.5 Appo/Schedule Audit/JMS 再取得テンプレ（RUN_ID=`20251115TappoSchedPlanZ`）

1. **準備**
   - `tmp/reseed_appo.sql` を Legacy/Modern DB へコピーして `docker exec opendolphin-postgres{,-modernized} psql -U opendolphin -d {opendolphin|opendolphin_modern} -f /tmp/reseed_appo.sql` を実行し、`d_appo id=8001` を復元してから CLI を叩く。
   - ヘッダー: `cp tmp/parity-headers/appo_20251111T070532Z.headers tmp/parity-headers/appo_${RUN_ID}.headers`（schedule 版も同様）→ `perl -0pi -e 's/TRACE_ID_PLACEHOLDER/trace-audit-appo-${RUN_ID}/'` で `X-Trace-Id` と `X-Run-Id` を差し替える。`PARITY_OUTPUT_DIR=artifacts/parity-manual/{appo,schedule}/${RUN_ID}` を事前に作成し、`logs/` ディレクトリも掘っておく。
2. **helper 実行例（docker network 内でコンテナ名直接参照）**
   ```bash
   RUN_ID=${RUN_ID:-20251115TappoSchedPlanZ}
   docker run --rm --network legacy-vs-modern_default \
     -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy \
     bash -lc "set -euo pipefail
       export PARITY_HEADER_FILE=tmp/parity-headers/appo_${RUN_ID}.headers
       export PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json
       export PARITY_OUTPUT_DIR=artifacts/parity-manual/appo/${RUN_ID}
       ops/tools/send_parallel_request.sh --profile modernized-dev PUT /appo rest_audit_appo_trace
       export PARITY_HEADER_FILE=tmp/parity-headers/schedule_${RUN_ID}.headers
       unset PARITY_BODY_FILE
       export PARITY_OUTPUT_DIR=artifacts/parity-manual/schedule/${RUN_ID}
       ops/tools/send_parallel_request.sh --profile modernized-dev GET /schedule/pvt/2025-11-09 rest_audit_schedule_trace
     "
   ```
3. **JMS / Audit 採取**
   - `docker exec opendolphin-server{,-modernized-dev} /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)' > artifacts/parity-manual/{appo|schedule}/${RUN_ID}/logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt`
   - `docker exec opendolphin-postgres{,-modernized} sh -c "psql -U opendolphin -d {opendolphin|opendolphin_modern} -c \"\\copy (select id,event_time,action,resource,actor_id,request_id,patient_id from d_audit_event where request_id='trace-audit-{appo|schedule}-${RUN_ID}' order by id desc) to STDOUT with csv header\"" > artifacts/parity-manual/{appo|schedule}/${RUN_ID}/logs/d_audit_event_{legacy,modern}.tsv`
4. **期待値 / 証跡**
   - Appo: Legacy/Modern `HTTP 200` (`response:1`), Modern JMS `messages-added` が 1 増分（例: 4L→5L）、Legacy は 0L 継続。`d_audit_event_modern.tsv` に `APPOINTMENT_MUTATION` success/failure が TraceId=`trace-audit-appo-${RUN_ID}` で複数行追加される。
   - Schedule: Legacy/Modern `HTTP 200`（`架空 花子` 1 件）、`d_audit_event` に `SCHEDULE_FETCH` が 1 行ずつ。JMS は enqueue しないため `messages-added` は before/after で変化なし。
   - Evidence は `artifacts/parity-manual/{appo,schedule}/${RUN_ID}/` へ HTTP/headers/meta/JMS/Audit/README をまとめ、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` / `PHASE2_PROGRESS.md` / `rest_error_scenarios.manual.csv` の該当行へ RUN_ID リンクを追記する。

##### Appendix A.6 Factor2 / Messaging backlog（RUN_ID=`20251118Tfactor2ParityZ2`, `20251112TmessagingDiagZ1`）

- **Factor2 TOTP (`/20/adm/factor2/totp/registration`)**  
  - ヘッダー: `tmp/parity-headers/factor2_totp_registration_TEMPLATE.headers`（`userName=1.3.6.1.4.1.9414.72.103:admin`, `password=admin2025`, `TRACE_RUN_ID=20251118Tfactor2ParityZ2`）、ペイロード: `tmp/factor2/totp_registration_payload.json`。  
  - 結果: Legacy=404（WildFly10 側は Factor2 REST を公開していないため既知）、Modern=200。`artifacts/parity-manual/factor2/20251118Tfactor2ParityZ2/` に HTTP/headers/meta、`logs/send_parallel_request.log`、`logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt`（Modern `messages-added`=23L→26L）、`logs/d_audit_event_factor2_{modern,legacy}.tsv` を保存。`SessionAuditDispatcher` 経由で `TOTP_REGISTER_INIT` が `d_audit_event` に記録され、`d_factor2_credential` / `d_factor2_challenge` CSV で副作用も採取済み。レスポンスの `secret` および `provisioningUri` は README で `***masked***` に置換すること。  
- **Factor2 FIDO (`/20/adm/factor2/fido2/{registration,assertion}/options`)**  
  - ヘッダー: `tmp/parity-headers/factor2_fido_{registration,assertion}_TEMPLATE.headers`（同 `TRACE_RUN_ID`）、ペイロード: `tmp/factor2/fido_{registration,assertion}_options_payload.json`。  
  - 結果: Legacy=404（未公開 API）、Modern=200。`logs/d_audit_event_factor2_modern.tsv` に `FIDO2_{REGISTER,ASSERT}_INIT` が 1 行ずつ残り、JMS は TOTP と合算で +3 件 enqueue。Modern 側は `d_factor2_challenge` に registration/assertion チャレンジを生成し、Legacy は Audit/JMS 変化なし。Evidence/README は上記 TOTP と同ディレクトリを参照。
- **Claim / Diagnosis / MML dispatch**  
  - ヘッダー: `tmp/parity-headers/{claim,diagnosis,mml}_TEMPLATE.headers`（`TRACE_RUN_ID` を同一値で差し込み、Diagnosis の `Accept` は `text/plain`）。ボディは `tmp/claim-tests/send_{claim,diagnosis}_success.json` と `tmp/mml-tests/send_mml_success.json` を使用。  
  - RUN_ID=`20251118TmessagingParityZ2`（2025-11-13 JST）: Claim=Legacy/Modern 200、Diagnosis=Legacy 500 / Modern 200、MML=Legacy 404 / Modern 200。Modern 側の `messages-added` は 26L→28L となり、`artifacts/parity-manual/messaging/20251118TmessagingParityZ2/logs/` に HTTP・JMS before/after・`d_audit_event_{claim,mml}_modern.tsv`（Diagnosis は未記録）を保存。  
  - RUN_ID=`20251118TdiagnosisLegacyZ1`（2025-11-13 JST）: Legacy diagnosis を 200 で再取得。手順は (1) `tmp/diagnosis_seed.sql` を Legacy Postgres へ投入して `d_patient`/`d_karte`/`d_letter_module` を整備、(2) `docker exec opendolphin-server /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands="/subsystem=logging/logger=dolphin.claim:add(level=INFO)"` で `DiagnosisSender` の NPE を抑止、(3) helper コンテナから `ops/tools/send_parallel_request.sh --profile modernized-dev POST /karte/diagnosis/claim messaging_diagnosis` を実行。Legacy=200（`response=9002004`）、Modern=200。Legacy JMS は 0L→0L のまま（サーバー直送）、Modern は `messages-added=5L→6L`。`artifacts/parity-manual/messaging/20251118TdiagnosisLegacyZ1/` に HTTP/headers/meta/JMS/Audit TSV/`legacy_server.log` を保存。  
  - RUN_ID=`20251118TdiagnosisAuditZ2`（2025-11-13 JST）: Legacy/Modern 両コンテナへ WAR をホットデプロイ後、`--profile compose` で `POST /karte/diagnosis/claim` を再取得。`tmp/diagnosis_seed.sql` を毎回再投入したうえで CLI を叩き、`artifacts/parity-manual/messaging/20251118TdiagnosisAuditZ2/logs/d_audit_event_diagnosis_{legacy,modern}.tsv` に TraceId=`parity-diagnosis-send-20251118TdiagnosisAuditZ2` の `EHT_DIAGNOSIS_CREATE` が記録されることを確認。Legacy/Modern とも HTTP 200 で `response=9002***`、JMS は変化なし（直送仕様）。
  - RUN_ID=`20251112TmessagingDiagZ1`: Legacy=404、Modern=400（Claim）、406（Diagnosis）、500（MML）。`artifacts/parity-manual/messaging/20251112TmessagingDiagZ1/logs/modern_server.log` に `RESTEASY-JACKSON000100: Duplicate field IDocInfo.admFlag` と `MmlResource.sendMmlPayload` 失敗ログを保存。  
  - ToDo: Legacy/Modern 共通で診断監査 (`d_audit_event` に `EHT_DIAGNOSIS_*`) が未実装のため、CLI では TSV が空。`TRACEID_JMS` フロー完了後に Listener 実装と playback を追加する。

##### Appendix A.7 Lab module GET（RUN_ID=`20251112TlabReportZ1`）

- ヘッダー: `tmp/parity-headers/lab_report_TEMPLATE.headers`（`userName=1.3.6.1.4.1.9414.72.103:doctor1`, `password=doctor2025`, `TRACE_RUN_ID=20251112TlabReportZ1`）。  
- 実行例: `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy bash -lc 'set -euo pipefail; export PARITY_HEADER_FILE=tmp/parity-headers/lab_report_TEMPLATE.headers; export PARITY_OUTPUT_DIR=artifacts/parity-manual/lab/20251112TlabReportZ1; export TRACE_RUN_ID=20251112TlabReportZ1; ops/tools/send_parallel_request.sh --profile modernized-dev GET /lab/module/WEB1001,0,5 lab_module_fetch'`  
- 証跡: `artifacts/parity-manual/lab/20251112TlabReportZ1/` に HTTP/headers/meta, `logs/send_parallel_request.log`, `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt`, `logs/d_audit_event_lab_{legacy,modern}.tsv` を保存。Modern 側は `messages-added=10L→12L` を記録し、`LAB_TEST_READ` / `REST_UNAUTHORIZED_GUARD` が TraceId ごとに `d_audit_event` へ残る。Legacy は 200 応答だが audit/JMS は従来通り空（想定外動作として checklist へ記述）。
