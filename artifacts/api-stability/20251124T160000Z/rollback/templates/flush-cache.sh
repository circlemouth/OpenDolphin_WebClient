#!/usr/bin/env bash
set -euo pipefail
# RUN_ID: 20251124T160000Z (parent=20251124T000000Z)
# Purpose: ORCA-05/06/08 向けキャッシュ/フラグを安全に無効化するテンプレ。
# Usage:
#   DRY_RUN=1 ./flush-cache.sh            # 影響確認のみ
#   REDIS_URL=redis://127.0.0.1:6379 ./flush-cache.sh
#   REDIS_CLI="redis-cli -a <pass> -h <host> -p <port>" ./flush-cache.sh
# 対象キー（例）：orca:master:*, webclient:cache:orca*, feature:orca-master:*, audit:transition:*.

REDIS_CLI=${REDIS_CLI:-"redis-cli"}
REDIS_URL=${REDIS_URL:-""}
DRY_RUN=${DRY_RUN:-0}

if [[ -n "$REDIS_URL" ]]; then
  REDIS_CMD=("$REDIS_CLI" -u "$REDIS_URL")
else
  REDIS_CMD=("$REDIS_CLI")
fi

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY-RUN] ${REDIS_CMD[*]} $*"
  else
    echo "[EXEC] ${REDIS_CMD[*]} $*"
    "${REDIS_CMD[@]}" "$@"
  fi
}

delete_pattern() {
  local pattern="$1"
  mapfile -t keys < <("${REDIS_CMD[@]}" --raw --scan --pattern "$pattern") || true
  if [[ ${#keys[@]} -eq 0 ]]; then
    echo "[INFO] no keys for pattern=$pattern"
    return
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[DRY-RUN] DEL %s\n' "${keys[@]}"
  else
    "${REDIS_CMD[@]}" DEL "${keys[@]}" >/dev/null
    printf '[EXEC] DEL %s\n' "${keys[@]}"
  fi
}

# 1) feature flag を OFF（例: WEB_ORCA_MASTER_SOURCE）
run SET feature:orca-master:source "mock"

# 2) React Query / API キャッシュ相当キーを削除（パターン指定で SCAN→DEL）
for p in \
  "orca:master:generic-class:*" \
  "orca:master:generic-price:*" \
  "orca:master:youhou:*" \
  "orca:master:material:*" \
  "orca:master:kensa-sort:*" \
  "orca:master:insurer:*" \
  "orca:master:address:*" \
  "orca:master:tensu:*" \
  "audit:transition:*" \
; do
  delete_pattern "$p"
done

# 3) Redis FLUSHALL は使用しない（影響が広すぎるため禁止）。
#    必要に応じてパターン指定の SCAN + DEL を使用する。

# 4) キャッシュ無効化後、監査ギャップ確認のための簡易ヘルスチェック例
# run PING
# run INFO keyspace

exit 0
