package open.dolphin.metrics;

import io.agroal.api.AgroalDataSource;
import io.agroal.api.AgroalDataSourceMetrics;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Initialized;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.util.function.Function;
import java.util.function.Supplier;
import org.eclipse.microprofile.metrics.Gauge;
import org.eclipse.microprofile.metrics.Metadata;
import org.eclipse.microprofile.metrics.MetricRegistry;
import org.eclipse.microprofile.metrics.MetricType;
import org.eclipse.microprofile.metrics.MetricUnits;
import org.eclipse.microprofile.metrics.annotation.RegistryType;

/**
 * データソースの接続プールメトリクスを MicroProfile Metrics へ公開する。
 */
@ApplicationScoped
public class DatasourceMetricsRegistrar {

    private static final String ACTIVE_CONNECTIONS = "opendolphin_db_active_connections";
    private static final String AVAILABLE_CONNECTIONS = "opendolphin_db_available_connections";
    private static final String MAX_USED_CONNECTIONS = "opendolphin_db_max_used_connections";

    @Resource(lookup = "java:jboss/datasources/PostgresDS")
    private AgroalDataSource dataSource;

    @Inject
    @RegistryType(type = MetricRegistry.Type.APPLICATION)
    private MetricRegistry metricRegistry;

    public void init(@Observes @Initialized(ApplicationScoped.class) Object init) {
        registerGauge(
            ACTIVE_CONNECTIONS,
            "現在アクティブな JDBC 接続数",
            metrics -> metrics.activeCount()
        );
        registerGauge(
            AVAILABLE_CONNECTIONS,
            "接続プール内で利用可能な接続数",
            metrics -> metrics.availableCount()
        );
        registerGauge(
            MAX_USED_CONNECTIONS,
            "同時接続数の最大値 (起動後累積)",
            metrics -> metrics.maxUsedCount()
        );
    }

    private void registerGauge(String name, String description, Function<AgroalDataSourceMetrics, Long> extractor) {
        Supplier<Long> supplier = () -> {
            AgroalDataSourceMetrics metrics = getMetrics();
            if (metrics == null) {
                return 0L;
            }
            return extractor.apply(metrics);
        };
        if (metricRegistry.getGauges().containsKey(name)) {
            metricRegistry.remove(name);
        }
        Metadata metadata = Metadata.builder()
            .withName(name)
            .withDescription(description)
            .withType(MetricType.GAUGE)
            .withUnit(MetricUnits.NONE)
            .build();
        Gauge<Long> gauge = supplier::get;
        metricRegistry.register(metadata, gauge);
    }

    private AgroalDataSourceMetrics getMetrics() {
        if (dataSource == null) {
            return null;
        }
        try {
            return dataSource.getMetrics();
        } catch (Exception ex) {
            return null;
        }
    }
}
