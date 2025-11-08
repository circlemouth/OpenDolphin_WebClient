#!/usr/bin/env bash
#
# Modernized (WildFly 33) サーバーのみを起動・停止する補助スクリプト。
# docker compose v2 を前提とした最小構成で、旧サーバーを巻き込まずに
# `db-modernized` / `server-modernized-dev` のみを制御する。
#
# 使い方:
#   scripts/start_wildfly_headless.sh start [--build] [--pull]
#   scripts/start_wildfly_headless.sh stop
#   scripts/start_wildfly_headless.sh restart [--build] [--pull]
#   scripts/start_wildfly_headless.sh status
#   scripts/start_wildfly_headless.sh logs [docker logs の追加引数]
#   scripts/start_wildfly_headless.sh down

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.modernized.dev.yml"
ENV_FILE=""
PROJECT_NAME="${PROJECT_NAME:-modernized-headless}"
SERVICES=(db-modernized server-modernized-dev)

usage() {
  cat <<'USAGE'
Usage:
  start_wildfly_headless.sh [options] <command> [args...]

Options:
  --env-file PATH   docker compose に渡す .env を指定（既定: カレントの .env）。

Commands:
  start [--build] [--pull]   Modernized DB/WildFly を起動（バックグラウンド）
  stop                       Modernized DB/WildFly を停止
  restart [..opts..]         stop → start を連続実行
  status                     コンテナ状態を表示
  logs [args...]             docker compose logs を委譲
  down                       リソースを削除

環境変数:
  PROJECT_NAME   docker compose の --project-name（既定: modernized-headless）
USAGE
}

detect_compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker-compose)
  else
    printf '[ERROR] docker compose (v2) / docker-compose が見つかりません\n' >&2
    exit 1
  fi
}

compose() {
  local args=("${DOCKER_COMPOSE[@]}")
  args+=(--project-name "$PROJECT_NAME" --file "$COMPOSE_FILE")
  if [[ -n "$ENV_FILE" ]]; then
    args+=(--env-file "$ENV_FILE")
  fi
  "${args[@]}" "$@"
}

parse_global_opts() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env-file)
        if [[ $# -lt 2 ]]; then
          usage >&2
          exit 1
        fi
        ENV_FILE="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      --)
        shift
        break
        ;;
      -*)
        printf '[ERROR] unknown option: %s\n' "$1" >&2
        usage >&2
        exit 1
        ;;
      *)
        break
        ;;
    esac
  done
  if [[ $# -lt 1 ]]; then
    usage >&2
    exit 1
  fi
  COMMAND="$1"
  shift
  COMMAND_ARGS=("$@")
}

parse_start_opts() {
  local build=0 pull=0
  local -a args=("$@")
  START_ARGS=(up -d)
  while [[ ${#args[@]} -gt 0 ]]; do
    case "${args[0]}" in
      --build)
        build=1
        args=("${args[@]:1}")
        ;;
      --pull)
        pull=1
        args=("${args[@]:1}")
        ;;
      --)
        args=("${args[@]:1}")
        break
        ;;
      *)
        break
        ;;
    esac
  done
  [[ $pull -eq 1 ]] && START_ARGS+=(--pull always)
  [[ $build -eq 1 ]] && START_ARGS+=(--build)
  if [[ ${#args[@]} -gt 0 ]]; then
    START_ARGS+=("${args[@]}")
  fi
  START_ARGS+=("${SERVICES[@]}")
}

run_start() {
  parse_start_opts "${COMMAND_ARGS[@]}"
  compose "${START_ARGS[@]}"
}

run_stop() {
  compose stop "${SERVICES[@]}"
}

run_status() {
  compose ps "${SERVICES[@]}"
}

run_logs() {
  local extra=("${COMMAND_ARGS[@]}")
  if [[ ${#extra[@]} -eq 0 ]]; then
    extra=(-f)
  fi
  compose logs "${extra[@]}" "${SERVICES[@]}"
}

run_down() {
  compose down
}

run_restart() {
  local args=("${COMMAND_ARGS[@]}")
  COMMAND_ARGS=()
  run_stop || true
  COMMAND_ARGS=("${args[@]}")
  run_start
}

main() {
  detect_compose
  parse_global_opts "$@"
  case "$COMMAND" in
    start)
      run_start
      ;;
    stop)
      run_stop
      ;;
    restart)
      run_restart
      ;;
    status)
      run_status
      ;;
    logs)
      run_logs
      ;;
    down)
      run_down
      ;;
    *)
      printf '[ERROR] unknown command: %s\n' "$COMMAND" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
