package open.orca.rest;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;
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

        try {
            // 読み込む
            FileInputStream fin = new FileInputStream(f);
            try (InputStreamReader r = new InputStreamReader(fin, "JISAutoDetect")) {
                config.load(r);
            }

        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Failed to load custom.properties for ORCA config", e);
        }

        warnLegacyJdbcConfig();
    }
    
    public Connection getConnection() {
        
        try {
            DataSource ds = (DataSource)InitialContext.doLookup(ORCA_JNDI_NAME);
            return ds.getConnection();
        } catch (SQLException | NamingException e) {
            LOGGER.log(Level.SEVERE, "Failed to obtain ORCA datasource connection", e);
        }
        return null;
    }
    
//minagawa^     
    public Properties getProperties() {
        return copyProperties(config);
    }
    
    public String getProperty(String prop) {
        return config.getProperty(prop);
    }
    
    public boolean isSendClaim() {
        String test = config.getProperty("claim.conn");         // connection type
        return test!=null && test.equals("server");
    }
//minagawa$    

    private void warnLegacyJdbcConfig() {
        if (config == null) {
            return;
        }
        if (config.getProperty("claim.jdbc.url") != null
                || config.getProperty("claim.user") != null
                || config.getProperty("claim.password") != null) {
            LOGGER.warning("custom.properties claim.jdbc.* is ignored; use JNDI datasource " + ORCA_JNDI_NAME);
        }
    }

    private static Properties copyProperties(Properties source) {
        Properties copy = new Properties();
        if (source != null) {
            copy.putAll(source);
        }
        return copy;
    }
}
