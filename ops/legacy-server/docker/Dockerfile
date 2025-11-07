# syntax=docker/dockerfile:1.7

FROM maven:3.9.6-eclipse-temurin-8 AS build
WORKDIR /workspace

COPY pom.xml ./
RUN sed '/<module>server-modernized<\/module>/d' pom.xml > pom.server-classic.xml
COPY common ./common
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

RUN mvn -f pom.server-classic.xml -s /tmp/maven-settings.xml -B -pl server -am -DskipTests package && \
    mv server/target/opendolphin-server-*.war server/target/opendolphin-server.war

FROM jboss/wildfly:10.1.0.Final
ENV JBOSS_HOME=/opt/jboss/wildfly \
    WILDFLY_HOME=/opt/jboss/wildfly

USER root
COPY --from=build /workspace/server/target/opendolphin-server.war ${WILDFLY_HOME}/standalone/deployments/opendolphin-server.war
COPY --from=build /root/.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar /opt/jboss/postgresql-driver.jar
COPY --from=build /tmp/hbcompat/string-clob-type-compat.jar /opt/jboss/string-clob-type-compat.jar
COPY --from=build /root/.m2/repository/javax/jms/javax.jms-api/2.0.1/javax.jms-api-2.0.1.jar /opt/jboss/javax-jms-api.jar
COPY ops/shared/docker/custom.properties ${WILDFLY_HOME}/custom.properties
COPY ops/legacy-server/docker/configure-wildfly.cli /opt/jboss/configure-wildfly.cli
COPY ops/shared/docker/bootstrap.sh /opt/jboss/bootstrap.sh
RUN chmod +x /opt/jboss/bootstrap.sh

RUN mkdir -p /opt/jboss/tmp/WEB-INF/lib && \
    mv /opt/jboss/string-clob-type-compat.jar /opt/jboss/tmp/WEB-INF/lib/ && \
    mv /opt/jboss/javax-jms-api.jar /opt/jboss/tmp/WEB-INF/lib/ && \
    cd /opt/jboss/tmp && \
    jar uf ${WILDFLY_HOME}/standalone/deployments/opendolphin-server.war -C /opt/jboss/tmp WEB-INF && \
    rm -rf /opt/jboss/tmp

RUN ${WILDFLY_HOME}/bin/jboss-cli.sh --file=/opt/jboss/configure-wildfly.cli && \
    rm -f /opt/jboss/configure-wildfly.cli

RUN chown -R jboss:0 ${WILDFLY_HOME} /opt/jboss/bootstrap.sh /opt/jboss/postgresql-driver.jar

EXPOSE 8080 9990

USER jboss
ENTRYPOINT ["/opt/jboss/bootstrap.sh"]
CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-c", "standalone-full.xml", "-b", "0.0.0.0", "-bmanagement", "0.0.0.0"]
