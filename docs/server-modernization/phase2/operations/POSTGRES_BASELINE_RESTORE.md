# Legacy / Modernized Postgres ベースライン復旧手順（2025-11-08）

- 作成: Worker #2 (Codex)
- 目的: facility_num シーケンスや 2FA/監査テーブルが欠損した Postgres を Secrets 保管のベースライン DDL から復旧し、JMS / CLAIM / TRACE 系検証を再開できる状態へ戻す。
- 関連 Runbook: [`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md`](LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md), [`TRACE_PROPAGATION_CHECK.md`](TRACE_PROPAGATION_CHECK.md), [`FACTOR2_RECOVERY_RUNBOOK.md`](FACTOR2_RECOVERY_RUNBOOK.md)
- 証跡: `artifacts/parity-manual/db-restore/20251108/`（DDL 所在・欠損オブジェクト一覧・調査ログ）

## 0. Secrets / VPN 受領フロー（2025-11-08 追記）

1. **VPN/Secrets の存在確認**  
   - Ops から配布されている VPN プロファイル（`ops-vpn`）で接続した状態で `ls ~/Secrets` を実行し、`legacy-server/db-baseline/`・`server-modernized/db-baseline/` ディレクトリが見えることを確認する。  
   - `~/Secrets` が存在しない場合は Secrets ストレージがマウントされていない状態であり、`artifacts/parity-manual/db-restore/<UTC>/baseline_search.log` に結果を記録したうえで Ops/DBA へ連絡する（例: 2025-11-08 版 `.../20251108T062436Z/baseline_search.log`）。
2. **ダンプ取得リクエスト**  
   - RACI は `docs/server-modernization/phase2/notes/ops-observability-plan.md` の Ops 行を参照。Slack `#ops-db` もしくはチケットで以下を伝える: 対象（Legacy/Modernized）、必要ファイル、用途（Gate #40）、期限、証跡保存先。  
   - 受領した暗号化 ZIP は `~/Secrets/<category>/` に展開し、`shasum -a 256` を `artifacts/.../investigation.log` に転記する。権限は `chmod 600` を維持する。
