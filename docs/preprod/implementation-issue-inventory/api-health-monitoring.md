# APIヘルスチェック監視/CI連携手順

- RUN_ID: 20260124T010412Z
- 作業日: 2026-01-24
- 対象: ops/tools/api_health_check.sh
- 目的: /api/* 500 回避の自動検証を CI / 運用監視へ組み込み、失敗時のアラート基準と実行ログ形式を明文化する。

## エンドポイント一覧（期待HTTP）

| エンドポイント | 期待HTTP | 目的/補足 |
| --- | --- | --- |
| `/api/admin/config` | 200 / 401 / 403 | Admin 設定の疎通確認（401/403 は未認証として正常扱い）。 |
| `/api/admin/delivery` | 200 / 401 / 403 | 配信設定の疎通確認（401/403 は未認証として正常扱い）。 |
| `/api/admin/security/header-credentials/cache` | 200 / 401 / 403 | 認証キャッシュ系の疎通確認（401/403 は未認証として正常扱い）。 |

### 将来追加時の運用手順
1. `ops/tools/api_health_check.sh` の `ENDPOINTS` に追加する（`/path:allowedCodes` 形式）。
2. 本ドキュメントの表へ追記し、期待HTTPを明記する。
3. 追加後に `setup-modernized-env.sh` 実行で結果ログを残し、`docs/preprod/implementation-issue-inventory/logs/` に RUN_ID を記録する。

## 失敗時のアラート基準
- 5xx を検知した場合は **即失敗**（exit 1）。
- 期待HTTP以外のステータス（例: 404/500/502 等）は **失敗**（exit 1）。
- 失敗は **監視アラート送信 / CI fail** の条件とする。

## 実行ログ形式（RUN_ID付与）
- RUN_ID を `RUN_ID` または `DB_INIT_RUN_ID` で指定する（UTC, `YYYYMMDDThhmmssZ`）。
- API health log は `artifacts/preprod/api-health/api-health-<RUN_ID>.log` を使用。
- 例:
  ```
  api_health_check runId=20260124T010412Z baseUrl=http://localhost:19092/openDolphin/resources
  401 /api/admin/config
  401 /api/admin/delivery
  401 /api/admin/security/header-credentials/cache
  api_health_check OK
  ```

## CI 連携例（手動実行ステップ）
- 前提: Modernized Server が起動済み、`API_HEALTH_BASE_URL` が到達可能。
- 例:
  ```bash
  RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
  API_HEALTH_BASE_URL=http://localhost:19092/openDolphin/resources \
  API_HEALTH_LOG_FILE=artifacts/preprod/api-health/api-health-${RUN_ID}.log \
  ops/tools/api_health_check.sh
  ```
- 失敗時は exit 1 となり CI を fail させる。

## 運用監視の定期実行例（cron）
- 目的: 5 分間隔で疎通確認し、失敗時に監視アラートを発火。
- cron 設定例（root または監視専用ユーザー）:
  ```
  */5 * * * * RUN_ID=$(date -u +\%Y\%m\%dT\%H\%M\%SZ) API_HEALTH_BASE_URL=http://localhost:19092/openDolphin/resources API_HEALTH_LOG_FILE=/var/log/opendolphin/api-health-${RUN_ID}.log /path/to/repo/ops/tools/api_health_check.sh || logger -t opendolphin-api-health "API health check failed runId=${RUN_ID}"
  ```
- ログ保全要件がある場合は `/var/log/opendolphin/` のローテーション設定を追加する。

## 運用監視の定期実行例（systemd timer）
- `api-health-check.service`:
  ```ini
  [Unit]
  Description=OpenDolphin API health check

  [Service]
  Type=oneshot
  Environment=API_HEALTH_BASE_URL=http://localhost:19092/openDolphin/resources
  ExecStart=/bin/sh -lc 'RUN_ID=$(date -u +%Y%m%dT%H%M%SZ); API_HEALTH_LOG_FILE=/var/log/opendolphin/api-health-${RUN_ID}.log; /path/to/repo/ops/tools/api_health_check.sh'
  ```
- `api-health-check.timer`:
  ```ini
  [Unit]
  Description=Run API health check every 5 minutes

  [Timer]
  OnBootSec=2min
  OnUnitActiveSec=5min

  [Install]
  WantedBy=timers.target
  ```
- 失敗時は `systemd` のジョブ失敗として監視対象に登録し、アラートを出す。
