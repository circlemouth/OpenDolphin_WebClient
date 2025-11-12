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
  --config PATH         ローカルの attachment-storage.yaml（既定: server-modernized/config/attachment-storage.sample.yaml）
  --target-path PATH    コンテナ内の配置先（既定: /opt/jboss/config/attachment-storage.yaml）
  --no-reload           WildFly CLI の :reload をスキップ
  -h, --help            このヘルプを表示
USAGE
}

COMPOSE_FILE="docker-compose.modernized.dev.yml"
SERVICE="server-modernized-dev"
CONFIG_PATH="server-modernized/config/attachment-storage.sample.yaml"
TARGET_PATH="/opt/jboss/config/attachment-storage.yaml"
DO_RELOAD=1

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
    --config)
      CONFIG_PATH="$2"
      shift 2
      ;;
    --target-path)
      TARGET_PATH="$2"
      shift 2
      ;;
    --no-reload)
      DO_RELOAD=0
      shift 1
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

require_command() {
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "[ERROR] Missing required command: $cmd" >&2
      exit 1
    fi
  done
}

require_command docker grep awk

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
  docker compose -f "$COMPOSE_FILE" cp "$CONFIG_PATH" "$SERVICE:$TARGET_PATH.tmp"
  docker compose -f "$COMPOSE_FILE" exec "$SERVICE" /bin/sh -c "mv $TARGET_PATH.tmp $TARGET_PATH && chmod 600 $TARGET_PATH"
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
ensure_service_running "$COMPOSE_FILE" "$SERVICE"
push_config
reload_server

cat <<SUMMARY
[OK] $CONFIG_PATH を $SERVICE:$TARGET_PATH へ反映しました。
- compose file : $COMPOSE_FILE
- target path  : $TARGET_PATH
- reload       : $([[ $DO_RELOAD -eq 1 ]] && echo enabled || echo skipped)
SUMMARY
