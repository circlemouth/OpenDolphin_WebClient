#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ops/tools/helper_send_parallel_request.sh [helper-options] [--] <send_parallel_request args>

Description:
  helper コンテナ（docker compose --profile modernized-dev run helper）を経由して
  ops/tools/send_parallel_request.sh を実行するラッパー。TRACE_RUN_ID と
  PARITY_OUTPUT_DIR を自動生成し、artifacts/parity-manual/<case>/<RUN_ID>/
  へ応答を保存する。helper-options でケース名などを調整し、それ以外の
  引数は send_parallel_request.sh にそのまま引き渡される。

Helper options:
  --helper-case NAME         出力先 case 名（default: messaging）。
  --helper-output-root PATH  case 直上の出力ルート（default: artifacts/parity-manual）。
  --helper-profile NAME      docker compose プロファイル（default: modernized-dev）。
  --helper-service NAME      docker compose サービス名（default: helper）。
  --helper-workspace PATH    リポジトリのワークスペースパス（default: git rev-parse）。
  -h, --help                 このヘルプを表示。
  --                         以降は send_parallel_request.sh の引数として扱う。

Environment overrides:
  TRACE_RUN_ID / RUN_ID      明示指定があればそれを優先。未指定時は UTC タイムスタンプ。
  PARITY_OUTPUT_DIR          保存先を完全指定する場合に利用。
  PARITY_HEADER_FILE         相対パスは /workspace/ 配下へ展開される。
  PARITY_BODY_FILE           同上。
USAGE
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf '[ERROR] %s command not found\n' "$cmd" >&2
    exit 1
  fi
}

trim_trailing_slash() {
  local value="$1"
  while [[ "$value" == */ && "$value" != "/" ]]; do
    value="${value%/}"
  done
  printf '%s' "$value"
}

resolve_workspace() {
  local override="$1"
  if [[ -n "$override" ]]; then
    (cd "$override" >/dev/null 2>&1 && pwd) && return
    printf '[ERROR] invalid --helper-workspace path: %s\n' "$override" >&2
    exit 1
  fi
  if command -v git >/dev/null 2>&1; then
    if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
      (cd "$git_root" && pwd)
      return
    fi
  fi
  pwd
}

