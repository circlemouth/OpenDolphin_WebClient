#!/bin/bash
set -Eeuo pipefail

if [[ $# -gt 0 && $1 == "$JBOSS_HOME/bin/standalone.sh" ]]; then
    shift
fi

exec "$JBOSS_HOME/bin/standalone.sh" "$@"
