# 添付ファイル保存モード検証チェックリスト

## 1. 目的と範囲
- `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #L83 に記載のタスクを分解し、DB/LargeObject と S3 互換ストレージ（MinIO モック）を切り替えながら `/karte/attachment` 系 API のアップロード/ダウンロードを検証するための前提条件と手順を整理する。
- 設定および運用手順はモダナイズサーバー（WildFly 33, `docker-compose.modernized.dev.yml`）を対象とし、Legacy サーバーには適用しない。

> 2025-11-13 時点ステータス: **DB/S3 両モードで `smoke_existing_stack.sh` によるアップロード/ダウンロードが成功**。RUN_ID=`20251118TattachmentDbZ3`（database）/`20251118TattachmentS3Z3`（s3）で `AttachmentModel` の JDBC 型を `bytea` 固定化し、`hibernate.jdbc.use_streams_for_lob=false` を設定した WAR をホットデプロイ。`attachment-storage.yaml` を `/opt/jboss/wildfly/standalone/configuration/` へ差し替えて `jboss-cli :reload` → REST 200 と SHA-256 一致を確認済み。証跡: `artifacts/parity-manual/attachments/20251118Tattachment{Db,S3}Z3/`。

## 2. `attachment-storage.yaml` 必須項目
Secrets へ登録する `attachment-storage.yaml` は `server-modernized/config/attachment-storage.sample.yaml` を雛形とし、最低限以下のキーを埋める。

| キー | 必須 | 説明 | 備考 |
| --- | --- | --- | --- |
| `storage.type` | ✅ | `database` または `s3` で保存先を切替。 | 現状リポジトリ内で参照コード未確認のため、実装側での読み込み先を要確認。 |
| `storage.database.lobTable` | ✅ (database モード時) | 添付バイナリを格納する LOB テーブル名。既定値: `schema_attachment`。 | 既存 DB の `d_attachment`.`bytes` を利用する際は `schema_attachment` から `d_attachment` へ揃える必要あり。 |
| `storage.s3.bucket` | ✅ (s3 モード時) | MinIO/S3 のバケット名。例: `opendolphin-attachments`。 | テナント毎 prefix は `basePath` で調整。 |
| `storage.s3.region` | ✅ | MinIO ではダミーでも良いが、SDK が期待する値（例: `ap-northeast-1`）を設定。 |
| `storage.s3.basePath` | ✅ | `clinics/${FACILITY_ID}` など施設別パス。 | `${FACILITY_ID}` 置換要件を確認すること。 |
| `storage.s3.serverSideEncryption` / `kmsKeyId` | 任意 | サーバー側暗号化設定。 | MinIO モックでは `AES256` 固定運用を想定。 |
| `storage.s3.multipartUploadThresholdMb` | 任意 | マルチパート開始閾値 (MB)。 | 大容量 PDF を前提に 50MB 以上を推奨。 |
| `storage.s3.lifecycle.transitionToStandardIaAfterDays` | 任意 | ライフサイクル移行日数。 | 実運用では S3 側ポリシーと整合させる。 |
| `storage.s3.lifecycle.expireAfterDays` | 任意 | 自動削除までの日数。 | 例: 3650 日 (10 年)。 |

> 注意: `rg -n "attachment-storage" -g "*"` を実行してもソースコード側での参照が確認できなかったため、WildFly 起動時にこの YAML をどのように読み込むのか追加設計が必要。Secrets へ投入する前に `server-modernized` 側へバインド処理を実装すること。

### 2.1 `attachment-storage.yaml` ローダー設計と Secrets 反映フロー
- `ops/tests/storage/attachment-mode/load_config.sh`
  - 2025-11-13: `--apply` オプションを追加し、`docker compose cp` で一時ファイルを配置 → `docker compose exec --user root` で `/opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml` へ移動 → `chown jboss:jboss && chmod 600` → `jboss-cli :reload` までを自動実行するようにした。root シェルを個別に開いて `mv/chmod` する手順は不要。
  - 既定では `/opt/jboss/config/attachment-storage.yaml` を参照し、bind mount 上での差分検証も継続できる。`--target-path` 指定時も `--apply` と併用できるため、別パスへ配置したいケースでも root 操作はスクリプト内で完結する。
- 期待する実行手順:
  1. `cp ops/tests/storage/attachment-mode/templates/attachment-storage.<database|s3>.yaml tmp/attachment-storage.override.yaml` → 必須キーや Secrets を編集。
  2. `source tmp/attachment-mode/minio.env` を実行したシェルから `ops/tests/storage/attachment-mode/load_config.sh --mode <database|s3> --config tmp/attachment-storage.override.yaml --compose-file docker-compose.modernized.dev.yml --service server-modernized-dev` を実行し、`server-modernized-dev` のみリロード。MinIO など他コンテナは停止させない。
  3. `docker compose exec server-modernized-dev ls -l /opt/jboss/config/attachment-storage.yaml` と `jboss-cli.sh --commands='module list'` を用いて反映済みであることを確認。
- 2025-11-12: 既存スタックが停止中でもテンプレ差分検証だけ実施できるよう `--dry-run` オプションを追加。`docker compose cp/exec` をスキップし、`storage.type` や `storage.s3.*` キー検証と copy/reload プランのログだけを出力する。
  ```bash
  ops/tests/storage/attachment-mode/load_config.sh \
    --mode database \
    --config tmp/attachment-storage.override.yaml \
    --no-reload --dry-run
  ```
  - DB/S3 両モードで dry-run 実行済み。WARN が出る `storage.s3.*` はテンプレにコメント追記する予定（RUN_ID=`20251118TattachmentS3Z1` を参照）。
- スクリプトは `storage.type`、`storage.s3.bucket/region/basePath/accessKey/secretKey` の有無を静的に検証し、S3 モード移行時の設定漏れを CLI 実行前に検知できるようにした。
- `--no-reload` オプションで CLI リロードの抑止も可能（MinIO メンテ中に設定だけ差し替えたい場合に利用）。
- これらの操作だけでは Secrets への恒久保管にならないため、Phase7 の完了条件として「Secrets 管理ストア（Vault or SealedSecret）へ同期し、`server-modernized` 起動時に `ATTACHMENT_STORAGE_CONFIG_PATH=/opt/jboss/config/attachment-storage.yaml` を確実に指す」ことを別途記録する。

### 2.2 前段テンプレ資材（README / MinIO env / artifacts）
- `ops/tests/storage/attachment-mode/templates/attachment-storage.database.yaml` / `attachment-storage.s3.yaml`
  - DB/S3 両モードの差異（`storage.type` と `storage.s3.*`）のみを切り替える最低限の雛形。`load_config.sh --mode <mode>` を `--config` 未指定で呼び出した際のデフォルト参照先でもある。
  - `${FACILITY_ID}` プレースホルダーや `accessKey/secretKey` はテンプレに残し、`tmp/attachment-storage.override.yaml` を生成後に Run 毎の値へ上書きする。
- `tmp/attachment-mode/minio.env.example`
  - `MINIO_ROOT_*`, `ATTACHMENT_S3_*`, `MODERNIZED_APP_HTTP_PORT` など S3/MinIO CLI が共有で参照する環境変数を export 形式で集約。複製して `minio.env` を作成し、`source tmp/attachment-mode/minio.env` するだけで Secrets をシェルへ展開できる。
- `ops/tests/storage/attachment-mode/templates/README.smoke.template.md`
  - `smoke_existing_stack.sh` 実行時に `artifacts/parity-manual/attachments/<RUN_ID>/README.md` へ自動コピーされ、`RUN_ID` / `MODE_LABEL` を差し込んだチェックリストとして機能する。
  - チェック項目には `load_config` 実施可否、MinIO env 読み込み、curl ヘルスチェック結果、ハッシュ/ログ貼付パスを含め、docker 再構築禁止期間でも筆跡管理を途切れさせない。
- 2025-11-12: `smoke_existing_stack.sh` に `--run-id`（出力先固定）と `--dry-run`（REST/API 実行をスキップ）を追加済み。
  - `--dry-run` 実行時は `artifacts/parity-manual/attachments/<RUN_ID>/<MODE_LABEL>/dry-run.log` のみ生成し、README へ TODO を残す。
  - 実績: RUN_ID=`20251118TattachmentDbZ1`（MODE_LABEL=`database-preview`）、RUN_ID=`20251118TattachmentS3Z1`（MODE_LABEL=`s3-preview`）。いずれも `cli smoke:dry-run` のみ完了し、HTTP 実行は server-modernized-dev 起動待ち。

## 3. MinIO / S3 モック前提条件
- リポジトリ内に `minio` や `MODERNIZED_STORAGE_MODE` を参照する Compose/CLI 設定は存在しない（`rg -n "minio"`, `rg -n "MODERNIZED_STORAGE_MODE"` いずれもヒットせず）。MinIO コンテナと認証情報（`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_SERVER_URL` など）は別途提供が必要。
- モック環境で必要となる代表的な Secrets／環境変数:
  - `ATTACHMENT_S3_ENDPOINT`（例: `http://minio:9000`）
  - `ATTACHMENT_S3_ACCESS_KEY` / `ATTACHMENT_S3_SECRET_KEY`
  - `ATTACHMENT_S3_REGION`（MinIO は任意文字列）
  - `ATTACHMENT_S3_BUCKET` と `ATTACHMENT_S3_BASE_PATH`
