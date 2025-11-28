# ローカルバックエンド Docker 起動手順

Web クライアント開発者がローカルで旧サーバー / モダナイズ版サーバーを起動するための手順をまとめる。

## 共通設定
1. `ops/shared/docker/custom.properties` を開き、施設情報や `claim.jdbc.url` を環境に合わせて修正する。
2. ルートの `.env.sample` をコピーして `.env` を作成し、必要な環境変数を上書きする。
3. DB コンテナをビルドまたは起動しておく: `docker compose -f ops/base/docker-compose.yml up -d db`。

## setup-modernized-env.ps1 での一括起動（モダナイズ版 + Web クライアント）
- 実行: `powershell -NoProfile -ExecutionPolicy Bypass -File .\\setup-modernized-env.ps1`
- ORCA 接続: `docs/web-client/operations/mac-dev-login.local.md` を既定で参照。`ORCA_HOST` / `ORCA_PORT` / `ORCA_USER` / `ORCA_PASS` で上書き可。8000 番は自動で拒否し `18080` にフォールバック。
- 生成物: `custom.properties.dev`（UTF-8/BOM なし）と `docker-compose.override.dev.yml` を生成し、`server-modernized-dev` にマウント。
- DB シード: `ops/db/local-baseline/local_synthetic_seed.sql` を `docker cp`→`psql` で適用（`hibernate_sequence` ガード込み）。
- 初期ユーザー: facility `1.3.6.1.4.1.9414.10.1` に `dolphindev` / `dolphindev` を SQL で登録。
- ポート: モダナイズ版 WildFly アプリ `http://localhost:9080`（Welcome to WildFly 応答）、管理ポート `9995`（404 もしくは未公開想定）、Web クライアント `http://localhost:5173`。
- 孤立コンテナ警告が出る場合は `docker compose ... --remove-orphans` で整理してから再実行する。

## ポート一覧（デフォルト）
| サービス | ポート | 備考 |
| --- | --- | --- |
| 旧サーバー (server) | 8080 / 9990 | `APP_HTTP_PORT` / `APP_ADMIN_PORT` |
| モダナイズ版 (server-modernized-dev) | 9080 / 9995 | `MODERNIZED_APP_HTTP_PORT` / `MODERNIZED_APP_ADMIN_PORT` |
| Web クライアント (Vite dev) | 5173 | `WEB_CLIENT_DEV_PORT` |

