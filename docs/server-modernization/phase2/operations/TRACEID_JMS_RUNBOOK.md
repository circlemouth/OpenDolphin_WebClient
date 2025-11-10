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

すべてのログは `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/` 以下に置き、HTTP 応答 (`trace_http_*/{legacy,modern}/`) との紐付けを保つ。

---

## 5. 失敗時のフォールバック

| 現象 | 原因 | 対処 |
| --- | --- | --- |
| `curl: (6) Could not resolve host: opendolphin-server` | Docker Desktop / WSL 連携が無効。`--profile modernized-dev` は Docker ネットワーク内のホスト名を前提にしている。 | Docker Desktop をインストールし対象ディストリを有効化、または `compose` プロファイルへ切替えて `localhost` を使用。Runbook 冒頭の前提条件と `TRACE_PROPAGATION_CHECK.md §5.2` を参照。 |
| `relation "d_users" does not exist` | Modernized DB に初期データが入っていない。 | `LOCAL_BACKEND_DOCKER.md` / `POSTGRES_BASELINE_RESTORE.md` でシード投入 → 再実行。 |
| Legacy 側 WildFly ビルド失敗 (`org.wildfly.extension.micrometer`) | Legacy イメージが Micrometer 拡張を含まない。 | Legacy ビルド時は `ops/legacy-server/docker/configure-wildfly.cli` から該当拡張を外すか、Legacy 側の Trace 取得を後回しにする。 |

---

## 6. 証跡の保存と報告

1. `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/trace_http_*` に HTTP 応答、`logs/` に WildFly / JMS / SQL を保存。
2. `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` の「CLI シナリオ」「実行ログ」節へ RUN_ID、結果、ブロッカー、参照パスを追記。
3. `docs/server-modernization/phase2/PHASE2_PROGRESS.md` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` に同 Run ID の状況を要約。
4. 追加の Runbook 更新があれば `docs/web-client/planning/phase2/DOC_STATUS.md` の該当欄を Active で維持する。

---

## 7. 関連ドキュメント
- `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md`
- `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`
- `docs/server-modernization/phase2/PHASE2_PROGRESS.md`
- `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`
