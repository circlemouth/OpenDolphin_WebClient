# Mac Docker Recovery Playbook（Docker Desktop 前提）

- 作成日: 2026-06-16
- 対象: macOS (Apple Silicon / Intel) + Docker Desktop 利用者が、Legacy (`opendolphin-server`) と Modernized (`opendolphin-server-modernized-dev`) を同時起動し、Trace Harness / JPQL ログ / 監査証跡を再取得するための手順。
- 参照ドキュメント: [`POSTGRES_BASELINE_RESTORE.md`](POSTGRES_BASELINE_RESTORE.md), [`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md`](LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md), [`TRACE_PROPAGATION_CHECK.md`](../notes/TRACE_PROPAGATION_CHECK.md), [`domain-transaction-parity.md`](../notes/domain-transaction-parity.md)

## 0. Scope / 前提
1. macOS 13 以降、Docker Desktop 4.29 以降を使用する。Rosetta 2 / Hypervisor.framework を有効化済みであること。
2. リポジトリを `/Users/<user>/Documents/OpenDolphin_WebClient`（任意）へ clone 済みで、`git status` が clean であること。
3. ネットワーク要件:
   - `localhost:8080`（Legacy HTTP）、`localhost:9080`（Modernized HTTP）、`localhost:5432`（Postgres Legacy）、`localhost:55432`（Postgres Modernized）を使用。別プロセスで占有されていないことを `lsof -i :8080` 等で確認。
   - Docker Desktop の Kubernetes は **無効** にしておく（ポート競合防止）。
4. 想定する主な環境変数:
   | 変数 | 既定値 | 用途 |
   | --- | --- | --- |
   | `PROJECT_NAME` | `legacy-vs-modern` | `scripts/start_legacy_modernized.sh` が付与する compose プロジェクト名 |
   | `BASE_URL_LEGACY` | `http://localhost:8080/openDolphin/resources` | `ops/tools/send_parallel_request.sh` |
   | `BASE_URL_MODERN` | `http://localhost:9080/openDolphin/resources` | 同上 |
   | `PARITY_OUTPUT_DIR` | `artifacts/parity-manual` | HTTP/JPQL 証跡の保存先 |
   | `PARITY_HEADER_FILE` | `tmp/trace-headers/*.headers` | 追加ヘッダー |
   | `PARITY_BODY_FILE` | シナリオ毎に指定 | `PUT /appo` 等のボディ |
   | `SEND_PARALLEL_REQUEST_PROFILE_FILE` | `ops/tools/send_parallel_request.profile.env.sample` | `--profile compose` 用テンプレート |
5. 監査証跡の保存先: `artifacts/parity-manual/{JPQL,TRACEID_JMS,<domain>}/$RUN_ID/` に統一。RUN_ID は `date -u +%Y%m%dT%H%M%SZ` で生成する。

## 1. Docker Desktop 設定（Mac）
1. **Hypervisor とリソース割当**  
   - Docker Desktop > Settings > General で「Use Virtualization Framework」を有効化。Intel Mac は「Use Rosetta for x86/amd64 emulation」を ON。  
   - Settings > Resources で最低 6 CPU / 8 GiB RAM / 2 GiB Swap / 60 GiB Disk を割り当てる。`scripts/start_legacy_modernized.sh start --build` は Maven ビルドを含むため CPU が 4 未満だと 30 分以上かかる。
2. **File Sharing**  
   - Settings > Resources > File Sharing にリポジトリルート（例: `/Users/<user>/Documents/OpenDolphin_WebClient`）を追加。  
   - 追加後に Docker Desktop を再起動し、`docker run --rm -v "$PWD":/repo busybox ls /repo` が成功することを確認。
3. **CLI 準備**  
   - `brew install jq gnu-sed coreutils` を実行し、`/opt/homebrew/bin`（または `/usr/local/bin`）が PATH に入っていること。  
   - `~/.docker/config.json` に `{"credsStore":"desktop"}` がある場合、そのままで良い。
4. **ネットワーク確認**  
   - `docker network ls | grep legacy-vs-modern_default` が存在しないことを確認（再実行時は `docker network rm legacy-vs-modern_default` で初期化可）。  
   - VPN クライアントが `localhost` ループバックをフィルタしないよう、必要に応じてスプリットトンネルを設定。
