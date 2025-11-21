#!/usr/bin/env bash
# 同一ホストで旧サーバー (WildFly 10) と新サーバー (WildFly 33) を同時起動するユーティリティ。
# docker compose v2 を想定し、必要な Compose ファイルをまとめて適用する。
# 使い方:
#   ./scripts/start_legacy_modernized.sh start [--build]
#   ./scripts/start_legacy_modernized.sh stop
#   ./scripts/start_legacy_modernized.sh status
#   ./scripts/start_legacy_modernized.sh down
#   ./scripts/start_legacy_modernized.sh logs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PROJECT_NAME="${PROJECT_NAME:-legacy-vs-modern}"
SERVICES=(db server db-modernized server-modernized-dev)
COMPOSE_FILES=(
  "${REPO_ROOT}/docker-compose.yml"
  "${REPO_ROOT}/ops/base/docker-compose.yml"
  "${REPO_ROOT}/docker-compose.modernized.dev.yml"
)
LEGACY_RELATIVE_DIR="tmp/legacy-compose"
LEGACY_ABS_DIR="${REPO_ROOT}/${LEGACY_RELATIVE_DIR}"
LEGACY_WAR_NAME="opendolphin-server"
MODERNIZED_WILDFLY_CONTAINER="${MODERNIZED_WILDFLY_CONTAINER:-opendolphin-server-modernized-dev}"
MODERNIZED_WILDFLY_CLI_PATH="/opt/jboss/wildfly/x-client-compat.cli"
X_CLIENT_COMPAT_CLI="${SCRIPT_DIR}/compat/x-client-compat.cli"
COMPAT_WAIT_ATTEMPTS="${COMPAT_WAIT_ATTEMPTS:-30}"
COMPAT_WAIT_INTERVAL="${COMPAT_WAIT_INTERVAL:-2}"

error() {
  printf '[ERROR] %s\n' "$*" >&2
}

usage() {
  cat <<'USAGE'
Usage:
  start_legacy_modernized.sh [command] [options]

Commands:
  start [--build]   旧・新サーバーと各 DB を起動 (バックグラウンド)
  stop              対象コンテナを停止
  status            対象コンテナの状態を表示
  down              プロジェクト全体を停止してリソースを削除
  logs [args...]    対象サービスのログを表示 (引数は docker compose logs に委譲)

Environment:
  PROJECT_NAME  docker compose の --project-name (default: legacy-vs-modern)

USAGE
}

detect_compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker-compose)
  else
    error "docker compose (v2) または docker-compose が見つかりません。"
    exit 1
  fi
}

