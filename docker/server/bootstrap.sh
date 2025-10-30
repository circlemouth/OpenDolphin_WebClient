#!/bin/bash
set -Eeuo pipefail

exec "$JBOSS_HOME/bin/standalone.sh" "$@"
