#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/jpql_trace_compare.sh [options] LEGACY_LOG MODERN_LOG

Options:
  -o, --output FILE   Write diff result to FILE instead of stdout
  -h, --help          Show this help

The script extracts SQL statements from hibernate.show_sql logs,
normalizes whitespace, and prints a unified diff to illustrate
JPQL/SQL differences between the legacy and modernized servers.
USAGE
}

legacy_log=""
modern_log=""
output_file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)
      output_file="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -z "$legacy_log" ]]; then
        legacy_log="$1"
      elif [[ -z "$modern_log" ]]; then
        modern_log="$1"
      else
        echo "Unexpected argument: $1" >&2
        usage >&2
        exit 1
      fi
      shift
      ;;
  esac
  continue
done

if [[ -z "$legacy_log" || -z "$modern_log" ]]; then
  usage >&2
  exit 1
fi

if [[ ! -f "$legacy_log" ]]; then
  echo "Legacy log not found: $legacy_log" >&2
  exit 1
fi
if [[ ! -f "$modern_log" ]]; then
  echo "Modern log not found: $modern_log" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

normalize() {
  local input="$1"
  local output="$2"
  awk '
    /Hibernate:/ {
      line=$0
      sub(/^.*Hibernate:[[:space:]]*/, "", line)
      gsub(/[[:space:]]+/, " ", line)
      sub(/^[[:space:]]*/, "", line)
      if (line != "") print line
      next
    }
    /org\.hibernate\.SQL/ {
      line=$0
      sub(/^.*org\.hibernate\.SQL[^:]*:[[:space:]]*/, "", line)
      gsub(/[[:space:]]+/, " ", line)
      sub(/^[[:space:]]*/, "", line)
      if (line != "") print line
      next
    }
  ' "$input" > "$output"
}

legacy_norm="$tmpdir/legacy.sql"
modern_norm="$tmpdir/modern.sql"
normalize "$legacy_log" "$legacy_norm"
normalize "$modern_log" "$modern_norm"

if [[ -n "$output_file" ]]; then
  set +e
  diff -u "$legacy_norm" "$modern_norm" | tee "$output_file"
  status=${PIPESTATUS[0]}
  set -e
else
  set +e
  diff -u "$legacy_norm" "$modern_norm"
  status=$?
  set -e
fi

if [[ $status -gt 1 ]]; then
  exit $status
fi
