package open.dolphin.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Metrics;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * WildFly が提供する Micrometer MeterRegistry を CDI へ公開する。
 * JNDI から取得できない場合はフォールバックとしてグローバルレジストリを返す。
 */
@ApplicationScoped
public class MeterRegistryProducer {

    private static final Logger LOGGER = LoggerFactory.getLogger(MeterRegistryProducer.class);
    private static final String WILDFLY_JNDI_NAME = "java:jboss/micrometer/registry";

    @Produces
    @ApplicationScoped
    public MeterRegistry produceMeterRegistry() {
        MeterRegistry registry = lookupWildFlyRegistry();
        if (registry != null) {
            return registry;
        }
        LOGGER.warn("Micrometer registry not found under {}; falling back to global registry.", WILDFLY_JNDI_NAME);
        return Metrics.globalRegistry;
    }

    private MeterRegistry lookupWildFlyRegistry() {
        try {
            InitialContext context = new InitialContext();
            Object lookedUp = context.lookup(WILDFLY_JNDI_NAME);
            if (lookedUp instanceof MeterRegistry meterRegistry) {
                return meterRegistry;
            }
        } catch (NamingException ex) {
            LOGGER.debug("WildFly Micrometer registry lookup failed", ex);
        }
        return null;
    }
}
