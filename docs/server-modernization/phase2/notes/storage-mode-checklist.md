# 添付ファイル保存モード検証チェックリスト

## 1. 目的と範囲
- `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #L83 に記載のタスクを分解し、DB/LargeObject と S3 互換ストレージ（MinIO モック）を切り替えながら `/karte/attachment` 系 API のアップロード/ダウンロードを検証するための前提条件と手順を整理する。
- 設定および運用手順はモダナイズサーバー（WildFly 33, `docker-compose.modernized.dev.yml`）を対象とし、Legacy サーバーには適用しない。

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
- `ops/tests/storage/attachment-mode/load_config.sh` を追加。`docker compose cp` / `exec` のみで `attachment-storage.yaml` を `/opt/jboss/config/` に差し替え、`jboss-cli :reload` を即座に実行できる。
- 期待する実行手順:
  1. `cp server-modernized/config/attachment-storage.sample.yaml /tmp/attachment-storage.dev.yaml` → 必須キーを編集。
  2. `ops/tests/storage/attachment-mode/load_config.sh --config /tmp/attachment-storage.dev.yaml --compose-file docker-compose.modernized.dev.yml --service server-modernized-dev` を実行し、`server-modernized-dev` のみリロード。MinIO など他コンテナは停止させない。
  3. `docker compose exec server-modernized-dev ls -l /opt/jboss/config/attachment-storage.yaml` と `jboss-cli.sh --commands='module list'` を用いて反映済みであることを確認。
- スクリプトは `storage.type`、`storage.s3.bucket/region/basePath/accessKey/secretKey` の有無を静的に検証し、S3 モード移行時の設定漏れを CLI 実行前に検知できるようにした。
- `--no-reload` オプションで CLI リロードの抑止も可能（MinIO メンテ中に設定だけ差し替えたい場合に利用）。
- これらの操作だけでは Secrets への恒久保管にならないため、Phase7 の完了条件として「Secrets 管理ストア（Vault or SealedSecret）へ同期し、`server-modernized` 起動時に `ATTACHMENT_STORAGE_CONFIG_PATH=/opt/jboss/config/attachment-storage.yaml` を確実に指す」ことを別途記録する。

## 3. MinIO / S3 モック前提条件
- リポジトリ内に `minio` や `MODERNIZED_STORAGE_MODE` を参照する Compose/CLI 設定は存在しない（`rg -n "minio"`, `rg -n "MODERNIZED_STORAGE_MODE"` いずれもヒットせず）。MinIO コンテナと認証情報（`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_SERVER_URL` など）は別途提供が必要。
- モック環境で必要となる代表的な Secrets／環境変数:
  - `ATTACHMENT_S3_ENDPOINT`（例: `http://minio:9000`）
  - `ATTACHMENT_S3_ACCESS_KEY` / `ATTACHMENT_S3_SECRET_KEY`
  - `ATTACHMENT_S3_REGION`（MinIO は任意文字列）
  - `ATTACHMENT_S3_BUCKET` と `ATTACHMENT_S3_BASE_PATH`
- これらの値を `attachment-storage.yaml` または WildFly のシステムプロパティへどのように橋渡しするか設計未定。Secrets 設計時にフォーマットと保管場所を確定する。

## 4. モード切替と再起動の暫定手順
1. **Compose プロジェクト分離**: `COMPOSE_PROJECT_NAME=od-attach-db`（DB モード）、`COMPOSE_PROJECT_NAME=od-attach-s3`（S3 モード）を使い分け、`docker compose -f docker-compose.modernized.dev.yml up -d --build` でそれぞれ起動。既存 Compose ファイルにはストレージ関連の環境変数が無いため、`.env` 等で暫定的に注入する。 
2. **設定反映**: `.env` に `MODERNIZED_STORAGE_MODE`（`database`/`s3`）と MinIO 認証情報 (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `ATTACHMENT_S3_*`) を追記し、`docker-compose.modernized.dev.yml` では MinIO + `minio-mc` が自動起動する。YAML (`server-modernized/config/attachment-storage.sample.yaml`) は `/opt/jboss/config/attachment-storage.yaml` にマウントされる。
3. **アプリ再起動**: `MODERNIZED_STORAGE_MODE=<mode> docker compose -f docker-compose.modernized.dev.yml up -d server-modernized-dev` で起動し、`SYSAD_*` ヘッダー付きで `/openDolphin/resources/dolphin` を確認する。mode を切り替える際は `docker compose down -v` でボリュームをクリアした後に再起動する。

