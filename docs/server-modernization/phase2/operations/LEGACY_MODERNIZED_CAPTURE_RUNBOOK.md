# Legacy / Modernized 並列キャプチャ Runbook

> **方針**: Legacy サーバーは電子カルテ機能の参照用であり、運用予定はない。Modernized サーバーは新 Web クライアントとの連携だけを必須条件とし、旧クライアント互換は対象外。以下の手順は Modernized×Web クライアント連携の安定化を最優先とし、Legacy での再現は比較が必要な場合のみ実施する。特に Gate 判定は Modernized 側の成功だけで完了とする。

- 更新日: 2025-11-07
- 担当: Worker #1 (Codex)
- 対象: チェックリスト #25（Codex 向け環境構築スクリプト検証）/#26（docker-compose 依存関係明文化）の Gate
- 参照: [`PHASE2_PROGRESS.md`](../PHASE2_PROGRESS.md), [`SERVER_MODERNIZED_DEBUG_CHECKLIST.md`](../SERVER_MODERNIZED_DEBUG_CHECKLIST.md)

## 0. リンクと証跡

- **実行ログ**: `artifacts/parity-manual/setup/20251107T234615Z/`
  - `setup_codex_env.log`: CRLF 行末状態のまま `./scripts/setup_codex_env.sh` を実行した際の失敗ログ（shebang が `bash\r` となり動作不可）
  - `setup_codex_env_nonroot.log`: `bash scripts/setup_codex_env.sh` の実行で `set: pipefail^M` による失敗を記録
  - `setup_codex_env_unix_nonroot.log`: LF 変換済みコピーを root 未使用で実行し、root 権限必須エラーを確認
  - `compose_services.txt` / `compose_profiles.txt`: `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml config --services/--profiles` の CLI 出力
