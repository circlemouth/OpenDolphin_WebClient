package open.dolphin.metrics;

import io.agroal.api.AgroalDataSourceMetrics;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Initialized;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;
import javax.sql.DataSource;

/**
 * ORCA データソースの接続プールメトリクスを Micrometer へ公開する。
 */
@ApplicationScoped
public class OrcaDatasourceMetricsRegistrar {

    private static final String ACTIVE_CONNECTIONS = "opendolphin_orca_db_active_connections";
    private static final String AVAILABLE_CONNECTIONS = "opendolphin_orca_db_available_connections";
    private static final String MAX_USED_CONNECTIONS = "opendolphin_orca_db_max_used_connections";

    @Resource(lookup = "java:jboss/datasources/ORCADS")
    private DataSource dataSource;

    @Inject
    private MeterRegistry meterRegistry;

    // Micrometer Gauge は弱参照が既定のため、Supplier を保持して GC による解放を防ぐ。
    private final List<Supplier<Number>> registeredSuppliers = new ArrayList<>();

    public void init(@Observes @Initialized(ApplicationScoped.class) Object init) {
        if (meterRegistry == null) {
            return;
        }
        registeredSuppliers.clear();
        registerGauge(
            ACTIVE_CONNECTIONS,
            "ORCA DB の現在アクティブな JDBC 接続数",
            metrics -> metrics.activeCount()
        );
        registerGauge(
            AVAILABLE_CONNECTIONS,
            "ORCA DB の接続プール内で利用可能な接続数",
            metrics -> metrics.availableCount()
        );
        registerGauge(
            MAX_USED_CONNECTIONS,
            "ORCA DB の同時接続数の最大値 (起動後累積)",
            metrics -> metrics.maxUsedCount()
        );
    }

    private void registerGauge(String name, String description, Function<AgroalDataSourceMetrics, Long> extractor) {
        meterRegistry.find(name).meters().forEach(this::removeMeterSafely);

        Supplier<Number> supplier = () -> {
            AgroalDataSourceMetrics metrics = getMetrics();
            if (metrics == null) {
                return 0;
            }
            return extractor.apply(metrics);
        };
        registeredSuppliers.add(supplier);
        Gauge.builder(name, supplier, value -> value.get().doubleValue())
            .description(description)
            .strongReference(true)
            .register(meterRegistry);
    }

    private AgroalDataSourceMetrics getMetrics() {
        if (dataSource == null) {
            return null;
        }
        if (!(dataSource instanceof io.agroal.api.AgroalDataSource)) {
            return null;
        }
        try {
            return ((io.agroal.api.AgroalDataSource) dataSource).getMetrics();
        } catch (Exception ex) {
            return null;
        }
    }

    private void removeMeterSafely(Meter meter) {
        try {
            meterRegistry.remove(meter);
        } catch (UnsupportedOperationException ignored) {
            // WildFly Micrometer 実装は remove 未サポートの場合があるため握り潰す。
        }
    }
}
