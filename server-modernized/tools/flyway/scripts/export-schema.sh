#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DB_HOST:-}" || -z "${DB_NAME:-}" ]]; then
  echo "DB_HOST と DB_NAME を設定してください" >&2
  exit 1
fi

OUTPUT_DIR=${OUTPUT_DIR:-$(pwd)/artifacts}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "${OUTPUT_DIR}"

pg_dump \
  --schema-only \
  --no-owner \
  --file "${OUTPUT_DIR}/opendolphin-${TIMESTAMP}.sql" \
  --dbname "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?sslmode=${DB_SSLMODE:-require}"

echo "Schema dump saved to ${OUTPUT_DIR}/opendolphin-${TIMESTAMP}.sql"
