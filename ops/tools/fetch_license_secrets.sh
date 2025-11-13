#!/usr/bin/env bash
# Vault 上のライセンスシークレットを取得し、license.properties と POST ボディを生成して WildFly へ配備する。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEFAULT_WORK_DIR="${REPO_ROOT}/tmp/license"
DEFAULT_ARTIFACT_ROOT="${REPO_ROOT}/artifacts/parity-manual/license"

RUN_ID=""
VAULT_PATH="kv/modernized-server/license/dev"
WORK_DIR="${DEFAULT_WORK_DIR}"
ARTIFACT_DIR=""
LEGACY_CONTAINER="opendolphin-server"
MODERN_CONTAINER="opendolphin-server-modernized-dev"
TARGET_LICENSE_PATH="/opt/jboss/wildfly/license.properties"
LINK_LICENSE_PATH="/etc/opendolphin/license/license.properties"
SKIP_LEGACY=0
SKIP_MODERN=0
DRY_RUN=0
LOG_JSON=0

usage() {
  cat <<'USAGE'
usage:
  ops/tools/fetch_license_secrets.sh [options]

options:
  --run-id VALUE             追跡用 RUN_ID（default: UTC 時刻で自動生成）
  --vault-path PATH          Vault kv パス（default: kv/modernized-server/license/dev）
  --work-dir DIR             license.properties / POST ボディの生成先（default: tmp/license）
  --artifact-dir DIR         生成結果をコピーする artifacts ルート（default: 未指定）
  --legacy-container NAME    Legacy WildFly コンテナ名（default: opendolphin-server）
  --modern-container NAME    Modernized WildFly コンテナ名（default: opendolphin-server-modernized-dev）
  --target-path PATH         WildFly 内の license.properties 配置先（default: /opt/jboss/wildfly/license.properties）
  --link-path PATH           WildFly 内で張り直すシンボリックリンク（default: /etc/opendolphin/license/license.properties）
  --skip-legacy              Legacy への配備をスキップ
  --skip-modern              Modernized への配備をスキップ
  --dry-run                  Vault 取得とファイル生成のみ行い docker cp/exec は実行しない
  --log-json                 取得した Vault JSON を WORK_DIR/vault_secret.json に保存
  -h, --help                 このメッセージを表示

環境変数:
  VAULT_ADDR, VAULT_TOKEN    vault CLI と同じ指定を利用（必須）。
  FETCH_LICENSE_RUN_ID       --run-id を省略した場合の既定値として利用。
USAGE
}

