package open.dolphin.orca.transport;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.msg.gateway.ExternalServiceAuditLogger;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.orca.rest.ORCAConnection;

/**
 * HTTP transport for ORCA API endpoints using Basic auth.
 */
@ApplicationScoped
public class RestOrcaTransport implements OrcaTransport {

    private static final Logger LOGGER = Logger.getLogger(RestOrcaTransport.class.getName());

    private static final String ENV_ORCA_API_HOST = "ORCA_API_HOST";
    private static final String ENV_ORCA_API_PORT = "ORCA_API_PORT";
    private static final String ENV_ORCA_API_SCHEME = "ORCA_API_SCHEME";
    private static final String ENV_ORCA_API_USER = "ORCA_API_USER";
    private static final String ENV_ORCA_API_PASSWORD = "ORCA_API_PASSWORD";
    private static final String ENV_ORCA_API_PATH_PREFIX = "ORCA_API_PATH_PREFIX";

    private static final String PROP_ORCA_API_HOST = "orca.orcaapi.ip";
    private static final String PROP_ORCA_API_PORT = "orca.orcaapi.port";
    private static final String PROP_ORCA_API_USER = "orca.id";
    private static final String PROP_ORCA_API_PASSWORD = "orca.password";

    private static final String PROP_CLAIM_HOST = "claim.host";
    private static final String PROP_CLAIM_PORT = "claim.send.port";
    private static final String PROP_CLAIM_SCHEME = "claim.scheme";

    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(15);

    private HttpClient client;

    @Inject
    SessionTraceManager traceManager;

    @PostConstruct
    private void initialize() {
        this.client = HttpClient.newBuilder()
                .connectTimeout(DEFAULT_CONNECT_TIMEOUT)
                .build();
    }

