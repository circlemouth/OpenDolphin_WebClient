# Legacy / Modernized 並列キャプチャ Runbook

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
- **DB ベースライン Gate**: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md`（節 6）および `artifacts/parity-manual/db-restore/20251109T200035Z/`（`psql -h localhost ...`, `flyway info`, README）を参照し、キャプチャ手順に入る前の必須 Gate とする。

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
- DocumentModel で使われる `ModuleModel` / `SchemaModel` / `AttachmentModel` は `server-modernized/src/main/resources/META-INF/persistence.xml` に列挙済みで、`server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` によって Modernized DB に `d_document` / `d_module` / `d_image` / `d_attachment` を配置する準備が整っている。DocumentModel が参照するテーブルの欠損で生じる `UnknownEntityException` を回避するためのスキーマ基盤が構築されたが、まだ検証が完了していない。
- RUN_ID=`20251110T133000Z` で `tmp/trace_http_200.headers` を使って trace harness を再取得し、HTTP/trace/JMS/`d_audit_event` を `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` に記録する計画。`trace_http_{400,500}` は AuditTrail ID 衝突バグによって Modernized が 500 を返す既知の issue として README に記載済みで、同様の挙動を想定している。
- 次アクション: Modern WildFly を再ビルド（`mvn -pl server-modernized -DskipTests install` など）し、`docker compose -f docker-compose.modernized.dev.yml up -d db-modernized server-modernized-dev` を起動したうえで `GET /schedule/pvt/2025-11-09` を trace ヘッダー付きで実行し、HTTP 200 および `d_audit_event`/JMS TraceId を確認する。検証結果は `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` へ保存し、`PHASE2_PROGRESS.md` / `docs/server-modernization/phase2/notes/domain-transaction-parity.md` / `DOC_STATUS.md` に RUN_ID・ブロッカー・次アクションを整理したうえで次 RUN を採番する。Docker 操作が必要になった場合は一度手を止め、他ワーカーとの干渉がないことを確認してから再開する。

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
