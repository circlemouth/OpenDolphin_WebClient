# Ops ディレクトリ構成

サーバー起動・検証に関する Docker 資産を `ops/` 配下へ整理した。各サブディレクトリの役割は次の通り。

- `base/` … PostgreSQL を定義する共通 Compose。`docker compose -f ops/base/docker-compose.yml up -d db` で単体起動できる。
- `legacy-server/` … 旧 Java EE サーバー (WildFly 10) 用の Dockerfile / Compose。`docker compose -f ops/legacy-server/docker-compose.yml up -d` で `db` と `server` を起動する。
- `modernized-server/` … モダナイズ版サーバー (WildFly 33) 用の Dockerfile / Compose。`docker compose -f ops/modernized-server/docker-compose.yml up -d` で単独検証が可能。
- `shared/` … `custom.properties`・`bootstrap.sh`・Maven `settings.xml` など両サーバーで共通利用するファイル。
- `tests/api-smoke-test/` … 旧/新サーバーを比較するスモークテスト資産と、CI 用 Compose 定義 (`docker-compose.yml`)。

旧来の `docker/server*` や `server-modernized/tools/api-smoke-test` に存在していたファイルは上記へ移動済み。既存の操作手順は `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` を参照し、新しいパスへ読み替えてください。
