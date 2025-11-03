package open.dolphin.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Metrics;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * WildFly が提供する Micrometer MeterRegistry を CDI へ公開する。
 * JNDI から取得できない場合はフォールバックとしてグローバルレジストリを返す。
 */
@ApplicationScoped
public class MeterRegistryProducer {

    private static final Logger LOGGER = Logger.getLogger(MeterRegistryProducer.class.getName());
    private static final String WILDFLY_JNDI_NAME = "java:jboss/micrometer/registry";

    @Produces
    @ApplicationScoped
    public MeterRegistry produceMeterRegistry() {
        MeterRegistry registry = lookupWildFlyRegistry();
        if (registry != null) {
            return registry;
        }
        LOGGER.log(Level.WARNING, "Micrometer registry not found under {0}; falling back to global registry.", WILDFLY_JNDI_NAME);
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
            LOGGER.log(Level.FINE, "WildFly Micrometer registry lookup failed: {0}", ex.getMessage());
        }
        return null;
    }
}
