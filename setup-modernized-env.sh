#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   WEB_CLIENT_MODE=npm ./setup-modernized-env.sh
#     → モダナイズ版サーバーは Docker で立ち上げつつ、Web クライアントはローカルの
#       npm run dev サーバーで起動します。
#   WEB_CLIENT_MODE=docker ./setup-modernized-env.sh
#     → これまで通り Web クライアントも Docker コンテナとして立ち上げます。
#
# WEB_CLIENT_DEV_HOST / WEB_CLIENT_DEV_PORT で npm モードのホスト/ポートを調整し、
# WEB_CLIENT_DEV_LOG でログパス、VITE_* 系環境変数で Web クライアントの Vite 設定を
# 切り替えられます。

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

normalize_base_path() {
  local raw="${1:-/}"
  if [[ -z "$raw" ]]; then
    raw="/"
  fi
  if [[ "$raw" != /* ]]; then
    raw="/$raw"
  fi
  while [[ "$raw" != "/" && "${raw: -1}" == "/" ]]; do
    raw="${raw%/}"
  done
  if [[ -z "$raw" ]]; then
    raw="/"
  fi
  printf '%s' "$raw"
}

ORCA_INFO_FILE="docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md"
ORCA_CREDENTIAL_FILE="docs/web-client/operations/mac-dev-login.local.md"
CUSTOM_PROP_TEMPLATE="ops/shared/docker/custom.properties"
CUSTOM_PROP_OUTPUT="custom.properties.dev"
COMPOSE_OVERRIDE_FILE="docker-compose.override.dev.yml"
LOCAL_SEED_FILE="ops/db/local-baseline/local_synthetic_seed.sql"
SCHEMA_DUMP_FILE_DEFAULT="artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/legacy_schema_dump.sql"
SCHEMA_DUMP_FILE="${SCHEMA_DUMP_FILE:-$SCHEMA_DUMP_FILE_DEFAULT}"
DB_INIT_REPAIR_SQL_DEFAULT="ops/db/maintenance/modernized_db_init_repair.sql"
DB_INIT_REPAIR_SQL="${DB_INIT_REPAIR_SQL:-$DB_INIT_REPAIR_SQL_DEFAULT}"
DB_INIT_LOG_DIR="${DB_INIT_LOG_DIR:-artifacts/preprod/db-init}"
DB_INIT_RUN_ID="${DB_INIT_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
MODERNIZED_APP_HTTP_PORT="${MODERNIZED_APP_HTTP_PORT:-9080}"
export MODERNIZED_APP_HTTP_PORT
SERVER_HEALTH_URL="http://localhost:${MODERNIZED_APP_HTTP_PORT}/actuator/health"
WORKTREE_CONTAINER_SUFFIX="${WORKTREE_CONTAINER_SUFFIX:-}"
OPENDOLPHIN_SCHEMA_ACTION="${OPENDOLPHIN_SCHEMA_ACTION:-create}"
export OPENDOLPHIN_SCHEMA_ACTION
SCHEMA_INITIALIZED=0

ADMIN_USER="1.3.6.1.4.1.9414.10.1:dolphin"
ADMIN_PASS="36cdf8b887a5cffc78dcd5c08991b993" # dolphin (MD5)

NEW_USER_ID="dolphindev"
NEW_USER_PASS="dolphindev"
NEW_USER_NAME="Dolphin Dev"
FACILITY_ID="1.3.6.1.4.1.9414.10.1"

WEB_CLIENT_MODE="${WEB_CLIENT_MODE:-docker}"
WEB_CLIENT_DEV_HOST="${WEB_CLIENT_DEV_HOST:-localhost}"
WEB_CLIENT_DEV_PORT="${WEB_CLIENT_DEV_PORT:-5173}"
export WEB_CLIENT_DEV_PORT
WEB_CLIENT_DEV_LOG="${WEB_CLIENT_DEV_LOG:-tmp/web-client-dev.log}"
WEB_CLIENT_DEV_LOG_PATH="$WEB_CLIENT_DEV_LOG"
if [[ "${WEB_CLIENT_DEV_LOG_PATH}" != /* ]]; then
  WEB_CLIENT_DEV_LOG_PATH="$SCRIPT_DIR/$WEB_CLIENT_DEV_LOG_PATH"
fi
SCHEMA_DUMP_PATH="$SCHEMA_DUMP_FILE"
if [[ "$SCHEMA_DUMP_PATH" != /* ]]; then
  SCHEMA_DUMP_PATH="$SCRIPT_DIR/$SCHEMA_DUMP_PATH"
fi
DB_INIT_REPAIR_SQL_PATH="$DB_INIT_REPAIR_SQL"
if [[ "$DB_INIT_REPAIR_SQL_PATH" != /* ]]; then
  DB_INIT_REPAIR_SQL_PATH="$SCRIPT_DIR/$DB_INIT_REPAIR_SQL_PATH"
fi
DB_INIT_LOG_DIR_PATH="$DB_INIT_LOG_DIR"
if [[ "$DB_INIT_LOG_DIR_PATH" != /* ]]; then
  DB_INIT_LOG_DIR_PATH="$SCRIPT_DIR/$DB_INIT_LOG_DIR_PATH"
fi
DB_INIT_LOG_FILE="$DB_INIT_LOG_DIR_PATH/db-init-${DB_INIT_RUN_ID}.log"
WEB_CLIENT_DEV_PID_FILE="${WEB_CLIENT_DEV_PID_FILE:-tmp/web-client-dev.pid}"
WEB_CLIENT_DEV_PROXY_TARGET_RAW="${WEB_CLIENT_DEV_PROXY_TARGET:-}"
WEB_CLIENT_DEV_PROXY_TARGET_DEFAULT="http://localhost:${MODERNIZED_APP_HTTP_PORT}/openDolphin/resources"
WEB_CLIENT_DOCKER_PROXY_TARGET_DEFAULT="http://host.docker.internal:${MODERNIZED_APP_HTTP_PORT}/openDolphin/resources"
WEB_CLIENT_DEV_PROXY_TARGET="${WEB_CLIENT_DEV_PROXY_TARGET_RAW:-$WEB_CLIENT_DEV_PROXY_TARGET_DEFAULT}"
WEB_CLIENT_DEV_API_BASE="${WEB_CLIENT_DEV_API_BASE:-/api}"
# ENVs for npm dev server overrides
WEB_CLIENT_ENV_LOCAL="${WEB_CLIENT_ENV_LOCAL:-$SCRIPT_DIR/web-client/.env.local}"
# Normalize mode for bash versions without ${var,,}
WEB_CLIENT_MODE_LOWER="$(printf '%s' "$WEB_CLIENT_MODE" | tr '[:upper:]' '[:lower:]')"
VITE_BASE_PATH_NORMALIZED="$(normalize_base_path "${VITE_BASE_PATH:-/}")"
export VITE_BASE_PATH="$VITE_BASE_PATH_NORMALIZED"

if [[ -z "$WORKTREE_CONTAINER_SUFFIX" ]] && [[ "$SCRIPT_DIR" == *"/.worktrees/"* ]]; then
  WORKTREE_CONTAINER_SUFFIX="$(basename "$SCRIPT_DIR")"
fi
if [[ -n "$WORKTREE_CONTAINER_SUFFIX" ]]; then
  WORKTREE_CONTAINER_SUFFIX="$(printf '%s' "$WORKTREE_CONTAINER_SUFFIX" | tr -c '[:alnum:]-' '-')"
fi

container_name() {
  local base="$1"
  if [[ -n "$WORKTREE_CONTAINER_SUFFIX" ]]; then
    printf '%s-%s' "$base" "$WORKTREE_CONTAINER_SUFFIX"
    return
  fi
  printf '%s' "$base"
}

POSTGRES_CONTAINER_NAME="$(container_name opendolphin-postgres-modernized)"
SERVER_CONTAINER_NAME="$(container_name opendolphin-server-modernized-dev)"
MINIO_CONTAINER_NAME="$(container_name opendolphin-minio)"
DB_REPAIR_APPLIED=0
SEARCH_PATH_FIXED=0

log() {
  echo "[$(date +%H:%M:%S)] $*"
}

normalize_base_path() {
  local raw="${1:-/}"
  if [[ -z "$raw" ]]; then
    raw="/"
  fi
  if [[ "$raw" != /* ]]; then
    raw="/$raw"
  fi
  while [[ "$raw" != "/" && "${raw: -1}" == "/" ]]; do
    raw="${raw%/}"
  done
  if [[ -z "$raw" ]]; then
    raw="/"
  fi
  printf '%s' "$raw"
}

has_modernized_table() {
  local table_name="$1"
  docker exec "${POSTGRES_CONTAINER_NAME}" \
    psql -U opendolphin -d opendolphin_modern -tAc \
    "SELECT 1 FROM information_schema.tables WHERE table_name='${table_name}' AND table_schema IN ('opendolphin','public') LIMIT 1;" \
    | tr -d '[:space:]'
}

read_orca_info() {
  local file_scheme="" file_host="" file_port="" file_user="" file_pass=""
  local regex_auth='Basic auth:[[:space:]]*``([^`]*)``[[:space:]]*/[[:space:]]*``([^`]*)``'

  if [[ -f "$ORCA_INFO_FILE" ]]; then
    log "Reading ORCA connection info from $ORCA_INFO_FILE..."
    local base_url
    base_url="$(grep -Eo 'https?://[^` ]+' "$ORCA_INFO_FILE" | head -n 1 || true)"
    if [[ -n "$base_url" && "$base_url" =~ ^(https?)://([^/:]+)(:([0-9]+))? ]]; then
      file_scheme="${BASH_REMATCH[1]}"
      file_host="${BASH_REMATCH[2]}"
      file_port="${BASH_REMATCH[4]}"
      if [[ -z "$file_port" ]]; then
        if [[ "$file_scheme" == "https" ]]; then
          file_port="443"
        else
          file_port="80"
        fi
      fi
    fi

    if [[ -z "$file_user" || -z "$file_pass" ]]; then
      local info_content
      info_content="$(<"$ORCA_INFO_FILE")"
      if [[ $info_content =~ $regex_auth ]]; then
        file_user="${BASH_REMATCH[1]}"
        file_pass="${BASH_REMATCH[2]}"
      fi
    fi
  else
    log "Warning: ORCA info file not found ($ORCA_INFO_FILE)"
  fi

  if [[ -f "$ORCA_CREDENTIAL_FILE" ]]; then
    local content
    content="$(<"$ORCA_CREDENTIAL_FILE")"
    if [[ $content =~ $regex_auth ]]; then
      file_user="${BASH_REMATCH[1]}"
      file_pass="${BASH_REMATCH[2]}"
    fi
  else
    log "Warning: ORCA credential file not found ($ORCA_CREDENTIAL_FILE)"
  fi

  local fallback_port="${ORCA_API_PORT_FALLBACK:-18080}"

  ORCA_API_SCHEME="${ORCA_API_SCHEME:-$file_scheme}"
  ORCA_API_HOST="${ORCA_API_HOST:-${ORCA_HOST:-$file_host}}"
  ORCA_API_PORT="${ORCA_API_PORT:-${ORCA_PORT:-$file_port}}"
  ORCA_API_USER="${ORCA_API_USER:-${ORCA_USER:-$file_user}}"
  ORCA_API_PASSWORD="${ORCA_API_PASSWORD:-${ORCA_PASS:-$file_pass}}"

  if [[ -z "$ORCA_API_SCHEME" ]]; then
    ORCA_API_SCHEME="http"
  fi

  if [[ -z "$ORCA_API_HOST" ]]; then
    log "Warning: ORCA API host is not set; defaulting to localhost."
    ORCA_API_HOST="localhost"
  fi

  if [[ -z "$ORCA_API_PORT" ]]; then
    log "Warning: ORCA API port is not set; defaulting to $fallback_port."
    ORCA_API_PORT="$fallback_port"
  fi

  if [[ "$ORCA_API_PORT" == "8000" ]]; then
    log "Warning: Port 8000 is disallowed; using $fallback_port instead. Override with ORCA_API_PORT if needed."
    ORCA_API_PORT="$fallback_port"
  fi

  if [[ ! "$ORCA_API_PORT" =~ ^[0-9]+$ ]]; then
    echo "Invalid ORCA API port: $ORCA_API_PORT" >&2
    exit 1
  fi

  log "ORCA API scheme: $ORCA_API_SCHEME"
  log "ORCA API host: $ORCA_API_HOST"
  log "ORCA API port: $ORCA_API_PORT"
  if [[ -n "$ORCA_API_USER" ]]; then
    log "ORCA API user: $ORCA_API_USER"
  fi

  if [[ -z "${ORCA_BASE_URL:-}" ]]; then
    local base="${ORCA_API_SCHEME}://${ORCA_API_HOST}"
    if [[ "$ORCA_API_PORT" != "80" && "$ORCA_API_PORT" != "443" ]]; then
      base="${base}:${ORCA_API_PORT}"
    fi
    ORCA_BASE_URL="$base"
  fi

  if [[ -z "${ORCA_MODE:-}" ]]; then
    local host_lower
    host_lower="$(printf '%s' "$ORCA_API_HOST" | tr '[:upper:]' '[:lower:]')"
    if [[ "$host_lower" == *"weborca"* ]]; then
      ORCA_MODE="weborca"
    else
      ORCA_MODE="onprem"
    fi
  fi

  log "ORCA base url: $ORCA_BASE_URL"
  log "ORCA mode: $ORCA_MODE"
}

generate_custom_properties() {
  log "Generating $CUSTOM_PROP_OUTPUT from $CUSTOM_PROP_TEMPLATE..."
  if [[ ! -f "$CUSTOM_PROP_TEMPLATE" ]]; then
    echo "Template not found: $CUSTOM_PROP_TEMPLATE" >&2
    exit 1
  fi

  local sed_args=(
    -e "s/^orca\\.orcaapi\\.ip=.*/orca.orcaapi.ip=${ORCA_API_HOST}/"
    -e "s/^orca\\.orcaapi\\.port=.*/orca.orcaapi.port=${ORCA_API_PORT}/"
  )
  if [[ -n "$ORCA_API_USER" ]]; then
    sed_args+=(-e "s/^orca\\.id=.*/orca.id=${ORCA_API_USER}/")
  fi
  if [[ -n "$ORCA_API_PASSWORD" ]]; then
    sed_args+=(-e "s/^orca\\.password=.*/orca.password=${ORCA_API_PASSWORD}/")
  fi

  sed "${sed_args[@]}" "$CUSTOM_PROP_TEMPLATE" > "$CUSTOM_PROP_OUTPUT"
  log "custom.properties written to $CUSTOM_PROP_OUTPUT"
}

generate_compose_override() {
  log "Generating $COMPOSE_OVERRIDE_FILE..."
  cat > "$COMPOSE_OVERRIDE_FILE" <<EOF
services:
  server-modernized-dev:
    container_name: ${SERVER_CONTAINER_NAME}
    environment:
      OPENDOLPHIN_ENVIRONMENT: ${OPENDOLPHIN_ENVIRONMENT:-production}
      OPENDOLPHIN_STUB_ENDPOINTS_MODE: ${OPENDOLPHIN_STUB_ENDPOINTS_MODE:-block}
      ORCA_API_SCHEME: ${ORCA_API_SCHEME}
      ORCA_BASE_URL: ${ORCA_BASE_URL}
      ORCA_MODE: ${ORCA_MODE}
      OPENDOLPHIN_SCHEMA_ACTION: ${OPENDOLPHIN_SCHEMA_ACTION}
      JAVA_OPTS_APPEND: \${JAVA_OPTS_APPEND:-} -Dhibernate.hbm2ddl.auto=${OPENDOLPHIN_SCHEMA_ACTION} -Djakarta.persistence.schema-generation.database.action=${OPENDOLPHIN_SCHEMA_ACTION} -Dmicrometer.export.otlp.enabled=false -Dio.micrometer.export.otlp.enabled=false -Dotlp.enabled=false -Dotel.metrics.exporter=none -Dotel.sdk.disabled=true
    volumes:
      - ./$(basename "$CUSTOM_PROP_OUTPUT"):/opt/jboss/wildfly/custom.properties
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:8080/actuator/health >/dev/null"]
      interval: 30s
      timeout: 10s
      retries: 5
  db-modernized:
    container_name: ${POSTGRES_CONTAINER_NAME}
  minio:
    container_name: ${MINIO_CONTAINER_NAME}
EOF
  log "docker-compose override written to $COMPOSE_OVERRIDE_FILE"
}

start_modernized_server() {
  log "Starting Modernized Server..."
  docker compose -f docker-compose.modernized.dev.yml -f "$COMPOSE_OVERRIDE_FILE" up -d
}

schema_table_exists() {
  local table_name="$1"
  docker exec "${POSTGRES_CONTAINER_NAME}" \
    psql -U opendolphin -d opendolphin_modern -tAc \
    "SELECT to_regclass('${table_name}') IS NOT NULL;" \
    | tr -d '[:space:]'
}

wait_for_postgres_ready() {
  local retries="${1:-30}"
  for _ in $(seq 1 "$retries"); do
    if docker exec "${POSTGRES_CONTAINER_NAME}" pg_isready -U opendolphin >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

ensure_search_path() {
  local current_path
  current_path="$(docker exec "${POSTGRES_CONTAINER_NAME}" \
    psql -U opendolphin -d opendolphin_modern -tAc "SHOW search_path;" \
    | tr -d '[:space:]')"
  if [[ "$current_path" != *"opendolphin"* || "$current_path" != *"public"* ]]; then
    log "Fixing search_path (current=${current_path:-unknown})..."
    docker exec "${POSTGRES_CONTAINER_NAME}" \
      psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 \
      -c "ALTER ROLE opendolphin SET search_path TO opendolphin,public;"
    SEARCH_PATH_FIXED=1
  else
    log "search_path is already set: $current_path"
  fi
}

run_db_init_repair() {
  if [[ ! -f "$DB_INIT_REPAIR_SQL_PATH" ]]; then
    echo "DB init repair SQL not found: $DB_INIT_REPAIR_SQL_PATH" >&2
    exit 1
  fi
  mkdir -p "$DB_INIT_LOG_DIR_PATH"
  docker cp "$DB_INIT_REPAIR_SQL_PATH" "${POSTGRES_CONTAINER_NAME}":/tmp/modernized_db_init_repair.sql
  log "Running DB init repair SQL... (log: $DB_INIT_LOG_FILE)"
  docker exec "${POSTGRES_CONTAINER_NAME}" \
    psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 \
    -f /tmp/modernized_db_init_repair.sql | tee "$DB_INIT_LOG_FILE"
  DB_REPAIR_APPLIED=1
}

check_db_baseline() {
  local missing=0
  local required_any_schema_tables=(
    "d_users"
    "d_audit_event"
  )
  local required_sequences=(
    "opendolphin.hibernate_sequence"
    "opendolphin.d_patient_seq"
    "opendolphin.d_karte_seq"
    "opendolphin.d_audit_event_id_seq"
  )

  local current_path
  current_path="$(docker exec "${POSTGRES_CONTAINER_NAME}" \
    psql -U opendolphin -d opendolphin_modern -tAc "SHOW search_path;" \
    | tr -d '[:space:]')"
  if [[ "$current_path" != *"opendolphin"* || "$current_path" != *"public"* ]]; then
    log "search_path is missing required schemas: ${current_path:-unknown}"
    missing=1
  fi

  for table in "${required_any_schema_tables[@]}"; do
    if [[ "$(schema_table_exists "opendolphin.${table}")" != "t" && "$(schema_table_exists "public.${table}")" != "t" ]]; then
      log "Missing required table: ${table} (opendolphin/public)"
      missing=1
    fi
  done

  for seq in "${required_sequences[@]}"; do
    if [[ "$(schema_table_exists "$seq")" != "t" ]]; then
      log "Missing required sequence: $seq"
      missing=1
    fi
  done

  if [[ "$missing" -ne 0 ]]; then
    echo "DB baseline check failed. Review $DB_INIT_LOG_FILE for details." >&2
    exit 1
  fi
}

initialize_schema_if_needed() {
  if ! wait_for_postgres_ready 30; then
    echo "Postgres did not become ready in time." >&2
    exit 1
  fi

  local has_users
  has_users="$(schema_table_exists public.d_users)"
  if [[ "$has_users" == "t" ]]; then
    log "DB schema already initialized."
    return
  fi

  if [[ ! -f "$SCHEMA_DUMP_PATH" ]]; then
    echo "Schema dump not found: $SCHEMA_DUMP_PATH" >&2
    echo "DB initialization requires legacy schema dump. Aborting." >&2
    exit 1
  fi

  log "Initializing DB schema from legacy schema dump..."
  sed 's/^CREATE SCHEMA opendolphin;/CREATE SCHEMA IF NOT EXISTS opendolphin;/' "$SCHEMA_DUMP_PATH" | \
    docker exec -i "${POSTGRES_CONTAINER_NAME}" psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1
  SCHEMA_INITIALIZED=1
  log "Schema initialization completed."
}

wait_for_server() {
  log "Waiting for server to be healthy..."
  local retries=60
  local success=0
  for _ in $(seq 1 "$retries"); do
    local status
    status=$(curl -s -o /dev/null -w '%{http_code}' "$SERVER_HEALTH_URL" || true)
    if [[ "$status" == "200" ]]; then
      success=1
      break
    fi
    printf "."
    sleep 5
  done
  echo ""

  if [[ "$success" -ne 1 ]]; then
    echo "Server failed to start within timeout." >&2
    exit 1
  fi
  log "Server is UP!"
}

apply_baseline_seed() {
  log "Applying local baseline seed ($LOCAL_SEED_FILE)..."
  if [[ ! -f "$LOCAL_SEED_FILE" ]]; then
    echo "Seed file not found: $LOCAL_SEED_FILE" >&2
    exit 1
  fi
  if [[ "$(has_modernized_table d_facility)" != "1" ]]; then
    log "Warning: d_facility table not found; skipping baseline seed. Initialize DB schema first."
    return
  fi
  docker cp "$LOCAL_SEED_FILE" "${POSTGRES_CONTAINER_NAME}":/tmp/modern_seed.sql
  docker exec "${POSTGRES_CONTAINER_NAME}" psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /tmp/modern_seed.sql
  log "Baseline seed applied."
}

register_initial_user() {
  log "Registering initial user ($NEW_USER_ID) via SQL..."
  if [[ "$(has_modernized_table d_users)" != "1" ]]; then
    log "Warning: d_users table not found; skipping initial user registration."
    return
  fi
  local pass_hash
  pass_hash=$(printf "%s" "$NEW_USER_PASS" | md5sum | awk '{print $1}')

  local tmp_sql
  tmp_sql=$(mktemp)
  cat > "$tmp_sql" <<EOF
SET search_path = public;

-- Ensure hibernate_sequence exists and is aligned
DO \$\$
DECLARE
    max_id BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'hibernate_sequence' AND relkind = 'S'
    ) THEN
        CREATE SEQUENCE IF NOT EXISTS hibernate_sequence
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
    END IF;

    SELECT GREATEST(
        COALESCE((SELECT max(id) FROM d_facility), 0),
        COALESCE((SELECT max(id) FROM d_users), 0),
        COALESCE((SELECT max(id) FROM d_roles), 0),
        1
    ) INTO max_id;

    PERFORM setval('hibernate_sequence', max_id, true);
END\$\$;

-- Create facility if missing
INSERT INTO d_facility (id, facilityid, facilityname, membertype, registereddate, zipcode, address, telephone)
SELECT nextval('hibernate_sequence'), '$FACILITY_ID', 'OpenDolphin Clinic', 'PROCESS', now(), '000-0000', 'Tokyo', '03-0000-0000'
WHERE NOT EXISTS (SELECT 1 FROM d_facility WHERE facilityid = '$FACILITY_ID');

-- Create user if missing
INSERT INTO d_users (
    id, userid, password, commonname, facility_id, membertype, registereddate,
    sirname, givenname, email
)
SELECT
    nextval('hibernate_sequence'),
    '$FACILITY_ID:$NEW_USER_ID',
    '$pass_hash',
    '$NEW_USER_NAME',
    (SELECT id FROM d_facility WHERE facilityid = '$FACILITY_ID'),
    'PROCESS',
    now(),
    'Dolphin', 'Dev', 'dev@example.com'
WHERE NOT EXISTS (SELECT 1 FROM d_users WHERE userid = '$FACILITY_ID:$NEW_USER_ID');

-- Create roles if missing
INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'admin', '$FACILITY_ID:$NEW_USER_ID', id
FROM d_users WHERE userid = '$FACILITY_ID:$NEW_USER_ID'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$FACILITY_ID:$NEW_USER_ID' AND c_role = 'admin');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'user', '$FACILITY_ID:$NEW_USER_ID', id
FROM d_users WHERE userid = '$FACILITY_ID:$NEW_USER_ID'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$FACILITY_ID:$NEW_USER_ID' AND c_role = 'user');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'doctor', '$FACILITY_ID:$NEW_USER_ID', id
FROM d_users WHERE userid = '$FACILITY_ID:$NEW_USER_ID'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$FACILITY_ID:$NEW_USER_ID' AND c_role = 'doctor');
EOF

  docker cp "$tmp_sql" "${POSTGRES_CONTAINER_NAME}":/tmp/modern_user_seed.sql
  docker exec "${POSTGRES_CONTAINER_NAME}" psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /tmp/modern_user_seed.sql
  rm -f "$tmp_sql"
  log "User registration SQL executed successfully."
}

stop_existing_web_client_dev_server() {
  if [[ -f "$WEB_CLIENT_DEV_PID_FILE" ]]; then
    local existing_pid
    existing_pid="$(<"$WEB_CLIENT_DEV_PID_FILE" || true)"
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" >/dev/null 2>&1; then
      log "Stopping existing Web Client dev server PID $existing_pid..."
      kill "$existing_pid"
      for _ in {1..5}; do
        if kill -0 "$existing_pid" >/dev/null 2>&1; then
          sleep 1
          continue
        fi
        break
      done
      if kill -0 "$existing_pid" >/dev/null 2>&1; then
        log "Forcing stop of Web Client dev server PID $existing_pid..."
        kill -9 "$existing_pid"
      fi
    fi
    rm -f "$WEB_CLIENT_DEV_PID_FILE"
  fi

  if command -v lsof >/dev/null 2>&1; then
    local port_pids
    port_pids=$(lsof -t -iTCP:"$WEB_CLIENT_DEV_PORT" -sTCP:LISTEN || true)
    for pid in $port_pids; do
      if [[ -n "$pid" ]]; then
        log "Clearing lingering listener on port $WEB_CLIENT_DEV_PORT (PID $pid)..."
        kill "$pid" >/dev/null 2>&1 || true
      fi
    done
  else
    local fallback_pid
    fallback_pid=$(pgrep -f "npm run dev -- --host .*${WEB_CLIENT_DEV_PORT}" || true)
    if [[ -n "$fallback_pid" ]]; then
      log "Killing fallback npm dev process PID $fallback_pid..."
      kill "$fallback_pid" >/dev/null 2>&1 || true
    fi
  fi
}

start_web_client_docker() {
  log "Starting Web Client container via docker-compose..."
  local dev_proxy_target="${WEB_CLIENT_DEV_PROXY_TARGET_RAW:-$WEB_CLIENT_DOCKER_PROXY_TARGET_DEFAULT}"
  local dev_enable_legacy_header_auth="${VITE_ENABLE_LEGACY_HEADER_AUTH:-0}"
  local dev_allow_legacy_header_auth_fallback="${VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK:-1}"
  local dev_enable_facility_header="${VITE_ENABLE_FACILITY_HEADER:-1}"
  local base_path="$VITE_BASE_PATH_NORMALIZED"
  VITE_DEV_PROXY_TARGET="$dev_proxy_target" \
    VITE_ENABLE_LEGACY_HEADER_AUTH="$dev_enable_legacy_header_auth" \
    VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK="$dev_allow_legacy_header_auth_fallback" \
    VITE_ENABLE_FACILITY_HEADER="$dev_enable_facility_header" \
    VITE_API_BASE_URL="$WEB_CLIENT_DEV_API_BASE" \
    VITE_BASE_PATH="$base_path" \
    docker compose -f docker-compose.web-client.yml up -d
}

start_web_client_npm() {
  log "Starting Web Client dev server via npm run dev..."
  mkdir -p "$(dirname "$WEB_CLIENT_DEV_LOG_PATH")"
  stop_existing_web_client_dev_server

  local dev_proxy_target="$WEB_CLIENT_DEV_PROXY_TARGET"
  local dev_use_https="${VITE_DEV_USE_HTTPS:-0}"
  local dev_disable_msw="${VITE_DISABLE_MSW:-1}"
  local dev_enable_telemetry="${VITE_ENABLE_TELEMETRY:-0}"
  local dev_disable_security="${VITE_DISABLE_SECURITY:-0}"
  local dev_disable_audit="${VITE_DISABLE_AUDIT:-0}"
  local dev_enable_legacy_header_auth="${VITE_ENABLE_LEGACY_HEADER_AUTH:-0}"
  local dev_allow_legacy_header_auth_fallback="${VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK:-1}"
  local dev_enable_facility_header="${VITE_ENABLE_FACILITY_HEADER:-1}"
  local dev_api_base_url="${WEB_CLIENT_DEV_API_BASE:-/api}"
  local dev_orca_master_user="${VITE_ORCA_MASTER_USER:-1.3.6.1.4.1.9414.70.1:admin}"
  local dev_orca_master_password="${VITE_ORCA_MASTER_PASSWORD:-21232f297a57a5a743894a0e4a801fc3}"
  local base_path="$VITE_BASE_PATH_NORMALIZED"

  local npm_env_dir="tmp/web-client-vite-env"
  rm -rf "$npm_env_dir"
  mkdir -p "$npm_env_dir"
  cat > "$npm_env_dir/.env" <<EOF
VITE_API_BASE_URL=$dev_api_base_url
VITE_HTTP_TIMEOUT_MS=10000
VITE_HTTP_MAX_RETRIES=2
VITE_DEV_PROXY_TARGET=$dev_proxy_target
VITE_DEV_USE_HTTPS=$dev_use_https
VITE_DISABLE_MSW=$dev_disable_msw
VITE_ENABLE_TELEMETRY=$dev_enable_telemetry
VITE_DISABLE_SECURITY=$dev_disable_security
VITE_DISABLE_AUDIT=$dev_disable_audit
VITE_ENABLE_LEGACY_HEADER_AUTH=$dev_enable_legacy_header_auth
VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK=$dev_allow_legacy_header_auth_fallback
VITE_ENABLE_FACILITY_HEADER=$dev_enable_facility_header
VITE_ORCA_MASTER_USER=$dev_orca_master_user
VITE_ORCA_MASTER_PASSWORD=$dev_orca_master_password
VITE_BASE_PATH=$base_path
EOF
  mkdir -p "$(dirname "$WEB_CLIENT_ENV_LOCAL")"
  cp "$npm_env_dir/.env" "$WEB_CLIENT_ENV_LOCAL"

  local npm_pid
  npm_pid=$(
    cd web-client
    VITE_DEV_PROXY_TARGET="$dev_proxy_target" \
      VITE_DEV_USE_HTTPS="$dev_use_https" \
      VITE_DISABLE_MSW="$dev_disable_msw" \
      VITE_ENABLE_TELEMETRY="$dev_enable_telemetry" \
      VITE_DISABLE_SECURITY="$dev_disable_security" \
      VITE_DISABLE_AUDIT="$dev_disable_audit" \
      VITE_ENABLE_LEGACY_HEADER_AUTH="$dev_enable_legacy_header_auth" \
      VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK="$dev_allow_legacy_header_auth_fallback" \
      VITE_ENABLE_FACILITY_HEADER="$dev_enable_facility_header" \
      VITE_ORCA_MASTER_USER="$dev_orca_master_user" \
      VITE_ORCA_MASTER_PASSWORD="$dev_orca_master_password" \
      VITE_API_BASE_URL="$dev_api_base_url" \
      VITE_BASE_PATH="$base_path" \
      nohup npm run dev -- --host "$WEB_CLIENT_DEV_HOST" --port "$WEB_CLIENT_DEV_PORT" > "$WEB_CLIENT_DEV_LOG_PATH" 2>&1 &
    printf "%s" "$!"
  )
  printf "%s" "$npm_pid" > "$WEB_CLIENT_DEV_PID_FILE"

  log "Web Client dev server PID $npm_pid, logs at $WEB_CLIENT_DEV_LOG_PATH"
  log "Tail the log via 'tail -f $WEB_CLIENT_DEV_LOG' to watch the dev server output."
}

start_web_client() {
  case "$WEB_CLIENT_MODE_LOWER" in
    npm* | dev*)
      start_web_client_npm
      ;;
    *)
      start_web_client_docker
      ;;
  esac
}

main() {
  read_orca_info
  generate_custom_properties
  generate_compose_override
  start_modernized_server
  initialize_schema_if_needed
  ensure_search_path
  run_db_init_repair
  check_db_baseline
  if [[ "$SCHEMA_INITIALIZED" -eq 1 || "$DB_REPAIR_APPLIED" -eq 1 || "$SEARCH_PATH_FIXED" -eq 1 ]]; then
    log "Restarting Modernized Server to pick up initialized schema..."
    docker restart "${SERVER_CONTAINER_NAME}" >/dev/null
  fi
  wait_for_server
  apply_baseline_seed
  register_initial_user
  start_web_client
  if [[ "$WEB_CLIENT_MODE_LOWER" == npm* || "$WEB_CLIENT_MODE_LOWER" == dev* ]]; then
    log "All set! Web Client dev server is listening at http://${WEB_CLIENT_DEV_HOST}:${WEB_CLIENT_DEV_PORT}"
    log "Logs: $WEB_CLIENT_DEV_LOG_PATH"
  else
    log "All set! Web Client is running at http://localhost:${WEB_CLIENT_DEV_PORT}"
  fi
  log "Login with User: $NEW_USER_ID / Pass: $NEW_USER_PASS"
}

# ---------------------------------------------------------
# ログイン情報 (開発用)
# 施設ID: 1.3.6.1.4.1.9414.10.1
# ユーザーID: dolphindev
# パスワード: dolphindev
#
# 医師アカウント (既存)
# 施設ID: 1.3.6.1.4.1.9414.72.103
# ユーザーID: doctor1
# パスワード: doctor2025
# ---------------------------------------------------------

main "$@"