3. **未入手時の扱い**  
   - ダンプを取得できないまま手順を進めるのは不可。`PHASE2_PROGRESS.md` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` に「Secrets 未取得」の旨と依頼日時を記載し、Ops 側のトラッキング ID を明示する。  
   - 2025-11-08 時点では Secrets が未配布のため Modernized 側は `flyway` で `relation "appointment_model" does not exist` となり、Gate を閉じられない状況である。
4. **2025-11-08T07:43Z 追記（再試行ログ）**  
   - `ls ~/Secrets` が `No such file or directory` で終了した事例を `artifacts/parity-manual/db-restore/20251108T074337Z/investigation.log` に記録。Ops/DBA 依頼テンプレ（要求ファイル・Gate #40 期限・証跡保存先を列挙）は `artifacts/parity-manual/db-restore/20251108T062436Z/baseline_search.log:6` へ追記済み。  
   - Secrets 受領待ちの間は `docker compose` / `psql` / `flyway` を実行せず、Runbook/Checklist/Progress へブロッカーとして残す。

## 1. 前提と責務

1. **Secrets 取得**: Legacy/Modernized いずれのベースライン DDL もリポジトリには含まれていない。Ops/DBA から Secrets Storage 配下の以下ファイルを受領してローカルに配置する。
   - `legacy-server/db-baseline/opendolphin-legacy-schema.sql`
   - `legacy-server/db-baseline/opendolphin-legacy-seed.sql`
   - `server-modernized/db-baseline/opendolphin-modern-schema.sql`
2. **ツール**: `docker compose`, `docker exec`, `psql`, `flyway`（`server-modernized/tools/flyway/flyway.conf` を利用）、`rg`, `jq`。
3. **環境変数**: `.env` に定義された `POSTGRES_*` / `MODERNIZED_POSTGRES_*` を利用する。CLI で直接指定する場合は表 1 を参照。
4. **権限**: コンテナ内で `psql -U opendolphin` を実行できること。Flyway 実行ユーザーは `flyway_schema_history` 作成権限が必要。
5. **ゲート定義**:
   - `LEGACY_MODERNIZED_CAPTURE_RUNBOOK` の手順 2（サーバー起動）へ進む前に本 Runbook の Legacy/Modernized 両セクションが完了していること。
   - `TRACE_PROPAGATION_CHECK`・JMS/CLAIM 送信チェックは `d_audit_event` および `d_factor2_*` の存在を確認済みであることを Gate とする。

| サービス | コンテナ名 | 既定 DB 名 / ユーザー |
| --- | --- | --- |
| Legacy Postgres | `opendolphin-postgres` | `POSTGRES_DB` / `POSTGRES_USER`（既定: `opendolphin`） |
| Modernized Postgres | `opendolphin-postgres-modernized` | `MODERNIZED_POSTGRES_DB` / `MODERNIZED_POSTGRES_USER`（既定: `opendolphin_modern` / `opendolphin`） |

## 2. 資材所在チェックリスト

| No. | 内容 | 所在 / コマンド | 備考 |
| --- | --- | --- | --- |
| 1 | DDL/シードの所在一覧 | `artifacts/parity-manual/db-restore/20251108/ddl_inventory.md` | Secrets から取得したファイルと、リポジトリ内に存在する Flyway 差分のリスト。 |
| 2 | 欠損テーブル/シーケンス | `artifacts/parity-manual/db-restore/20251108/missing_objects.md` | facility_num, d_audit_event, d_factor2_* など不足オブジェクトと復旧先の対応表。 |
| 3 | 調査ログ | `artifacts/parity-manual/db-restore/20251108/investigation.log` | 参照したドキュメント・スクリプトのメモ。Runbook 更新時は同ログへ追記する。 |
| 4 | 実測ログ（2025-11-08 UTC 06:24） | `artifacts/parity-manual/db-restore/20251108T062436Z/` | Compose up/down、`psql`、`flyway`、Secrets 探索ログ（`baseline_search.log`）と README を保存。`flyway` の失敗理由を書き起こした。 |

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

### 3.2 ベースライン DDL の投入
1. Secrets から取得した `opendolphin-legacy-schema.sql` をコンテナへコピー。
   ```bash
   docker cp ~/Secrets/legacy-server/db-baseline/opendolphin-legacy-schema.sql \
     opendolphin-postgres:/tmp/legacy-schema.sql
   ```
2. `psql -f` で流し込み。
   ```bash
   docker exec -i opendolphin-postgres psql \
     -U ${POSTGRES_USER:-opendolphin} \
     -d ${POSTGRES_DB:-opendolphin} \
     -f /tmp/legacy-schema.sql
   ```
3. facility_num シーケンス確認。
   ```bash
   docker exec -i opendolphin-postgres psql -U ${POSTGRES_USER:-opendolphin} -d ${POSTGRES_DB:-opendolphin} \
     -c "\ds+ facility_num" && \
   docker exec -i opendolphin-postgres psql -U ${POSTGRES_USER:-opendolphin} -d ${POSTGRES_DB:-opendolphin} \
     -c "SELECT nextval('facility_num') AS preview;"
   ```
   - 既存施設がある環境で再投入する場合は、最新の facility_id から +1 した値で `ALTER SEQUENCE facility_num RESTART WITH <n>;` を忘れずに実行する。

### 3.3 テーブルシードの投入
1. `opendolphin-legacy-seed.sql` を `/tmp/legacy-seed.sql` としてコピーし、`psql -f` で投入。
2. `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` の JSONL 例を使って患者データを追加入力する場合は、スクリプト実行後に `SELECT count(*) FROM patient_model WHERE facility_id='1.3.6.1.4.1.9414.72.103';` で検証。
3. CLAIM/JMS 依存テーブルを確認。
   ```bash
   docker exec -i opendolphin-postgres psql -U ${POSTGRES_USER:-opendolphin} -d ${POSTGRES_DB:-opendolphin} \
     -c "SELECT relname FROM pg_class WHERE relname IN ('claim_item','diagnosis_module') ORDER BY relname;"
   ```

### 3.4 Runbook / チェックリスト更新
- `artifacts/parity-manual/db-restore/20251108/legacy_psql.log` に `psql -f` の標準出力を保存。
- `PHASE2_PROGRESS.md` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`（フェーズ2）へ Legacy 側ベースライン完了を追記。

### 3.5 2025-11-08 実測ログ
- `artifacts/parity-manual/db-restore/20251108T062436Z/psql_dt_legacy.log`: `d_users` / `d_audit_event` / `d_factor2_*` を含む 50+ テーブルが `opendolphin-postgres` に存在することを確認。
- `psql_count_d_users_legacy.log`, `psql_count_d_audit_event_legacy.log`, `psql_count_d_factor2_credential_legacy.log`: レコード件数（`d_users=5`, `d_audit_event=0`, `d_factor2_credential=0`）を取得済み。
- `psql_nextval_facility_num_legacy.log` / `psql_setval_facility_num_legacy.log`: `SELECT nextval('facility_num')` でシーケンスを確認し、直後に `SELECT setval('facility_num', 103);` で元の値へ戻した操作を記録。

## 4. Modernized Postgres 復旧手順

### 4.1 ベースライン適用
1. Modernized 用 DB を起動。
   ```bash
   docker compose -f docker-compose.modernized.dev.yml up -d db-modernized
   ```
2. スキーマ初期化（状況に応じて）:
   ```bash
   docker exec -i opendolphin-postgres-modernized psql \
     -U ${MODERNIZED_POSTGRES_USER:-opendolphin} \
     -d ${MODERNIZED_POSTGRES_DB:-opendolphin_modern} \
     -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'
   ```
