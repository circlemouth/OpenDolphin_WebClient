#!/usr/bin/env bash
set -euo pipefail

RUN_ID="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
WORKTREE_NAME="$(basename "$(pwd)")"
CONTAINER_NAME="${CONTAINER_NAME:-opendolphin-postgres-modernized-${WORKTREE_NAME}}"
DB_NAME="${DB_NAME:-opendolphin_modern}"
DB_USER="${DB_USER:-opendolphin}"
SEED_BASE="ops/db/local-baseline"
CONTAINER_SEED_DIR="/tmp/opendolphin-seed-${RUN_ID}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "container not found: $CONTAINER_NAME" >&2
  echo "set CONTAINER_NAME to the target container name." >&2
  exit 1
fi

LOG_DIR="artifacts/preprod/seed/${RUN_ID}"
mkdir -p "$LOG_DIR"

prepare_seed_files() {
  docker exec "$CONTAINER_NAME" mkdir -p "$CONTAINER_SEED_DIR"
  docker cp "${SEED_BASE}/local_synthetic_seed.sql" "${CONTAINER_NAME}:${CONTAINER_SEED_DIR}/local_synthetic_seed.sql"
  docker cp "${SEED_BASE}/e2e_repro_seed.sql" "${CONTAINER_NAME}:${CONTAINER_SEED_DIR}/e2e_repro_seed.sql"
}

run_seed() {
  local label="$1"
  local file="$2"
  local log_path="$3"
  echo "[seed] ${label}: ${file}"
  docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$file" | tee "$log_path"
}

prepare_seed_files
run_seed "baseline" "${CONTAINER_SEED_DIR}/local_synthetic_seed.sql" "${LOG_DIR}/seed-baseline.log"
run_seed "e2e-repro" "${CONTAINER_SEED_DIR}/e2e_repro_seed.sql" "${LOG_DIR}/seed-e2e-repro.log"

echo "seed logs: ${LOG_DIR}"
