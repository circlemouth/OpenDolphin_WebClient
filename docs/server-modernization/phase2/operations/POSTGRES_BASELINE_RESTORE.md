# Legacy / Modernized Postgres ベースライン復旧手順（2025-11-08）

> **優先順位**: Modernized DB を新 Web クライアント連携用に正常化することが唯一の必須条件。旧クライアントとの接続要件は廃止。Legacy DB の再作成は参照比較や差分検証が必要なタスクに限定し、実施しない場合は本手順の「Legacy」節をスキップしてよい。

- 作成: Worker #2 (Codex)
- 目的: facility_num シーケンスや 2FA/監査テーブルが欠損した Postgres をローカル合成ベースライン（Hibernate 自動 DDL + `ops/db/local-baseline/local_synthetic_seed.sql`）で即座に復旧し、JMS / CLAIM / TRACE 系検証を継続できる状態へ戻す。
- 関連 Runbook: [`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md`](LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md), [`TRACE_PROPAGATION_CHECK.md`](TRACE_PROPAGATION_CHECK.md), [`FACTOR2_RECOVERY_RUNBOOK.md`](FACTOR2_RECOVERY_RUNBOOK.md)
- 証跡: `artifacts/parity-manual/db-restore/20251108/`（DDL 所在・欠損オブジェクト一覧・調査ログ）、`artifacts/parity-manual/db-restore/20251109T200035Z/`（`scripts/start_legacy_modernized.sh start --build` 再実行ログと `psql -h localhost ... \dt` / `SELECT count(*) FROM d_users;` / `flyway info` 証跡、README 付き）

