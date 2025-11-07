#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/$(basename "${BASH_SOURCE[0]}")"

usage() {
  cat <<'USAGE'
usage:
  ops/tools/send_parallel_request.sh METHOD PATH [ID]
  ops/tools/send_parallel_request.sh --config CONFIG_JSON

必須 (単発実行時):
  METHOD   HTTP メソッド (GET/POST/PUT/DELETE など)
  PATH     リクエストパス。先頭に / が無い場合は自動で付与。
任意:
  ID       保存ディレクトリ名。省略時は METHOD+PATH をサニタイズして使用。

config モード:
  --config CONFIG_JSON   `scripts/api_parity_targets.sample.json` と同形式の JSON を読み込み、
                         targets 配列の内容を順番に送信する。各ターゲットでは
                         `method` / `path` / `id` / `body_file` / `header_file` / `query`
                         を指定できる（無指定時は defaults を利用）。

環境変数:
  BASE_URL_LEGACY   旧サーバーのベース URL (default: http://localhost:8080)
  BASE_URL_MODERN   モダナイズ版サーバーのベース URL (default: http://localhost:18080)
  PARITY_OUTPUT_DIR 保存先ルート (default: artifacts/parity-manual)
  PARITY_HEADER_FILE 追加ヘッダーを 1 行 1 ヘッダーで記述したファイル
  PARITY_BODY_FILE    --data-binary で送信するボディファイル
USAGE
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf '[ERROR] %s command is required but not found\n' "$cmd" >&2
    exit 1
  fi
}

run_config_mode() {
  local config_file="$1"
  if [[ ! -f "$config_file" ]]; then
    printf '[ERROR] config file not found: %s\n' "$config_file" >&2
    exit 1
  fi
  require_command jq

  local jq_filter='
    def merge_defaults($defaults):
      ($defaults // {}) as $d
      | . as $target
      | $d + $target;
    (.defaults // {}) as $defaults
    | (.targets // [])[]
    | merge_defaults($defaults)
  '

  local base_header_file="${PARITY_HEADER_FILE-}"
  local base_body_file="${PARITY_BODY_FILE-}"

  jq -c "$jq_filter" "$config_file" | while IFS= read -r target; do
    [[ -z "$target" ]] && continue
    local method path query_string request_path request_id header_file body_file name
    method="$(jq -r '.method // "GET"' <<<"$target")"
    path="$(jq -r '.path // empty' <<<"$target")"
    if [[ -z "$path" || "$path" == "null" ]]; then
      printf '[WARN] skip entry without path: %s\n' "$target" >&2
      continue
    fi
    name="$(jq -r '.name // empty' <<<"$target")"
    request_id="$(jq -r '.id // .request_id // .name // empty' <<<"$target")"
    header_file="$(jq -r '.header_file // empty' <<<"$target")"
    body_file="$(jq -r '.body_file // empty' <<<"$target")"
    query_string="$(jq -r '
      (.query // null) as $q
      | if $q == null then ""
        else
          ($q | to_entries | map("\(.key)=\(.value|tostring|@uri)") | join("&"))
        end
    ' <<<"$target")"

    request_path="$path"
    if [[ -n "$query_string" ]]; then
      if [[ "$request_path" == *\?* ]]; then
        request_path="${request_path}&${query_string}"
      else
        request_path="${request_path}?${query_string}"
      fi
    fi

    printf '\n[CONFIG] %s%s (%s %s)\n' \
      "${request_id:+${request_id} }" \
      "${name:+${name}}" \
      "$method" \
      "$request_path"

    (
      if [[ -n "$header_file" && "$header_file" != "null" ]]; then
        export PARITY_HEADER_FILE="$header_file"
      elif [[ -n "$base_header_file" ]]; then
        export PARITY_HEADER_FILE="$base_header_file"
      else
        unset PARITY_HEADER_FILE || true
      fi
      if [[ -n "$body_file" && "$body_file" != "null" ]]; then
        export PARITY_BODY_FILE="$body_file"
      elif [[ -n "$base_body_file" ]]; then
        export PARITY_BODY_FILE="$base_body_file"
      else
        unset PARITY_BODY_FILE || true
      fi
      "$SCRIPT_PATH" "$method" "$request_path" "${request_id:-}"
    )
  done
}

CONFIG_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)
      if [[ $# -lt 2 ]]; then
        usage >&2
        exit 1
      fi
      CONFIG_FILE="$2"
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
    *)
      break
      ;;
  esac
done

if [[ -n "$CONFIG_FILE" ]]; then
  run_config_mode "$CONFIG_FILE"
  exit 0
fi

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 1
fi

METHOD="$1"
REQUEST_PATH="$2"
REQUEST_ID="${3:-}"

if [[ -z "$REQUEST_ID" ]]; then
  REQUEST_ID="$(printf '%s_%s' "$METHOD" "$REQUEST_PATH" | tr -cs 'A-Za-z0-9._-' '_')"
fi
REQUEST_ID="${REQUEST_ID#_}"
REQUEST_ID="${REQUEST_ID%_}"
[[ -z "$REQUEST_ID" ]] && REQUEST_ID="request"

[[ "$REQUEST_PATH" != /* ]] && REQUEST_PATH="/$REQUEST_PATH"

BASE_URL_LEGACY="${BASE_URL_LEGACY:-http://localhost:8080}"
BASE_URL_MODERN="${BASE_URL_MODERN:-http://localhost:18080}"
OUTPUT_DIR="${PARITY_OUTPUT_DIR:-artifacts/parity-manual}"
mkdir -p "$OUTPUT_DIR"

HEADER_ARGS=()
if [[ -n "${PARITY_HEADER_FILE:-}" && -f "$PARITY_HEADER_FILE" ]]; then
  while IFS= read -r header_line; do
    [[ -z "$header_line" ]] && continue
    [[ "$header_line" =~ ^[[:space:]]*# ]] && continue
    HEADER_ARGS+=(-H "$header_line")
  done <"$PARITY_HEADER_FILE"
fi

BODY_ARGS=()
if [[ -n "${PARITY_BODY_FILE:-}" ]]; then
  BODY_ARGS=(--data-binary "@${PARITY_BODY_FILE}")
fi

send_request() {
  local label="$1"
  local base_url="$2"
  local target_dir="$OUTPUT_DIR/$REQUEST_ID/$label"
  mkdir -p "$target_dir"

  local body_path="$target_dir/response.json"
  local header_path="$target_dir/headers.txt"
  local meta_path="$target_dir/meta.json"
  local tmp_body tmp_headers tmp_stats status_code time_total curl_exit

  tmp_body="$(mktemp)"
  tmp_headers="$(mktemp)"
  tmp_stats="$(mktemp)"
  curl_exit=0
  if curl -sS -X "$METHOD" "$base_url$REQUEST_PATH" \
      -w '%{http_code} %{time_total}\n' \
      -D "$tmp_headers" \
      -o "$tmp_body" \
      "${HEADER_ARGS[@]}" \
      "${BODY_ARGS[@]}" >"$tmp_stats"; then
    read -r status_code time_total <"$tmp_stats"
  else
    curl_exit=$?
    read -r status_code time_total <"$tmp_stats" || true
  fi
  rm -f "$tmp_stats"

  mv "$tmp_body" "$body_path"
  mv "$tmp_headers" "$header_path"

  cat >"$meta_path" <<META
{
  "method": "$METHOD",
  "path": "$REQUEST_PATH",
  "base_url": "$base_url",
  "status_code": ${status_code:-0},
  "time_total": "${time_total:-0}",
  "exit_code": $curl_exit
}
META

  printf '%s %s -> %s (status=%s, time=%s, exit=%s)\n' \
    "$METHOD" "$REQUEST_PATH" "$label" "${status_code:-0}" "${time_total:-0}" "$curl_exit"
}

send_request legacy "$BASE_URL_LEGACY"
send_request modern "$BASE_URL_MODERN"
