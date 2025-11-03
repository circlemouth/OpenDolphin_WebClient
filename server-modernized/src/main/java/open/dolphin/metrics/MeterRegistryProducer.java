package open.dolphin.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Metrics;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.naming.InitialContext;
import jakarta.naming.NamingException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * WildFly が提供する Micrometer MeterRegistry を CDI へ公開する。
 * JNDI から取得できない場合はフォールバックとしてグローバルレジストリを返す。
 */
@ApplicationScoped
public class MeterRegistryProducer {

    private static final Logger LOGGER = Logger.getLogger(MeterRegistryProducer.class.getName());
    private static final String PROPERTY_KEY = "open.dolphin.metrics.registry.jndi";
    private static final String ENVIRONMENT_KEY = "OPEN_DOLPHIN_METRICS_REGISTRY_JNDI";
    private static final String DEFAULT_JNDI_NAME = "java:jboss/micrometer/registry";

    @Produces
    @ApplicationScoped
    public MeterRegistry produceMeterRegistry() {
        String jndiName = resolveJndiName();
        MeterRegistry registry = lookupRegistry(jndiName);
        if (registry != null) {
            return registry;
        }
        LOGGER.log(Level.WARNING, "Micrometer registry not found under {0}; falling back to global registry.", jndiName);
        return Metrics.globalRegistry;
    }

    private String resolveJndiName() {
        String fromProperty = System.getProperty(PROPERTY_KEY);
        if (fromProperty != null && !fromProperty.isBlank()) {
            return fromProperty;
        }
        String fromEnv = System.getenv(ENVIRONMENT_KEY);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        return DEFAULT_JNDI_NAME;
    }

    private MeterRegistry lookupRegistry(String jndiName) {
        try {
            InitialContext context = new InitialContext();
            Object lookedUp = context.lookup(jndiName);
            if (lookedUp instanceof MeterRegistry meterRegistry) {
                return meterRegistry;
            }
        } catch (NamingException ex) {
            LOGGER.log(Level.FINE, "Micrometer registry lookup failed for {0}: {1}", new Object[]{jndiName, ex.getMessage()});
        }
        return null;
    }
}