> ⚠️ Windows/WSL2 で `docker` / `docker compose` が実行できない場合は、Docker Desktop を導入済みの Mac 手順（[Mac ホスト切替ガイド](#mac-ホスト切替ガイド)）へ即時切り替えてから本 Runbook を継続すること。

## 0. ローカルベースライン方針（2025-11-08 改訂）

1. **デフォルトはローカル合成ベースライン**  
   - Hibernate の `hibernate.hbm2ddl.auto=update`（`common/src/main/resources/META-INF/persistence.xml`）を利用し、`./scripts/start_legacy_modernized.sh start --build` を 1 回実行してテーブルを自動生成する。  
   - 生成直後に `ops/db/local-baseline/local_synthetic_seed.sql` を Legacy/Modernized の両 DB へ流し、施設・ユーザー・ロール・`facility_num` シーケンスを最小セットで投入する。  
   - その後 `flyway -configFiles=server-modernized/tools/flyway/flyway.conf baseline` → `migrate` を実行し、Repo 管理の `V0002+` スクリプト（監査/2FA/PHR 拡張）を適用する。
2. **公式 dump は任意（補完用途）**  
   - Ops/DBA から配布される `pg_dump --schema-only` 版は本番差異分析やカットオーバー・データ移行テスト時のみ利用する。Runbook では「提供済みなら読み込む／未提供ならローカル合成ベースラインで進める」という扱いに統一した。  
   - 公式 dump を投入する場合も、本手順 3 章・4 章の `flyway baseline + migrate` とシード投入を再実施してローカル環境と整合させる。
3. **証跡の残し方**  
   - 合成ベースラインを適用した際の `docker compose logs db*`、`flyway`、`psql` 出力を `artifacts/parity-manual/db-restore/<UTC>/` に保存する。  
   - 公式 dump を読み込む場合のみ、追加で `shasum` や受領チケット ID を同フォルダにメモする。

## 1. 前提と責務

1. **ローカル資材**: Secrets 依存の DDL に頼らず、リポジトリ内の下記ファイルを利用する。
   - `ops/db/local-baseline/local_synthetic_seed.sql` …… 施設/ユーザー種データ + `facility_num` シーケンス。
   - `server-modernized/tools/flyway/sql/V0002__*.sql`…… インデックス・2FA・監査などの差分スクリプト。
   - `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` …… JSONL インポート等、追加データが必要な場合の参照。
2. **ツール**: `docker compose`, `docker exec`, `psql`, `flyway`（`server-modernized/tools/flyway/flyway.conf` を利用）、`rg`, `jq`。  
   - macOS で `psql` が未導入の場合は `brew install libpq`。ネットワーク/承認制約で導入できない場合は `docker exec -e PGPASSWORD=... opendolphin-postgres bash -lc "psql -h localhost ..."` をフォールバック手段として Runbook に含める。
3. **環境変数**: `.env` に定義された `POSTGRES_*` / `MODERNIZED_POSTGRES_*` を利用する。CLI で直接指定する場合は表 1 を参照。
4. **権限**: コンテナ内で `psql -U opendolphin` を実行できること。Flyway 実行ユーザーは `flyway_schema_history` 作成権限が必要。
5. **ゲート定義**:
   - `LEGACY_MODERNIZED_CAPTURE_RUNBOOK` の手順 2（サーバー起動）へ進む前に本 Runbook の Legacy/Modernized 両セクションが完了していること。
   - `TRACE_PROPAGATION_CHECK`・JMS/CLAIM 送信チェックは `d_audit_event` および `d_factor2_*` の存在を確認済みであることを Gate とする。

### 1.1 ローカル合成ベースラインの利点

- ハンズオン当日に Ops/DBA の配布待ちを発生させず、DB 初期化（スキーマ生成 + 種データ投入）を 10 分以内で完結できる。
- `ops/db/local-baseline/local_synthetic_seed.sql` は患者データを含まないため、開発者マシン・CI へそのままコミット済み。Secrets/VPN に依存しない。
- Flyway の `baseline` をローカルで打つため、`V0220__phr_async_job.sql` などリポジトリ内の差分管理と整合し、Gate #40/#44 の証跡（`artifacts/parity-manual/db-restore/*`）も即日更新できる。

| サービス | コンテナ名 | 既定 DB 名 / ユーザー |
| --- | --- | --- |
| Legacy Postgres | `opendolphin-postgres` | `POSTGRES_DB` / `POSTGRES_USER`（既定: `opendolphin`） |
| Modernized Postgres | `opendolphin-postgres-modernized` | `MODERNIZED_POSTGRES_DB` / `MODERNIZED_POSTGRES_USER`（既定: `opendolphin_modern` / `opendolphin`） |

### Mac ホスト切替ガイド
1. Windows/WSL2 側で `docker: not found` や `Cannot connect to the Docker daemon` が発生したら、Docker Desktop を最新安定版へ更新し、「Settings > Resources > WSL Integration」で対象ディストリ（例: Ubuntu-22.04）を有効化してから `./scripts/start_legacy_modernized.sh down && ./scripts/start_legacy_modernized.sh start --build` を再実行し、`docker compose ps` / `/actuator/health` 成功ログを `artifacts/parity-manual/db-restore/<UTC>/` に保存する。
2. 上記が設備制約で実施できない場合は、Docker Desktop が利用可能な Mac ホストへリポジトリと `.env` を同期し、同コマンド列を Mac のターミナル（zsh 推奨）で再実行する。結果を `artifacts/parity-manual/db-restore/<UTC>-mac/` へ区別して保存し、`PHASE2_PROGRESS.md` および `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` から参照できるようリンクを追記する。
3. いずれの環境でも `./scripts/start_legacy_modernized.sh start` の完了と Legacy/Modernized 両 `/actuator/health` 200 応答を確認できなければ、本 Runbook の 3 章以降（`psql`, `flyway`, シード投入）へ進まない。ブロッカーが解消したら再実行し、証跡を更新する。

## 2. 資材所在チェックリスト

| No. | 内容 | 所在 / コマンド | 備考 |
| --- | --- | --- | --- |
| 1 | ローカル合成ベースライン資材 | `ops/db/local-baseline/` / `README.md` | シード SQL (`local_synthetic_seed.sql`) と適用手順。CI／開発環境で共有可。 |
| 2 | 欠損テーブル/シーケンス一覧 | `artifacts/parity-manual/db-restore/20251108/missing_objects.md` | facility_num, d_audit_event, d_factor2_* など不足オブジェクトと復旧先の対応表。ローカル合成ベースライン適用後は `Status=Recovered` へ更新する。 |
| 3 | 調査ログ | `artifacts/parity-manual/db-restore/20251108/investigation.log` | 参照したドキュメント・スクリプトのメモ。Runbook 更新時は同ログへ追記する。 |
| 4 | 実測ログ（2025-11-08 UTC 06:24） | `artifacts/parity-manual/db-restore/20251108T062436Z/` | Compose up/down、`psql`、`flyway`、ローカル合成ベースライン投入ログ（`baseline_seed.log`）を保存。`flyway` の失敗理由を書き起こした。 |

## 3. Legacy Postgres 復旧手順

### 3.1 DB の初期化
1. `docker compose -f docker-compose.yml up -d db` で `opendolphin-postgres` を起動（既存ボリュームを再利用する場合は `docker volume rm <project>_postgres-data` を事前に実行）。
2. 既存スキーマを全削除する場合:
   ```bash
   docker exec -i opendolphin-postgres psql \
     -U ${POSTGRES_USER:-opendolphin} \
     -d ${POSTGRES_DB:-opendolphin} \
     -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
   ```


### 3.2 Hibernate によるスキーマ生成
1. 既に `db` コンテナが起動している状態で、`./scripts/start_legacy_modernized.sh start --build` を実行し、Legacy サーバーを 1 度だけ起動する。`common/src/main/resources/META-INF/persistence.xml` の `hibernate.hbm2ddl.auto=update` により `d_*` テーブルが生成される。  
   - ログ例: `HHH000204: Processing PersistenceUnitInfo [name: opendolphinPU]` → `HHH000476: Executing import script 'org.hibernate.tool.schema.internal.exec.ScriptSourceInputNonExistentImpl'` → `HHH000490: Using dialect org.hibernate.dialect.PostgreSQLDialect`。  
   - Schema 生成完了を確認したら、`./scripts/start_legacy_modernized.sh stop` でサーバーのみ停止（DB コンテナはそのまま）。
2. `docker exec opendolphin-postgres psql -c "\dt d_*"` を実行し、`d_facility` / `d_users` / `d_roles` / `d_audit_event` 等が作成されていることを確認する。
3. `facility_num` シーケンスが自動生成されていない場合は、次工程のシード SQL が作成するためここでは何もしない。

#### フォールバック: Legacy schema dump を取り込む（Hibernate DDL 不可時の既定手順）
- `scripts/start_legacy_modernized.sh` の Hibernate DDL が Modernized 側で失敗、または Legacy 側を起動できず DDL を再生成できない場合は、`pg_dump --schema-only --no-owner --no-privileges` で取得した Legacy DDL を両 DB へ流し込むのを既定の Gate とする（RUN_ID=`20251119TbaselineFixZ1` 実績）。
- Legacy DB から dump を採取するコマンド例:
  ```bash
  export TS=${TS:-$(date -u +%Y%m%dT%H%M%SZ)}
  mkdir -p artifacts/parity-manual/db-restore/$TS
  docker exec -e PGPASSWORD=${POSTGRES_PASSWORD:-opendolphin} \
    opendolphin-postgres \
    pg_dump --schema-only --no-owner --no-privileges \
      -U ${POSTGRES_USER:-opendolphin} \
      -d ${POSTGRES_DB:-opendolphin} \
    > artifacts/parity-manual/db-restore/$TS/legacy_schema_dump.sql
  ```
- 取得した dump は `docker exec -i` の `psql` へ食わせ、`legacy_schema_apply.log` を証跡として保存する。ホストに `psql` が無い場合でも同じワークフローで完結できる。
  ```bash
  cat artifacts/parity-manual/db-restore/$TS/legacy_schema_dump.sql \
    | docker exec -i opendolphin-postgres \
        bash -lc "PGPASSWORD=${POSTGRES_PASSWORD:-opendolphin} psql -U ${POSTGRES_USER:-opendolphin} -d ${POSTGRES_DB:-opendolphin} -v ON_ERROR_STOP=1" \
    | tee artifacts/parity-manual/db-restore/$TS/legacy_schema_apply.log
  ```
- 同一ファイルを Modernized 側にも適用し、Legacy/Modernized の DDL 差異をゼロにしてから本節 3.3（シード）・4.2（Flyway）へ進む。Modernized への適用例は 4.1 末尾を参照。`\dt` の結果と `SELECT count(*) FROM information_schema.tables WHERE table_schema='public';` を記録し、Gate で提示する。

### 3.3 テーブルシードの投入
1. `ops/db/local-baseline/local_synthetic_seed.sql` をホスト側の `psql -h localhost` で投入し、証跡を残す。
   ```bash
   export TS=$(date -u +%Y%m%dT%H%M%SZ)
   mkdir -p artifacts/parity-manual/db-restore/$TS
   PGPASSWORD=${POSTGRES_PASSWORD:-opendolphin} \
     psql -h localhost -p ${POSTGRES_PORT:-5432} \
          -U ${POSTGRES_USER:-opendolphin} \
          -d ${POSTGRES_DB:-opendolphin} \
          -f ops/db/local-baseline/local_synthetic_seed.sql \
     | tee artifacts/parity-manual/db-restore/$TS/legacy_seed.log
   ```
   - ホストに `psql` が無い場合は `docker exec -e PGPASSWORD=${POSTGRES_PASSWORD:-opendolphin} opendolphin-postgres bash -lc "psql -h localhost -U ${POSTGRES_USER:-opendolphin} ${POSTGRES_DB:-opendolphin} -f /workspace/ops/db/local-baseline/local_synthetic_seed.sql"` で代替する。
2. 追加データが必要な場合は `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` に従い JSONL を投入し、`SELECT count(*) FROM d_patient;` 等で件数を採取する。
3. CLAIM/JMS 依存テーブル（`claim_item`, `diagnosis_module` など）が必要なタスクは、`ops/tests/api-smoke-test` の CLI で対象 API を実行してデータを生成する。直接 SQL で作り込む場合は別ファイルを用意し、本 Runbook の付録へリンクする。

#### Flyway baseline + migrate（Legacy）
```bash
export TS=${TS:-$(date -u +%Y%m%dT%H%M%SZ)}
mkdir -p artifacts/parity-manual/db-restore/$TS
docker run --rm --network container:opendolphin-postgres \
  -e DB_HOST=localhost -e DB_PORT=5432 \
  -e DB_NAME=${POSTGRES_DB:-opendolphin} \
  -e DB_USER=${POSTGRES_USER:-opendolphin} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD:-opendolphin} \
  -v "$PWD/server-modernized/tools/flyway":/flyway-host \
  flyway/flyway:10.17 \
  -configFiles=/flyway-host/flyway.conf \
  -locations=filesystem:/flyway-host/sql baseline \
  | tee artifacts/parity-manual/db-restore/$TS/flyway_baseline_legacy.log

docker run --rm --network container:opendolphin-postgres \
  -e DB_HOST=localhost -e DB_PORT=5432 \
  -e DB_NAME=${POSTGRES_DB:-opendolphin} \
  -e DB_USER=${POSTGRES_USER:-opendolphin} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD:-opendolphin} \
  -v "$PWD/server-modernized/tools/flyway":/flyway-host \
  flyway/flyway:10.17 \
  -configFiles=/flyway-host/flyway.conf \
  -locations=filesystem:/flyway-host/sql migrate \
  | tee artifacts/parity-manual/db-restore/$TS/flyway_migrate_legacy.log

docker run --rm --network container:opendolphin-postgres \
  -e DB_HOST=localhost -e DB_PORT=5432 \
  -e DB_NAME=${POSTGRES_DB:-opendolphin} \
  -e DB_USER=${POSTGRES_USER:-opendolphin} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD:-opendolphin} \
  -v "$PWD/server-modernized/tools/flyway":/flyway-host \
  flyway/flyway:10.17 \
  -configFiles=/flyway-host/flyway.conf \
  -locations=filesystem:/flyway-host/sql info \
  | tee artifacts/parity-manual/db-restore/$TS/flyway_info_legacy.log
```
- `flyway_schema_history` に `0,0001,0002,0003,0220,0221,0222,0223,0224,0225,0226,0227` が並ぶまでを Gate とし、`flyway_info_legacy.log` で 0227 まで `Success` を確認する。
- `docker exec -i opendolphin-postgres psql -c '\dt d_*'` と `SELECT count(*) FROM d_users;` を `psql_legacy_dt.log` / `legacy_table_counts.log` に採取し、`artifacts/parity-manual/db-restore/$TS/README.md` へリンクする。

### 3.4 Runbook / チェックリスト更新
- `artifacts/parity-manual/db-restore/20251108/legacy_psql.log` に `psql -f` の標準出力を保存。
- `PHASE2_PROGRESS.md` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`（フェーズ2）へ Legacy 側ベースライン完了を追記。

### 3.5 2025-11-08 実測ログ
- `artifacts/parity-manual/db-restore/20251108T062436Z/psql_dt_legacy.log`: `d_users` / `d_audit_event` / `d_factor2_*` を含む 50+ テーブルが `opendolphin-postgres` に存在することを確認。
- `psql_count_d_users_legacy.log`, `psql_count_d_audit_event_legacy.log`, `psql_count_d_factor2_credential_legacy.log`: レコード件数（`d_users=5`, `d_audit_event=0`, `d_factor2_credential=0`）を取得済み。
- `psql_nextval_facility_num_legacy.log` / `psql_setval_facility_num_legacy.log`: `SELECT nextval('facility_num')` でシーケンスを確認し、直後に `SELECT setval('facility_num', 103);` で元の値へ戻した操作を記録。

## 4. Modernized Postgres 復旧手順

### 4.1 ローカル合成ベースライン適用
1. Modernized 用 DB を起動。
   ```bash
   docker compose -f docker-compose.modernized.dev.yml up -d db-modernized
   ```
2. 必要に応じてスキーマを初期化（Legacy と同様）。
3. `./scripts/start_legacy_modernized.sh start --build` をもう一度実行し、今度は `server-modernized-dev` の起動ログで Hibernate が Modernized DB にテーブルを生成することを確認する。処理完了後に `./scripts/start_legacy_modernized.sh stop`。
4. `ops/db/local-baseline/local_synthetic_seed.sql` を Modernized DB にも投入する（Legacy と同じ TS を利用すると整理しやすい）。
   ```bash
   export TS=${TS:-$(date -u +%Y%m%dT%H%M%SZ)}
   mkdir -p artifacts/parity-manual/db-restore/$TS
   PGPASSWORD=${MODERNIZED_POSTGRES_PASSWORD:-opendolphin} \
     psql -h localhost -p ${MODERNIZED_POSTGRES_PORT:-55432} \
          -U ${MODERNIZED_POSTGRES_USER:-opendolphin} \
          -d ${MODERNIZED_POSTGRES_DB:-opendolphin_modern} \
          -f ops/db/local-baseline/local_synthetic_seed.sql \
     | tee artifacts/parity-manual/db-restore/$TS/modern_seed.log
   ```
   - `psql` が無い場合は `docker exec -e PGPASSWORD=${MODERNIZED_POSTGRES_PASSWORD:-opendolphin} opendolphin-postgres-modernized bash -lc "psql -h localhost -U ${MODERNIZED_POSTGRES_USER:-opendolphin} ${MODERNIZED_POSTGRES_DB:-opendolphin_modern} -f /workspace/ops/db/local-baseline/local_synthetic_seed.sql"` を利用する。

#### フォールバック: Legacy schema dump を Modernized へ適用
- Hibernate が Modernized DB にテーブルを展開できない場合は、節 3.2 で取得した `artifacts/parity-manual/db-restore/$TS/legacy_schema_dump.sql` をそのまま Modernized DB に適用して差分を解消する。
  ```bash
  cat artifacts/parity-manual/db-restore/$TS/legacy_schema_dump.sql \
    | docker exec -i opendolphin-postgres-modernized \
        bash -lc "PGPASSWORD=${MODERNIZED_POSTGRES_PASSWORD:-opendolphin} psql -U ${MODERNIZED_POSTGRES_USER:-opendolphin} -d ${MODERNIZED_POSTGRES_DB:-opendolphin_modern} -v ON_ERROR_STOP=1" \
    | tee artifacts/parity-manual/db-restore/$TS/modern_schema_apply.log
  ```
- 適用後に `docker exec opendolphin-postgres-modernized psql -c "\\dt d_*"` と `SELECT count(*) FROM information_schema.tables WHERE table_schema='public';` を採取し、`modern_schema_apply.log` と同じフォルダへ格納する。Legacy と Modernized で `\dt` 行数が一致しない場合は Flyway 前に再投入する。

### 4.2 Flyway baseline + migrate
1. `.env` あるいはシェルで Flyway 用環境変数を設定。
   ```bash
   export DB_HOST=localhost
   export DB_PORT=${MODERNIZED_POSTGRES_PORT:-55432}
   export DB_NAME=${MODERNIZED_POSTGRES_DB:-opendolphin_modern}
   export DB_USER=${MODERNIZED_POSTGRES_USER:-opendolphin}
   export DB_PASSWORD=${MODERNIZED_POSTGRES_PASSWORD:-opendolphin}
   ```
2. `server-modernized/tools/flyway/flyway.conf` を指定して baseline/migrate。
   ```bash
   export TS=${TS:-$(date -u +%Y%m%dT%H%M%SZ)}
   mkdir -p artifacts/parity-manual/db-restore/$TS

   docker run --rm --network container:opendolphin-postgres-modernized \
     -e DB_HOST=localhost -e DB_PORT=5432 \
     -e DB_NAME=${DB_NAME} -e DB_USER=${DB_USER} -e DB_PASSWORD=${DB_PASSWORD} \
     -v "$PWD/server-modernized/tools/flyway":/flyway-host \
     flyway/flyway:10.17 \
     -configFiles=/flyway-host/flyway.conf \
     -locations=filesystem:/flyway-host/sql baseline \
     | tee artifacts/parity-manual/db-restore/$TS/flyway_baseline_modern.log

   docker run --rm --network container:opendolphin-postgres-modernized \
     -e DB_HOST=localhost -e DB_PORT=5432 \
     -e DB_NAME=${DB_NAME} -e DB_USER=${DB_USER} -e DB_PASSWORD=${DB_PASSWORD} \
     -v "$PWD/server-modernized/tools/flyway":/flyway-host \
     flyway/flyway:10.17 \
     -configFiles=/flyway-host/flyway.conf \
     -locations=filesystem:/flyway-host/sql migrate \
     | tee artifacts/parity-manual/db-restore/$TS/flyway_migrate_modern.log

   docker run --rm --network container:opendolphin-postgres-modernized \
     -e DB_HOST=localhost -e DB_PORT=5432 \
     -e DB_NAME=${DB_NAME} -e DB_USER=${DB_USER} -e DB_PASSWORD=${DB_PASSWORD} \
     -v "$PWD/server-modernized/tools/flyway":/flyway-host \
     flyway/flyway:10.17 \
     -configFiles=/flyway-host/flyway.conf \
     -locations=filesystem:/flyway-host/sql info \
     | tee artifacts/parity-manual/db-restore/$TS/flyway_info_modern.log
   ```
   - `baselineOnMigrate=true` だが、Hibernate でスキーマを生成した直後は **必ず** `baseline` → `migrate` → `info` の順で実行し、`flyway_schema_history` に `0,0001,0002,0003,0220,0221,0222` を残す（`artifacts/parity-manual/db-restore/20251109T200035Z/flyway_info_modern.log` を参照）。
   - `flyway/flyway:10.17` イメージは Flyway バイナリを同梱しているため、ホストに Flyway をインストールできない環境でも同様の手順で証跡を残せる。

### 4.3 代表テーブル確認
```bash
docker exec -i opendolphin-postgres-modernized psql -U ${MODERNIZED_POSTGRES_USER:-opendolphin} -d ${MODERNIZED_POSTGRES_DB:-opendolphin_modern} <<'SQL'
\pset format aligned
SELECT table_name FROM information_schema.tables WHERE table_name IN (
  'd_audit_event','d_factor2_credential','d_factor2_challenge','d_third_party_disclosure','phr_async_job'
) ORDER BY table_name;
SELECT column_name FROM information_schema.columns WHERE table_name='d_document' AND column_name='admflag';
SELECT column_name FROM information_schema.columns WHERE table_name='d_module' AND column_name='performflag';
SQL
```
- 期待する行が欠けている場合は `flyway_schema_history` で失敗箇所を確認し、`flyway repair` → `migrate` を再実行。

### 4.4 施設/アカウント同期
- Legacy 側と同じ施設/ユーザーを Modernized DB に反映する場合は、Legacy から `pg_dump --data-only --table=facility_model --table=user_model` を取得して Modernized へインポートするか、`SystemServiceBean` API を Modernized サーバーに対して呼び出して生成する。facility_num シーケンスを共有しないよう注意。

### 4.5 再起動とヘルスチェック
1. `docker compose -f docker-compose.modernized.dev.yml up -d server-modernized-dev`
2. `ops/modernized-server/checks/verify_startup.sh opendolphin-server-modernized-dev` で WildFly リソースを検証。
3. `docker compose -f docker-compose.yml up -d server` で Legacy 側も起動し、`LEGACY_MODERNIZED_CAPTURE_RUNBOOK` の手順 3 以降へ遷移。

### 4.6 2025-11-08 実測ログと既知ブロッカー
- ローカル合成ベースライン実行例: `artifacts/parity-manual/db-restore/20251108T120030Z/legacy_seed.log`, `.../modern_seed.log`, `.../flyway_migrate.log`。いずれも `V0002/V0003/V0220/V0221` の完了を確認済み。
- 2025-11-09 再実演: `artifacts/parity-manual/db-restore/20251109T200035Z/` に `scripts/start_legacy_modernized.sh start --build` ログ、`psql -h localhost -U opendolphin opendolphin -c '\dt'`, `SELECT count(*) FROM d_users;`、`flyway/flyway:10.17 info`（Legacy/Modernized 両方）を保存し、README へ Gate 条件を紐付けた。
- 旧来の Secrets 依存ログ（`psql_dt_modernized.log`, `psql_count_*.log`）はレガシーな失敗事例として残しているが、現行フローでは参照のみ。必要に応じて `DOC_STATUS.md` のステータスを `Dormant` へ変更する。
- 既知ブロッカーが発生した場合は `artifacts/parity-manual/db-restore/<UTC>/blocked_actions.log` に「どのテーブル/シーケンスが存在しないか」「合成ベースラインを再適用したか」を記録し、Flyway の `repair` / `migrate` で解消する。

### 4.7 想定失敗パターンと復旧手順

| No. | 失敗パターン | 代表ログ / 証跡 | 復旧手順 |
| --- | --- | --- | --- |
| 1 | `bash: psql: command not found`（ホストに Postgres クライアント無し） | `artifacts/parity-manual/db-restore/20251109T200035Z/README.md`（備考セクション） | `brew install libpq` で導入、もしくは `docker exec -e PGPASSWORD=... opendolphin-postgres bash -lc "psql -h localhost ..."` へ切り替える。README にフォールバック経緯を必ず記載。 |
| 2 | `ERROR: relation "appointment_model" does not exist (42P01)`（Flyway `V0002`） | `artifacts/parity-manual/db-restore/20251108T062436Z/flyway_migrate.log` | `./scripts/start_legacy_modernized.sh start --build` で Hibernate に再生成させ、`ops/db/local-baseline/local_synthetic_seed.sql` を両 DB に投入後、`flyway ... baseline` → `migrate` を再実行。 |
| 3 | `Unable to obtain connection from database (Connection refused)`（Flyway コンテナ） | `blocked_actions.log` に追記 | `docker ps` で `opendolphin-postgres(-modernized)` の稼働を確認し、`--network container:<db>` で Flyway を起動。`DB_PORT` を 5432（コンテナ内部ポート）へ固定。 |
| 4 | `SELECT count(*) FROM d_users;` が 0、`facility_num` シーケンス欠損 | `artifacts/parity-manual/db-restore/20251109T200035Z/psql_modern_d_users_count.log` 等 | `ops/db/local-baseline/local_synthetic_seed.sql` を再流し、`SELECT nextval('facility_num')` → `setval` で値を戻す。Gate では Legacy/Modernized 両方で 3 件以上のユーザーを必須とする。 |

## 5. Flyway / Dump 再作成
- ローカル合成ベースラインから検証用スナップショットを作りたい場合は `server-modernized/tools/flyway/scripts/export-schema.sh` を使って `pg_dump --schema-only` を取得し、`artifacts/parity-manual/db-restore/<UTC>/` に保存する。共有が必要になったときのみ Ops へ暗号化ファイルを送付する。
- レガシー DB も同様に `pg_dump --schema-only --no-owner` で取得し、患者データを含む `--data-only` 出力は暗号化したうえでプロジェクト共有ストレージに置く（Secrets 依存とは切り離す）。

## 6. Gate 条件（開始前前提 / チェックリスト / 証跡）

### 6.1 開始前前提
- `LEGACY_MODERNIZED_CAPTURE_RUNBOOK` 手順 1〜2（Compose 起動・環境変数ロード）が完了し、`scripts/start_legacy_modernized.sh start --build` を 1 度以上成功させていること。
- `ops/db/local-baseline/local_synthetic_seed.sql` と `server-modernized/tools/flyway/sql/` が最新であること（差分があれば本 Runbook を更新してから適用）。
- `TRACE_PROPAGATION_CHECK` や JMS/CLAIM の検証担当者と着手タイミングを共有し、DB Gate 未完了のまま次工程へ進めないこと。
- Modernized 専用 Gate: Hibernate DDL が動作しない場合は節 3.2 の `pg_dump --schema-only` フォールバックを既定とし、`legacy_schema_dump.sql` / `legacy_schema_apply.log` / `modern_schema_apply.log` を生成してからシード投入・Flyway を再開する（RUN_ID=`20251119TbaselineFixZ1` 実績）。
- `brew install libpq` または `docker exec ... psql` のいずれかで `psql -h localhost` が実行可能であること（フォールバック手段含む）。

> **再起動注意 (RUN_ID=`20251120TbaselineGateZ1` → 継続検証 `20251122TbaselineGateZ2`)**
> - Postgres を停止する際は `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml down db db-modernized 2>&1 | tee artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/down.log` のようにログを `artifacts/parity-manual/db-restore/<RUN_ID>/down.log` へ残し、Gate 記録と突合できるようにする。
> - 再起動前に `export MODERNIZED_POSTGRES_PORT=55433`（Legacy 5432 と衝突させない）を設定し、`docker compose ... up -d db db-modernized` 後は `psql -h localhost -p 55433` で応答することを確認する。Gate 用の `flyway` / `pg_dump` コマンドはこのポートに固定する。
> - 2025-11-13 13:07 JST 時点では `MODERNIZED_POSTGRES_PORT=55433 docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d db db-modernized` の標準出力を `artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/up.log` に採取し、Legacy 側 5432 と Modernized 側 55433 のポート分離を実測で確認済み。Gate 用の `flyway` / `pg_dump` / `psql -h localhost` も 55433 固定で実行する。
> - `local_synthetic_seed.sql` の `LOCAL.FACILITY.0001:nurse` を含むユーザー投入が失われるため、`SELECT count(*) FROM d_users;` が 3 件に戻るまで Legacy/Modernized 両 DB へ再投入する（Gate #3 の事前条件）。
> - `flyway/flyway:10.17 baseline` を再実行する前に `DROP TABLE IF EXISTS flyway_schema_history;`（Legacy/Modernized 双方）を実施し、`FlywayException: Found non-empty schema history table` を確実に防ぐ。

### 6.2 復旧チェックリスト

| No. | チェック項目 | コマンド / 参照 | 判定基準 |
| --- | --- | --- | --- |
| 0 | Modernized フォールバック Gate | `cat legacy_schema_dump.sql \| docker exec -i opendolphin-postgres(-modernized) ... psql -v ON_ERROR_STOP=1` | `legacy_schema_dump.sql`・`legacy_schema_apply.log`・`modern_schema_apply.log` が揃い、`flyway_info_{legacy,modern}.log` で 0227 まで `Success`（Hibernate DDL 不要でも Gate OK）。 |
| 1 | Legacy DB スキーマ生成 | `psql -h localhost -U opendolphin opendolphin -c '\dt'` | `d_facility` / `d_users` / `d_audit_event` 等 50+ テーブルが表示される（`psql_legacy_dt.log`）。 |
| 2 | Modernized DB スキーマ生成 | `psql -h localhost -U opendolphin opendolphin_modern -c '\dt'` | `d_factor2_*`, `phr_async_job`, `d_document` 等を確認（`psql_modern_dt.log`）。 |
| 3 | シード投入 / 件数確認 | `SELECT count(*) FROM d_users;`（Legacy/Modernized） | 双方とも 3 件以上。0 件の場合は `local_synthetic_seed.sql` を再投入。 |
| 4 | Flyway バージョン整合 | `docker run ... flyway/flyway:10.17 info` | `flyway_schema_history` に `0,0001,0002,0003,0220,0221,0222` が `Success`。 |
| 5 | facility_num シーケンス | `SELECT nextval('facility_num');` → `SELECT setval('facility_num', <前値>, true);` | `nextval` が連番を返し、`SystemServiceBean` で施設作成 API が成功。 |
| 6 | 監査ログ書き込み | `INSERT INTO d_audit_event (...) VALUES (...) RETURNING id;` | 1 件以上挿入でき、`TRACE_PROPAGATION_CHECK` へ進む準備が整う。 |
| 7 | JMS/CLAIM 事前条件 | `ops/tools/jms-probe.sh` 実行前に本表 1〜6 を完了 | Gate #40/#44 の前提として `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` を更新済み。 |

> **実証済み (2025-11-13 / RUN_ID=`20251122TbaselineGateZ2`)**: `docker compose ... down db db-modernized` の停止ログ（`artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/down.log`）と、`MODERNIZED_POSTGRES_PORT=55433 docker compose ... up -d db db-modernized` の再起動ログ（`artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/up.log`）を取得したうえで、`ops/db/local-baseline/local_synthetic_seed.sql` を Legacy/Modernized 双方へ再投入・`LOCAL.FACILITY.0001:nurse` を復旧し、`DROP TABLE IF EXISTS flyway_schema_history;` → `flyway/flyway:10.17 baseline` → `migrate` → `info`（すべて `artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/flyway_*`）を実行。`psql_{legacy,modern}_{dt,d_users_count,public_table_count}.log` では Legacy `d_users=3`、Modernized `d_users=4` を確認し、Gate #0〜#4 の証跡を新 RUN_ID へ更新した。

### 6.3 証跡要件
- `artifacts/parity-manual/db-restore/<UTC>/` に以下を保存（2025-11-09 版は `20251109T200035Z/` に格納済み）。
  - `start_legacy_modernized_start_build.log`
  - `legacy_schema_dump.sql`, `legacy_schema_apply.log`, `modern_schema_apply.log`
  - `psql_legacy_dt.log`, `psql_modern_dt.log`, `psql_*_d_users_count.log`
  - `legacy_seed.log`, `modern_seed.log`, `legacy_table_counts.log`, `modern_table_counts.log`
  - `flyway_info_{legacy,modern}.log`（必要に応じ `flyway_baseline_modern.log` / `flyway_migrate_modern.log` も取得）
  - README（Gate 適合状況、フォールバック手段、次アクション）
- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` と `PHASE2_PROGRESS.md` に証跡フォルダと更新日を明記し、他フェーズから辿れるようリンクする。
- `TRACE_PROPAGATION_CHECK.md` / `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` の Gate 表には「DB ベースライン復旧済み（2025-11-09 証跡）」と記載し、未完了時は担当者/理由を追記する。

## 7. 連絡フロー
- Ops/DBA へ連絡が必要なのは「本番スナップショットを再取得する」「暗号化 dump を共有ストレージへ保管する」ケースのみ。通常のローカル検証では開発チーム単独で完結させる。
- 復旧結果は `PHASE2_PROGRESS.md`（フェーズ2アップデート節）と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ2項目へリンクを記載し、証跡ディレクトリを明記する。