log_info() { printf '[INFO] %s\n' "$*"; }
log_warn() { printf '[WARN] %s\n' "$*" >&2; }
abort() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || abort "${cmd} コマンドが見つかりません"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --run-id)
        [[ $# -ge 2 ]] || abort "--run-id の後に値を指定してください"
        RUN_ID="$2"
        shift 2
        ;;
      --vault-path)
        [[ $# -ge 2 ]] || abort "--vault-path の後にパスを指定してください"
        VAULT_PATH="$2"
        shift 2
        ;;
      --work-dir)
        [[ $# -ge 2 ]] || abort "--work-dir の後にパスを指定してください"
        WORK_DIR="$2"
        shift 2
        ;;
      --artifact-dir)
        [[ $# -ge 2 ]] || abort "--artifact-dir の後にパスを指定してください"
        ARTIFACT_DIR="$2"
        shift 2
        ;;
      --legacy-container)
        [[ $# -ge 2 ]] || abort "--legacy-container の後に値を指定してください"
        LEGACY_CONTAINER="$2"
        shift 2
        ;;
      --modern-container)
        [[ $# -ge 2 ]] || abort "--modern-container の後に値を指定してください"
        MODERN_CONTAINER="$2"
        shift 2
        ;;
      --target-path)
        [[ $# -ge 2 ]] || abort "--target-path の後にパスを指定してください"
        TARGET_LICENSE_PATH="$2"
        shift 2
        ;;
      --link-path)
        [[ $# -ge 2 ]] || abort "--link-path の後にパスを指定してください"
        LINK_LICENSE_PATH="$2"
        shift 2
        ;;
      --skip-legacy)
        SKIP_LEGACY=1
        shift
        ;;
      --skip-modern)
        SKIP_MODERN=1
        shift
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      --log-json)
        LOG_JSON=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        abort "想定外の引数: $1"
        ;;
    esac
  done
}

parse_args "$@"

if [[ -z "$RUN_ID" ]]; then
  if [[ -n "${FETCH_LICENSE_RUN_ID:-}" ]]; then
    RUN_ID="$FETCH_LICENSE_RUN_ID"
  else
    RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
  fi
fi

require_cmd vault
require_cmd jq
require_cmd docker

mkdir -p "$WORK_DIR"
[[ -n "$ARTIFACT_DIR" ]] && mkdir -p "$ARTIFACT_DIR"

VAULT_JSON="$(vault kv get -format=json "$VAULT_PATH")" || abort "Vault から ${VAULT_PATH} を取得できませんでした"

if [[ "$LOG_JSON" -eq 1 ]]; then
  printf '%s\n' "$VAULT_JSON" >"${WORK_DIR}/vault_secret.json"
  chmod 600 "${WORK_DIR}/vault_secret.json"
fi

LICENSE_KEY="$(jq -r '.data.data["license.key"] // empty' <<<"$VAULT_JSON")"
LICENSE_SECRET="$(jq -r '.data.data["license.secret"] // empty' <<<"$VAULT_JSON")"
LICENSE_UID_SEED="$(jq -r '.data.data["license.uid_seed"] // empty' <<<"$VAULT_JSON")"
ROTATED_AT="$(jq -r '.data.data.rotated_at // ""' <<<"$VAULT_JSON")"

[[ -n "$LICENSE_KEY" ]] || abort "Vault データに license.key が存在しません"
[[ -n "$LICENSE_SECRET" ]] || abort "Vault データに license.secret が存在しません"
[[ -n "$LICENSE_UID_SEED" ]] || abort "Vault データに license.uid_seed が存在しません"

POST_BODY_VALUE="${LICENSE_UID_SEED}-${RUN_ID}"
LICENSE_FILE="${WORK_DIR}/license.properties"
POST_BODY_FILE="${WORK_DIR}/system_license_post_body.txt"
META_FILE="${WORK_DIR}/license_fetch_meta.json"

cat >"$LICENSE_FILE" <<EOF
license.key=${LICENSE_KEY}
license.secret=${LICENSE_SECRET}
EOF
chmod 600 "$LICENSE_FILE"

printf '%s\n' "$POST_BODY_VALUE" >"$POST_BODY_FILE"
chmod 600 "$POST_BODY_FILE"

cat >"$META_FILE" <<EOF
{
  "run_id": "${RUN_ID}",
  "vault_path": "${VAULT_PATH}",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "license_uid_seed": "${LICENSE_UID_SEED}",
  "post_body_value": "${POST_BODY_VALUE}",
  "target_path": "${TARGET_LICENSE_PATH}",
  "link_path": "${LINK_LICENSE_PATH}",
  "rotated_at": "${ROTATED_AT}",
  "work_dir": "${WORK_DIR}"
}
EOF
chmod 600 "$META_FILE"

copy_to_container() {
  local container="$1"
  local skip_flag="$2"
  if [[ "$skip_flag" -eq 1 ]]; then
    log_info "${container} への配備はスキップされました"
    return
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log_info "[DRY RUN] ${container} への docker cp/exec をスキップ"
    return
  fi
  log_info "${container} へ license.properties を配置しています"
  docker cp "$LICENSE_FILE" "${container}:${TARGET_LICENSE_PATH}"
  docker exec -u 0 "$container" sh -c "chown jboss:jboss '${TARGET_LICENSE_PATH}' && chmod 600 '${TARGET_LICENSE_PATH}' && ln -sf '${TARGET_LICENSE_PATH}' '${LINK_LICENSE_PATH}'"
}

copy_to_container "$LEGACY_CONTAINER" "$SKIP_LEGACY"
copy_to_container "$MODERN_CONTAINER" "$SKIP_MODERN"

if [[ -n "$ARTIFACT_DIR" ]]; then
  log_info "生成物を ${ARTIFACT_DIR} へコピーします"
  cp "$LICENSE_FILE" "${ARTIFACT_DIR}/license.properties"
  cp "$POST_BODY_FILE" "${ARTIFACT_DIR}/system_license_post_body.txt"
  cp "$META_FILE" "${ARTIFACT_DIR}/license_fetch_meta.json"
fi

log_info "完了: RUN_ID=${RUN_ID}, Vault パス=${VAULT_PATH}"