- これらの値は `tmp/attachment-mode/minio.env` を `source` したシェルから `load_config.sh` / `smoke_existing_stack.sh` を起動し、`attachment-storage.yaml`（templates 由来）と WildFly システムプロパティに同一値を反映させる。RUN_ID ごとの証跡（README/hashes/logs）は `artifacts/parity-manual/attachments/<timestamp>/` 配下に保存し、本チェックリストへ成功/失敗と利用設定を追記する。

## 4. モード切替と再起動の暫定手順
1. **Compose プロジェクト分離**: `COMPOSE_PROJECT_NAME=od-attach-db`（DB モード）、`COMPOSE_PROJECT_NAME=od-attach-s3`（S3 モード）を使い分け、`docker compose -f docker-compose.modernized.dev.yml up -d --build` でそれぞれ起動。既存 Compose ファイルにはストレージ関連の環境変数が無いため、`.env` 等で暫定的に注入する。 
2. **設定反映**: `.env` に `MODERNIZED_STORAGE_MODE`（`database`/`s3`）と MinIO 認証情報 (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `ATTACHMENT_S3_*`) を追記し、`docker-compose.modernized.dev.yml` では MinIO + `minio-mc` が自動起動する。YAML (`server-modernized/config/attachment-storage.sample.yaml`) は `/opt/jboss/config/attachment-storage.yaml` にマウントされる。
3. **アプリ再起動**: `MODERNIZED_STORAGE_MODE=<mode> docker compose -f docker-compose.modernized.dev.yml up -d server-modernized-dev` で起動し、`SYSAD_*` ヘッダー付きで `/openDolphin/resources/dolphin` を確認する。mode を切り替える際は `docker compose down -v` でボリュームをクリアした後に再起動する。

