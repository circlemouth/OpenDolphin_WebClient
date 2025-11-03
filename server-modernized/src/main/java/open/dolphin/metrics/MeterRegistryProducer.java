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
        LOGGER.warn("Micrometer registry not found under {}; falling back to global registry.", jndiName);
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
            LOGGER.debug("Micrometer registry lookup failed for {}: {}", jndiName, ex.getMessage());
        }
        return null;
    }
}
