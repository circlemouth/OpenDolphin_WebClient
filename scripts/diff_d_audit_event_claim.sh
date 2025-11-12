#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/diff_d_audit_event_claim.sh <new-run|file> <old-run|file>

Compare EHT_CLAIM_SEND rows inside d_audit_event_claim.tsv between two RUN_IDs.
- Arguments may be RUN_IDs (directory names under artifacts/parity-manual/TRACEID_JMS)
  or direct paths to the tsv/csv files.
- Output lists TraceId (request_id) differences so Claim parity regressions are visible at a glance.
EOF
}

resolve_file() {
  local target=$1
  if [[ -f "$target" ]]; then
    printf '%s' "$target"
    return 0
  fi

  local candidate="artifacts/parity-manual/TRACEID_JMS/$target/logs/d_audit_event_claim.tsv"
  if [[ -f "$candidate" ]]; then
    printf '%s' "$candidate"
    return 0
  fi

  echo "[diff_d_audit_event_claim] file or RUN_ID not found: $target" >&2
  exit 1
}

derive_label() {
  local file=$1
  local parent
  parent=$(dirname "$file")            # .../logs
  parent=$(dirname "$parent")          # .../<RUN_ID>
  printf '%s' "$(basename "$parent")"
}

format_claim_rows() {
  local file=$1
  local out=$2
  tail -n +2 "$file" | awk -F',' 'BEGIN{OFS="\t"} $2=="EHT_CLAIM_SEND" {print $3,$4}' | sort -u >"$out"
}

print_section() {
  local title=$1
  local file=$2
  local label=$3
  echo "$title"
  if [[ -s "$file" ]]; then
    awk -F'\t' -v run="$label" '{printf "  - %s (event_time=%s, run=%s)\n", $1, $2, run}' "$file"
  else
    echo "  - (差分なし)"
  fi
}

main() {
  if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
    usage
    exit 0
  fi

  if [[ $# -ne 2 ]]; then
    usage >&2
    exit 1
  fi

  local left_file right_file left_label right_label
  left_file=$(resolve_file "$1")
  right_file=$(resolve_file "$2")
  left_label=$(derive_label "$left_file")
  right_label=$(derive_label "$right_file")

  left_tmp=$(mktemp)
  right_tmp=$(mktemp)
  only_left=$(mktemp)
  only_right=$(mktemp)
  intersection=$(mktemp)
  trap 'rm -f "$left_tmp" "$right_tmp" "$only_left" "$only_right" "$intersection"' EXIT

  format_claim_rows "$left_file" "$left_tmp"
  format_claim_rows "$right_file" "$right_tmp"

  comm -23 "$left_tmp" "$right_tmp" >"$only_left"
  comm -13 "$left_tmp" "$right_tmp" >"$only_right"
  comm -12 "$left_tmp" "$right_tmp" >"$intersection"

  echo "# Claim TraceId diff"
  echo "Left (new):  $left_label -> $left_file"
  echo "Right(old): $right_label -> $right_file"
  echo
  print_section "## ${left_label} にのみ存在" "$only_left" "$left_label"
  print_section "## ${right_label} にのみ存在" "$only_right" "$right_label"
  print_section "## 両 RUN に共通" "$intersection" "${left_label}/${right_label}"
}

main "$@"