### 4.1 既存スタック向け CLI 雛形（コンテナ再構築禁止時の検証）
- `ops/tests/storage/attachment-mode/smoke_existing_stack.sh` を追加。`docker compose` での `up/down` を封印し、稼働中の WildFly／MinIO を前提に REST API だけでアップロード→ダウンロードを行い、`artifacts/parity-manual/attachments/<UTC>/<mode-label>/` へ JSON・ハッシュ・ログを保存する。
- 主要オプション: `--mode-label s3-manual`（成果物名）、`--sample-file`（外部 PDF などを投入したい場合）、`--no-logs`（CI 実行時に `docker compose logs` を抑止）。
- スクリプト冒頭で `SYSAD_*` / `ATTACHMENT_MODE_*` / `MODERNIZED_APP_HTTP_PORT` の有無を判定し、欠落していれば実行を中断する。管理者・医師ユーザー・患者選定ロジックは `run.sh` と同じ JSON を生成するため、証跡の比較も容易。
- 取得済みログは 400 行に丸めて `server-modernized-dev` / `minio` / `minio-mc` の tail だけを採取する。MinIO が停止中の場合は警告を出すがスクリプト自体は継続する。

### 4.2 2025-11-13 本実行ノート
- host 側の `localhost:9080` に直接アクセスするとレスポンスが戻らないため、`legacy-vs-modern_default` ネットワーク上に `attachment-forward` (alpine+socat) を常駐させ、`localhost:19080` → `opendolphin-server-modernized-dev:8080` をフォワード。`smoke_existing_stack.sh` では `MODERNIZED_APP_HTTP_PORT=19080` を指定する。
- `smoke_existing_stack.sh` に `--use-existing` フラグを追加し、以下の既存アカウントで検証した（facilityId=1.3.6.1.4.1.9414.72.103 / numeric id=5001）。
  - Admin: `1.3.6.1.4.1.9414.72.103:admin` / `admin2025`
  - Doctor: `1.3.6.1.4.1.9414.72.103:doctor1` / `doctor2025`