convert_to_container_path() {
  local path="$1"
  [[ -z "$path" ]] && return
  local abs_path
  if [[ "$path" == /* ]]; then
    abs_path="$path"
  else
    abs_path="${WORKSPACE_DIR%/}/$path"
  fi
  if [[ "$abs_path" == "$WORKSPACE_DIR"* ]]; then
    printf '/workspace%s' "${abs_path#$WORKSPACE_DIR}"
  else
    printf '%s' "$path"
  fi
}

HELPER_CASE="${HELPER_CASE:-messaging}"
HELPER_OUTPUT_ROOT="${HELPER_OUTPUT_ROOT:-artifacts/parity-manual}"
HELPER_PROFILE="${HELPER_PROFILE:-modernized-dev}"
HELPER_SERVICE="${HELPER_SERVICE:-helper}"
HELPER_WORKSPACE="${HELPER_WORKSPACE:-}"
HELPER_INNER_COMMAND="${HELPER_INNER_COMMAND:-ops/tools/send_parallel_request.sh}"
HELPER_FALLBACK_NETWORK="${HELPER_FALLBACK_NETWORK:-legacy-vs-modern_default}"
HELPER_FALLBACK_IMAGE="${HELPER_FALLBACK_IMAGE:-mcr.microsoft.com/devcontainers/base:jammy}"

send_args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --helper-case)
      [[ $# -lt 2 ]] && { usage >&2; exit 1; }
      HELPER_CASE="$2"
      shift 2
      ;;
    --helper-output-root)
      [[ $# -lt 2 ]] && { usage >&2; exit 1; }
      HELPER_OUTPUT_ROOT="$2"
      shift 2
      ;;
    --helper-profile)
      [[ $# -lt 2 ]] && { usage >&2; exit 1; }
      HELPER_PROFILE="$2"
      shift 2
      ;;
    --helper-service)
      [[ $# -lt 2 ]] && { usage >&2; exit 1; }
      HELPER_SERVICE="$2"
      shift 2
      ;;
    --helper-workspace)
      [[ $# -lt 2 ]] && { usage >&2; exit 1; }
      HELPER_WORKSPACE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        send_args+=("$1")
        shift
      done
      break
      ;;
    *)
      send_args+=("$1")
      shift
      ;;
  esac
done

if [[ ${#send_args[@]} -eq 0 ]]; then
  usage >&2
  exit 1
fi

require_command docker
WORKSPACE_DIR="$(resolve_workspace "$HELPER_WORKSPACE")"
WORKSPACE_DIR="${WORKSPACE_DIR%/}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
trace_suffix="${TRACE_RUN_SUFFIX:-${RUN_ID_SUFFIX:-}}"
if [[ -n "$trace_suffix" ]]; then
  timestamp+="$trace_suffix"
fi
TRACE_RUN_ID="${TRACE_RUN_ID:-${RUN_ID:-$timestamp}}"
if [[ -z "$TRACE_RUN_ID" ]]; then
  TRACE_RUN_ID="$timestamp"
fi

trimmed_root="$(trim_trailing_slash "$HELPER_OUTPUT_ROOT")"
[[ -z "$trimmed_root" ]] && trimmed_root="."
DEFAULT_OUTPUT_DIR="${trimmed_root}/${HELPER_CASE}/${TRACE_RUN_ID}"
PARITY_OUTPUT_DIR="${PARITY_OUTPUT_DIR:-$DEFAULT_OUTPUT_DIR}"

if [[ "$PARITY_OUTPUT_DIR" == /* ]]; then
  HOST_PARITY_OUTPUT_DIR="$PARITY_OUTPUT_DIR"
else
  HOST_PARITY_OUTPUT_DIR="${WORKSPACE_DIR%/}/$PARITY_OUTPUT_DIR"
fi
mkdir -p "$HOST_PARITY_OUTPUT_DIR"
CONTAINER_PARITY_OUTPUT_DIR="$(convert_to_container_path "$PARITY_OUTPUT_DIR")"

CONTAINER_PARITY_HEADER_FILE=""
if [[ -n "${PARITY_HEADER_FILE:-}" ]]; then
  CONTAINER_PARITY_HEADER_FILE="$(convert_to_container_path "$PARITY_HEADER_FILE")"
fi
CONTAINER_PARITY_BODY_FILE=""
if [[ -n "${PARITY_BODY_FILE:-}" ]]; then
  CONTAINER_PARITY_BODY_FILE="$(convert_to_container_path "$PARITY_BODY_FILE")"
fi

printf '[helper] TRACE_RUN_ID=%s\n' "$TRACE_RUN_ID"
printf '[helper] PARITY_OUTPUT_DIR=%s\n' "$PARITY_OUTPUT_DIR"
printf '[helper] docker workspace=%s\n' "$WORKSPACE_DIR"

docker_cmd=(docker compose)
if [[ -n "$HELPER_PROFILE" ]]; then
  docker_cmd+=(--profile "$HELPER_PROFILE")
fi

printf -v send_cmd ' %q' "${send_args[@]}"
send_cmd="${send_cmd:1}"

read -r -d '' container_script <<'SCRIPT' || true
set -euo pipefail
cd /workspace
source ops/tools/send_parallel_request.profile.env.sample
PLACEHOLDER_COMMAND PLACEHOLDER_SEND_ARGS
SCRIPT

container_script="${container_script/PLACEHOLDER_COMMAND/$HELPER_INNER_COMMAND}"
container_script="${container_script/PLACEHOLDER_SEND_ARGS/$send_cmd}"

compose_services_output=""
helper_service_available=0
if compose_services_output="$(
  cd "$WORKSPACE_DIR" &&
    "${docker_cmd[@]}" config --services 2>&1
)"; then
  if grep -Fxq "$HELPER_SERVICE" <<<"$compose_services_output"; then
    helper_service_available=1
  fi
else
  printf '[WARN] docker compose config --services failed. Falling back to docker run (%s)\n' "$HELPER_FALLBACK_IMAGE" >&2
  printf '[WARN] %s\n' "$compose_services_output" >&2
fi

if (( helper_service_available )); then
  printf '[helper] docker compose service "%s" detected; running via compose\n' "$HELPER_SERVICE"
  compose_run_cmd=("${docker_cmd[@]}" run --rm)
  if [[ -n "$TRACE_RUN_ID" ]]; then
    compose_run_cmd+=(-e "TRACE_RUN_ID=$TRACE_RUN_ID")
  fi
  if [[ -n "$CONTAINER_PARITY_OUTPUT_DIR" ]]; then
    compose_run_cmd+=(-e "PARITY_OUTPUT_DIR=$CONTAINER_PARITY_OUTPUT_DIR")
  fi
  if [[ -n "$CONTAINER_PARITY_HEADER_FILE" ]]; then
    compose_run_cmd+=(-e "PARITY_HEADER_FILE=$CONTAINER_PARITY_HEADER_FILE")
  fi
  if [[ -n "$CONTAINER_PARITY_BODY_FILE" ]]; then
    compose_run_cmd+=(-e "PARITY_BODY_FILE=$CONTAINER_PARITY_BODY_FILE")
  fi
  compose_run_cmd+=("$HELPER_SERVICE" bash -lc "$container_script")
  (
    cd "$WORKSPACE_DIR"
    "${compose_run_cmd[@]}"
  )
else
  printf '[helper] service "%s" not found in compose config. Falling back to docker run (%s).\n' "$HELPER_SERVICE" "$HELPER_FALLBACK_IMAGE"
  docker_run_cmd=(docker run --rm)
  if [[ -n "$HELPER_FALLBACK_NETWORK" ]]; then
    docker_run_cmd+=(--network "$HELPER_FALLBACK_NETWORK")
  fi
  docker_run_cmd+=(-v "$WORKSPACE_DIR:/workspace" -w /workspace)
  if [[ -n "$TRACE_RUN_ID" ]]; then
    docker_run_cmd+=(-e "TRACE_RUN_ID=$TRACE_RUN_ID")
  fi
  if [[ -n "$CONTAINER_PARITY_OUTPUT_DIR" ]]; then
    docker_run_cmd+=(-e "PARITY_OUTPUT_DIR=$CONTAINER_PARITY_OUTPUT_DIR")
  fi
  if [[ -n "$CONTAINER_PARITY_HEADER_FILE" ]]; then
    docker_run_cmd+=(-e "PARITY_HEADER_FILE=$CONTAINER_PARITY_HEADER_FILE")
  fi
  if [[ -n "$CONTAINER_PARITY_BODY_FILE" ]]; then
    docker_run_cmd+=(-e "PARITY_BODY_FILE=$CONTAINER_PARITY_BODY_FILE")
  fi
  docker_run_cmd+=("$HELPER_FALLBACK_IMAGE" bash -lc "$container_script")
  "${docker_run_cmd[@]}"
fi