- **環境変数テンプレ**: `ops/tools/send_parallel_request.profile.env.sample`
- **DB ベースライン Gate**: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md`（節 6）および最新証跡 `artifacts/parity-manual/db-restore/20251119TbaselineFixZ1/`（`docker exec ... psql` fallback、`pg_dump --schema-only` 代替、`flyway/flyway:10.17 info`, README）を参照し、キャプチャ手順に入る前の必須 Gate とする。旧ログ `artifacts/parity-manual/db-restore/20251109T200035Z/` も比較用途で保持。
- **PK 揃え済み→再取得待ち**: `ops/db/local-baseline/local_synthetic_seed.sql` で `WEB1001` の `d_karte.id=10` を固定し、`docker exec opendolphin-postgres-modernized psql -c "INSERT ..."`→`DELETE id=6`→`SELECT setval('opendolphin.hibernate_sequence',10,true);` で Modern DB を調整済み。Legacy/Modern 双方の `d_karte` を `docker exec opendolphin-postgres(-modernized) psql -c "SELECT id, patientId ..."` で採取し、結果は `artifacts/parity-manual/db/20251111T062323Z/karte_id_check.txt` に保存した。Docker 再デプロイと parity RUN_ID 更新は後続タスク。

## 1. 前提条件と権限

### 1.1 CLI / OS 要件

| 要素 | 必須バージョン/備考 |
| --- | --- |
| OS | Linux (WSL2 など) で root/sudo 取得可能であること |
| `docker` / `docker compose` | Docker Engine 24 以降、Compose v2.40.3 で動作確認済み |
| Runtime | Bash 5.x、`curl`, `jq`, `rg`, `tar`, `unzip` |
| Python | **実行禁止**（プロジェクト規約） |

### 1.2 `scripts/setup_codex_env.sh` 実行要件

1. **改行コードの修正必須**: リポジトリの `scripts/*.sh` は CRLF 行末でコミットされており、そのままでは `set: pipefail^M` や shebang 解決エラーで停止する。以下いずれかで LF 化してから実行する。  
   ```bash
   # 一時的に LF 変換したコピーで動作させる例（権限確認用）
   tr -d '\r' < scripts/setup_codex_env.sh > /tmp/setup_codex_env.sh
   chmod +x /tmp/setup_codex_env.sh
   sudo /tmp/setup_codex_env.sh
   ```  
   永続的に利用する場合は `dos2unix scripts/setup_codex_env.sh`（推奨）または `.gitattributes` で `eol=lf` を指定する。
2. **root 権限が必須**: `require_root` で `EUID=0` を強制。`sudo` または root シェルが必須。
3. **ネットワークとパッケージ権限**:
   - `apt-get update` と `apt-get install openjdk-17-jdk wget curl tar unzip ca-certificates` を実行
   - `/opt/apache-maven-3.9.6` への展開、および `/usr/local/bin/mvn` シンボリックリンクの書き換え
   - `/etc/profile.d/opendolphin-java.sh` を生成し `JAVA_HOME` を永続化
   - `~/.m2/repository` へ `AppleJavaExtensions.jar` / `iTextAsian.jar` を `install:install-file` で登録
   - `server-modernized` 依存解決のため `mvn -pl server-modernized -am package -DskipTests`
4. **ネットワーク疎通確認**: `https://repo.maven.apache.org/maven2/` への `curl -Iv`（最大 5 秒）でエラーログを `/tmp/codex-curl-maven.log` に保存。
5. **クリーンアップ**: スクリプトは一時 POM (`.pom.server-modernized.*.xml`) を生成し EXIT トラップで削除する。途中失敗時は `/tmp` に残るため、再実行前に削除する。

### 1.3 Compose / CLI だけでの運用条件

- GUI を使用せず、すべて `docker compose`・`curl`・`ops/tools/send_parallel_request.sh` 等で操作する。
- 証跡（ログ・設定ファイル）は `artifacts/parity-manual/` 配下に UTC Timestamp 付きで保存する。
- `scripts/start_legacy_modernized.sh` も CRLF のため、そのままでは動作しない。`dos2unix` するか、以下のようにオンザフライで LF 変換して実行する。  
  ```bash
  bash <(tr -d '\r' < scripts/start_legacy_modernized.sh) status
  ```

## 2. docker-compose 構成と起動順序

### 2.1 サービス一覧

| サービス | Compose ファイル | `depends_on` | 公開ポート / ヘルスチェック | 備考 |
| --- | --- | --- | --- | --- |
| `db` | `docker-compose.yml`, `ops/base/docker-compose.yml` | なし | `5432`（`POSTGRES_PORT`）、`pg_isready` で監視 | 旧サーバーと共有する PostgreSQL |
| `server` | `docker-compose.yml` | `db` (`service_healthy`) | `8080/9990`（`APP_HTTP_PORT`/`APP_ADMIN_PORT`） | WildFly 10 旧サーバー。`custom.properties` をマウント |
| `db-modernized` | `docker-compose.modernized.dev.yml` | なし | `55432`→`5432`、`pg_isready` | モダナイズ専用 Postgres ボリューム `postgres-data-modernized` |
| `server-modernized-dev` | `docker-compose.modernized.dev.yml` | `db-modernized` (`service_healthy`) | `9080/9995`（`MODERNIZED_APP_HTTP_PORT`/`MODERNIZED_APP_ADMIN_PORT`） | WildFly 33。`healthcheck` で `/openDolphin/resources/dolphin` を `SYSAD_*` ヘッダー付きでポーリング |

### 2.2 推奨起動手順

1. **プロジェクト名の決定**（例 `legacy-vs-modern`）。複数検証を並列で行わない場合は既定値のままでよい。
2. **DB 群を先に起動**  
   ```bash
   docker compose -p legacy-vs-modern \
     -f docker-compose.yml \
     -f docker-compose.modernized.dev.yml \
     up -d db db-modernized
   docker compose -p legacy-vs-modern ps
   ```
   両 DB の `State` が `running (healthy)` になるまで待機。
3. **アプリケーションを順次起動**  
   ```bash
   docker compose -p legacy-vs-modern \
     -f docker-compose.yml \
     -f docker-compose.modernized.dev.yml \
     up -d server server-modernized-dev
   ```
4. **ヘルスチェック確認**  
   ```bash
   curl -sf -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
        -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
        http://localhost:${APP_HTTP_PORT:-8080}/openDolphin/resources/dolphin

   curl -sf -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
        -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
        http://localhost:${MODERNIZED_APP_HTTP_PORT:-9080}/openDolphin/resources/dolphin
   ```
5. **停止/撤去**  
   - 停止のみ: `docker compose -p legacy-vs-modern ... stop`
   - 完全撤去: `docker compose -p legacy-vs-modern ... down --volumes`

### 2.3 フォールバックと切替パターン

- **旧/新片側のみ起動したい場合**:  
  - Modernized のみ: `docker compose --profile modernized up -d server-modernized-dev`
  - 旧サーバーのみ: `docker compose up -d server`
- **`scripts/start_legacy_modernized.sh` の利用**:  
  - `dos2unix scripts/start_legacy_modernized.sh` 実施後、`./scripts/start_legacy_modernized.sh start --build` で一括起動。  
  - `--build` は `server`/`server-modernized-dev` を再ビルドするため、Maven キャッシュ (`~/.m2`) がセットアップ済みであることが前提。
- **ヘルスチェック失敗時**:  
  1. `docker compose logs -f server-modernized-dev` で WildFly 起動ログを確認  
  2. `docker compose restart db-modernized server-modernized-dev` で再投入  
  3. DB 健全性が戻らない場合は `docker volume rm legacy-vs-modern_postgres-data-modernized` 後に再起動し、必要なら初期データを再投入
- **証跡採取**: 重要な CLI 出力は `artifacts/parity-manual/setup/<UTC>/` に `tee` で保存する。Runbook 冒頭のログを参照。

### 2.4 Flyway/Seed Refresh Gate（letter/lab/stamp）

- `server-modernized/tools/flyway/sql/V0225__letter_lab_stamp_tables.sql` と `ops/db/local-baseline/local_synthetic_seed.sql` を適用して紹介状/ラボ/スタンプ系の欠損を解消する際は、以下の順番を厳守する。詳細コマンドは `server-modernized/tools/flyway/README.md` に記載。  
  1. **Flyway migrate**: `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace flyway/flyway:10.17 -configFiles=server-modernized/tools/flyway/flyway.conf migrate` を実行し、`flyway_schema_history` に version 0225 を登録する（`d_letter_module*` / `d_nlabo_module*` / `d_nlabo_item*` / `d_stamp_tree*` を作成）。  
  2. **Seed 再投入**: Legacy (`db`)/Modernized (`db-modernized`) の両 Postgres に `psql -f ops/db/local-baseline/local_synthetic_seed.sql` を流し込み、`id=8` の紹介状、`id=9101/9201/9202` のラボデータ、`id=9` のスタンプツリーを復元する。  
  3. **再デプロイと parity 取得**: `scripts/start_legacy_modernized.sh down && start --build` → `ops/tools/send_parallel_request.sh --profile compose --case {letter,lab,stamp}` の順に再実行して証跡を更新する。Docker コンテナの再起動や send_parallel_request の実行自体はホスト担当者が行うため、開発コンテナ内ではファイル更新と手順書作成に留め、次担当者へ「再デプロイ待ち」である旨を共有する。  
- 上記が完了するまで `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`・`docs/server-modernization/phase2/PHASE2_PROGRESS.md`・`docs/server-modernization/phase2/notes/domain-transaction-parity.md` には「Flyway/seed 追加を実施、Docker 再デプロイ待ち」と明記し、Docker 側の適用が完了したら RUN_ID を更新する。

### 2.5 Diagnosis Seed Refresh Gate（診断監査・Claim parity）

- `POST /karte/diagnosis/claim` をトリガーに `d_audit_event`／JMS／HTTP を採取するタスクでは、**キャプチャ前に毎回 `tmp/diagnosis_seed.sql` を Legacy / Modernized 双方へ再投入すること**。`F001/doctor1` の患者・カルテ・診断エントリと `hibernate_sequence`／`opendolphin.d_diagnosis_seq` を既知レンジ（>=9002000）へ戻し、監査ログの欠損や ID 衝突を防止する。代表的な証跡: `artifacts/parity-manual/messaging/20251118TdiagnosisAuditZ2/`（RUN_ID=`20251118TdiagnosisAuditZ2`）。
1. **Legacy reseed**  
   ```bash
   docker exec -i opendolphin-postgres bash -lc '
     set -euo pipefail
     cd /workspace
     psql -U opendolphin -d opendolphin -f tmp/diagnosis_seed.sql \
       | tee artifacts/parity-manual/messaging/${RUN_ID:-diagnosis_seed}/logs/legacy_diagnosis_seed.log
   '
   ```
   - `tee` 出力を `artifacts/parity-manual/messaging/<case>/<RUN_ID>/logs/` へ保存し、`d_patient/d_karte/d_diagnosis` の初期化行数と `setval` 実行結果を記録する。
2. **Modernized reseed**  
   ```bash
   docker exec -i opendolphin-postgres-modernized bash -lc '
     set -euo pipefail
     cd /workspace
     psql -U opendolphin -d opendolphin -f tmp/diagnosis_seed.sql \
       | tee artifacts/parity-manual/messaging/${RUN_ID:-diagnosis_seed}/logs/modern_diagnosis_seed.log
   '
   ```
   - Modernized 側でも `d_audit_event` の `actor_id` / `patient_id` が Legacy と一致することを後段の取得結果で確認する。
3. **整合性チェック**  
   reseed 後に `docker exec opendolphin-postgres psql -U opendolphin -d opendolphin -c "SELECT id, diagnosis_code, started, status FROM d_diagnosis ORDER BY id DESC LIMIT 3;"` を実行し、`9002***` レンジへの更新と `status=F`（固定値）を記録する。Modernized でも同クエリを実行し、差分があれば Runbook へ記録する。併せて `SELECT last_value FROM hibernate_sequence;` / `SELECT last_value FROM opendolphin.d_diagnosis_seq;` を両環境で採取し、`>=9002000` を Gate 通過条件とする。
4. **Gate 閉塞条件**  
   `tmp/diagnosis_seed.sql` の適用ログと整合性チェック結果を `PHASE2_PROGRESS.md` および作業チケットへリンクしない限り、本 Gate を閉じて次フェーズ（診断監査取得）へ進めない。`TRACE_RUN_ID` ごとに再実施し、未実施の場合は `artifacts/parity-manual/messaging/<RUN_ID>/README.md` へ TODO を明記する。
5. **helper ラッパーで診断 Claim を送信**  
   reseed 直後に `ops/tools/helper_send_parallel_request.sh` を使用して `/karte/diagnosis/claim` を投入する。helper サービスは `docker-compose.modernized.dev.yml` の `profiles: [modernized-dev]` に定義されており、`mcr.microsoft.com/devcontainers/base:jammy` イメージを `/workspace` へマウントしたまま待機している。`COMPOSE_FILE=docker-compose.modernized.dev.yml` をセットしてラッパーを呼び出すと `docker compose --profile modernized-dev run --rm helper ...` が内部で実行され、`TRACE_RUN_ID` / `PARITY_OUTPUT_DIR` を自動採番する。RUN_ID を固定したい場合は `TRACE_RUN_ID` もしくは `TRACE_RUN_SUFFIX` を明示する。
   ```bash
   PARITY_HEADER_FILE=tmp/parity-headers/diagnosis_TEMPLATE.headers \
   PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json \
   TRACE_RUN_ID=${TRACE_RUN_ID:-20251118TdiagnosisAuditZ2} \
     ops/tools/helper_send_parallel_request.sh \
       --helper-case messaging -- \
       --profile compose POST /karte/diagnosis/claim messaging_diagnosis
   ```
   - 出力は `artifacts/parity-manual/messaging/<TRACE_RUN_ID>/` 配下に `legacy|modern` / `logs/` を自動作成して保存される。`--helper-case` で `messaging` 以外の case を切り替え可能。
   - helper 実行ログには決定した RUN_ID が表示されるため、後続の `d_audit_event` 取得や README 記載では同じ値を使用する。
   - Compose ファイルから helper サービスが外れている場合や別環境でテストする場合は、自動的に `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace mcr.microsoft.com/devcontainers/base:jammy ...` へフォールバックする。ネットワーク名・イメージは `HELPER_FALLBACK_NETWORK` / `HELPER_FALLBACK_IMAGE` で上書き可能。
   - 疎通確認のみを行いたい場合は `HELPER_INNER_COMMAND=echo ops/tools/helper_send_parallel_request.sh -- helper_compose_ok` のように `HELPER_INNER_COMMAND` を差し替え、RUN_ID=`20251119ThelperComposeEchoZ1`（compose 経路）や `20251119ThelperFallbackEchoZ1`（フォールバック経路）のログを参考に CLI 実行可否だけを確認する。
6. **`d_audit_event` を TraceId で採取**  
   helper 実行時の `X-Trace-Id`（例: `parity-diagnosis-send-${TRACE_RUN_ID}`）で Legacy / Modernized 双方の監査行を抽出し、Gate 2.5 の証跡をクローズする。
   ```bash
   TRACE_RUN_ID=${TRACE_RUN_ID:-20251118TdiagnosisAuditZ2}
   TRACE_ID="parity-diagnosis-send-${TRACE_RUN_ID}"
   for target in opendolphin-postgres opendolphin-postgres-modernized; do
     LABEL=$([[ "$target" == opendolphin-postgres ]] && echo legacy || echo modern)
     docker exec -i "$target" bash -lc "
       set -euo pipefail
       cd /workspace
       psql -U opendolphin -d opendolphin \
         -F '\t' -A \
         -c \"SELECT id, trace_id, actor_id, patient_id, event_type, created FROM d_audit_event WHERE trace_id='${TRACE_ID}' ORDER BY id\" \
         > artifacts/parity-manual/messaging/${TRACE_RUN_ID}/logs/d_audit_event_diagnosis_${LABEL}.tsv
     "
   done
   ```
   - Legacy/Modernized で採取した TSV を README と Runbook にリンクし、`actor_id`／`patient_id`／`event_type` の一致を Gate 完了条件として記録する。
   - `tmp/diagnosis_seed.sql` → helper → `d_audit_event` の 3 ステップは 1 RUN_ID 内で連続実行し、欠けた場合は `artifacts/parity-manual/messaging/<RUN_ID>/README.md` に TODO として残す。

## 3. GUI なしでの並列キャプチャ実行

1. **環境変数の読み込み**  
   ```bash
   # 必要な profile/URL 定義（後述テンプレート）を読み込む
   source ops/tools/send_parallel_request.profile.env.sample
   ```
2. **Legacy/Modernized 双方の URL を確認**  
   `echo $BASE_URL_LEGACY`, `echo $BASE_URL_MODERN` で `/openDolphin/resources` の完全 URL が設定されていることを確認。
3. **共通ヘッダー・リクエストファイルを準備**  
   - 追加ヘッダー: `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/default.txt`
   - リクエストボディ: `PARITY_BODY_FILE=/tmp/request.json`（必要時）
   - Legacy/Modernized 共通で doctor1 を利用する場合は `userName: 1.3.6.1.4.1.9414.72.103:doctor1 / password: 632080fabdb968f9ac4f31fb55104648 (MD5)` をヘッダーに指定し、`clientUUID`, `facilityId`, `X-Trace-Id` をケースごとに差し替える。`tmp/parity-headers/<case>_<RUN_ID>.headers` をテンプレート化しておくと便利。
4. **CLI 送信 (`ops/tools/send_parallel_request.sh`)**  
   - 事前に `dos2unix ops/tools/send_parallel_request.sh`（または `bash <(tr -d '\r' < ops/tools/send_parallel_request.sh)`）を実施。  
   ```bash
   BASE_URL_LEGACY=${BASE_URL_LEGACY:-http://localhost:8080/openDolphin/resources} \
   BASE_URL_MODERN=${BASE_URL_MODERN:-http://localhost:9080/openDolphin/resources} \
   PARITY_OUTPUT_DIR=artifacts/parity-manual \
     bash <(tr -d '\r' < ops/tools/send_parallel_request.sh) GET /serverinfo/version trace-check
   ```
   - `legacy`/`modern` それぞれの応答が `artifacts/parity-manual/<ID>/legacy|modern/` に蓄積される。
5. **ログ採取**  
   - `docker compose logs server-modernized-dev | rg traceId=` などの出力も `artifacts/parity-manual/setup/<UTC>/` に保存する。
   - Host から `localhost` へ到達できない場合は前述の §3.1（Compose ネットワーク経由）を利用する。
   - Host から `localhost` へ到達できない場合は §3.1（Compose ネットワーク経由での CLI 実行）を利用する。

### 3.1 Compose ネットワーク経由での CLI 実行（buildpack-deps:curl）

WSL やリモート CLI から `localhost:{8080,9080}` へ到達できない場合は、Compose ネットワーク上に helper コンテナを立てて CLI を実行する。

```bash
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
CASE=appo
docker run --rm --network legacy-vs-modern_default \
  -v "$PWD":/workspace -w /workspace buildpack-deps:curl \
  bash -lc 'set -euo pipefail
    BASE_URL_LEGACY="http://server:8080/openDolphin/resources"
    BASE_URL_MODERN="http://server-modernized-dev:8080/openDolphin/resources"
    PARITY_HEADER_FILE="/workspace/tmp/parity-headers/${CASE}_${RUN_ID}.headers"
    PARITY_BODY_FILE="/workspace/ops/tests/api-smoke-test/payloads/appo_cancel_sample.json"
    PARITY_OUTPUT_DIR="/workspace/artifacts/parity-manual/${CASE}/${RUN_ID}"
    ops/tools/send_parallel_request.sh PUT /appo appo_put'
```

- `server` / `server-modernized-dev` は Compose のデフォルトネットワーク名。コンテナから見ると `localhost` ではなくこのホスト名を使う。
- 出力先はホスト側と共有しているため、`artifacts/parity-manual/<case>/<RUN_ID>/` に legacy/modern のレスポンスが保存される。

### 3.2 StampTree PUT 事前同期フロー（First Commit Win 回避）

`StampServiceBean#getNextVersion`（`server/src/main/java/open/dolphin/session/StampServiceBean.java:42-96`）は保持している `versionNumber` が DB 側と一致した場合のみ `+1` を許容するため、固定 payload のまま `PUT /stamp/tree` を送ると常に `First Commit Win Exception`（Legacy=500）となる。Parity 取得や再現試験では以下の順序で version を同期してから PUT を実行する。

1. **最新ツリーを取得**:  
   ```bash
   RUN_ID=${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}
   USER_PK=${USER_PK:-9001}
   for TARGET in legacy modern; do
     BASE_URL=$([ "$TARGET" = legacy ] && echo "$BASE_URL_LEGACY" || echo "$BASE_URL_MODERN")
     curl -sS -H @tmp/parity-headers/stamp_${RUN_ID}.headers \
       "$BASE_URL/stamp/tree/${USER_PK}" \
       | tee "artifacts/parity-manual/stamp/${RUN_ID}/${TARGET}/stamp_tree_get.json" >/dev/null
   done
   ```
   `personalTree.versionNumber` と `personalTree.id` を控え、`treeBytes` をそのまま次ステップへ渡す。
2. **payload へ反映**: `tmp/parity-letter/stamp_tree_payload.json` の `id`／`userModel.id`／`versionNumber`／`treeBytes` を GET 結果で上書きし、`publishedDate` など日付フィールドも差分があれば同期する。`jq` を使う場合は `jq '.personalTree | {id,versionNumber,treeBytes}' ...` で抜き出す。
3. **PUT/sync を送信**: `ops/tools/send_parallel_request.sh --profile compose PUT /stamp/tree parity-stamp-${RUN_ID}` を実行する（`syncTree` 版も同 payload を利用）。この時点で Legacy は 200 を返し、Modernized 側は `treeBytes` bytea マッピングを修正済みであれば 200 になる。応答 ID / version は `artifacts/parity-manual/stamp/${RUN_ID}` に追記し、`rest_error_scenarios.manual.csv` の `rest_error_stamp_data_exception` 行へ RUN_ID を記録する。
4. **差分メモ**: version 更新後に別セッションが PUT を実行する場合、再度 §3.2 の GET からやり直す。`StampManagementPage.tsx`（Web クライアント）も同じフローで `versionNumber` を同期するため、Runbook と UI で手順が乖離しないよう README へリンクを追加する。

### 3.3 `rest_error_{letter_fk,lab_empty,stamp_data_exception}` Audit/JMS 再取得（2025-11-11 更新）
1. **コード反映後の初期化**  
   `scripts/start_legacy_modernized.sh start --build` で Legacy / Modernized 両サーバーを再デプロイし、WildFly の healthcheck が 200 になるまで待機する。以降の CLI はすべて同一 RUN_ID（例: `RUN_ID=20251111TrestfixZ`）で統一する。
2. **`d_audit_event_id_seq` の整合性確保**  
   各 Postgres コンテナで以下を実行し、バックアップ・LOCK・`setval`・検証行挿入を一括で行う（`TRACEID_JMS_RUNBOOK.md §5.3` 参照）。ログファイルは後段 Evidence として利用する。  
   ```bash
   RUN_ID=${RUN_ID:-20251111TrestfixZ}
   mkdir -p artifacts/parity-manual/db/${RUN_ID}/{modern,legacy}
   docker exec opendolphin-postgres-modernized bash -lc '
     cd /workspace
     psql -U opendolphin -d opendolphin_modern \
       -v audit_event_backup_file="/tmp/d_audit_event_before_seq_reset_${RUN_ID}.csv" \
       -v audit_event_validation_log="/tmp/d_audit_event_seq_validation_${RUN_ID}.txt" \
       -v audit_event_status_log="/tmp/d_audit_event_seq_status_${RUN_ID}.txt" \
       -f ops/db/local-baseline/reset_d_audit_event_seq.sql'
   '
   docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_before_seq_reset_${RUN_ID}.csv artifacts/parity-manual/db/${RUN_ID}/modern/audit_event_backup.csv
   docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_seq_validation_${RUN_ID}.txt artifacts/parity-manual/db/${RUN_ID}/modern/audit_event_validation_log.txt
   docker cp opendolphin-postgres-modernized:/tmp/d_audit_event_seq_status_${RUN_ID}.txt artifacts/parity-manual/db/${RUN_ID}/modern/audit_event_status_log.txt
   ```
   Legacy 側も `docker cp ... artifacts/parity-manual/db/${RUN_ID}/legacy/` 以下へコピーし、ファイル名を `audit_event_*` で統一する。
   Legacy 側も同じコマンドで取得し、`artifacts/parity-manual/db/${RUN_ID}/` に `_legacy` サフィックス付きで保管する。
3. **REST ケースの送信**  
   `tmp/parity-headers/{letter,lab,stamp}_${RUN_ID}.headers` を複製し、`ops/tools/send_parallel_request.sh --profile modernized-dev` で `rest_error_{letter_fk,lab_empty,stamp_data_exception}` を順番に送信する。`PARITY_OUTPUT_DIR=artifacts/parity-manual/<case>/${RUN_ID}` を忘れず指定し、`logs/send_parallel_request.log` に 3 ケースすべての traceId を残す。
4. **Audit / JMS ログ採取**  
   - `docker compose exec db-{legacy,modern} psql ... "select * from d_audit_event where request_id='parity-<case>-<RUN_ID>' order by id"` を `logs/d_audit_event_{legacy,modern}.txt` に保存。
   - `docker compose exec opendolphin-server-modernized-dev /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands='/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource' > logs/jms_dolphinQueue_read-resource.txt` を実施。
   - Legacy 側は `standalone/log/server.log` から `TRACEID=<case>` を含む行を抽出し `logs/legacy_trace.log` にまとめる。
5. **ドキュメント反映**  
   取得した HTTP/Audit/JMS/Evidence を `TRACE_PROPAGATION_CHECK.md`, `PHASE2_PROGRESS.md`, `domain-transaction-parity.md`, `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` にリンク。`logs/d_audit_event_{legacy,modern}.txt` が 0 行の場合は原因（例: `SEQ_SMOKE` 挿入失敗）を `artifacts/parity-manual/<case>/${RUN_ID}/README.md` に記載し、再採取条件を残す。

### 3.4 Legacy JMS before/after ログ採取（2025-11-12 追加）

フェーズ4-2「Legacy JMS queue messages-added=0L 継続」タスクでは、PUT/GET を投げる **前後で jboss-cli の出力を必ず 2 本ずつ** 残す。Docker ホスト上で直接 `docker exec` を叩くのではなく、helper コンテナを経由して `docker compose exec` を呼ぶ構成に統一する。

1. **Legacy queue の before/after を取得**  
   ```bash
   RUN_ID=20251112T091500Z
   CASE=stamp
   for LABEL in before after; do
     docker compose --profile modernized-dev run --rm helper bash -lc '
       set -euo pipefail
       cd /workspace
       docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec opendolphin-server \
         /opt/jboss/wildfly/bin/jboss-cli.sh \
         --connect --commands="/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource(include-runtime=true)" \
         > artifacts/parity-manual/TRACEID_JMS/'"${RUN_ID}"'/logs/'"${LABEL}"'_jms_dolphinQueue_read-resource_legacy.txt
     '
   done
   ```
   - helper は `legacy-vs-modern_default` に常時参加しているため、`--network` や `/etc/hosts` の追記は不要。
   - `LABEL=before` を REST 実行直前、`LABEL=after` を parity 実行直後に揃える。
2. **Modernized queue も同手順で採取**  
   上記スクリプトの `opendolphin-server` を `opendolphin-server-modernized-dev` に置き換え、`.../${LABEL}_jms_dolphinQueue_read-resource.txt` へ出力する。Modern 側は `messages-added` が 1 以上に増え `message-count=0L` へ戻る挙動をコメントで残す。
3. **閲覧・差分確認**  
   - `LABEL=before; rg -n 'messages-added|message-count|consumer-count' artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/${LABEL}_jms_dolphinQueue_read-resource_legacy.txt` で 0L の継続を即時確認（`LABEL=after` でも同様に実行）。
   - `diff -u logs/before_jms_dolphinQueue_read-resource_legacy.txt logs/after_jms_dolphinQueue_read-resource_legacy.txt` で変化なしを証跡化。
   - `less -N artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/{before,after}_jms_dolphinQueue_read-resource*.txt` を使えば CLI 色コードを除いたまま確認できる。
4. **Runbook / チェックリスト連携**  
   取得結果は `TRACEID_JMS_RUNBOOK.md` §4.1 のテンプレに沿って #コメントや `messages-added=0L` を残し、`PHASE2_PROGRESS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` のフェーズ4-2 backlog に「ログ取得フロー整備済み」として反映する。差分を検出した場合は同日中に Issue 化し、本節へ追記する。
5. **MDB 再起動フロー時に必ず採取するログ**（コマンド実行は禁止。マネージャー指示が出たら下記ファイルを取得済みフォルダへ追加する）
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/before_jms_dolphinQueue_read-resource_legacy.txt`
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/after_jms_dolphinQueue_read-resource_legacy.txt`
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/{before,after}_jms_dolphinQueue_read-resource.txt`（Modernized 対応）
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/legacy_mdb_restart.log`（`StampSenderMDB` 再起動 CLI の標準出力）
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/server.log`（`docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml cp opendolphin-server:/opt/jboss/wildfly/standalone/log/server.log artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/server.log` で取得。`StampSenderMDB` の `Starting/Stopping` が出力されていること）
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/jms_dolphinQueue_read-resource_legacy.txt`（再起動後の定点観測。`messages-added` と `consumer-count` をコメント追記）
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/standalone-full_dolphinQueue_snippet.txt`（`cat /opt/jboss/wildfly/standalone/configuration/standalone-full.xml | rg -n 'dolphinQueue'` の結果）
   - `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/ejb-jar_StampSenderMDB_snippet.txt`（`server/src/main/resources/META-INF/ejb-jar.xml` の `StampSenderMDB` 設定抜粋。ローカルコピーでも可）
6. **構成ファイルの diff テンプレ**
   ```bash
   mkdir -p artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config
   docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml cp \
     opendolphin-server:/opt/jboss/wildfly/standalone/configuration/standalone-full.xml \
     artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/standalone-full_after.xml
   docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml cp \
     opendolphin-server:/opt/jboss/wildfly/standalone/deployments/opendolphin.war/WEB-INF/ejb-jar.xml \
     artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/ejb-jar_after.xml
   diff -u artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/standalone-full_before.xml \
          artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/standalone-full_after.xml \
          | tee artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/standalone-full.diff
   diff -u artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/ejb-jar_before.xml \
          artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/config/ejb-jar_after.xml \
          | tee artifacts/parity-manual/TRACEID_JMS/${RUN_ID}/logs/ejb-jar.diff
   ```
   - `*_before.xml` は再起動前に採取したファイルをリネームしてから配置する。`messages-added` の変化がゼロでも `StampSenderMDB` の `destinationLookup` や `acknowledgeMode` が入れ替わっていないことを diff で確認し、結果と `server.log` の再起動時刻・`legacy_mdb_restart.log` の stop/start シーケンスを `domain-transaction-parity.md Appendix A.6` の記録列へ転記する。

## 4. `MODERNIZED_TARGET_PROFILE` / URL 切替

- `MODERNIZED_TARGET_PROFILE` は CLI ツールで参照先を切り替えるための論理名。Runbookでは以下を標準とする。

| Profile | 説明 | `BASE_URL_LEGACY` | `BASE_URL_MODERN` |
| --- | --- | --- | --- |
| `compose` (既定) | ローカル docker compose で旧/新を同時起動 | `http://localhost:8080/openDolphin/resources` | `http://localhost:9080/openDolphin/resources` |
| `modernized-dev` | `docker-compose.modernized.dev.yml` で立てた helper コンテナや CI runner から直接コンテナ名でアクセス | `http://opendolphin-server:8080/openDolphin/resources` | `http://opendolphin-server-modernized-dev:8080/openDolphin/resources` |
| `legacy-only` | Modernized を起動せず旧サーバーのみ比較ログを残す | 同上 | Modernized 側は `http://localhost:9080/openDolphin/resources`（未応答でも可） |
| `remote-dev` | Modernized をリモート環境へ切り替える | 同上 | `MODERNIZED_REMOTE_BASE_URL` で上書き |
| `custom` | 監査や再現試験用に任意 URL を指定 | 手動設定 | 手動設定 |

- プロファイルごとの環境変数定義テンプレートは `ops/tools/send_parallel_request.profile.env.sample` を参照し、`source` して利用する。

## 5. ログ・証跡整理

| ファイル | 内容 | 実行コマンド |
| --- | --- | --- |
| `setup_codex_env.log` | CRLF のまま実行して失敗した証跡（shebang 解決不可） | `./scripts/setup_codex_env.sh` |
| `setup_codex_env_nonroot.log` | `bash` 経由でも CRLF が原因で失敗することを確認 | `bash scripts/setup_codex_env.sh` |
| `setup_codex_env_unix_nonroot.log` | LF 変換済みコピーで root 権限必須エラーを確認 | `tmp/setup_codex_env.sh` |
| `compose_services.txt` | Compose で管理するサービス一覧 | `docker compose ... config --services` |
| `compose_profiles.txt` | Compose で定義されている profile（`modernized`） | `docker compose ... config --profiles` |

- **担当割当表**: ORCA API ごとの優先度と推奨担当ロールは `assets/orca-api-assignments.md` に集約しているため、証跡採取時は該当ロールのワーカーへタスクを割り当ててから RUN_ID を採番する。

並列検証では、`assets/orca-api-assignments.md` の P0（受付/予約/カルテ系: #1-18, #22, #27, #33, #35-37, #41-53）を受付・診療チームで先行し、P1（マスタ/入院・会計系: #7, #11, #19-26, #29-31, #34, #38-40, #47）を入院/会計/マスタ担当が追随、P2（バックオフィス/帳票系: #28, #32, #42-44）をバッチで確認する。各チームは担当範囲を GitHub Issue と RUN_ID ログへ明記し、重複実行を避ける。

必要に応じて `docker compose logs`, `docker compose inspect`, `ops/tools/send_parallel_request.sh --config ...` の結果も同一ディレクトリへ追記し、`PHASE2_PROGRESS.md` に証跡パスを記録する。

## 6. 既知の制約と注意事項

1. **CRLF 行末問題**: `scripts/`・`ops/tools/` 配下の Bash スクリプトは CRLF のため、必ず LF へ変換してから実行する。Runbook実績では `tr -d '\r'` で一時変換した。
2. **root 権限必須**: `scripts/setup_codex_env.sh` は `apt-get` と `/etc/profile.d` 書き込みを行うため root 不可欠。sudo 利用ができない環境では実行できない。
3. **ネットワーク制限**: Maven Central への HTTPS 接続が必須。プロキシ環境では `https_proxy` を設定する。
4. **Docker ボリュームの肥大化**: `postgres-data` / `postgres-data-modernized` は試験ごとに削除しないとディスクを圧迫する。`docker volume rm legacy-vs-modern_postgres-data*` でクリーンアップする。
5. **ログ保全**: 取得した並列キャプチャログは `artifacts/parity-manual/` 配下で日付単位に分け、`PHASE2_PROGRESS.md` へリンクを残さなければ Gate を閉じられない。

以上の前提を満たした場合、GUI を使用せず CLI のみで Legacy/Modernized 並列キャプチャ環境を再現できる。

## 7. DocumentModel/persistence + Trace Harness RUN_ID=20251110T133000Z
- DocumentModel で使われる `ModuleModel` / `SchemaModel` / `AttachmentModel` は `server-modernized/src/main/resources/META-INF/persistence.xml` に列挙済みで、`server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` によって Modernized DB に `d_document` / `d_module` / `d_image` / `d_attachment` を配置する準備が整っている。DocumentModel が参照するテーブルの欠損で生じる `UnknownEntityException` を回避するためのスキーマ基盤が構築されたが、まだ検証が完了していない。
- RUN_ID=`20251110T133000Z` で `tmp/trace_http_200.headers` を使って trace harness を再取得し、HTTP/trace/JMS/`d_audit_event` を `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` に記録する計画。`trace_http_{400,500}` は AuditTrail ID 衝突バグによって Modernized が 500 を返す既知の issue として README に記載済みで、同様の挙動を想定している。
- 次アクション: Modern WildFly を再ビルド（`mvn -pl server-modernized -DskipTests install` など）し、`docker compose -f docker-compose.modernized.dev.yml up -d db-modernized server-modernized-dev` を起動したうえで `GET /schedule/pvt/2025-11-09` を trace ヘッダー付きで実行し、HTTP 200 および `d_audit_event`/JMS TraceId を確認する。検証結果は `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` へ保存し、`PHASE2_PROGRESS.md` / `docs/server-modernization/phase2/notes/domain-transaction-parity.md` / `DOC_STATUS.md` に RUN_ID・ブロッカー・次アクションを整理したうえで次 RUN を採番する。Docker 操作が必要になった場合は一度手を止め、他ワーカーとの干渉がないことを確認してから再開する。

## 8. ホスト↔9080 障害時の暫定運用（helper コンテナ利用）

- RUN_ID=`20251111Tnetdiag3` の診断結果（`artifacts/parity-manual/network/20251111Tnetdiag3/README.txt`）の通り、`localhost:9080` では SYN 後に HTTP payload が返らない場合がある。再ビルドや Docker Desktop の再起動はマネージャー権限作業のため、本 Runbook では helper/socat による暫定アクセス手段のみ実施する。
- 事象の判定基準: `curl -v http://localhost:9080/openDolphin/resources/serverinfo/jamri` が 20〜120 秒待ちで 0 byte 応答、`tcpdump -i lo0 port 9080` が握手＋ACK のみを記録しアプリデータが戻らない、pf で 9080 関連ルールがヒットしないこと。

### 8.1 helper コンテナ経由での CLI 実行（必須運用）
1. `docker compose --profile modernized-dev up -d helper` を起動済みであることを確認。スタック構成に helper サービスが含まれていないホストでは `ops/tools/helper_send_parallel_request.sh` が自動的に `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace mcr.microsoft.com/devcontainers/base:jammy ...` へフォールバックするため、手動で `docker run ... buildpack-deps:curl` を叩くのは例外時のみ。フォールバック確認用には `HELPER_INNER_COMMAND=echo TRACE_RUN_ID=20251119ThelperFallbackEchoZ1 ops/tools/helper_send_parallel_request.sh --helper-case helper-tests --helper-service helper-missing -- helper_fallback_ok` を実行し、`helper` サービス経由（RUN_ID=`20251119ThelperComposeEchoZ1`）とのログ差分を README に記録済み。
2. 以下のように Base URL をコンテナ名に切り替えて parity CLI を実行する。
   ```bash
   RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
   docker run --rm --network legacy-vs-modern_default \
     -v "$PWD":/workspace -w /workspace buildpack-deps:curl \
     bash -lc 'set -euo pipefail
       BASE_URL_LEGACY="http://server:8080/openDolphin/resources"
       BASE_URL_MODERN="http://server-modernized-dev:8080/openDolphin/resources"
       PARITY_OUTPUT_DIR="/workspace/artifacts/parity-manual/net-check/${RUN_ID}"
       ops/tools/send_parallel_request.sh GET /serverinfo/jamri helper-net-check'
   ```
3. helper で取得した結果はホストと共有されるため、`artifacts/parity-manual/<case>/<RUN_ID>/helper/` へ保存し、`PHASE2_PROGRESS.md` と `DOC_STATUS.md` に「ホスト側ポート不通のため helper 経由で運用中」と記録する。

### 8.2 socat での代替ポート公開
- ホスト上で `socat TCP-LISTEN:19080,fork,reuseaddr TCP:localhost:9080` を起動し、クライアントには `http://localhost:19080` を案内する。
- IPv6 (::1) は LISTEN しないため、必要に応じて `socat TCP-LISTEN:19080,fork,bind=[::1] TCP:[::1]:9080` を追加で起動する。
- PID は `pgrep -x socat` で記録し、停止時は `kill <PID>`。`RUN_ID=20251111Tnetdiag3` では PID=59517 を控えた。
- socat 越しでも 9080 からアプリ応答が戻らない場合は helper 内で直接 `server-modernized-dev:8080` を叩き、アプリ層が稼働していることを確認する。

### 8.3 証跡と監査
- 9080 障害時に採取した curl/tcpdump/pf ログは `artifacts/parity-manual/network/<RUN_ID>/` へ保存し、`README.txt` に取得方法・時刻・所見を残す。次回 RUN で事象が再発した場合は同ディレクトリへ追記して比較する。
- helper/socat 経路を使ったまま本番操作を行う場合、手順書・作業チケットに「helper コンテナ経由アクセス必須」「Docker port-forward 復旧待ち」と明記し、恒久対策完了後に切り戻す。

### 8.4 `env-status-check.sh` による 8080/9080 ヘルスチェック自動化
1. RUN_ID（例: `RUN_ID=20251118TenvCheckZ1`）を宣言し、以下を実行する。Legacy/Modernized への curl、`docker compose ps`、`server`/`server-modernized-dev` ログ採取が一括で `artifacts/parity-manual/env-status/<RUN_ID>/` に保存される。  
   ```bash
   RUN_ID=20251118TenvCheckZ1
   ops/tools/env-status-check.sh \
     --run-id "$RUN_ID" \
     --legacy-note "jamri.code 未設定のため 200 でも空ボディ" \
     --modern-note "port-forward recovered on host" \
     --log-target server \
     --log-target server-modernized-dev
   ```
2. スクリプトは `userName: 9001:doctor1` / `password: doctor2025` ヘッダーで `/serverinfo/jamri` を問い合わせ、成功時は `legacy|modern.{headers,body,meta}.json`、失敗時は `*.curl.log` にタイムアウトや 4xx/5xx を残す。`--skip-legacy` / `--skip-modern` で片系のみ確認、`--max-time` で timeout 条件を調整可能。
3. 9080 が固まっている場合は本節 8.1/8.2 の helper/socat へ切り替える前に必ずスクリプトでエビデンスを採取し、`meta.json` の `notes` に「helper 経由へ切替」「port-forward 再登録待ち」等を追記する。復旧後も同一 RUN_ID で再実行することで `modern.meta.json` を同フォルダ内に補完できる。

## 9. 恒久復旧手順（Docker Desktop 再起動／pf pass 追記／VPN 切替）

> **実行権限**: Docker Desktop の再起動や pf.conf 編集はマネージャーが担当。ワーカーは文書化と確認コマンドの整備のみを行い、実操作は実施しない。

- **ネットワーク証跡テンプレ**: `artifacts/parity-manual/network/TEMPLATE/` に `pf_rules_9080.txt` ほか採取必須ファイルを配置済み。Docker port-forward を再生成する際は当ディレクトリを `cp -R .../TEMPLATE <RUN_ID>` で複製し、各ログを指示通りに上書きして証跡を残す。

### 9.0 テンプレ適用チェックリスト
1. `RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)_netrecover` を宣言し、`LOG_ROOT=artifacts/parity-manual/network/${RUN_ID}` をエクスポートする。
2. `cp -R artifacts/parity-manual/network/TEMPLATE ${LOG_ROOT}` を実行し、`README.txt`（テンプレに同梱）へ実施日・担当者を記入する。
3. `docker compose --profile helper port backend 9080 | tee ${LOG_ROOT}/docker_backend_portforward.log` を実行し、直後に `docker compose logs --tail 200 backend server-modernized-dev >> ${LOG_ROOT}/docker_backend_portforward.log` を追記する。
4. `curl -v http://localhost:9080/healthz --max-time 10 2>&1 | tee ${LOG_ROOT}/host_curl_9080.log` を取得し、VPN 状態と HTTP ステータスを冒頭コメントに書く。
5. `sudo pfctl -sr | grep -E "9080|vpnkit" | tee ${LOG_ROOT}/pf_rules_9080.txt` を取得し、pf.conf の更新有無を先頭に残す。
6. `sudo tcpdump -i lo0 port 9080 -w ${LOG_ROOT}/lo0_9080.pcap -U -G 10 -W 1` を採取し、サマリを `lo0_9080.pcap.sample.txt` として保存、`README.txt` にも HTTP 応答有無を追記する。
7. `tree ${LOG_ROOT}` と `shasum ${LOG_ROOT}/lo0_9080.pcap` を `README.txt` 末尾へ貼り付け、証跡一式をチケットへ紐付ける。
8. `docs/web-client/planning/phase2/DOC_STATUS.md` の「ネットワーク復旧」行を更新し、RUN_ID と確認済みコマンド（pfctl/curl/tcpdump/docker logs）を備考に書く。

### 9.1 再起動前の退避
1. `docker compose ps` で稼働中サービスを控える（例: `opendolphin-server`, `opendolphin-server-modernized-dev`, helper）。
2. `docker compose logs --timestamps server-modernized-dev > artifacts/.../pre-restart.log` で応答停止時刻を保存。
3. `lsof -iTCP:9080 -sTCP:LISTEN` で `com.docker.backend` / `vpnkit` が LISTEN している PID を控える。

### 9.2 Docker Desktop/vpnkit の再起動候補
1. Docker Desktop UI から `Quit Docker Desktop`（CLI の場合は `osascript -e 'quit app "Docker"'`）。
2. 念のため `pkill -f com.docker.backend` を実行し、残存プロセスを停止。
3. Docker Desktop を再起動し、`docker info` が成功するまで待つ。
4. `docker compose -f docker-compose.modernized.dev.yml up -d helper` など最小構成の再起動をマネージャーが実施。ワーカー側ではビルドや再起動を要求しない。

### 9.3 pf pass ルール案（必要時）
- 症状再発時に pf が疑われる場合、`/etc/pf.conf` のアンカーに以下を追記し、審査後に `sudo pfctl -f /etc/pf.conf` で適用する。
  ```pf
  pass in  on lo0 proto tcp from 127.0.0.1 to any port 9080 flags S/SA keep state
  pass out on lo0 proto tcp from 127.0.0.1 to any port 9080 flags S/SA keep state
  pass in  on lo0 proto tcp from ::1        to any port 9080 flags S/SA keep state
  pass out on lo0 proto tcp from ::1        to any port 9080 flags S/SA keep state
  ```
- 実施時は `/etc/pf.conf` バージョンと `pfctl -sr | grep 9080` を `artifacts/parity-manual/network/<RUN_ID>/pf_rules_9080.txt` に保存する。

### 9.4 VPN/フィルタ切替
- port-forward 復旧後に VPN が干渉しないか確認するため、VPN クライアントを一時停止 → `curl -v http://localhost:9080/...` → VPN 再接続の順で比較ログを採取。
- 社内規定で VPN を常時接続する必要がある場合は、Security チームへ相談し localhost ループバックを除外できるか確認する。

### 9.5 再起動後の確認コマンド
1. `netstat -anv | grep 9080` または `lsof -iTCP:9080 -sTCP:LISTEN` で LISTEN ソケットが `com.docker.backend` に戻っているか確認。
2. `docker compose ps helper server-modernized-dev` で port-forward 対象コンテナが Up 状態であることを確認。
3. `curl -v http://localhost:9080/openDolphin/resources/serverinfo/jamri --max-time 10` を実行し、200/JSON が返るか確認。
4. `tcpdump -i lo0 port 9080 -c 10` を短時間実行し、握手後に HTTP payload が返っていることを目視。
5. `ops/tools/send_parallel_request.sh --profile compose GET /serverinfo/version net-check` を走らせ、`artifacts/parity-manual/network/<RUN_ID>/post-restart/` にログを保存。

### 9.6 依存関係と再開条件
- Docker port-forward が復旧し `curl`/`tcpdump` で正常応答が得られるまで、`PHASE2_PROGRESS.md` には「ネットワーク復旧ブロッカー: helper コンテナ必須」と記録し、直接ホストからの parity 実行・本番反映を禁止する。
- 復旧完了後は本章の手順番号と証跡パスを `PHASE2_PROGRESS.md`・`DOC_STATUS.md` に追記し、helper/socat 運用を停止する。

## 3. GUI なしでの並列キャプチャ実行

1. **環境変数の読み込み**  
   ```bash
   # 必要な profile/URL 定義（後述テンプレート）を読み込む
   source ops/tools/send_parallel_request.profile.env.sample
   ```
2. **Legacy/Modernized 双方の URL を確認**  
   `echo $BASE_URL_LEGACY`, `echo $BASE_URL_MODERN` で `/openDolphin/resources` の完全 URL が設定されていることを確認。
3. **共通ヘッダー・リクエストファイルを準備**  
   - 追加ヘッダー: `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/default.txt`
   - リクエストボディ: `PARITY_BODY_FILE=/tmp/request.json`（必要時）
   - doctor1 を使う場合は `password: 632080fabdb968f9ac4f31fb55104648`（MD5）を指定し、`clientUUID`・`facilityId`・`X-Trace-Id` をケースごとに差し替える（`tmp/parity-headers/<case>_<RUN_ID>.headers` を利用）。Legacy は平文パスワードを受け付けない点に注意。
4. **CLI 送信 (`ops/tools/send_parallel_request.sh`)**  
   - 事前に `dos2unix ops/tools/send_parallel_request.sh`（または `bash <(tr -d '\r' < ops/tools/send_parallel_request.sh)`）を実施。  
   ```bash
   BASE_URL_LEGACY=${BASE_URL_LEGACY:-http://localhost:8080/openDolphin/resources} \
   BASE_URL_MODERN=${BASE_URL_MODERN:-http://localhost:9080/openDolphin/resources} \
   PARITY_OUTPUT_DIR=artifacts/parity-manual \
     bash <(tr -d '\r' < ops/tools/send_parallel_request.sh) GET /serverinfo/version trace-check
   ```
   - `legacy`/`modern` それぞれの応答が `artifacts/parity-manual/<ID>/legacy|modern/` に蓄積される。
5. **ログ採取**  
   - `docker compose logs server-modernized-dev | rg traceId=` などの出力も `artifacts/parity-manual/setup/<UTC>/` に保存する。

## 4. `MODERNIZED_TARGET_PROFILE` / URL 切替

- `MODERNIZED_TARGET_PROFILE` は CLI ツールで参照先を切り替えるための論理名。Runbookでは以下を標準とする。

| Profile | 説明 | `BASE_URL_LEGACY` | `BASE_URL_MODERN` |
| --- | --- | --- | --- |
| `compose` (既定) | ローカル docker compose で旧/新を同時起動 | `http://localhost:8080/openDolphin/resources` | `http://localhost:9080/openDolphin/resources` |
| `modernized-dev` | `docker-compose.modernized.dev.yml` で立てた helper コンテナや CI runner から直接コンテナ名でアクセス | `http://opendolphin-server:8080/openDolphin/resources` | `http://opendolphin-server-modernized-dev:8080/openDolphin/resources` |
| `legacy-only` | Modernized を起動せず旧サーバーのみ比較ログを残す | 同上 | Modernized 側は `http://localhost:9080/openDolphin/resources`（未応答でも可） |
| `remote-dev` | Modernized をリモート環境へ切り替える | 同上 | `MODERNIZED_REMOTE_BASE_URL` で上書き |
| `custom` | 監査や再現試験用に任意 URL を指定 | 手動設定 | 手動設定 |

- プロファイルごとの環境変数定義テンプレートは `ops/tools/send_parallel_request.profile.env.sample` を参照し、`source` して利用する。

## 5. ログ・証跡整理

| ファイル | 内容 | 実行コマンド |
| --- | --- | --- |
| `setup_codex_env.log` | CRLF のまま実行して失敗した証跡（shebang 解決不可） | `./scripts/setup_codex_env.sh` |
| `setup_codex_env_nonroot.log` | `bash` 経由でも CRLF が原因で失敗することを確認 | `bash scripts/setup_codex_env.sh` |
| `setup_codex_env_unix_nonroot.log` | LF 変換済みコピーで root 権限必須エラーを確認 | `tmp/setup_codex_env.sh` |
| `compose_services.txt` | Compose で管理するサービス一覧 | `docker compose ... config --services` |
| `compose_profiles.txt` | Compose で定義されている profile（`modernized`） | `docker compose ... config --profiles` |

必要に応じて `docker compose logs`, `docker compose inspect`, `ops/tools/send_parallel_request.sh --config ...` の結果も同一ディレクトリへ追記し、`PHASE2_PROGRESS.md` に証跡パスを記録する。

## 6. 既知の制約と注意事項

1. **CRLF 行末問題**: `scripts/`・`ops/tools/` 配下の Bash スクリプトは CRLF のため、必ず LF へ変換してから実行する。Runbook実績では `tr -d '\r'` で一時変換した。
2. **root 権限必須**: `scripts/setup_codex_env.sh` は `apt-get` と `/etc/profile.d` 書き込みを行うため root 不可欠。sudo 利用ができない環境では実行できない。
3. **ネットワーク制限**: Maven Central への HTTPS 接続が必須。プロキシ環境では `https_proxy` を設定する。
4. **Docker ボリュームの肥大化**: `postgres-data` / `postgres-data-modernized` は試験ごとに削除しないとディスクを圧迫する。`docker volume rm legacy-vs-modern_postgres-data*` でクリーンアップする。
5. **ログ保全**: 取得した並列キャプチャログは `artifacts/parity-manual/` 配下で日付単位に分け、`PHASE2_PROGRESS.md` へリンクを残さなければ Gate を閉じられない。

以上の前提を満たした場合、GUI を使用せず CLI のみで Legacy/Modernized 並列キャプチャ環境を再現できる。

## 7. DocumentModel/persistence + Trace Harness RUN_ID=20251110T133000Z
- DocumentModel で使われる `ModuleModel` / `SchemaModel` / `AttachmentModel` は `server-modernized/src/main/resources/META-INF/persistence.xml` に列挙済みで、`server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` によって Modernized DB に `d_document` / `d_module` / `d_image` / `d_attachment` が作成される。これにより DocumentModel が参照するテーブルが存在しないために発生していた `UnknownEntityException` を回避できる下地が整った。
- `tmp/trace_http_200.headers` を使って `trace_http_200` を再取得し、HTTP/Trace/JMS/`d_audit_event` を `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/` に保存（`README.md` にケース別ステータスとログ採取手順を追記）。`trace_http_{400,500}` も同 RUN_ID で再取得しており、現状は Modernized=400 / Legacy=500(400ケース)/200(500ケース) だが、`d_audit_event_id_seq` を再採番すると AuditTrail ID が衝突して Modernized も 500 になる既知バグのため README/TRACE_PROPAGATION_CHECK へ注記済み。`d_audit_event` には `traceId` カラムが無く `SYSTEM_ACTIVITY_SUMMARY` のみが蓄積される点もブロッカーとして維持する。
- 次アクション: Modern WildFly を再ビルド (`mvn -pl server-modernized -DskipTests install` など) し、`docker compose -f docker-compose.modernized.dev.yml up -d db-modernized server-modernized-dev` を起動したうえで `GET /schedule/pvt/2025-11-09` に trace ヘッダーを付与して 200/`d_audit_event`/JMS を確認。新 RUN の `TRACEID_JMS/20251110T133000Z/` にログを蓄え、`PHASE2_PROGRESS.md`/`docs/server-modernization/phase2/notes/domain-transaction-parity.md`/`DOC_STATUS.md` に結果とブロッカー（DocumentModel persistence + audit traceId）を追記した上で次の RUN を採番する。Docker 操作が必要になったら一旦手を止め、他ワーカーと干渉しないよう指示を待ってから再開する。