    @Override
    public String invoke(OrcaEndpoint endpoint, String requestXml) {
        if (endpoint == null) {
            throw new OrcaGatewayException("Endpoint must not be null");
        }
        OrcaTransportSettings resolved = OrcaTransportSettings.load();
        if (!resolved.isReady()) {
            throw new OrcaGatewayException("ORCA transport settings are incomplete");
        }
        String payload = requestXml != null ? requestXml : "";
        String traceId = resolveTraceId();
        String requestId = traceId;
        String url = resolved.buildUrl(endpoint);
        String action = "ORCA_HTTP";
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(toUri(url))
                    .timeout(DEFAULT_READ_TIMEOUT)
                    .header("Content-Type", "application/xml")
                    .header("Accept", "application/xml")
                    .header("Authorization", resolved.basicAuthHeader())
                    .header("X-Request-Id", safeHeader(requestId))
                    .header("X-Trace-Id", safeHeader(traceId))
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();
            ExternalServiceAuditLogger.logOrcaRequest(traceId, action, endpoint.getPath(), resolved.auditSummary());
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int status = response.statusCode();
            String body = response.body() != null ? response.body() : "";
            ExternalServiceAuditLogger.logOrcaResponse(traceId, action, endpoint.getPath(), status, resolved.auditSummary());
            if (status < 200 || status >= 300) {
                OrcaGatewayException failure = new OrcaGatewayException("ORCA HTTP response status " + status);
                ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), failure);
                throw failure;
            }
            return body;
        } catch (IOException ex) {
            ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), ex);
            throw new OrcaGatewayException("Failed to call ORCA API", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), ex);
            throw new OrcaGatewayException("ORCA API request interrupted", ex);
        }
    }

    private String resolveTraceId() {
        if (traceManager == null) {
            return null;
        }
        SessionTraceContext context = traceManager.current();
        return context != null ? context.getTraceId() : null;
    }

    private static URI toUri(String url) {
        try {
            return new URI(url);
        } catch (URISyntaxException ex) {
            throw new OrcaGatewayException("Invalid ORCA API URL: " + url, ex);
        }
    }

    private static String safeHeader(String value) {
        return value == null ? "" : value;
    }

    static final class OrcaTransportSettings {
        private final String host;
        private final int port;
        private final String scheme;
        private final String user;
        private final String password;
        private final String pathPrefix;

        private OrcaTransportSettings(String host, int port, String scheme, String user, String password, String pathPrefix) {
            this.host = host;
            this.port = port;
            this.scheme = scheme;
            this.user = user;
            this.password = password;
            this.pathPrefix = pathPrefix;
        }

        static OrcaTransportSettings load() {
            Properties props = loadProperties();
            return new OrcaTransportSettings(
                    firstNonBlank(trim(env(ENV_ORCA_API_HOST)), property(props, PROP_ORCA_API_HOST), property(props, PROP_CLAIM_HOST)),
                    resolvePort(parsePort(env(ENV_ORCA_API_PORT)), property(props, PROP_ORCA_API_PORT), property(props, PROP_CLAIM_PORT)),
                    normalizeScheme(firstNonBlank(trim(env(ENV_ORCA_API_SCHEME)), property(props, PROP_CLAIM_SCHEME))),
                    firstNonBlank(trim(env(ENV_ORCA_API_USER)), property(props, PROP_ORCA_API_USER)),
                    firstNonBlank(trim(env(ENV_ORCA_API_PASSWORD)), property(props, PROP_ORCA_API_PASSWORD)),
                    normalizePathPrefix(firstNonBlank(trim(env(ENV_ORCA_API_PATH_PREFIX))))
            );
        }

        boolean isReady() {
            return host != null && !host.isBlank()
                    && port > 0
                    && user != null && !user.isBlank()
                    && password != null && !password.isBlank();
        }

        String buildUrl(OrcaEndpoint endpoint) {
            StringBuilder builder = new StringBuilder();
            builder.append(scheme != null ? scheme : "http");
            builder.append("://");
            builder.append(host);
            builder.append(':');
            builder.append(port);
            if (pathPrefix != null && !pathPrefix.isBlank()) {
                if (!pathPrefix.startsWith("/")) {
                    builder.append('/');
                }
                builder.append(pathPrefix);
            }
            builder.append(endpoint.getPath());
            return builder.toString();
        }

        String basicAuthHeader() {
            String token = user + ":" + password;
            String encoded = Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
            return "Basic " + encoded;
        }

        String auditSummary() {
            String resolvedScheme = scheme != null ? scheme : "http";
            return String.format(Locale.ROOT, "orca.host=%s orca.port=%d orca.scheme=%s", safe(host), port, resolvedScheme);
        }

        private static Properties loadProperties() {
            Properties properties = loadCustomProperties();
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

        private static Properties loadCustomProperties() {
            Properties properties = new Properties();
            String jbossHome = System.getProperty("jboss.home.dir");
            if (jbossHome == null || jbossHome.isBlank()) {
                return properties;
            }
            File custom = new File(jbossHome, "custom.properties");
            if (!custom.isFile()) {
                return properties;
            }
            try (FileInputStream fis = new FileInputStream(custom);
                 InputStreamReader reader = new InputStreamReader(fis, "JISAutoDetect")) {
                properties.load(reader);
            } catch (IOException ex) {
                LOGGER.log(Level.WARNING, "Failed to load custom.properties for ORCA transport", ex);
            }
            return properties;
        }

        private static String property(Properties props, String key) {
            if (props == null || key == null) {
                return null;
            }
            return props.getProperty(key);
        }

        private static String env(String key) {
            return System.getenv(key);
        }

        private static String trim(String value) {
            return value == null ? null : value.trim();
        }

        private static String firstNonBlank(String... values) {
            if (values == null) {
                return null;
            }
            for (String value : values) {
                if (value != null && !value.isBlank()) {
                    return value.trim();
                }
            }
            return null;
        }

        private static int parsePort(String value) {
            if (value == null || value.isBlank()) {
                return -1;
            }
            try {
                return Integer.parseInt(value.trim());
            } catch (NumberFormatException ex) {
                LOGGER.log(Level.WARNING, "Invalid ORCA API port: {0}", value);
                return -1;
            }
        }

        private static int resolvePort(int primary, String... candidates) {
            if (primary > 0) {
                return primary;
            }
            if (candidates != null) {
                for (String candidate : candidates) {
                    int parsed = parsePort(candidate);
                    if (parsed > 0) {
                        return parsed;
                    }
                }
            }
            return -1;
        }

        private static String normalizeScheme(String value) {
            String schemeValue = trim(value);
            if (schemeValue == null || schemeValue.isBlank()) {
                return "http";
            }
            return schemeValue.toLowerCase(Locale.ROOT);
        }

        private static String normalizePathPrefix(String value) {
            String trimmed = trim(value);
            if (trimmed == null || trimmed.isBlank()) {
                return "";
            }
            if (trimmed.endsWith("/")) {
                return trimmed.substring(0, trimmed.length() - 1);
            }
            return trimmed;
        }

        private static String safe(String value) {
            return value != null ? value : "unknown";
        }
    }
}
