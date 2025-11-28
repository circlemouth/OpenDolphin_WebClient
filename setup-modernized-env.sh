#!/usr/bin/env bash
set -euo pipefail

ORCA_INFO_FILE="docs/web-client/operations/mac-dev-login.local.md"
CUSTOM_PROP_TEMPLATE="ops/shared/docker/custom.properties"
CUSTOM_PROP_OUTPUT="custom.properties.dev"
COMPOSE_OVERRIDE_FILE="docker-compose.override.dev.yml"
LOCAL_SEED_FILE="ops/db/local-baseline/local_synthetic_seed.sql"
SERVER_HEALTH_URL="http://localhost:9080/openDolphin/resources/dolphin"

ADMIN_USER="1.3.6.1.4.1.9414.10.1:dolphin"
ADMIN_PASS="36cdf8b887a5cffc78dcd5c08991b993" # dolphin (MD5)

NEW_USER_ID="dolphindev"
NEW_USER_PASS="dolphindev"
NEW_USER_NAME="Dolphin Dev"
FACILITY_ID="1.3.6.1.4.1.9414.10.1"

log() {
  echo "[$(date +%H:%M:%S)] $*"
}

read_orca_info() {
  local file_host="" file_port="" file_user="" file_pass=""
  local regex_base='Base URL:[[:space:]]*``http://([^:]+):([0-9]+)``'
  local regex_auth='Basic auth:[[:space:]]*``([^`]*)``[[:space:]]*/[[:space:]]*``([^`]*)``'

  if [[ -f "$ORCA_INFO_FILE" ]]; then
    log "Reading ORCA connection info from $ORCA_INFO_FILE..."
    local content
    content="$(<"$ORCA_INFO_FILE")"
    if [[ $content =~ $regex_base ]]; then
      file_host="${BASH_REMATCH[1]}"
      file_port="${BASH_REMATCH[2]}"
    fi
    if [[ $content =~ $regex_auth ]]; then
      file_user="${BASH_REMATCH[1]}"
      file_pass="${BASH_REMATCH[2]}"
    fi
  else
    log "Warning: ORCA info file not found ($ORCA_INFO_FILE)"
  fi

  local fallback_port="${ORCA_PORT_FALLBACK:-18080}"

  ORCA_HOST="${ORCA_HOST:-$file_host}"
  ORCA_PORT="${ORCA_PORT:-$file_port}"
  ORCA_USER="${ORCA_USER:-$file_user}"
  ORCA_PASS="${ORCA_PASS:-$file_pass}"

  if [[ -z "$ORCA_HOST" ]]; then
    log "Warning: ORCA host is not set; defaulting to localhost."
    ORCA_HOST="localhost"
  fi

  if [[ -z "$ORCA_PORT" ]]; then
    log "Warning: ORCA port is not set; defaulting to $fallback_port."
    ORCA_PORT="$fallback_port"
  fi

  if [[ "$ORCA_PORT" == "8000" ]]; then
    log "Warning: Port 8000 is disallowed; using $fallback_port instead. Override with ORCA_PORT if needed."
    ORCA_PORT="$fallback_port"
  fi

  if [[ ! "$ORCA_PORT" =~ ^[0-9]+$ ]]; then
    echo "Invalid ORCA port: $ORCA_PORT" >&2
    exit 1
  fi

  log "ORCA host: $ORCA_HOST"
  log "ORCA port: $ORCA_PORT"
  if [[ -n "$ORCA_USER" ]]; then
    log "ORCA user: $ORCA_USER"
  fi
}

generate_custom_properties() {
  log "Generating $CUSTOM_PROP_OUTPUT from $CUSTOM_PROP_TEMPLATE..."
  if [[ ! -f "$CUSTOM_PROP_TEMPLATE" ]]; then
    echo "Template not found: $CUSTOM_PROP_TEMPLATE" >&2
    exit 1
  fi

  local sed_args=(
    -e "s/^claim\\.host=.*/claim.host=${ORCA_HOST}/"
    -e "s/^claim\\.send\\.port=.*/claim.send.port=${ORCA_PORT}/"
  )
  if [[ -n "$ORCA_USER" ]]; then
    sed_args+=(-e "s/^claim\\.user=.*/claim.user=${ORCA_USER}/")
  fi
  if [[ -n "$ORCA_PASS" ]]; then
    sed_args+=(-e "s/^claim\\.password=.*/claim.password=${ORCA_PASS}/")
  fi

  sed "${sed_args[@]}" "$CUSTOM_PROP_TEMPLATE" > "$CUSTOM_PROP_OUTPUT"
  log "custom.properties written to $CUSTOM_PROP_OUTPUT"
}

generate_compose_override() {
  log "Generating $COMPOSE_OVERRIDE_FILE..."
  cat > "$COMPOSE_OVERRIDE_FILE" <<EOF
services:
  server-modernized-dev:
    volumes:
      - ./$(basename "$CUSTOM_PROP_OUTPUT"):/opt/jboss/wildfly/custom.properties
EOF
  log "docker-compose override written to $COMPOSE_OVERRIDE_FILE"
}

start_modernized_server() {
  log "Starting Modernized Server..."
  docker compose -f docker-compose.modernized.dev.yml -f "$COMPOSE_OVERRIDE_FILE" up -d
}

wait_for_server() {
  log "Waiting for server to be healthy..."
  local retries=60
  local success=0
  for _ in $(seq 1 "$retries"); do
    local status
    status=$(curl -s -o /dev/null -w '%{http_code}' \
      -H "userName: $ADMIN_USER" \
      -H "password: $ADMIN_PASS" \
      "$SERVER_HEALTH_URL" || true)
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
  docker cp "$LOCAL_SEED_FILE" opendolphin-postgres-modernized:/tmp/modern_seed.sql
  docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /tmp/modern_seed.sql
  log "Baseline seed applied."
}

register_initial_user() {
  log "Registering initial user ($NEW_USER_ID) via SQL..."
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
    '$NEW_USER_ID',
    '$pass_hash',
    '$NEW_USER_NAME',
    (SELECT id FROM d_facility WHERE facilityid = '$FACILITY_ID'),
    'PROCESS',
    now(),
    'Dolphin', 'Dev', 'dev@example.com'
WHERE NOT EXISTS (SELECT 1 FROM d_users WHERE userid = '$NEW_USER_ID');

-- Create roles if missing
INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'admin', '$NEW_USER_ID', id
FROM d_users WHERE userid = '$NEW_USER_ID'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$NEW_USER_ID' AND c_role = 'admin');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'user', '$NEW_USER_ID', id
FROM d_users WHERE userid = '$NEW_USER_ID'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$NEW_USER_ID' AND c_role = 'user');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'doctor', '$NEW_USER_ID', id
FROM d_users WHERE userid = '$NEW_USER_ID'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$NEW_USER_ID' AND c_role = 'doctor');
EOF

  docker cp "$tmp_sql" opendolphin-postgres-modernized:/tmp/modern_user_seed.sql
  docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /tmp/modern_user_seed.sql
  rm -f "$tmp_sql"
  log "User registration SQL executed successfully."
}

start_web_client() {
  log "Starting Web Client..."
  docker compose -f docker-compose.web-client.yml up -d
}

main() {
  read_orca_info
  generate_custom_properties
  generate_compose_override
  start_modernized_server
  wait_for_server
  apply_baseline_seed
  register_initial_user
  start_web_client
  log "All set! Web Client is running at http://localhost:5173"
  log "Login with User: $NEW_USER_ID / Pass: $NEW_USER_PASS"
}

main "$@"
