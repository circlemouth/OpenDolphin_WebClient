package open.orca.rest;

import io.micrometer.core.instrument.Metrics;
import io.micrometer.core.instrument.Tags;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Properties;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.naming.InitialContext;
import jakarta.naming.NamingException;
import javax.sql.DataSource;

/**
 * 2013/08/29
 * @author kazushi
 */
public class ORCAConnection {
    private static final Logger LOGGER = Logger.getLogger(ORCAConnection.class.getName());
    private static final Logger AUDIT_LOGGER = Logger.getLogger("open.dolphin.audit.external");
    private static final String ORCA_JNDI_NAME = "java:jboss/datasources/ORCADS";
    private static final String METRIC_LOOKUP_COUNTER = "opendolphin_orca_datasource_lookup_total";
    private static final String METRIC_CONNECTION_COUNTER = "opendolphin_orca_connection_total";
    private static final String OUTCOME_SUCCESS = "success";
    private static final String OUTCOME_FAILURE = "failure";
    private static final Set<String> BLOCKED_CUSTOM_PROPERTIES = Set.of(
            "orca.password"
    );
    private static final String ENV_ORCA_DB_HOST = "ORCA_DB_HOST";
    private static final String ENV_ORCA_DB_PORT = "ORCA_DB_PORT";
    private static final String ENV_ORCA_DB_NAME = "ORCA_DB_NAME";
    private static final String ENV_ORCA_DB_USER = "ORCA_DB_USER";
    private static final String ENV_ORCA_DB_PASSWORD = "ORCA_DB_PASSWORD";
    private static final String ENV_ORCA_DB_SSLMODE = "ORCA_DB_SSLMODE";
    private static final String ENV_ORCA_DB_SSLROOTCERT = "ORCA_DB_SSLROOTCERT";
    private static final String ENV_ORCA_DB_SECRET_REF = "ORCA_DB_SECRET_REF";
    private static final String ENV_ORCA_DB_SECRET_VERSION = "ORCA_DB_SECRET_VERSION";
    private static final String ENV_DB_HOST = "DB_HOST";
    private static final String ENV_DB_PORT = "DB_PORT";
    private static final String ENV_DB_NAME = "DB_NAME";
    private static final String ENV_DB_USER = "DB_USER";
    private static final String ENV_DB_PASSWORD = "DB_PASSWORD";

    private static final ORCAConnection instane = new ORCAConnection();
    
    //@Resource(mappedName="java:jboss/datasources/ORCADS")
    //private DataSource ds;
    
//minagawa^    
    private final Properties config;
//minagawa$
    private boolean datasourceAuditLogged;
    private boolean connectionAuditLogged;
    
    public static ORCAConnection getInstance() {
        return instane;
    }
    
    private ORCAConnection() {
        
        StringBuilder sb = new StringBuilder();
        sb.append(System.getProperty("jboss.home.dir"));
        sb.append(File.separator);
        sb.append("custom.properties");
        File f = new File(sb.toString());
        
        this.config = new Properties();

        boolean hasJdbcConfig = false;
        try {
            // 読み込む
            FileInputStream fin = new FileInputStream(f);
            try (InputStreamReader r = new InputStreamReader(fin, "JISAutoDetect")) {
                config.load(r);
            }
            hasJdbcConfig = hasJdbcConfig(config);
            stripSensitiveProperties(config);

        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Failed to load custom.properties for ORCA config", e);
        }

        if (hasJdbcConfig) {
            warnJdbcConfig();
        }
    }
    
