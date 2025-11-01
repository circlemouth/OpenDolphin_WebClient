# ローカルバックエンド Docker 起動手順

Web クライアント開発チーム向けに、既存サーバー WAR を改変せず Docker Compose で起動できる構成を用意した。WildFly コンテナ上で `opendolphin-server.war` をデプロイし、PostgreSQL と組み合わせてローカルで API を検証する。

## 前提条件
- Docker Desktop 4.x 以上（または Docker Engine 24.x 以上）と Docker Compose v2 系列。
- 初回ビルド時は Maven 依存ライブラリのダウンロードが発生するため、安定したネットワーク環境を用意すること。
- サーバー側コード (`server/`) は改変しない。設定は `docker/server/custom.properties` と環境変数で行う。

## 構成概要
| サービス | 役割 | ポート | 永続化 |
| --- | --- | --- | --- |
| `db` | PostgreSQL 14（アプリ用 DB） | 5432 (`POSTGRES_PORT`) | `postgres-data` ボリューム |
| `server` | WildFly 26 + OpenDolphin WAR | 8080 (`APP_HTTP_PORT`), 9990 (`APP_ADMIN_PORT`) | なし（必要に応じてログをマウント） |

- `server` コンテナ内の `custom.properties` は `docker/server/custom.properties` をベースにビルド時コピーされる。値を変更したい場合はファイルを編集して再ビルドする。
- WildFly のデータソース `java:jboss/datasources/ORCADS` は CLI スクリプトで自動作成し、PostgreSQL コンテナへ接続する。

## セットアップ手順
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
3. `docker compose build server` を実行し、WAR のビルドと WildFly イメージの作成を行う。
4. `docker compose up -d` で全コンテナを起動する。初回は Postgres の初期化と WildFly のデプロイに数分かかる。
5. 起動後、以下のヘルスチェックコマンドが 0 で終了し、JSON が返ることを確認する。
   ```bash
   curl -sf \
     -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
     -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
     http://localhost:8080/openDolphin/resources/dolphin
   ```

## データベースの初期データ投入
- 本リポジトリには ORCA/電子カルテ用スキーマやマスターデータを含めていない。実運用データをコピーするか、別途提供される初期化スクリプトを `docker-entrypoint-initdb.d/` に配置して `db` サービスを再起動する。
- 既存環境のバックアップをリストアする場合は、`postgres-data` ボリュームを削除してから実施する。

## ログ・メンテナンス
- アプリログ閲覧: `docker compose logs -f server`
- DB ログ閲覧: `docker compose logs -f db`
- コンテナ停止: `docker compose down`
- 永続ボリューム削除（DB リセット）: `docker compose down -v`（データが消えるため要注意）

## トラブルシュート
- `server` のヘルスチェックが失敗する場合は、`docker compose logs server` で WildFly の起動ログを確認する。ヘルスエンドポイント `openDolphin/resources/dolphin` にアクセスする際の `SYSAD_USER_NAME` / `SYSAD_PASSWORD` 設定ミスやデータベース未起動・`custom.properties` の記述ミスなどが典型。
- Postgres 接続情報を変更した場合は `custom.properties` と `.env` の双方を整合させたうえで、`docker compose build server`→`docker compose up -d` の順で再構築する。
- 既存機能で追加の外部サービス（SMTP/SMS 等）が必要な場合は、別途モックコンテナを用意するか `custom.properties` 上で無効化する。
