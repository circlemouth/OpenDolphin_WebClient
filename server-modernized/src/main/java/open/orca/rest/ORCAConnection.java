package open.orca.rest;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.SQLException;
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
    private static final String ORCA_JNDI_NAME = "java:jboss/datasources/ORCADS";
    private static final Set<String> BLOCKED_CUSTOM_PROPERTIES = Set.of(
            "claim.jdbc.url",
            "claim.user",
            "claim.password"
    );

    private static final ORCAConnection instane = new ORCAConnection();
    
    //@Resource(mappedName="java:jboss/datasources/ORCADS")
    //private DataSource ds;
    
//minagawa^    
    private final Properties config;
//minagawa$
    
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

        boolean hasLegacyJdbcConfig = false;
        try {
            // 読み込む
            FileInputStream fin = new FileInputStream(f);
            try (InputStreamReader r = new InputStreamReader(fin, "JISAutoDetect")) {
                config.load(r);
            }
            hasLegacyJdbcConfig = hasLegacyJdbcConfig(config);
            stripSensitiveProperties(config);

        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Failed to load custom.properties for ORCA config", e);
        }

        if (hasLegacyJdbcConfig) {
            warnLegacyJdbcConfig();
        }
    }
    
    public Connection getConnection() throws SQLException {
        try {
            DataSource ds = (DataSource) InitialContext.doLookup(ORCA_JNDI_NAME);
            if (ds == null) {
                throw new SQLException("ORCA datasource lookup returned null: " + ORCA_JNDI_NAME);
            }
            return ds.getConnection();
        } catch (NamingException e) {
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
    
    public boolean isSendClaim() {
        String test = config.getProperty("claim.conn");         // connection type
        return test!=null && test.equals("server");
    }
//minagawa$    

    private void warnLegacyJdbcConfig() {
        LOGGER.warning("custom.properties claim.jdbc.* is ignored; use JNDI datasource " + ORCA_JNDI_NAME);
    }

    private static boolean isSensitiveProperty(String prop) {
        if (prop == null) {
            return false;
        }
        if (BLOCKED_CUSTOM_PROPERTIES.contains(prop)) {
            return true;
        }
        return prop.startsWith("claim.jdbc.");
    }

    private static boolean hasLegacyJdbcConfig(Properties source) {
        if (source == null) {
            return false;
        }
        for (String key : source.stringPropertyNames()) {
            if (isSensitiveProperty(key)) {
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
}
