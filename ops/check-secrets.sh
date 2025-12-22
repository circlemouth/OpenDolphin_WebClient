#!/usr/bin/env bash
# OpenDolphin Modernized Server Secrets Preflight
# 目的:
#   - モダナイズサーバーの 2FA / PHR / S3 関連 Secrets と構成値が投入されているか事前検証する。
#   - CI/CD で実行し、未設定・形式不一致の場合は非ゼロ終了でデプロイを停止する。
# 注意:
#   - 本スクリプトは CI 設定案の段階であり、Vault 連携や AWS CLI 依存は持たない。
#   - Secrets の値はログへ出力せず、結果メッセージのみ表示すること。

set -euo pipefail

declare -i EXIT_CODE=0
declare -a ERRORS=()
declare -a WARNINGS=()

# shellcheck disable=SC2034
REQUIRED_SECRETS=(
  "FACTOR2_AES_KEY_B64|32 byte Base64 (44 chars)|^[A-Za-z0-9+/=]{44}$"
  "FIDO2_RP_ID|FIDO2 RP ID (domain)|^[A-Za-z0-9.-]+\$"
  "FIDO2_ALLOWED_ORIGINS|Comma separated https:// origins|"
  "PHR_EXPORT_SIGNING_SECRET|PHR export signing secret (>=32 chars)|^.{32,}\$"
)

S3_ONLY_SECRETS=(
  "PHR_EXPORT_S3_BUCKET|S3 bucket name|^[A-Za-z0-9.-]{3,63}\$"
  "PHR_EXPORT_S3_REGION|AWS region|^[a-z]{2}-[a-z]+-[0-9]\$"
  "PHR_EXPORT_S3_PREFIX|Object key prefix (optional)|"
  "AWS_REGION|AWS SDK region override|^[a-z]{2}-[a-z]+-[0-9]\$"
  "AWS_ACCESS_KEY_ID|AWS access key id|^.{16,}\$"
  "AWS_SECRET_ACCESS_KEY|AWS secret access key|^.{32,}\$"
)

log_info() {
  printf "[check-secrets] %s\n" "$*"
}

add_error() {
  ERRORS+=("$1")
  EXIT_CODE=1
}

add_warning() {
  WARNINGS+=("$1")
}

check_pattern() {
  local name="$1"
  local label="$2"
  local pattern="$3"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    add_error "${name}: 未設定（${label}）"
    return
  fi

  if [[ -n "$pattern" ]] && ! [[ "$value" =~ $pattern ]]; then
    add_error "${name}: 形式不一致（期待: ${label}）"
  fi
}

