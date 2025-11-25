# RUN_ID=20251119TenvCheckZ2 環境ヘルスチェック追記

## 1. 実行コマンド
- `./ops/tools/env-status-check.sh --run-id 20251119TenvCheckZ2 --compose-file docker-compose.yml --compose-file ops/base/docker-compose.yml --compose-file docker-compose.modernized.dev.yml --log-target server --log-target server-modernized-dev`
- 2025-11-13 12:33 JST 時点で WARN なし（`server`/`server-modernized-dev` 向け `docker compose logs --tail 200` が成功）。

## 2. 保存物
- `docker_compose_status.txt`: `opendolphin-server` と `opendolphin-postgres` の稼働のみを確認（modernized 側は停止中）。
- `server.logs.txt`: Legacy WildFly の直近 200 行を採取。
- `server-modernized-dev.logs.txt`: ファイル生成済み。現時点でコンテナが起動していないため内容は空（次回起動後に追記予定）。
- `legacy.{headers,body,meta}.txt`: 8080 (`/openDolphin/resources/serverinfo/jamri`) が 200 応答を継続していることを記録。
- `modern.meta.json` / `modern.curl.log`: 9080 への接続が `curl (7)` で拒否された旨を記録（ボディ／ヘッダーは未取得）。

## 3. フォローアップ
- Modernized 側 (`opendolphin-server-modernized-dev`) を `scripts/start_legacy_modernized.sh start --profiles modernized` などで再起動し、9080 port-forward 復旧後に `server-modernized-dev.logs.txt` と `modern.*` を再取得する。
- PORT 復旧後は本 README と `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に 9080 再開済みである旨を追記する。
- 備考: modern curl (7) → 再起動待ち。2025-11-13 13:40 JST 時点で Slack #server-modernized-env / 共有ノート（Ops Environment）へ本フォルダのリンク（`artifacts/parity-manual/env-status/20251119TenvCheckZ2/README.md`）を共有し、復旧後に再取得する方針を伝達済み。
