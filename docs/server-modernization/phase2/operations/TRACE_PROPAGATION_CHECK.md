# Trace Propagation Check（2026-06-16）

## 1. 手順サマリ
1. `test_config.manual.csv` の `trace-id` 列を使用し、`headers/*.headers` のコピーに `X-Trace-Id` を追記する（例: `tmp/trace/user_profile.headers`）。
2. `BASE_URL_LEGACY` / `BASE_URL_MODERN` と `PARITY_HEADER_FILE` を指定して `ops/tools/send_parallel_request.sh` を実行し、HTTP レスポンスを `artifacts/parity-manual/<CASE>/...` に保存する。
3. `docker logs <container> | perl -pe 's/\e\[[0-9;]*[A-Za-z]//g'` で ANSI コードを除去し、`trace-id` を含む行を `artifacts/parity-manual/TRACEID_JMS/trace/` に退避する。

> **詳細手順:** `docs/server-modernization/phase2/operations/TRACEID_JMS_RUNBOOK.md` に CLI 前提、プロファイル選定、ログ保管パスを統一化した。
## 2. ケース: user_profile (`trace-id=trace-user-profile-manual`)
- **HTTP ログ**: `artifacts/parity-manual/TRACEID_JMS/trace/modern_http.log`
- **SQL ログ**: `artifacts/parity-manual/JPQL/{legacy.log,modernized.log}`
- **観測:**
  - モダナイズ版 `LogFilter` は `traceId=<value>` を INFO 出力しており、`SessionTraceManager` がヘッダー値を継承することを確認した（2 本のログ行が生成されるのは RESTEasy が同一リクエストを 2 回ログする既知挙動）。
  - Legacy `LogFilter` は traceId をログに出力しないため、HTTP ログ単体では `X-Trace-Id` を追跡できない。`SessionTraceManager` も未実装なため、JMS/監査ログへは伝搬しない。
  - user_profile では JMS 連携が発生しない。`artifacts/parity-manual/TRACEID_JMS/trace/README.txt` に対象外である旨を記録した。

## 3. TODO
- JMS 連携が発生するケース（例: `/20/adm/factor2/fido2/enroll` や Touch 送信系）を再現し、`MessagingGateway` → `MessageSender` の traceId 伝搬をログ採取する。
- Legacy `LogFilter` に traceId ログ出力を追加する差分を設計し、SessionTraceManager 相当を導入するか検討する。
- `SessionTraceManager` の DEBUG ログを有効化した状態で例外発生パス（401/500）を採取し、`TRACE_PROPAGATION_CHECK.md` に比較表を追加する。
- `server-modernized/src/main/java/open/dolphin/session/framework/SessionTraceManager.java` は `SessionOperationInterceptor` から渡された `preferredTraceId` と ThreadLocal MDC を同期させるだけで、REST リソース側で `sessionTraceManager.current()` が null のままでも処理を進める。`SystemResource#getActivities` のように REST 層で 400 を返す経路ではセッション層が介在しないため、`LogFilter` が先に `MDC.put("traceId", header)` を完了しているか、もしくは REST 層で明示的に `sessionTraceManager.start(...)` を呼び出して監査ログへ traceId を載せる案を検討する。

## 4. CLI シナリオ（2025-11-08 更新）

| Case ID | API | 期待ステータス | ヘッダープロファイル | `trace-id` | 状態 |
| --- | --- | --- | --- | --- | --- |
| `trace_http_200` | `GET /serverinfo/jamri` | 200 (Jamri コード) | `ops/tests/api-smoke-test/headers/trace-anonymous.headers` | `trace-http-200` | ✅ `ops/tools/send_parallel_request.sh` で実行。証跡: `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/` |
| `trace_http_400` | `GET /dolphin/activity/2025,04` | 400 (BadRequest) | `ops/tests/api-smoke-test/headers/trace-session.headers` | `trace-http-400` | ⏳ `d_users` テーブル未整備のため `LogFilter` 認証時に `relation "d_users" does not exist`。DB シード後に再実行。 |
| `trace_http_401` | `GET /touch/user/<param>` | 401 (Credential 欠落) | `trace-session.headers` から `password` 行を除去して送信 | `trace-http-401` | ⏳ 同上。`TouchUserService` へ到達する前に `UserServiceBean#authenticate` が失敗。 |
| `trace_http_500` | `GET /karte/pid/INVALID,%5Bdate%5D` | 500 (NumberFormatException) | `trace-session.headers` | `trace-http-500` | ⏳ `KarteServiceBean` へ到達する前に `LogFilter` 認証が失敗。 |

