package open.dolphin.msg.gateway;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.Objects;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.orca.rest.ORCAConnection;

@ApplicationScoped
public class MessagingConfig {

    private static final Logger LOGGER = Logger.getLogger(MessagingConfig.class.getName());
    private static final String CLAIM_CONN = "claim.conn";
    private static final String CLAIM_HOST = "claim.host";
    private static final String CLAIM_PORT = "claim.send.port";
    private static final String CLAIM_ENCODING = "claim.send.encoding";
    private static final String DOLPHIN_FACILITY = "dolphin.facilityId";

    private volatile ClaimSettings cachedClaimSettings;

    public ClaimSettings claimSettings() {
        ClaimSettings settings = cachedClaimSettings;
        if (settings == null) {
            settings = reloadClaimSettings();
        }
        return settings;
    }

    public synchronized ClaimSettings reloadClaimSettings() {
        Properties properties = loadProperties();
        boolean serverSide = "server".equalsIgnoreCase(properties.getProperty(CLAIM_CONN));
        String host = properties.getProperty(CLAIM_HOST);
        int port = parsePort(properties.getProperty(CLAIM_PORT));
        String encoding = properties.getProperty(CLAIM_ENCODING, "SHIFT_JIS");
        String facilityId = properties.getProperty(DOLPHIN_FACILITY);
        ClaimSettings settings = new ClaimSettings(serverSide, host, port, encoding, facilityId);
        cachedClaimSettings = settings;
        return settings;
    }

    private Properties loadProperties() {
        Properties properties = new Properties();
        File custom = resolveCustomProperties();
        if (custom != null && custom.isFile()) {
            try (FileInputStream fis = new FileInputStream(custom);
                 InputStreamReader reader = new InputStreamReader(fis, resolveEncoding())) {
                properties.load(reader);
            } catch (IOException ex) {
                LOGGER.log(Level.WARNING, "Failed to load custom.properties for messaging configuration", ex);
            }
        }

        if (properties.isEmpty()) {
            try {
                Properties orca = ORCAConnection.getInstance().getProperties();
                if (orca != null) {
                    properties.putAll(orca);
                }
            } catch (Exception ex) {
                LOGGER.log(Level.WARNING, "Failed to load ORCA connection properties", ex);
            }
        }
        return properties;
    }

    private File resolveCustomProperties() {
        String jbossHome = System.getProperty("jboss.home.dir");
        if (jbossHome == null) {
            return null;
        }
        return new File(jbossHome, "custom.properties");
    }

    private Charset resolveEncoding() {
        try {
            return Charset.forName("JISAutoDetect");
        } catch (Exception ex) {
            LOGGER.log(Level.FINE, "JISAutoDetect charset unavailable, falling back to UTF-8", ex);
            return Charset.forName("UTF-8");
        }
    }

    private int parsePort(String value) {
        if (value == null || value.isBlank()) {
            return -1;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            LOGGER.log(Level.WARNING, "Invalid claim.send.port value: {0}", value);
            return -1;
        }
    }

    public record ClaimSettings(boolean serverSideSend, String host, int port, String encoding, String facilityId) {

        public boolean isReady() {
            return serverSideSend && host != null && !host.isBlank() && port > 0;
        }

        public String encodingOrDefault() {
            return Objects.requireNonNullElse(encoding, "SHIFT_JIS");
        }
    }
}
