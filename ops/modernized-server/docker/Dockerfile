# syntax=docker/dockerfile:1.7

FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml ./
RUN grep -v '<module>server</module>' pom.xml | grep -v '<module>client</module>' > pom.server-modernized.xml
COPY common ./common
COPY server-modernized ./server-modernized
COPY ext_lib ./ext_lib
COPY ops/shared/docker/settings.xml /tmp/maven-settings.xml

RUN mvn -N -f pom.server-modernized.xml -s /tmp/maven-settings.xml -B install:install-file -Dfile=ext_lib/iTextAsian.jar -DgroupId=opendolphin -DartifactId=itext-font -Dversion=1.0 -Dpackaging=jar
RUN mvn -N -f pom.server-modernized.xml -s /tmp/maven-settings.xml -B install:install-file -Dfile=ext_lib/AppleJavaExtensions.jar -DgroupId=com.apple -DartifactId=AppleJavaExtensions -Dversion=1.6 -Dpackaging=jar
RUN mvn -N -f pom.server-modernized.xml -s /tmp/maven-settings.xml -B dependency:get -Dartifact=org.postgresql:postgresql:42.7.3
RUN mvn -N -f pom.server-modernized.xml -s /tmp/maven-settings.xml -B dependency:get -Dartifact=org.hibernate:hibernate-core:5.0.10.Final

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

RUN mvn -f pom.server-modernized.xml -s /tmp/maven-settings.xml -B -pl server-modernized -am -DskipTests package && \
    mv server-modernized/target/opendolphin-server-*.war server-modernized/target/opendolphin-server.war

FROM quay.io/wildfly/wildfly:33.0.2.Final-jdk17
ENV JBOSS_HOME=/opt/jboss/wildfly \
    WILDFLY_HOME=/opt/jboss/wildfly

USER root
COPY --from=build /workspace/server-modernized/target/opendolphin-server.war ${WILDFLY_HOME}/standalone/deployments/opendolphin-server.war
COPY --from=build /root/.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar /opt/jboss/postgresql-driver.jar
COPY --from=build /tmp/hbcompat/string-clob-type-compat.jar /opt/jboss/string-clob-type-compat.jar
COPY ops/shared/docker/custom.properties ${WILDFLY_HOME}/custom.properties
COPY ops/modernized-server/docker/configure-wildfly.cli /opt/jboss/configure-wildfly.cli
COPY ops/shared/docker/bootstrap.sh /opt/jboss/bootstrap.sh
RUN chmod +x /opt/jboss/bootstrap.sh

RUN mkdir -p /opt/jboss/tmp/WEB-INF/lib && \
    mv /opt/jboss/string-clob-type-compat.jar /opt/jboss/tmp/WEB-INF/lib/ && \
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