3. Secrets 保管の `opendolphin-modern-schema.sql` をコピー＆適用。
   ```bash
   docker cp ~/Secrets/server-modernized/db-baseline/opendolphin-modern-schema.sql \
     opendolphin-postgres-modernized:/tmp/modern-schema.sql

   docker exec -i opendolphin-postgres-modernized psql \
     -U ${MODERNIZED_POSTGRES_USER:-opendolphin} \
     -d ${MODERNIZED_POSTGRES_DB:-opendolphin_modern} \
     -f /tmp/modern-schema.sql
   ```

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
   flyway -configFiles=server-modernized/tools/flyway/flyway.conf -locations=filesystem:server-modernized/tools/flyway/sql baseline
   flyway -configFiles=server-modernized/tools/flyway/flyway.conf -locations=filesystem:server-modernized/tools/flyway/sql migrate
   ```
   - `baselineOnMigrate=true` だが、Secrets 由来 DDL を入れ直した直後は必ず `baseline` → `migrate` の順で実行し、`flyway_schema_history` に `version=0`（baseline）と `2/3/220/221` のレコードを残す。
   - `V0002` 実行時に `pg_trgm` 拡張を作成するため、Postgres の `shared_preload_libraries` に依存せず適用可能。

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
- Secrets 未取得のまま `docker compose -f docker-compose.modernized.dev.yml up -d db-modernized` を実行し、`opendolphin-postgres-modernized` へ `psql -c "\dt"` を投げた結果は `Did not find any relations.`（`psql_dt_modernized.log`）。`d_users` / `d_audit_event` / `d_factor2_*` への `SELECT COUNT(*)` はすべて `relation ... does not exist` で失敗（`psql_count_*.log`）。
- `flyway` はコンテナ版を使用:  
  ```bash
  docker run --rm \
    --network container:opendolphin-postgres-modernized \
    -v "$PWD/server-modernized/tools/flyway/sql":/flyway/sql \
    -v "$PWD/server-modernized/tools/flyway/flyway.conf":/flyway/conf/flyway.conf \
    -e DB_HOST=localhost -e DB_PORT=5432 \
    -e DB_NAME=opendolphin_modern -e DB_USER=opendolphin -e DB_PASSWORD=opendolphin \
    flyway/flyway:10.17 -configFiles=/flyway/conf/flyway.conf migrate
  ```
  - `flyway_migrate.log`: `V0002__performance_indexes.sql` 適用時に `ERROR: relation "appointment_model" does not exist (SQLSTATE 42P01)` で停止。ベースライン DDL を投入しない限り `flyway` は進まないことを確認。
  - `psql_flyway_schema_history.log`: `<< Flyway Schema Creation >>` と `0001 baseline tag` のみが記録されており、以降のバージョンが登録されていない状態を保存。
- 次アクション: Secrets から `opendolphin-modern-schema.sql` を受領後に `psql -f` → `flyway baseline/migrate` を再実行し、同ディレクトリに成功ログ（`legacy_psql.log`, `modern_psql.log`, `flyway_migrate_success.log`）を追加する。

## 5. Flyway / Dump 再作成
- 調査や修正後に新しいベースラインを作り直す場合は `server-modernized/tools/flyway/scripts/export-schema.sh` を使用して `pg_dump --schema-only` を取得し、Secrets Storage の `server-modernized/db-baseline/` に再配置する。`DB_SSLMODE` の既定は `require` なので、ローカル DB へ出力する際は `DB_SSLMODE=prefer` を指定する。
- Legacy 側も同様に `pg_dump --schema-only --no-owner` で出力し、Ops が管理する `legacy-server/db-baseline/` に保存する。医療データを含む `--data-only` ダンプは Secrets 共有フォルダ外へ持ち出さないこと。

## 6. Gate 判定と後続タスク
1. **Gate: DB 復旧完了**  
   - Legacy/Modernized 両方で `psql` の代表クエリに成功し、`flyway_schema_history` に `0,2,3,220,221` のレコードが存在すること。
   - `facility_num` シーケンスから `nextval` が取得でき、`SystemServiceBean` で施設作成 API が成功すること。
2. **Gate: 監査ログ採取準備**  
   - `d_audit_event` への `INSERT` が `psql` で手動確認できること（例: `INSERT INTO d_audit_event (...) VALUES (...) RETURNING id;`）。
   - `TRACE_PROPAGATION_CHECK` のケース ID を `ops/tools/send_parallel_request.sh` で再実行し、`artifacts/parity-manual/TRACEID_JMS/` に追記できる状態であること。
3. **Gate: JMS/CLAIM**  
   - `ops/tools/jms-probe.sh`（または `MessagingGateway` 経由 API）を実行する前に本 Runbook 手順を完了し、`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` の Gate 表に「DB ベースライン復旧済み」という行を追加する。

## 7. 連絡フロー
- ベースライン DDL の取得や Secrets の更新が必要な場合は、`docs/server-modernization/phase2/notes/ops-observability-plan.md` の RACI 表に従い、Ops DBA へ事前申請する。
- 復旧結果は `PHASE2_PROGRESS.md`（フェーズ2アップデート節）と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ2項目へリンクを記載し、証跡ディレクトリを明記する。