check_fido2_allowed_origins() {
  local value="${FIDO2_ALLOWED_ORIGINS:-}"
  if [[ -z "$value" ]]; then
    add_error "FIDO2_ALLOWED_ORIGINS: 未設定（Comma separated https:// origins）"
    return
  fi

  local IFS=',' origin
  read -ra ORIGINS <<< "$value"
  if [[ "${#ORIGINS[@]}" -eq 0 ]]; then
    add_error "FIDO2_ALLOWED_ORIGINS: 要素が空（https:// で始まる値を指定）"
    return
  fi

  for origin in "${ORIGINS[@]}"; do
    origin="$(echo "$origin" | xargs)" # trim
    if [[ -z "$origin" || ! "$origin" =~ ^https:// ]]; then
      add_error "FIDO2_ALLOWED_ORIGINS: '${origin}' が無効（https:// で開始する必要あり）"
    fi
  done
}

check_required_secrets() {
  local entry name label pattern
  for entry in "${REQUIRED_SECRETS[@]}"; do
    IFS='|' read -r name label pattern <<< "$entry"
    if [[ "$name" == "FIDO2_ALLOWED_ORIGINS" ]]; then
      check_fido2_allowed_origins
    else
      check_pattern "$name" "$label" "$pattern"
    fi
  done
}

check_s3_only_secrets() {
  if [[ "${PHR_EXPORT_STORAGE_TYPE:-FILESYSTEM}" != "S3" ]]; then
    add_warning "PHR_EXPORT_STORAGE_TYPE が S3 ではないため S3 関連チェックをスキップ（FILESYSTEM 選択時は問題なし）"
    return
  fi

  local entry name label pattern
  for entry in "${S3_ONLY_SECRETS[@]}"; do
    IFS='|' read -r name label pattern <<< "$entry"
    check_pattern "$name" "$label" "$pattern"
  done
}

check_factor2_aes_key_entropy() {
  local value="${FACTOR2_AES_KEY_B64:-}"
  if [[ -z "$value" ]]; then
    return
  fi

  # Base64 デコード可能か軽量チェック（python 禁止のため base64 コマンドを利用）
  if ! command -v base64 >/dev/null 2>&1; then
    add_warning "base64 コマンドが見つからないため FACTOR2_AES_KEY_B64 のデコード検証をスキップ"
    return
  fi

  if ! echo "$value" | base64 -d >/dev/null 2>&1; then
    add_error "FACTOR2_AES_KEY_B64: Base64 デコード失敗（再登録が必要）"
  fi
}

check_layer_identity_secrets() {
  local base64_value="${PHR_LAYER_PRIVATE_KEY_BASE64:-}"
  local path_value="${PHR_LAYER_PRIVATE_KEY_PATH:-}"

  if [[ -z "$base64_value" && -z "$path_value" ]]; then
    add_error "PHR_LAYER_PRIVATE_KEY_BASE64 または PHR_LAYER_PRIVATE_KEY_PATH: 未設定（Layer ID 署名鍵が必要）"
    return
  fi

  if [[ -n "$base64_value" && -n "$path_value" ]]; then
    add_warning "PHR_LAYER_PRIVATE_KEY_BASE64 と PHR_LAYER_PRIVATE_KEY_PATH が両方設定されています（base64 を優先）"
  fi

  if [[ -n "$base64_value" ]]; then
    if ! [[ "$base64_value" =~ ^[A-Za-z0-9+/=\r\n[:space:]]+$ ]]; then
      add_error "PHR_LAYER_PRIVATE_KEY_BASE64: 形式不一致（Base64 形式の秘密鍵）"
      return
    fi

    if ! command -v base64 >/dev/null 2>&1; then
      add_warning "base64 コマンドが見つからないため PHR_LAYER_PRIVATE_KEY_BASE64 のデコード検証をスキップ"
      return
    fi

    local normalized
    normalized="$(printf '%s' "$base64_value" | tr -d '[:space:]')"
    if ! printf '%s' "$normalized" | base64 -d >/dev/null 2>&1; then
      add_error "PHR_LAYER_PRIVATE_KEY_BASE64: Base64 デコード失敗（再登録が必要）"
    fi
    return
  fi

  if [[ -n "$path_value" ]]; then
    if [[ ! -f "$path_value" ]]; then
      add_error "PHR_LAYER_PRIVATE_KEY_PATH: ファイルが存在しません (${path_value})"
      return
    fi
    if [[ ! -s "$path_value" ]]; then
      add_error "PHR_LAYER_PRIVATE_KEY_PATH: ファイルが空です (${path_value})"
    fi
  fi
}

main() {
  log_info "Secrets チェックを開始します（vault/外部依存は実行しません）"

  check_required_secrets
  check_s3_only_secrets
  check_factor2_aes_key_entropy
  check_layer_identity_secrets

  if [[ "${#WARNINGS[@]}" -gt 0 ]]; then
    log_info "Warnings:"
    for warn in "${WARNINGS[@]}"; do
      printf "  - %s\n" "$warn"
    done
  fi

  if [[ "${#ERRORS[@]}" -gt 0 ]]; then
    log_info "Errors:"
    for err in "${ERRORS[@]}"; do
      printf "  - %s\n" "$err"
    done
  else
    log_info "すべての必須 Secrets が確認できました。"
  fi

  exit "${EXIT_CODE}"
}

main "$@"