    public Connection getConnection() throws SQLException {
        try {
            DataSource ds = (DataSource) InitialContext.doLookup(ORCA_JNDI_NAME);
            if (ds == null) {
                auditDatasourceLookup("ORCA_DATASOURCE_LOOKUP_FAILURE", "datasource_null");
                throw new SQLException("ORCA datasource lookup returned null: " + ORCA_JNDI_NAME);
            }
            auditDatasourceLookup("ORCA_DATASOURCE_LOOKUP_SUCCESS", null);
            try {
                Connection connection = ds.getConnection();
                auditDatasourceConnection("ORCA_DATASOURCE_CONNECTION_SUCCESS", null);
                return connection;
            } catch (SQLException ex) {
                auditDatasourceConnection("ORCA_DATASOURCE_CONNECTION_FAILURE", ex.getClass().getSimpleName());
                throw ex;
            }
        } catch (NamingException e) {
            auditDatasourceLookup("ORCA_DATASOURCE_LOOKUP_FAILURE", e.getClass().getSimpleName());
            throw new SQLException("Failed to lookup ORCA datasource: " + ORCA_JNDI_NAME, e);
        }
    }
    
//minagawa^     
    public Properties getProperties() {
        return copyProperties(config);
    }
    
    public String getProperty(String prop) {
        if (isSensitiveProperty(prop)) {
            LOGGER.warning("Blocked access to sensitive property in custom.properties: " + prop);
            return null;
        }
        return config.getProperty(prop);
    }
    
//minagawa$    

    public synchronized void validateDatasourceSecretsOrThrow() {
        ValidationResult result = ValidationResult.evaluate();
        if (!result.isValid()) {
            auditDatasourceLookup("ORCA_DATASOURCE_LOOKUP_FAILURE", "missing_env");
            throw new IllegalStateException("ORCA datasource secrets are missing: " + result.missingSummary());
        }
        auditDatasourceLookup("ORCA_DATASOURCE_LOOKUP_SUCCESS", null);
    }

    private void warnJdbcConfig() {
        LOGGER.warning("custom.properties JDBC settings are ignored; use JNDI datasource " + ORCA_JNDI_NAME);
    }

    private static boolean isSensitiveProperty(String prop) {
        if (prop == null) {
            return false;
        }
        String lower = prop.toLowerCase(Locale.ROOT);
        if (BLOCKED_CUSTOM_PROPERTIES.contains(prop)) {
            return true;
        }
        if (isJdbcProperty(lower)) {
            return true;
        }
        return lower.contains("password") || lower.contains("token") || lower.contains("secret");
    }

    private static boolean isJdbcProperty(String propLowerCase) {
        return propLowerCase.contains(".jdbc.");
    }

