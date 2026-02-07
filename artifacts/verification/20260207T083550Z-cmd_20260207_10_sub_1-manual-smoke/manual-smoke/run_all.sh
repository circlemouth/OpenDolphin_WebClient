#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

FACILITY_ID="${FACILITY_ID:-1.3.6.1.4.1.9414.72.103}"
USER_ID="${USER_ID:-doctor1}"
PASSWORD="${PASSWORD:-doctor2025}"

run_case() {
  local label="$1"
  local port="$2"
  local stamp_phase="$3"
  local order_mvp="$4"
  local rec_phase="$5"

  local out_dir="$BASE_DIR/$label"
  mkdir -p "$out_dir"

  local base_url="http://localhost:${port}"
  local vite_log="$out_dir/vite.log"

  echo "[${label}] start vite on ${base_url}" | tee "$out_dir/run.log"
  (
    cd "$BASE_DIR/../../../../web-client"
    VITE_DISABLE_MSW=0 \
    VITE_STAMPBOX_MVP="$stamp_phase" \
    VITE_ORDER_EDIT_MVP="$order_mvp" \
    VITE_RECEPTION_STATUS_MVP="$rec_phase" \
    npm run dev -- --host --port "$port" >"$vite_log" 2>&1
  ) &
  local vite_pid="$!"
  echo "$vite_pid" > "$out_dir/vite.pid"

  for i in $(seq 1 40); do
    if curl -sf "$base_url/" >/dev/null; then
      echo "[${label}] vite ready in ${i}s" | tee -a "$out_dir/run.log"
      break
    fi
    sleep 1
    if ! kill -0 "$vite_pid" 2>/dev/null; then
      echo "[${label}] vite exited early (pid=${vite_pid}). tail log:" | tee -a "$out_dir/run.log"
      tail -n 40 "$vite_log" | tee -a "$out_dir/run.log" || true
      return 1
    fi
  done

  node "$BASE_DIR/smoke.mjs" \
    --baseUrl "$base_url" \
    --outDir "$out_dir" \
    --facilityId "$FACILITY_ID" \
    --userId "$USER_ID" \
    --password "$PASSWORD" \
    --label "$label" \
    --flagsJson "$(jq -cn \
      --arg port "$port" \
      --arg baseUrl "$base_url" \
      --arg stampbox "$stamp_phase" \
      --arg orderEditMvp "$order_mvp" \
      --arg receptionStatus "$rec_phase" \
      '{port:($port|tonumber),baseUrl:$baseUrl,VITE_DISABLE_MSW:0,VITE_STAMPBOX_MVP:($stampbox|tonumber),VITE_ORDER_EDIT_MVP:$orderEditMvp,VITE_RECEPTION_STATUS_MVP:($receptionStatus|tonumber)}')"

  echo "[${label}] stop vite pid=${vite_pid}" | tee -a "$out_dir/run.log"
  kill "$vite_pid" 2>/dev/null || true
  for _ in $(seq 1 10); do
    if kill -0 "$vite_pid" 2>/dev/null; then sleep 0.3; else break; fi
  done
  kill -9 "$vite_pid" 2>/dev/null || true
}

command -v jq >/dev/null 2>&1 || { echo "jq is required"; exit 1; }

run_case baseline 4173 0 0 0
run_case mvp1 4174 1 1 1
run_case mvp2 4175 2 1 2

echo "ok"
