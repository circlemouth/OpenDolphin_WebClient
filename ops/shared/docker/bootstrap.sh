#!/bin/bash
set -Eeuo pipefail

if [[ -n "${OPENDOLPHIN_SCHEMA_ACTION:-}" ]] && [[ "${OPENDOLPHIN_SCHEMA_ACTION}" != "none" ]]; then
    export JAVA_OPTS_APPEND="${JAVA_OPTS_APPEND:-} -Dhibernate.hbm2ddl.auto=${OPENDOLPHIN_SCHEMA_ACTION} -Djakarta.persistence.schema-generation.database.action=${OPENDOLPHIN_SCHEMA_ACTION}"
fi

if [[ $# -gt 0 && $1 == "$JBOSS_HOME/bin/standalone.sh" ]]; then
    shift
fi

exec "$JBOSS_HOME/bin/standalone.sh" "$@"