### 4.1 既存スタック向け CLI 雛形（コンテナ再構築禁止時の検証）
- `ops/tests/storage/attachment-mode/smoke_existing_stack.sh` を追加。`docker compose` での `up/down` を封印し、稼働中の WildFly／MinIO を前提に REST API だけでアップロード→ダウンロードを行い、`artifacts/parity-manual/attachments/<UTC>/<mode-label>/` へ JSON・ハッシュ・ログを保存する。
- 主要オプション: `--mode-label s3-manual`（成果物名）、`--sample-file`（外部 PDF などを投入したい場合）、`--no-logs`（CI 実行時に `docker compose logs` を抑止）。
- スクリプト冒頭で `SYSAD_*` / `ATTACHMENT_MODE_*` / `MODERNIZED_APP_HTTP_PORT` の有無を判定し、欠落していれば実行を中断する。管理者・医師ユーザー・患者選定ロジックは `run.sh` と同じ JSON を生成するため、証跡の比較も容易。
- 取得済みログは 400 行に丸めて `server-modernized-dev` / `minio` / `minio-mc` の tail だけを採取する。MinIO が停止中の場合は警告を出すがスクリプト自体は継続する。

## 5. 検証ステータス（2025-11-08T20:54:51Z）
- `ops/tests/storage/attachment-mode/run.sh` を追加。`MODERNIZED_STORAGE_MODE=database|s3` で compose を起動し、サンプル添付をアップロード→ダウンロード→`sha256sum` 突合、MinIO ログ採取まで自動化する。docker を共有利用しているため、実行はマネージャーがタイミング調整の上で行う。
- `MODERNIZED_STORAGE_MODE` / `ATTACHMENT_STORAGE_CONFIG_PATH` / `ATTACHMENT_S3_*` を `server-modernized` へ伝搬するロジックを実装済み。WildFly 起動時に `attachment-storage.yaml` を読み込み、S3 モードではアップロードを MinIO に退避し、取得時は自動でバイナリをフェッチする。
- 上記理由によりバイナリハッシュ比較 (`shasum -a 256`) やレスポンス JSON 差分採取は開始できず、`artifacts/parity-manual/attachments/20251108T205451Z/README.md` へブロッカーを記録済み。
- 2025-11-12 追加: Secrets 差し替え用 `load_config.sh` と、既存スタック向け CLI 雛形 `smoke_existing_stack.sh` を `ops/tests/storage/attachment-mode/` に配置。いずれも **実行は未着手** のまま（docker 再構築禁止のため）。次回解禁時は `load_config.sh` で `storage.type=s3` 設定を投入 → `smoke_existing_stack.sh --mode-label s3-manual` で REST 証跡を採取し、`run.sh` による compose 切替は最後の検証でのみ行う運用に切り替える。

## 6. Runbook / 参照資料
- `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`: 外部ストレージ（S3/ファイル共有）設定手順。添付ストレージ切替方針と Secrets 管理ルールを参照すること。
- `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`: S3 デュアルライト構想および `attachment-storage.yaml` ひな形の背景。
- `ops/tests/storage/attachment-mode/README.md`: 自動化スクリプトの前提、実行手順、出力物レイアウト。

## 8. マネージャー実行メモ（docker 専任者向け）

1. `docker compose -f docker-compose.modernized.dev.yml down -v` で共有コンテナをリセットし、他タスクと排他状態を確保する。
2. `ops/tests/storage/attachment-mode/run.sh --compose-file docker-compose.modernized.dev.yml --output-root artifacts/parity-manual/attachments` を実行。完走すると `artifacts/parity-manual/attachments/<UTC>/database|s3/` に API レスポンス、ハッシュ、MinIO/WildFly ログが保存される。
3. 実行完了後、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` 該当タスクと本ファイルのステータス欄に完了日時と成果物パスを追記する。
4. フェイルした場合は `artifacts/.../<mode>/logs/server.log` と `docker compose logs server-modernized-dev` を添付し、ブロッカー内容を本ファイル §5 へ追記する。

## 7. 今後必要なアクション
- `server-modernized` で `attachment-storage.yaml` をロードし、`storage.type` に応じて `AttachmentModel` 保存先を切り替える実装を追加。
- MinIO コンテナ定義と資格情報を `docker-compose.modernized.dev.yml` または別 Compose ファイルへ追加し、`ops/tests/storage/attachment-mode/*.sh` を新設して REST 経由のアップロード/ダウンロードを自動化。
- テスト成果物（レスポンス JSON と `shasum`）を `artifacts/parity-manual/attachments/<timestamp>/` に保存し、本チェックリストへ成功/失敗・使用設定を追記する。