- `ops/tests/api-smoke-test/test_config.manual.csv` と `rest_error_scenarios.manual.csv` に同シナリオを追記済み。400/401/500 ケースは `Checklist #49/#73/#74` のカバレッジと紐付け、再実行手順を `expected_status` / `notes` に明文化した。
- `ops/tools/send_parallel_request.sh` は `--profile <compose|modernized-dev|legacy-only|remote-dev|custom>` で `send_parallel_request.profile.env.sample` を読み込めるようになった。`modernized-dev` は helper コンテナなど Docker ネットワーク上で `opendolphin-server(-modernized-dev)` へ直アクセスする用途。ホストから直接叩く場合は `compose` を使用し、どうしても `modernized-dev` を使う場合は `/etc/hosts` へ名前解決を追記する。

### 4.1 実行ログとブロッカー

- `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/legacy|modern/`  
  - `meta.json` / `headers.txt` / `response.json` を保存済み。`legacy` 側は Modernized URL へフォールバックさせて出力フォーマットを共通化した。
- `artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/legacy_build.log`  
  - `docker compose -f docker-compose.yml up -d db server` で Legacy イメージを再構築した際の失敗ログ。`org.wildfly.extension.micrometer` が WildFly 10.1 には存在せず、`configure-wildfly.cli` が適用できないことを記録。
- `artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/modern_server_full.log`  
  - Modernized 側 `/user/doctor1` 実行時に `relation "d_users" does not exist` で `SessionOperation` が 500 になったスタックトレースを保存。`d_users` / `d_facility` 等の初期データ投入が無いと 200/400/401 ケースは実行できない旨を記載。

> **次ステップ:** `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` を参照して `d_users` ほかテストデータを `db-modernized` と `db` の双方に投入し、`trace_http_400`〜`trace_http_500` を再実行。完了後は本ファイルと `domain-transaction-parity.md` を更新し、Checklist #49/#73/#74 をクローズする。

## 5. 2025-11-09 実行ログ（Compose=local, RUN_ID=20251109T060930Z）
- HTTP 証跡: `artifacts/parity-manual/TRACEID_JMS/20251109T060930Z/trace_http_{200,400,401,500}/`
- WildFly ログ: `artifacts/parity-manual/TRACEID_JMS/20251109T060930Z/logs/modern_trace_http_*.log`

| ケース | 期待 | Legacy | Modernized | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 | 200 | 200 | Trace ID は modernized のみ INFO 出力（Legacy LogFilter には未実装）。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 400 | **500** | **500** | Modernized が `UnknownEntityException: AuditEvent`。Legacy も 500 HTML。 |
| `trace_http_401` (`GET /touch/user/...`) | 401 | **500** | **500** | Modernized ログに `Remote user does not contain facility separator`。Legacy は 500 HTML。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 | 200 | 400 | Legacy が例外を握り潰し 200。Modernized は JSON デコードエラーを 400 で返却。 |

### 5.1 追加メモ / TODO
1. JMS ログは今回のケースでは発生せず。`/20/adm/factor2/*` や Touch 送信系の Trace 採取が必要。
2. Legacy 側の Trace ID 表示を `LogFilter` へ追加するまで、Legacy HTTP での可視化は未達。
3. `dolphin/activity` と `touch/user` の 500 化により `rest_error_scenarios.manual.csv` も 400/401 を記録できていない。アプリ修正後、同 RUN_ID フォルダへ差分を上書きする。

## 5.2 2025-11-10 追記: RUN_ID=20251110T035118Z（`--profile modernized-dev`）
- HTTP 証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T035118Z/trace_http_{200,400,401,500}/`
- CLI ログ: `artifacts/parity-manual/TRACEID_JMS/20251110T035118Z/logs/send_parallel_request.log`

観測:
- `send_parallel_request.sh --profile modernized-dev` をローカルホスト上で実行すると、Docker Desktop / WSL2 連携が無効なため `opendolphin-server` / `opendolphin-server-modernized-dev` の名前解決に失敗し、全ケースが `curl: (6) Could not resolve host`（`status=000`, `exit=6`）で終了した。
- 同環境では `docker ps` すら実行できず、WSL から Docker Engine へ接続できない (`The command 'docker' could not be found in this WSL 2 distro.`)。よって `server-modernized-dev` コンテナの WildFly ログ取得や `d_audit_event` 連携確認も行えない。

TODO / 対応案:
1. Windows 側の Docker Desktop で当該 WSL ディストリビューションとの統合を有効化し、`docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d` で `opendolphin-server(-modernized-dev)` 名前解決が成立する状態を作る。
2. もしくはホスト側で `compose` プロファイルを利用し `BASE_URL_{LEGACY,MODERN}=http://localhost:{8080,9080}/openDolphin/resources` に切り替える（`TRACEID_JMS_RUNBOOK.md` §3.2 参照）。`modernized-dev` を引き続き使う場合は `/etc/hosts` や VPN ルータで `opendolphin-server*` を名前解決させる。
3. 環境復旧後に `docker logs opendolphin-server-modernized-dev | rg traceId=` を再取得し、`TRACE_PROPAGATION_CHECK.md` の 5.1 表に 4xx/5xx の最新ステータスを反映する。