- 新しい環境変数 `ATTACHMENT_MODE_PATIENT_QUERY` を `000` に設定し、`patientId=0000001`（id=2）を取得。`ATTACHMENT_MODE_PATIENT_FROM_DATE` は既定の `2000-01-01 00:00:00` を使用。
- 両モードとも `/openDolphin/resources/karte/2,2000-01-01%2000:00:00` で `ObservationModel` 未登録例外が発生していたが、RUN_ID=`20251118TobservationFixZ1` でエンティティ登録を追加し、`20251118Tattachment{Db,S3}Z3` ではエラーなく添付 API まで到達した。
## 5. 検証ステータス（2025-11-13T02:46Z 更新）
- RUN_ID=`20251118TattachmentDbZ2`（MODE_LABEL=`database`）: `/karte` 取得で `ObservationModel` 未登録の 500 が発生し、添付 API へ進めず（証跡: `artifacts/parity-manual/attachments/20251118TattachmentDbZ2/`）。
- RUN_ID=`20251118TattachmentS3Z2`（MODE_LABEL=`s3`）: 同じく `/karte` 取得で失敗し REST シナリオ未実施（`artifacts/parity-manual/attachments/20251118TattachmentS3Z2/`）。
- RUN_ID=`20251118TattachmentDbZ3`（MODE_LABEL=`database`）: `server-modernized` を再ビルド（`AttachmentModel.bytes` に `@JdbcTypeCode(SqlTypes.BINARY)`、`persistence.xml` に `hibernate.jdbc.use_streams_for_lob=false` を追加）→ `smoke_existing_stack.sh --mode-label database --use-existing --run-id 20251118TattachmentDbZ3` を実行。`database/hashes.txt` で SHA-256 が一致し、`logs/server-tail.log` に 200 応答が残っている。
- RUN_ID=`20251118TattachmentS3Z3`（MODE_LABEL=`s3`）: `attachment-storage.yaml` を S3 設定へ差し替え、`jboss-cli :reload` 後に `smoke_existing_stack.sh --mode-label s3 --run-id 20251118TattachmentS3Z3` を実行。MinIO 側に PUT/GET が記録され、`s3/hashes.txt` で整合性が取れた。
- RUN_ID=`20251119TattachmentAutoZ1`（MODE_SEQUENCE=`database->s3->database` 予定）: `run.sh --modes all` の database ステップで `SystemResource#addFacilityAdmin` が `select nextval('facility_num')` 実行時に `ERROR: relation "facility_num" does not exist` となり失敗。`opendolphin_modern` には `d_users` / `facility_model` / `facility_num` シーケンス等のベーススキーマが一切生成されておらず、`local_synthetic_seed.sql` もテーブル欠如のためロールバックした。`artifacts/parity-manual/attachments/20251119TattachmentAutoZ1/database/` に再現用 payload と `logs/server.log`（該当エラーを含む）を保存済み。`docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` 記載のベースライン復元（Hibernate でテーブル作成→シード投入）を完了させない限り自動スクリプト検証に進めない。
- ブロッカー更新: ObservationModel 登録済み（RUN_ID=`20251118TobservationFixZ1`）。`load_config.sh --apply` で `/opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml` へのコピーと `chmod/chown` が自動化されたため、root 手作業は不要になった。
- 既知の暫定対処:
  - host→WildFly の HTTP 応答が戻らないため、`attachment-forward` (alpine + socat) で `localhost:19080` を `opendolphin-server-modernized-dev:8080` へフォワードしている。
  - `smoke_existing_stack.sh` は `--use-existing` / `ATTACHMENT_MODE_PATIENT_QUERY` によって既存アカウント (`1.3.6.1.4.1.9414.72.103:{admin,doctor1}`) と `patientId=0000001` を再利用するよう拡張済み。
  - `run.sh --modes all` で DB→S3→DB を連続実行する際も `load_config.sh --apply` を内部呼び出しして設定コピーと `:reload` を済ませるため、root 操作なしで環境切替できる。
