package open.dolphin.tools;

import jakarta.persistence.Persistence;
import java.util.HashMap;
import java.util.Map;

public final class SchemaBootstrap {
    private SchemaBootstrap() {
    }

    public static void main(String[] args) {
        Map<String, Object> props = new HashMap<>();
        String host = getenv("DB_HOST", "localhost");
        String port = getenv("DB_PORT", "55434");
        String name = getenv("DB_NAME", "opendolphin_modern");
        String user = getenv("DB_USER", "opendolphin");
        String pass = getenv("DB_PASSWORD", "opendolphin");
        String url = "jdbc:postgresql://" + host + ":" + port + "/" + name;

        props.put("jakarta.persistence.jdbc.url", url);
        props.put("jakarta.persistence.jdbc.user", user);
        props.put("jakarta.persistence.jdbc.password", pass);
        props.put("jakarta.persistence.jdbc.driver", "org.postgresql.Driver");
        props.put("jakarta.persistence.transactionType", "RESOURCE_LOCAL");
        props.put("jakarta.persistence.schema-generation.database.action", "create");
        props.put("hibernate.hbm2ddl.auto", "create");
        props.put("hibernate.transaction.coordinator_class", "jdbc");
        props.put("hibernate.transaction.jta.platform", "org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform");

        System.out.println("[SchemaBootstrap] Generating schema to " + url);
        Persistence.generateSchema("opendolphinPU", props);
        System.out.println("[SchemaBootstrap] Schema generation completed.");
    }

    private static String getenv(String key, String fallback) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