5. **証跡フォルダの事前作成**  
   ```bash
   mkdir -p artifacts/parity-manual/{JPQL,TRACEID_JMS,appo,schedule,letter,lab,stamp}/placeholder \
     tmp/trace-headers tmp/trace
   ```
   - `placeholder` ディレクトリは空で良い。権限を `chmod -R 755 artifacts/parity-manual` で調整しておく。

## 2. `scripts/start_legacy_modernized.sh start --build`
1. **クリーンアップ（必要時）**
   ```bash
   ./scripts/start_legacy_modernized.sh down || true
   docker system prune -f
   ```
2. **ビルド & 起動**
   ```bash
   export PROJECT_NAME=${PROJECT_NAME:-legacy-vs-modern}
   ./scripts/start_legacy_modernized.sh start --build | tee artifacts/parity-manual/logfilter/$(date -u +%Y%m%dT%H%M%SZ)/start.log
   ```
   - WildFly のビルドログは `tmp/legacy-compose/server/target` 以下に生成される。エラー時は `./scripts/start_legacy_modernized.sh logs server` / `... server-modernized-dev` で切り分ける。
3. **稼働確認**
   ```bash
   docker compose -p ${PROJECT_NAME} ps
   curl -f http://localhost:8080/openDolphin/resources/serverinfo/jamri
   curl -f http://localhost:9080/openDolphin/resources/serverinfo/jamri
   ```
   - いずれかが失敗した場合、`docker compose -p ${PROJECT_NAME} logs db{,-modernized}` を採取し `artifacts/parity-manual/logfilter/<UTC>/` へ保存。
4. **ネットワーク/環境変数確認**
   ```bash
   docker network inspect ${PROJECT_NAME}_default | rg '"Name": "opendolphin'
   printf "BASE_URL_LEGACY=%s\nBASE_URL_MODERN=%s\n" \
     "${BASE_URL_LEGACY:-http://localhost:8080/openDolphin/resources}" \
     "${BASE_URL_MODERN:-http://localhost:9080/openDolphin/resources}"
   ```

## 3. `POSTGRES_BASELINE_RESTORE.md` Mac 補足
1. **psql の入手**  
   ```bash
   brew install libpq
   echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
   ```
2. **Legacy/Modernized DB のベースライン適用**  
   ```bash
   TS=$(date -u +%Y%m%dT%H%M%SZ)
   docker compose -p ${PROJECT_NAME} exec db psql -U opendolphin -d opendolphin_modern \
     -f ops/db/local-baseline/local_synthetic_seed.sql \
     | tee artifacts/parity-manual/db-restore/${TS}/legacy_seed.log

   docker compose -p ${PROJECT_NAME} exec db-modernized psql -U opendolphin -d opendolphin_modern \
     -f ops/db/local-baseline/local_synthetic_seed.sql \
     | tee artifacts/parity-manual/db-restore/${TS}/modern_seed.log
   ```
3. **Flyway（モダナイズ側）**
   ```bash
   docker run --rm --network container:opendolphin-postgres-modernized \
     -v "$PWD/server-modernized/tools/flyway":/flyway-host \
     -e FLYWAY_URL=jdbc:postgresql://localhost:5432/opendolphin_modern \
     -e FLYWAY_USER=opendolphin -e FLYWAY_PASSWORD=opendolphin \
     flyway/flyway:10.17 -configFiles=/flyway-host/flyway.conf migrate \
     | tee artifacts/parity-manual/db-restore/${TS}/flyway_migrate_modern.log
   ```
4. **検証**  
   ```bash
   docker compose -p ${PROJECT_NAME} exec db psql -U opendolphin -c "\dt"
   docker compose -p ${PROJECT_NAME} exec db-modernized psql -U opendolphin -c "\dt"
   ```
   - 結果を `artifacts/parity-manual/db-restore/${TS}/\*.log` に保存。  
   - 詳細フローやトラブル時の切り戻しは `POSTGRES_BASELINE_RESTORE.md` セクション 0〜4 を参照。

## 4. API 投入～証跡保存
1. **ヘッダープロファイル生成**
   ```bash
   cp ops/tests/api-smoke-test/headers/trace-session.headers tmp/trace-headers/trace_http_200.headers
   gsed -i '' 's/X-Trace-Id:.*/X-Trace-Id: trace-http-200/' tmp/trace-headers/trace_http_200.headers
   # 他ケースも同様に作成
   ```