- 次のアクション: (1) Secrets ストア（Vault/SealedSecret）と `attachment-storage.yaml` の同期手順を起票し、`ATTACHMENT_STORAGE_CONFIG_PATH` を本番向けに一元管理する。(2) `run.sh --modes all` の成果物（`artifacts/.../<RUN_ID>/<mode-label>/load_config.log`）を RUN_ID=20251118Tattachment{Db,S3}Z3 に遡って棚卸しし、legacy stack へ展開するための比較観点を整理する。(3) `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の該当項目へ root 操作不要化と `--modes all` ワークフローを反映する。

## 6. Runbook / 参照資料
- `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`: 外部ストレージ（S3/ファイル共有）設定手順。添付ストレージ切替方針と Secrets 管理ルールを参照すること。
- `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`: S3 デュアルライト構想および `attachment-storage.yaml` ひな形の背景。
- `ops/tests/storage/attachment-mode/README.md`: 自動化スクリプトの前提、実行手順、出力物レイアウト。

## 8. マネージャー実行メモ（docker 専任者向け）

1. `docker compose -f docker-compose.modernized.dev.yml down -v` で共有コンテナをリセットし、他タスクと排他状態を確保する。
2. `ops/tests/storage/attachment-mode/run.sh --compose-file docker-compose.modernized.dev.yml --run-id <RUN_ID> --modes all --output-root artifacts/parity-manual/attachments` を実行。DB→S3→DB の順に `load_config.sh --apply` を呼び出しつつコンテナを切り替え、`artifacts/parity-manual/attachments/<RUN_ID>/<mode-label>/` に API レスポンス・`load_config.log`・ハッシュ・MinIO/WildFly ログを保存する。`confirmed/started/recorded/confirmDate` は epoch(ms) で自動採番されるため、既存の `smoke_existing_stack.sh` との比較も容易。
3. 実行完了後、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` 該当タスクと本ファイルのステータス欄に完了日時と成果物パスを追記する。
4. フェイルした場合は `artifacts/.../<mode>/logs/server.log` と `docker compose logs server-modernized-dev` を添付し、ブロッカー内容を本ファイル §5 へ追記する。

## 7. 今後必要なアクション
- `/openDolphin/resources/karte/{patientId}` で発生していた `ObservationModel` 未マッピングは RUN_ID=`20251118TobservationFixZ1` で解消済みのため、`run.sh --modes all --run-id <next>` を通して DB/S3/DB の 3 セッションを再取得し、`artifacts/.../<mode-label>/load_config.log` と `hashes.txt` を最新版へ更新する。
- Secrets ストア側で `attachment-storage.yaml` を永続化する正式手順を Phase7 の TODO として切り出し、`load_config.sh --apply` で参照している YAML と Secrets の乖離が発生しないようにする。
- 成功した RUN_ID ごとに `docs/web-client/planning/phase2/DOC_STATUS.md` / 本チェックリストへ結果と証跡パスを反映し、MinIO/WildFly ログに差分がないことを確認する。
