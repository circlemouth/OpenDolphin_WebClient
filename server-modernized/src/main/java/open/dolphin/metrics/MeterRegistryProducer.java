package open.dolphin.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Metrics;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Dependent;
import jakarta.enterprise.inject.Produces;
import jakarta.naming.InitialContext;
import jakarta.naming.NamingException;
import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
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
    private static final String DISABLE_OTLP_ENV = "OPENDOLPHIN_DISABLE_OTLP_METRICS";
    private static final String DISABLE_OTLP_PROPERTY = "open.dolphin.metrics.otlp.disabled";
    private static final ScheduledExecutorService OTLP_SWEEPER = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "otlp-metrics-sweeper");
        t.setDaemon(true);
        return t;
    });

    @PostConstruct
    void initialize() {
        if (shouldDisableOtlp()) {
            // 明示的に Micrometer / OTLP 関連のフラグも落としておく
            System.setProperty("otlp.enabled", "false");
            System.setProperty("micrometer.export.otlp.enabled", "false");
            System.setProperty("management.otlp.metrics.export.enabled", "false");
            filterOutOtlp(Metrics.globalRegistry);
            // 起動後に追加される OTLP レジストリも除去するため、短周期でスイープする
            OTLP_SWEEPER.scheduleAtFixedRate(() -> filterOutOtlp(Metrics.globalRegistry),
                    0, Duration.ofSeconds(20).toSeconds(), TimeUnit.SECONDS);
        }
    }

    @Produces
    @Dependent
    public MeterRegistry produceMeterRegistry() {
        String jndiName = resolveJndiName();
        MeterRegistry registry = lookupRegistry(jndiName);
        boolean disableOtlp = shouldDisableOtlp();
        if (disableOtlp) {
            registry = filterOutOtlp(registry);
            filterOutOtlp(Metrics.globalRegistry);
            if (registry != null) {
                return registry;
            }
            LOGGER.info("Micrometer registry not found under {}; falling back to global registry (OTLP disabled).", jndiName);
            return Metrics.globalRegistry;
        }
        if (registry != null) {
            return registry;
        }
        LOGGER.info("Micrometer registry not found under {}; falling back to global registry.", jndiName);
        return Metrics.globalRegistry;
    }

    private boolean shouldDisableOtlp() {
        return Boolean.parseBoolean(System.getProperty(DISABLE_OTLP_PROPERTY, "false"))
                || Boolean.parseBoolean(System.getenv(DISABLE_OTLP_ENV));
    }

    private MeterRegistry filterOutOtlp(MeterRegistry registry) {
        if (registry != null && isOtlpRegistry(registry)) {
            LOGGER.info("Disabling OTLP MeterRegistry {}", registry.getClass().getName());
            try {
                registry.close();
            } catch (Exception ex) {
                LOGGER.debug("Ignoring error while closing OTLP registry: {}", ex.getMessage());
            }
            return null;
        }
        // Also remove any OTLP registries registered globally.
        Metrics.globalRegistry.getRegistries().stream()
                .filter(this::isOtlpRegistry)
                .toList()
                .forEach(r -> {
                    LOGGER.info("Removing global OTLP MeterRegistry {}", r.getClass().getName());
                    Metrics.globalRegistry.remove(r);
                    try {
                        r.close();
                    } catch (Exception ex) {
                        LOGGER.debug("Ignoring error while closing OTLP registry: {}", ex.getMessage());
                    }
                });
        return registry;
    }

    private boolean isOtlpRegistry(MeterRegistry registry) {
        return registry.getClass().getName().toLowerCase().contains("otlp");
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
