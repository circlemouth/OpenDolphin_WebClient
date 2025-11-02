# ローカルバックエンド Docker 起動手順

Web クライアント開発チーム向けに、従来サーバー（Java 8 / WildFly 10 ベース）とモダナイズ版サーバー（Java 17 / WildFly 26 LTS ベース）の両方を Docker Compose で起動できる構成を用意した。既定では従来サーバーを利用し、モダナイズ版を評価したい場合にのみ明示的に起動する。

## 前提条件
- Docker Desktop 4.x 以上（または Docker Engine 24.x 以上）と Docker Compose v2 系列。
- 初回ビルド時は Maven 依存ライブラリのダウンロードが発生するため、安定したネットワーク環境を用意すること。
- サーバー側コード (`server/`、`server-modernized/`) は改変しない。設定は `docker/server/custom.properties` と環境変数で行う。

## 構成概要
| サービス | プロファイル | 役割 | ポート | 永続化 |
| --- | --- | --- | --- | --- |
| `db` | 常時 | PostgreSQL 14（アプリ用 DB） | 5432 (`POSTGRES_PORT`) | `postgres-data` ボリューム |
| `server` | 常時 | WildFly 10.1.0.Final + 旧 OpenDolphin WAR | 8080 (`APP_HTTP_PORT`), 9990 (`APP_ADMIN_PORT`) | なし |
| `server-modernized` | `modernized` プロファイル | WildFly 26.1.3.Final + モダナイズ版 WAR | 8080 (`APP_HTTP_PORT`), 9990 (`APP_ADMIN_PORT`) | なし |

- `server` はデフォルトで起動対象。`server-modernized` は `--profile modernized` を付与した場合のみビルド・起動される。
- いずれのサーバーでも `custom.properties` は `docker/server/custom.properties` をベースにビルド時コピーされる。値を変更したい場合はファイルを編集して再ビルドする。
- モダナイズ版 WAR のビルドは Java 17 + Maven 3.9、従来版は Java 8 + Maven 3.9 で行う。
- WildFly のデータソース `java:jboss/datasources/ORCADS` は CLI スクリプトで自動作成し、PostgreSQL コンテナへ接続する。

## 共通セットアップ手順
1. `docker/server/custom.properties` を開き、施設名や `claim.jdbc.url`（デフォルトは `jdbc:postgresql://db:5432/opendolphin`）等をローカル事情に合わせて修正する。
2. プロジェクトルートの `.env.sample` をコピーして `.env` を作成し、必要な環境変数を上書きする。
   ```env
   POSTGRES_DB=opendolphin
   POSTGRES_USER=opendolphin
   POSTGRES_PASSWORD=opendolphin
   APP_HTTP_PORT=8080
   APP_ADMIN_PORT=9990
   POSTGRES_PORT=5432
   SYSAD_USER_NAME=1.3.6.1.4.1.9414.10.1:dolphin
   SYSAD_PASSWORD=36cdf8b887a5cffc78dcd5c08991b993
   ```
3. DB コンテナをビルドしておく: `docker compose pull db`（イメージ取得のみの場合）または `docker compose up -d db`。

## 従来サーバー（既定）の起動
1. `docker compose build server` を実行し、旧 `server/` モジュールをビルドした WAR を WildFly 10 イメージへ組み込む。旧イメージからアップデートする場合は `docker compose build --no-cache server` を推奨する。
2. `docker compose up -d` を実行し、`db` と `server` を起動する。
3. 起動後、以下のヘルスチェックコマンドが 0 で終了し、JSON が返ることを確認する。
   ```bash
   curl -sf \
     -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
     -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
     http://localhost:${APP_HTTP_PORT:-8080}/openDolphin/resources/dolphin
   ```

## モダナイズ版サーバーの起動
> **注意:** `server` と `server-modernized` は同一ポートを利用するため、同時に起動できない。切り替える際は片方を停止してからもう一方を起動すること。

1. 既存の `server` コンテナが起動している場合は `docker compose down` で停止する。
2. モダナイズ版イメージをビルド: `docker compose --profile modernized build server-modernized`。キャッシュを無効化する場合は `--no-cache` を併用する。
3. `docker compose --profile modernized up -d server-modernized` を実行し、`db` と `server-modernized` を起動する。
4. 起動後、従来サーバーと同じヘルスチェックコマンドで JSON が返ることを確認する。

## データベースの初期データ投入
- 本リポジトリには ORCA/電子カルテ用スキーマやマスターデータを含めていない。実運用データをコピーするか、別途提供される初期化スクリプトを `docker-entrypoint-initdb.d/` に配置して `db` サービスを再起動する。
- 既存環境のバックアップをリストアする場合は、`postgres-data` ボリュームを削除してから実施する。

## ログ・メンテナンス
- アプリログ閲覧: `docker compose logs -f server`（モダナイズ版利用時は `server-modernized` を指定）。
- DB ログ閲覧: `docker compose logs -f db`
- コンテナ停止: `docker compose down`
- 永続ボリューム削除（DB リセット）: `docker compose down -v`（データが消えるため要注意）

## トラブルシュート
- サーバーのヘルスチェックが失敗する場合は、`docker compose logs server` または `docker compose logs server-modernized` で WildFly の起動ログを確認する。ヘルスエンドポイント `openDolphin/resources/dolphin` にアクセスする際の `SYSAD_USER_NAME` / `SYSAD_PASSWORD` 設定ミスやデータベース未起動・`custom.properties` の記述ミスなどが典型。
- Postgres 接続情報を変更した場合は `custom.properties` と `.env` の双方を整合させたうえで、対象サーバーの `docker compose build ...` → `docker compose up -d ...` の順で再構築する。
- 既存機能で追加の外部サービス（SMTP/SMS 等）が必要な場合は、別途モックコンテナを用意するか `custom.properties` 上で無効化する。
- WildFly 管理ポートへ Maven プラグイン経由でデプロイする場合は、`.env` に記載した `WILDFLY_HOSTNAME` / `WILDFLY_PORT` / `WILDFLY_SERVER_ID` と、`~/.m2/settings.xml` の `<server>` 定義（管理ユーザー・パスワード）を整合させる。コマンド例: `mvn -f server-modernized/pom.xml -Dwildfly.hostname=$WILDFLY_HOSTNAME -Dwildfly.port=$WILDFLY_PORT -Dwildfly.serverId=$WILDFLY_SERVER_ID wildfly:deploy`。

## 既存利用者向けアップデート手順

以前の WildFly 10 ベースイメージのみを利用していたローカル環境は、以下の手順で新構成へ移行する。

1. 旧コンテナを停止: `docker compose down`。
2. キャッシュされたビルド成果物を削除: `docker builder prune` や `docker image rm opendolphin-server` を必要に応じて実行。
3. `.env` に `WILDFLY_HOSTNAME` / `WILDFLY_PORT` / `WILDFLY_SERVER_ID` を追記し、WildFly 管理資格情報は `~/.m2/settings.xml` の `<servers>` に設定する（例: `wildfly-management`）。
4. 従来サーバーを再構築する場合は `docker compose build --no-cache server` → `docker compose up -d`。
5. モダナイズ版を評価する場合は上記「モダナイズ版サーバーの起動」に従い、`docker compose --profile modernized build server-modernized` → `docker compose --profile modernized up -d server-modernized` を実行する。
6. いずれかを切り替える際はポート競合を避けるため、片方のコンテナを確実に停止してからもう一方を起動する。
