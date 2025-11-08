#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
ENV_KEY="LOGFILTER_HEADER_AUTH_ENABLED"

usage() {
  cat <<'USAGE'
usage: ops/tools/logfilter_toggle.sh [--env-file PATH] <enable|disable|status>

options:
  --env-file PATH   対象となる .env ファイルを指定（既定: リポジトリ直下の .env）

commands:
  enable            LOGFILTER_HEADER_AUTH_ENABLED=true を設定（ヘッダ認証フォールバックを許可）
  disable           LOGFILTER_HEADER_AUTH_ENABLED=false を設定（Elytron のみを許可）
  status            現在の設定値を表示

本スクリプトは `docker-compose*.yml` から server-modernized 系コンテナへ渡される
LOGFILTER_HEADER_AUTH_ENABLED を操作します。設定変更後は `docker compose up -d --build`
等で WildFly を再起動してください。
USAGE
}

parse_args() {
  local args=()
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
  ACTION="$1"
}

current_value() {
  if [[ -f "$ENV_FILE" ]]; then
    local line
    line="$(grep -E "^${ENV_KEY}=" "$ENV_FILE" | tail -n 1 || true)"
    if [[ -n "$line" ]]; then
      echo "${line#${ENV_KEY}=}"
      return
    fi
  fi
  echo ""
}

apply_value() {
  local new_value="$1"
  mkdir -p "$(dirname "$ENV_FILE")"
  local tmp
  tmp="$(mktemp)"
  local updated=0
  if [[ -f "$ENV_FILE" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" == "${ENV_KEY}="* ]]; then
        printf '%s=%s\n' "$ENV_KEY" "$new_value" >>"$tmp"
        updated=1
      else
        printf '%s\n' "$line" >>"$tmp"
      fi
    done <"$ENV_FILE"
  fi
  if [[ $updated -eq 0 ]]; then
    if [[ -s "$tmp" ]]; then
      printf '\n' >>"$tmp"
    fi
    printf '%s=%s\n' "$ENV_KEY" "$new_value" >>"$tmp"
  fi
  mv "$tmp" "$ENV_FILE"
  printf '[INFO] %s=%s を %s に書き込みました\n' "$ENV_KEY" "$new_value" "$ENV_FILE"
  printf '        変更を反映するには docker compose / scripts/start_* で WildFly を再起動してください\n'
}

show_status() {
  local value
  value="$(current_value)"
  if [[ -z "$value" ]]; then
    printf '%s is not set (effective default: true)\n' "$ENV_KEY"
  else
    printf '%s=%s (%s)\n' "$ENV_KEY" "$value" "$( [[ "$value" =~ ^([Tt]rue|1|on|yes)$ ]] && echo "enabled" || echo "disabled" )"
  fi
  printf 'env file: %s\n' "$ENV_FILE"
}

main() {
  ACTION=""
  parse_args "$@"

  case "$ACTION" in
    enable|on)
      apply_value "true"
      ;;
    disable|off)
      apply_value "false"
      ;;
    status)
      show_status
      ;;
    *)
      printf '[ERROR] unknown command: %s\n' "$ACTION" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
