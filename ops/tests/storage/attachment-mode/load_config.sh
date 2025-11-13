#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: load_config.sh [options]

Copies a prepared attachment-storage.yaml into a running server-modernized container
and optionally triggers a WildFly CLI reload. Containersは再構築せず、既存スタック向けの即時切替を想定。

Options:
  --compose-file FILE   docker compose ファイル（既定: docker-compose.modernized.dev.yml）
  --service NAME        WildFly サービス名（既定: server-modernized-dev）
  --mode MODE           テンプレ選択（database|s3, 既定: database。--config 指定時は無視）
  --config PATH         ローカルの attachment-storage.yaml（既定: ops/tests/storage/attachment-mode/templates/attachment-storage.<mode>.yaml）
  --target-path PATH    コンテナ内の配置先（既定: /opt/jboss/config/attachment-storage.yaml）
  --apply               `/opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml` へ root 権限で配置し、chmod/chown を自動実行
  --no-reload           WildFly CLI の :reload をスキップ
  --dry-run             docker compose cp/exec を行わず、検証と出力のみ
  -h, --help            このヘルプを表示
USAGE
}

COMPOSE_FILE="docker-compose.modernized.dev.yml"
SERVICE="server-modernized-dev"
TARGET_PATH="/opt/jboss/config/attachment-storage.yaml"
TARGET_OVERRIDDEN=0
STANDALONE_PATH="/opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml"
APPLY_AS_ROOT=0
TARGET_OWNER="${ATTACHMENT_STORAGE_FILE_OWNER:-jboss:jboss}"
DO_RELOAD=1
MODE="database"
DRY_RUN=0
RUN_ID=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
CONFIG_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --config)
      CONFIG_PATH="$2"
      shift 2
      ;;
    --target-path)
      TARGET_PATH="$2"
      TARGET_OVERRIDDEN=1
      shift 2
      ;;
    --apply)
      APPLY_AS_ROOT=1
      if [[ $TARGET_OVERRIDDEN -eq 0 ]]; then
        TARGET_PATH="$STANDALONE_PATH"
      fi
      shift 1
      ;;
    --no-reload)
      DO_RELOAD=0
      shift 1
      ;;
    --dry-run)
      DRY_RUN=1
      shift 1
      ;;
    --run-id)
      RUN_ID="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
esac
done

case "$MODE" in
  database|db)
    MODE="database"
    ;;
  s3)
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac

if [[ -z "$CONFIG_PATH" ]]; then
  CONFIG_PATH="$TEMPLATES_DIR/attachment-storage.$MODE.yaml"
fi

require_command() {
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "[ERROR] Missing required command: $cmd" >&2
      exit 1
    fi
  done
}

if [[ $DRY_RUN -eq 0 ]]; then
  require_command docker
fi
require_command grep awk

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "[ERROR] Config file not found: $CONFIG_PATH" >&2
  exit 1
fi

validate_config() {
  local file="$1"
  if ! grep -q "storage.type" "$file"; then
    echo "[ERROR] $file には storage.type が定義されていません" >&2
    exit 1
  fi
  if grep -q "storage.type: s3" "$file"; then
    for key in bucket region basePath accessKey secretKey; do
      if ! grep -q "storage.s3.$key" "$file"; then
        echo "[WARN] storage.s3.$key が未設定です" >&2
      fi
    done
  fi
}

ensure_service_running() {
  local compose_file="$1"
  local service="$2"
  if ! docker compose -f "$compose_file" ps "$service" 2>/dev/null | grep -q "Up"; then
    echo "[ERROR] $service is not running (compose file: $compose_file)" >&2
    exit 1
  fi
}

push_config() {
  local remote_tmp="$TARGET_PATH.tmp"
  docker compose -f "$COMPOSE_FILE" cp "$CONFIG_PATH" "$SERVICE:$remote_tmp"
  if [[ $APPLY_AS_ROOT -eq 1 ]]; then
    docker compose -f "$COMPOSE_FILE" exec --user root "$SERVICE" /bin/sh -c "set -eu; mv $remote_tmp $TARGET_PATH && chown $TARGET_OWNER $TARGET_PATH && chmod 600 $TARGET_PATH"
  else
    docker compose -f "$COMPOSE_FILE" exec "$SERVICE" /bin/sh -c "set -eu; mv $remote_tmp $TARGET_PATH && chmod 600 $TARGET_PATH"
  fi
}

reload_server() {
  if [[ $DO_RELOAD -eq 0 ]]; then
    echo "[INFO] WildFly reload skipped by --no-reload"
    return
  fi
  docker compose -f "$COMPOSE_FILE" exec "$SERVICE" /opt/jboss/wildfly/bin/jboss-cli.sh --connect <<'CLI'
:reload
CLI
}

validate_config "$CONFIG_PATH"
if [[ $DRY_RUN -eq 0 ]]; then
  ensure_service_running "$COMPOSE_FILE" "$SERVICE"
  push_config
  reload_server
else
  cat <<DRYRUN
[DRY-RUN] Would push $CONFIG_PATH to $SERVICE:$TARGET_PATH (compose: $COMPOSE_FILE)
[DRY-RUN] root apply : $([[ $APPLY_AS_ROOT -eq 1 ]] && echo yes || echo no)
[DRY-RUN] reload: $([[ $DO_RELOAD -eq 1 ]] && echo enabled || echo skipped)
DRYRUN
fi

cat <<SUMMARY
[OK] $CONFIG_PATH の検証が完了しました。
- compose file : $COMPOSE_FILE
- target path  : $TARGET_PATH
- root apply   : $([[ $APPLY_AS_ROOT -eq 1 ]] && echo yes || echo no)
- reload       : $([[ $DO_RELOAD -eq 1 ]] && echo enabled || echo skipped)
- dry-run      : $([[ $DRY_RUN -eq 1 ]] && echo yes || echo no)
- run-id       : ${RUN_ID:-"(not specified)"}
SUMMARY
