#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
usage: ops/tools/send_parallel_request.sh METHOD PATH [ID]

必須:
  METHOD   HTTP メソッド (GET/POST/PUT/DELETE など)
  PATH     リクエストパス。先頭に / が無い場合は自動で付与。
任意:
  ID       保存ディレクトリ名。省略時は METHOD+PATH をサニタイズして使用。

環境変数:
  BASE_URL_LEGACY   旧サーバーのベース URL (default: http://localhost:8080)
  BASE_URL_MODERN   モダナイズ版サーバーのベース URL (default: http://localhost:18080)
  PARITY_OUTPUT_DIR 保存先ルート (default: artifacts/parity-manual)
  PARITY_HEADER_FILE 追加ヘッダーを 1 行 1 ヘッダーで記述したファイル
  PARITY_BODY_FILE    --data-binary で送信するボディファイル
USAGE
}

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
      -w '%{http_code} %{time_total}' \
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