prepare_legacy_assets() {
  rm -rf "${LEGACY_ABS_DIR}"
  mkdir -p "${LEGACY_ABS_DIR}"

  cat >"${LEGACY_ABS_DIR}/configure-wildfly.cli" <<'CLI'
embed-server --std-out=echo --server-config=standalone-full.xml

module add --name=org.postgresql --resources=/opt/jboss/postgresql-driver.jar --dependencies=javax.api,javax.transaction.api

if (outcome == success) of /subsystem=datasources/jdbc-driver=postgresql:read-resource()
    /subsystem=datasources/jdbc-driver=postgresql:remove()
end-if
/subsystem=datasources/jdbc-driver=postgresql:add(driver-name=postgresql,driver-module-name=org.postgresql,driver-class-name=org.postgresql.Driver)

if (outcome == success) of /subsystem=datasources/data-source=ORCADS:read-resource()
    /subsystem=datasources/data-source=ORCADS:remove()
end-if
/subsystem=datasources/data-source=ORCADS:add(jndi-name=java:jboss/datasources/ORCADS, driver-name=postgresql, connection-url="jdbc:postgresql://${env.DB_HOST:opendolphin-postgres}:${env.DB_PORT:5432}/${env.DB_NAME:opendolphin_modern}", user-name=${env.DB_USER:opendolphin}, password=${env.DB_PASSWORD:opendolphin}, use-ccm=false, share-prepared-statements=true, min-pool-size=5, max-pool-size=50, background-validation=true, background-validation-millis=60000, validate-on-match=true, check-valid-connection-sql="SELECT 1")

if (outcome == success) of /subsystem=datasources/data-source=PostgresDS:read-resource()
    /subsystem=datasources/data-source=PostgresDS:remove()
end-if
/subsystem=datasources/data-source=PostgresDS:add(jndi-name=java:jboss/datasources/PostgresDS, driver-name=postgresql, connection-url="jdbc:postgresql://${env.DB_HOST:opendolphin-postgres}:${env.DB_PORT:5432}/${env.DB_NAME:opendolphin_modern}", user-name=${env.DB_USER:opendolphin}, password=${env.DB_PASSWORD:opendolphin}, use-ccm=false, share-prepared-statements=true, min-pool-size=5, max-pool-size=50, background-validation=true, background-validation-millis=60000, validate-on-match=true, check-valid-connection-sql="SELECT 1")

# --- ActiveMQ Artemis JMS ---
if (outcome != success) of /subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource()
    /subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:add(entries=["java:/queue/dolphin","java:jboss/exported/jms/queue/dolphin"], durable=true)
end-if
# WildFly 10 ships java:/ConnectionFactory / java:/JmsXA by default. Avoid re-registration to keep CLI idempotent.
# --- End ActiveMQ Artemis JMS ---

if (outcome == success) of /subsystem=logging/logger=open.dolphin:read-resource()
    /subsystem=logging/logger=open.dolphin:write-attribute(name=level,value=INFO)
else
    /subsystem=logging/logger=open.dolphin:add(level=INFO)
end-if

stop-embedded-server
CLI

  cat >"${LEGACY_ABS_DIR}/Dockerfile.legacy" <<EOF
# syntax=docker/dockerfile:1.7

ARG WAR_BASENAME=${LEGACY_WAR_NAME}

FROM maven:3.9.6-eclipse-temurin-17 AS build
ARG WAR_BASENAME
WORKDIR /workspace

COPY pom.xml ./
RUN sed '/<module>server-modernized<\\/module>/d' pom.xml > pom.server-classic.xml
COPY common ./common
COPY reporting ./reporting
COPY server ./server
COPY client ./client
COPY ext_lib ./ext_lib
COPY ops/shared/docker/settings.xml /tmp/maven-settings.xml

RUN mvn -N -f pom.server-classic.xml -s /tmp/maven-settings.xml -B install:install-file -Dfile=ext_lib/iTextAsian.jar -DgroupId=opendolphin -DartifactId=itext-font -Dversion=1.0 -Dpackaging=jar
RUN mvn -N -f pom.server-classic.xml -s /tmp/maven-settings.xml -B install:install-file -Dfile=ext_lib/AppleJavaExtensions.jar -DgroupId=com.apple -DartifactId=AppleJavaExtensions -Dversion=1.6 -Dpackaging=jar
RUN mvn -N -f pom.server-classic.xml -s /tmp/maven-settings.xml -B dependency:get -Dartifact=org.postgresql:postgresql:42.7.3
RUN mvn -N -f pom.server-classic.xml -s /tmp/maven-settings.xml -B dependency:get -Dartifact=org.hibernate:hibernate-core:5.0.10.Final
RUN mvn -N -f pom.server-classic.xml -s /tmp/maven-settings.xml -B dependency:get -Dartifact=javax.jms:javax.jms-api:2.0.1

RUN mkdir -p /tmp/hbcompat/src/org/hibernate/type /tmp/hbcompat/classes
RUN cat <<'JAVA' > /tmp/hbcompat/src/org/hibernate/type/StringClobType.java
package org.hibernate.type;

import org.hibernate.dialect.Dialect;
import org.hibernate.type.descriptor.java.StringTypeDescriptor;
import org.hibernate.type.descriptor.sql.ClobTypeDescriptor;

public class StringClobType extends AbstractSingleColumnStandardBasicType<String>
        implements DiscriminatorType<String> {

    private static final long serialVersionUID = 1L;

    public StringClobType() {
        super(ClobTypeDescriptor.DEFAULT, StringTypeDescriptor.INSTANCE);
    }

    @Override
    public String getName() {
        return "string_clob";
    }

    @Override
    public String objectToSQLString(String value, Dialect dialect) {
        return StringTypeDescriptor.INSTANCE.toString(value);
    }

    @Override
    public String stringToObject(String xml) {
        return StringTypeDescriptor.INSTANCE.fromString(xml);
    }
}
JAVA

RUN javac -cp /root/.m2/repository/org/hibernate/hibernate-core/5.0.10.Final/hibernate-core-5.0.10.Final.jar -d /tmp/hbcompat/classes /tmp/hbcompat/src/org/hibernate/type/StringClobType.java
RUN jar cf /tmp/hbcompat/string-clob-type-compat.jar -C /tmp/hbcompat/classes .

RUN set -eux; \
    mvn -f pom.server-classic.xml -s /tmp/maven-settings.xml -B -pl server -am -Plegacy-wildfly10 -DskipTests -Dmaven.test.skip=true package; \
    WAR_DIR=server/target; \
    WAR_FILE="\${WAR_DIR}/\${WAR_BASENAME}.war"; \
    if [ ! -f "\${WAR_FILE}" ]; then \
        FIRST_WAR=\$(ls "\${WAR_DIR}"/*.war | head -n 1); \
        mv "\${FIRST_WAR}" "\${WAR_FILE}"; \
    fi

FROM jboss/wildfly:10.1.0.Final
ARG WAR_BASENAME
ENV JBOSS_HOME=/opt/jboss/wildfly \
    WILDFLY_HOME=/opt/jboss/wildfly

USER root
RUN mkdir -p /usr/share/fonts/opendolphin
COPY ops/assets/fonts/NotoSansCJKjp-Regular.otf /usr/share/fonts/opendolphin/NotoSansCJKjp-Regular.otf
RUN chmod 644 /usr/share/fonts/opendolphin/NotoSansCJKjp-Regular.otf
ENV OPENDOLPHIN_REPORT_FONT_PATH=/usr/share/fonts/opendolphin/NotoSansCJKjp-Regular.otf
COPY --from=build /workspace/server/target/\${WAR_BASENAME}.war \${WILDFLY_HOME}/standalone/deployments/\${WAR_BASENAME}.war
COPY --from=build /root/.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar /opt/jboss/postgresql-driver.jar
COPY --from=build /tmp/hbcompat/string-clob-type-compat.jar /opt/jboss/string-clob-type-compat.jar
COPY --from=build /root/.m2/repository/javax/jms/javax.jms-api/2.0.1/javax.jms-api-2.0.1.jar /opt/jboss/javax-jms-api.jar
COPY ops/shared/docker/custom.properties \${WILDFLY_HOME}/custom.properties
COPY ${LEGACY_RELATIVE_DIR}/configure-wildfly.cli /opt/jboss/configure-wildfly.cli
COPY ops/shared/docker/bootstrap.sh /opt/jboss/bootstrap.sh
RUN chmod +x /opt/jboss/bootstrap.sh

RUN mkdir -p /opt/jboss/tmp/WEB-INF/lib && \
    mv /opt/jboss/string-clob-type-compat.jar /opt/jboss/tmp/WEB-INF/lib/ && \
    mv /opt/jboss/javax-jms-api.jar /opt/jboss/tmp/WEB-INF/lib/ && \
    cd /opt/jboss/tmp && \
    jar uf \${WILDFLY_HOME}/standalone/deployments/\${WAR_BASENAME}.war -C /opt/jboss/tmp WEB-INF && \
    rm -rf /opt/jboss/tmp

RUN \${WILDFLY_HOME}/bin/jboss-cli.sh --file=/opt/jboss/configure-wildfly.cli && \
    rm -f /opt/jboss/configure-wildfly.cli

RUN chown -R jboss:0 \${WILDFLY_HOME} /opt/jboss/bootstrap.sh /opt/jboss/postgresql-driver.jar

EXPOSE 8080 9990

USER jboss
ENTRYPOINT ["/opt/jboss/bootstrap.sh"]
CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-c", "standalone-full.xml", "-b", "0.0.0.0", "-bmanagement", "0.0.0.0"]
EOF
}

create_override_file() {
  prepare_legacy_assets
  local tmpdir="${TMPDIR:-/tmp}"
  local tmpfile
  tmpfile="$(mktemp "${tmpdir}/od-compose-override-XXXXXX")"
  local override_file="${tmpfile}.yml"
  mv "${tmpfile}" "${override_file}"
  cat >"${override_file}" <<YAML
services:
  server:
    build:
      context: .
      dockerfile: ${LEGACY_RELATIVE_DIR}/Dockerfile.legacy
YAML
  printf '%s\n' "${override_file}"
}

wait_for_container_ready() {
  local container_name="$1"
  local max_attempts="${2:-$COMPAT_WAIT_ATTEMPTS}"
  local interval="${3:-$COMPAT_WAIT_INTERVAL}"

  for ((attempt = 1; attempt <= max_attempts; attempt++)); do
    local health
    health="$(docker inspect -f '{{.State.Health.Status}}' "${container_name}" 2>/dev/null || true)"
    if [[ "${health}" == "healthy" ]]; then
      return 0
    fi
    if [[ "${health}" == "unhealthy" ]]; then
      error "コンテナ ${container_name} のヘルスチェックが unhealthy です。"
      return 1
    fi

    local running
    running="$(docker inspect -f '{{.State.Running}}' "${container_name}" 2>/dev/null || true)"
    if [[ "${running}" == "true" && -z "${health}" ]]; then
      return 0
    fi

    sleep "${interval}"
  done

  error "コンテナ ${container_name} の起動待ちがタイムアウトしました (${max_attempts} 回試行)。"
  return 1
}

apply_x_client_compat_filter() {
  if [[ ! -f "${X_CLIENT_COMPAT_CLI}" ]]; then
    error "X-Client-Compat CLI ファイルが見つかりません: ${X_CLIENT_COMPAT_CLI}"
    return 1
  fi

  if ! docker inspect "${MODERNIZED_WILDFLY_CONTAINER}" >/dev/null 2>&1; then
    error "コンテナ ${MODERNIZED_WILDFLY_CONTAINER} が存在しません。start コマンドの compose up 完了後に確認してください。"
    return 1
  fi

  wait_for_container_ready "${MODERNIZED_WILDFLY_CONTAINER}"

  docker cp "${X_CLIENT_COMPAT_CLI}" "${MODERNIZED_WILDFLY_CONTAINER}:${MODERNIZED_WILDFLY_CLI_PATH}"
  docker exec "${MODERNIZED_WILDFLY_CONTAINER}" /opt/jboss/wildfly/bin/jboss-cli.sh -c "--file=${MODERNIZED_WILDFLY_CLI_PATH}"
}

compose() {
  "${DOCKER_COMPOSE[@]}" \
    --project-name "${PROJECT_NAME}" \
    -f "${COMPOSE_FILES[0]}" \
    -f "${COMPOSE_FILES[1]}" \
    -f "${COMPOSE_FILES[2]}" \
    -f "${OVERRIDE_FILE}" \
    "$@"
}

main() {
  if [[ $# -eq 0 ]]; then
    CMD="start"
  else
    CMD="$1"
    shift
  fi

  case "${CMD}" in
    start|stop|status|down|logs) ;;
    -h|--help) usage; exit 0 ;;
    *)
      usage
      exit 1
      ;;
  esac

  detect_compose
  OVERRIDE_FILE="$(create_override_file)"
  cleanup() {
    rm -f "${OVERRIDE_FILE}"
    rm -rf "${LEGACY_ABS_DIR}"
  }
  trap cleanup EXIT

  case "${CMD}" in
    start)
      local up_opts=()
      for arg in "$@"; do
        case "${arg}" in
          --build|--no-build|--force-recreate|--pull) up_opts+=("${arg}") ;;
          *)
            error "start コマンドでは --build/--no-build/--force-recreate/--pull のみ指定できます: ${arg}"
            exit 1
            ;;
        esac
      done
      compose config >/dev/null
      if ((${#up_opts[@]} > 0)); then
        compose up -d "${up_opts[@]}" "${SERVICES[@]}"
      else
        compose up -d "${SERVICES[@]}"
      fi
      apply_x_client_compat_filter
      ;;
    stop)
      compose stop "${SERVICES[@]}"
      ;;
    status)
      compose ps
      ;;
    down)
      compose down
      ;;
    logs)
      if [[ $# -eq 0 ]]; then
        compose logs "${SERVICES[@]}"
      else
        compose logs "$@"
      fi
      ;;
  esac
}

main "$@"
