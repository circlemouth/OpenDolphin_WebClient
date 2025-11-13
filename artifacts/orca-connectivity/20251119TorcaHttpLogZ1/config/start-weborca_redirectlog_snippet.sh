DB_CONF_PATH="/opt/jma/weborca/conf/db.conf"
STATE_DIR="/var/lib/orca"
SETUP_DONE_FLAG="${STATE_DIR}/.jma_setup_done"
PASSWD_DONE_FLAG="${STATE_DIR}/.ormaster_password_done"
SCHEMA_DONE_FLAG="${STATE_DIR}/.schema_checked"
TMP_DIR="/tmp/weborca"

mkdir -p "${STATE_DIR}" "${TMP_DIR}"

ensure_http_log_dir() {
    local link_dir="/var/log/orca"
    mkdir -p "${ORCA_LOG_ROOT}"
    if [[ -L "${link_dir}" ]]; then
        return
    fi
    if [[ -e "${link_dir}" ]]; then
        return
    fi
    ln -s "${ORCA_LOG_ROOT}" "${link_dir}"
}

prepare_redirect_log() {
    ensure_http_log_dir
    local target="${REDIRECTLOG:-$DEFAULT_HTTP_LOG}"
    local target_dir
    target_dir="$(dirname "${target}")"
    mkdir -p "${target_dir}"
    touch "${target}"
    chown orca:orca "${target_dir}" "${target}" 2>/dev/null || true
    if [[ "${target_dir}" == "/var/log/orca" ]]; then
        local link_target
        link_target="$(basename "${target}")"
        ln -sf "${link_target}" /var/log/orca/orca_http.log
    fi
    export REDIRECTLOG="${target}"
}

wait_for_db() {
    local elapsed=0
    log "Waiting for PostgreSQL at ${ORCA_DB_HOST}:${ORCA_DB_PORT} (timeout: ${ORCA_DB_WAIT_SECONDS}s)"
    until PGPASSWORD="${ORCA_DB_PASS}" pg_isready -h "${ORCA_DB_HOST}" -p "${ORCA_DB_PORT}" -U "${ORCA_DB_USER}" >/dev/null 2>&1; do
        sleep 5
        elapsed=$((elapsed + 5))
        if (( elapsed >= ORCA_DB_WAIT_SECONDS )); then
            log "PostgreSQL not reachable after ${ORCA_DB_WAIT_SECONDS}s"
            exit 1
        fi
    done
    log "PostgreSQL is reachable"
}

write_db_conf() {
    log "Rendering ${DB_CONF_PATH}"
    cat <<CONF > "${DB_CONF_PATH}"
DBHOST="${ORCA_DB_HOST}"
DBPORT="${ORCA_DB_PORT}"
DBNAME="${ORCA_DB_NAME}"