    private static boolean hasJdbcConfig(Properties source) {
        if (source == null) {
            return false;
        }
        for (String key : source.stringPropertyNames()) {
            if (isJdbcProperty(key.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private static void stripSensitiveProperties(Properties source) {
        if (source == null) {
            return;
        }
        for (String key : Set.copyOf(source.stringPropertyNames())) {
            if (isSensitiveProperty(key)) {
                source.remove(key);
            }
        }
    }

    private static Properties copyProperties(Properties source) {
        Properties copy = new Properties();
        if (source != null) {
            for (String key : source.stringPropertyNames()) {
                if (!isSensitiveProperty(key)) {
                    copy.setProperty(key, source.getProperty(key));
                }
            }
        }
        return copy;
    }

    private synchronized void auditDatasourceLookup(String event, String reason) {
        recordMetric(METRIC_LOOKUP_COUNTER, event, reason);
        if (datasourceAuditLogged && reason == null) {
            return;
        }
        ValidationResult result = ValidationResult.evaluate();
        StringBuilder builder = new StringBuilder();
        builder.append("event=").append(event);
        builder.append(" jndiName=").append(ORCA_JNDI_NAME);
        builder.append(" source=").append(result.sourceLabel());
        if (!result.secretRef.isBlank()) {
            builder.append(" secretRef=").append(result.secretRef);
        }
        if (!result.secretVersion.isBlank()) {
            builder.append(" secretVersion=").append(result.secretVersion);
        }
        if (reason != null) {
            builder.append(" reason=").append(reason);
        }
        if (!result.missingEnv.isEmpty()) {
            builder.append(" missingEnv=").append(result.missingSummary());
        }
        AUDIT_LOGGER.log(reason == null ? Level.INFO : Level.WARNING, builder.toString());
        if (reason == null) {
            datasourceAuditLogged = true;
        }
    }

    private synchronized void auditDatasourceConnection(String event, String reason) {
        recordMetric(METRIC_CONNECTION_COUNTER, event, reason);
        if (connectionAuditLogged && reason == null) {
            return;
        }
        ValidationResult result = ValidationResult.evaluate();
        StringBuilder builder = new StringBuilder();
        builder.append("event=").append(event);
        builder.append(" jndiName=").append(ORCA_JNDI_NAME);
        builder.append(" source=").append(result.sourceLabel());
        if (!result.secretRef.isBlank()) {
            builder.append(" secretRef=").append(result.secretRef);
        }
        if (!result.secretVersion.isBlank()) {
            builder.append(" secretVersion=").append(result.secretVersion);
        }
        if (reason != null) {
            builder.append(" reason=").append(reason);
        }
        AUDIT_LOGGER.log(reason == null ? Level.INFO : Level.WARNING, builder.toString());
        if (reason == null) {
            connectionAuditLogged = true;
        }
    }

    private static void recordMetric(String metric, String event, String reason) {
        String outcome = event != null && event.endsWith("SUCCESS") ? OUTCOME_SUCCESS : OUTCOME_FAILURE;
        String resolvedReason = (reason == null || reason.isBlank()) ? "none" : reason;
        Metrics.counter(metric, Tags.of("outcome", outcome, "reason", resolvedReason)).increment();
    }

    private static boolean hasAnyOrcaOverride() {
        return hasEnv(ENV_ORCA_DB_HOST)
                || hasEnv(ENV_ORCA_DB_PORT)
                || hasEnv(ENV_ORCA_DB_NAME)
                || hasEnv(ENV_ORCA_DB_USER)
                || hasEnv(ENV_ORCA_DB_PASSWORD)
                || hasEnv(ENV_ORCA_DB_SSLMODE)
                || hasEnv(ENV_ORCA_DB_SSLROOTCERT)
                || hasEnv(ENV_ORCA_DB_SECRET_REF)
                || hasEnv(ENV_ORCA_DB_SECRET_VERSION);
    }

    private static boolean hasEnv(String key) {
        return !isBlank(System.getenv(key));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static final class ValidationResult {
        private final boolean orcaOverrides;
        private final Set<String> missingEnv;
        private final String secretRef;
        private final String secretVersion;

        private ValidationResult(boolean orcaOverrides, Set<String> missingEnv, String secretRef, String secretVersion) {
            this.orcaOverrides = orcaOverrides;
            this.missingEnv = missingEnv;
            this.secretRef = secretRef != null ? secretRef : "";
            this.secretVersion = secretVersion != null ? secretVersion : "";
        }

        private static ValidationResult evaluate() {
            boolean useOrca = hasAnyOrcaOverride();
            Set<String> missing = Set.of();
            if (useOrca) {
                missing = collectMissing(ENV_ORCA_DB_HOST, ENV_ORCA_DB_NAME, ENV_ORCA_DB_USER, ENV_ORCA_DB_PASSWORD);
            } else {
                missing = collectMissing(ENV_DB_HOST, ENV_DB_NAME, ENV_DB_USER, ENV_DB_PASSWORD);
            }
            return new ValidationResult(useOrca, missing,
                    System.getenv(ENV_ORCA_DB_SECRET_REF),
                    System.getenv(ENV_ORCA_DB_SECRET_VERSION));
        }

        private static Set<String> collectMissing(String... keys) {
            Set<String> missing = new java.util.LinkedHashSet<>();
            for (String key : keys) {
                if (isBlank(System.getenv(key))) {
                    missing.add(key);
                }
            }
            return missing;
        }

        private boolean isValid() {
            return missingEnv.isEmpty();
        }

        private String sourceLabel() {
            return orcaOverrides ? "ORCA_DB" : "DB";
        }

        private String missingSummary() {
            if (missingEnv.isEmpty()) {
                return "";
            }
            return String.join(",", missingEnv);
        }
    }
}