2. **Trace Harness（HTTP/JMS）**
   ```bash
   RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
   export PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}
   export SEND_PARALLEL_REQUEST_PROFILE_FILE=ops/tools/send_parallel_request.profile.env.sample
   ops/tools/send_parallel_request.sh --profile compose --loop 1 GET /serverinfo/jamri trace_http_200
   ops/tools/send_parallel_request.sh --profile compose --loop 1 GET "/dolphin/activity/2025,04" trace_http_400
   ops/tools/send_parallel_request.sh --profile compose --loop 1 GET "/schedule/pvt/2025-11-09" trace-schedule-jpql
   PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json \
     ops/tools/send_parallel_request.sh --profile compose --loop 1 PUT /appo trace-appo-jpql
   ```
   - 実行ログ: `artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/send_parallel_request.log`
   - `trace-appo-jpql` など JMS を伴うケースは `logs/modern_trace_*.log` に `traceId=` 行を追記。
3. **JPQL ケース**
   ```bash
   RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
   export PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/${RUN_ID}
   for svc in patient karte schedule appo; do
     export PARITY_HEADER_FILE=tmp/trace/jpql-${svc}-${RUN_ID}.headers
     cp tmp/trace-headers/trace_session.headers "$PARITY_HEADER_FILE"
     gsed -i '' "s/X-Trace-Id:.*/X-Trace-Id: jpql-${svc}-${RUN_ID}/" "$PARITY_HEADER_FILE"
     case "$svc" in
       appo)
         PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json \
           ops/tools/send_parallel_request.sh --profile compose PUT /appo "trace-${svc}-jpql"
         ;;
       schedule)
         ops/tools/send_parallel_request.sh --profile compose GET /schedule/pvt/2025-11-09 "trace-${svc}-jpql"
         ;;
       patient)
         ops/tools/send_parallel_request.sh --profile compose GET /patient/id/0000001 "trace-${svc}-jpql"
         ;;
       karte)
         ops/tools/send_parallel_request.sh --profile compose GET /karte/pid/0000001,2024-01-01 "trace-${svc}-jpql"
         ;;
     esac
   done
   scripts/jpql_trace_compare.sh artifacts/parity-manual/JPQL/${RUN_ID}
   ```
4. **監査ログ / DB 差分**
   ```bash
   docker compose -p ${PROJECT_NAME} exec db \
     psql -U opendolphin -d opendolphin_modern \
     -c "select * from d_audit_event order by event_time desc limit 200" \
     > artifacts/parity-manual/JPQL/${RUN_ID}/d_audit_event.legacy.log

   docker compose -p ${PROJECT_NAME} exec db-modernized \
     psql -U opendolphin -d opendolphin_modern \
     -c "select * from d_audit_event order by event_time desc limit 200" \
     > artifacts/parity-manual/JPQL/${RUN_ID}/d_audit_event.modern.log
   ```
5. **成果物整理**
   - `artifacts/parity-manual/JPQL/${RUN_ID}/README.md` に以下を記録: 実行日時 / コマンド / TraceId / 既知ブロッカー / `d_audit_event` 取得結果。
   - `artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/README.md` に HTTP ケースのサマリと `docker ps` 出力を記載。
   - `domain-transaction-parity.md` 付録A と `PHASE2_PROGRESS.md`（フェーズ4欄）へ RUN_ID とステータスを転記。

## 5. 失敗時の切り戻し
1. **コンテナ強制停止**
   ```bash
   ./scripts/start_legacy_modernized.sh down || docker compose -p ${PROJECT_NAME} down -v
   ```
2. **ボリューム削除**
   ```bash
   docker volume ls | awk '/legacy-vs-modern/ {print $2}' | xargs -r docker volume rm
   ```
3. **Docker Desktop 再起動**
   - メニューから Quit Docker Desktop → 再起動。`docker info` が復旧するまで待機。
4. **証跡確保**
   - 失敗時の `logs/*.log`, `docker compose` 出力を `artifacts/parity-manual/logfilter/<UTC>/failure/` に保存し、再実行の Runbook（本書および `domain-transaction-parity.md` §3.3）へリンク。
5. **再チャレンジ条件**
   - `docker compose -p ${PROJECT_NAME} ps` が全サービス `Exit 0` 以外で停止していない。
   - Postgres が `psql` で接続可能（`select 1;`）。  
   - 記録済み RUN_ID を `docs/server-modernization/phase2/planning/phase2/DOC_STATUS.md` に `Retry` として記入。Docker が復旧したら `domain-transaction-parity.md` 付録A.2 を更新してリトライする。
