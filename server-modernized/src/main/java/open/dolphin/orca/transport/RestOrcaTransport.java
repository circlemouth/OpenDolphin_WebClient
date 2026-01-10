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
    private static final String ENV_ORCA_API_WEBORCA = "ORCA_API_WEBORCA";
    private static final String ENV_ORCA_API_RETRY_MAX = "ORCA_API_RETRY_MAX";
    private static final String ENV_ORCA_API_RETRY_BACKOFF_MS = "ORCA_API_RETRY_BACKOFF_MS";

    private static final String PROP_ORCA_API_HOST = "orca.orcaapi.ip";
    private static final String PROP_ORCA_API_PORT = "orca.orcaapi.port";
    private static final String PROP_ORCA_API_USER = "orca.id";
    private static final String PROP_ORCA_API_PASSWORD = "orca.password";


    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(15);
    private static final int DEFAULT_RETRY_MAX = 0;
    private static final long DEFAULT_RETRY_BACKOFF_MS = 200L;
    private static final String ORCA_CONTENT_TYPE = "application/xml; charset=utf-8";
    private static final String ORCA_ACCEPT = "application/xml";

    private HttpClient client;

    @Inject
    SessionTraceManager traceManager;

    @PostConstruct
    private void initialize() {
        this.client = HttpClient.newBuilder()
                .connectTimeout(DEFAULT_CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    @Override
    public String invoke(OrcaEndpoint endpoint, String requestXml) {
        OrcaTransportSettings resolved = OrcaTransportSettings.load();
        String traceId = resolveTraceId();
        String action = "ORCA_HTTP";
        if (endpoint == null) {
            OrcaGatewayException failure = new OrcaGatewayException("Endpoint must not be null");
            ExternalServiceAuditLogger.logOrcaFailure(traceId, action, null, resolved.auditSummary(), failure);
            throw failure;
        }
        if (!resolved.isReady()) {
            OrcaGatewayException failure = new OrcaGatewayException("ORCA transport settings are incomplete");
            ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), failure);
            throw failure;
        }
        String payload = requestXml != null ? requestXml : "";
        if (endpoint.requiresBody() && payload.isBlank()) {
            logMissingBody(traceId, endpoint, resolved);
            OrcaGatewayException failure = new OrcaGatewayException("ORCA request body is required for " + endpoint.getPath());
            ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), failure);
            throw failure;
        }
        String requestId = traceId;
        String url = resolved.buildUrl(endpoint, extractQueryFromMeta(endpoint, payload));
        URI uri = toUriWithAudit(url, traceId, action, endpoint, resolved);
        int maxRetries = resolved.retryMax;
        long backoffMs = resolved.retryBackoffMs;
        int attempt = 0;
        while (true) {
            attempt++;
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(uri)
                        .timeout(DEFAULT_READ_TIMEOUT)
                        .header("Content-Type", ORCA_CONTENT_TYPE)
                        .header("Accept", ORCA_ACCEPT)
                        .header("Authorization", resolved.basicAuthHeader())
                        .header("X-Request-Id", safeHeader(requestId))
                        .header("X-Trace-Id", safeHeader(traceId))
                        .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                        .build();
                ExternalServiceAuditLogger.logOrcaRequestDetail(traceId, uri != null ? uri.toString() : null,
                        request.method(), ORCA_CONTENT_TYPE, ORCA_ACCEPT, payload);
                ExternalServiceAuditLogger.logOrcaRequest(traceId, action, endpoint.getPath(), resolved.auditSummary());
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                int status = response.statusCode();
                String body = response.body() != null ? response.body() : "";
                ExternalServiceAuditLogger.logOrcaResponse(traceId, action, endpoint.getPath(), status, resolved.auditSummary());
                if (status < 200 || status >= 300) {
                    OrcaGatewayException failure = new OrcaGatewayException("ORCA HTTP response status " + status);
                    ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), failure);
                    if (shouldRetry(status, attempt, maxRetries)) {
                        sleepQuietly(backoffMs);
                        continue;
                    }
                    throw failure;
                }
                if (body.isBlank()) {
                    OrcaGatewayException failure = new OrcaGatewayException("ORCA HTTP response body is empty");
                    ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), failure);
                    if (shouldRetry(200, attempt, maxRetries)) {
                        sleepQuietly(backoffMs);
                        continue;
                    }
                    throw failure;
                }
                return body;
            } catch (IOException ex) {
                ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), ex);
                if (shouldRetry(-1, attempt, maxRetries)) {
                    sleepQuietly(backoffMs);
                    continue;
                }
                throw new OrcaGatewayException("Failed to call ORCA API", ex);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                ExternalServiceAuditLogger.logOrcaFailure(traceId, action, endpoint.getPath(), resolved.auditSummary(), ex);
                throw new OrcaGatewayException("ORCA API request interrupted", ex);
            }
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

    private static URI toUriWithAudit(String url, String traceId, String action,
            OrcaEndpoint endpoint, OrcaTransportSettings settings) {
        try {
            return toUri(url);
        } catch (OrcaGatewayException ex) {
            String path = endpoint != null ? endpoint.getPath() : null;
            String summary = settings != null ? settings.auditSummary() : "orca.host=unknown";
            ExternalServiceAuditLogger.logOrcaFailure(traceId, action, path, summary, ex);
            throw ex;
        }
    }

    private static String safeHeader(String value) {
        return value == null ? "" : value;
    }

    private static boolean shouldRetry(int status, int attempt, int maxRetries) {
        if (attempt > maxRetries + 1) {
            return false;
        }
        if (status == -1) {
            return true;
        }
        return status >= 500 && status < 600;
    }

    private static void sleepQuietly(long backoffMs) {
        if (backoffMs <= 0) {
            return;
        }
        try {
            Thread.sleep(backoffMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    static final class OrcaTransportSettings {
        private final String host;
        private final int port;
        private final String scheme;
        private final String user;
        private final String password;
        private final String pathPrefix;
        private final boolean weborcaExplicit;
        private final int retryMax;
        private final long retryBackoffMs;

        private OrcaTransportSettings(String host, int port, String scheme, String user, String password,
                String pathPrefix, boolean weborcaExplicit, int retryMax, long retryBackoffMs) {
            this.host = host;
            this.port = port;
            this.scheme = scheme;
            this.user = user;
            this.password = password;
            this.pathPrefix = pathPrefix;
            this.weborcaExplicit = weborcaExplicit;
            this.retryMax = retryMax;
            this.retryBackoffMs = retryBackoffMs;
        }

        static OrcaTransportSettings load() {
            Properties props = loadProperties();
            return new OrcaTransportSettings(
                    firstNonBlank(trim(env(ENV_ORCA_API_HOST)), property(props, PROP_ORCA_API_HOST)),
                    resolvePort(parsePort(env(ENV_ORCA_API_PORT)), property(props, PROP_ORCA_API_PORT)),
                    normalizeScheme(firstNonBlank(trim(env(ENV_ORCA_API_SCHEME)))),
                    firstNonBlank(trim(env(ENV_ORCA_API_USER)), property(props, PROP_ORCA_API_USER)),
                    firstNonBlank(trim(env(ENV_ORCA_API_PASSWORD)), property(props, PROP_ORCA_API_PASSWORD)),
                    normalizePathPrefix(firstNonBlank(trim(env(ENV_ORCA_API_PATH_PREFIX)))),
                    parseBoolean(env(ENV_ORCA_API_WEBORCA)),
                    parseInt(env(ENV_ORCA_API_RETRY_MAX), DEFAULT_RETRY_MAX),
                    parseLong(env(ENV_ORCA_API_RETRY_BACKOFF_MS), DEFAULT_RETRY_BACKOFF_MS)
            );
        }

        boolean isReady() {
            return host != null && !host.isBlank()
                    && port > 0
                    && user != null && !user.isBlank()
                    && password != null && !password.isBlank();
        }

        String buildUrl(OrcaEndpoint endpoint, String query) {
            StringBuilder builder = new StringBuilder();
            builder.append(scheme != null ? scheme : "http");
            builder.append("://");
            builder.append(host);
            if (!(isHttps() && port == 443)) {
                builder.append(':');
                builder.append(port);
            }
            String resolvedPrefix = resolvePathPrefix(pathPrefix);
            String resolvedPath = normalizeEndpointPath(endpoint != null ? endpoint.getPath() : null);
            builder.append(joinPath(resolvedPrefix, resolvedPath));
            if (query != null && !query.isBlank()) {
                builder.append('?').append(query);
            }
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

        private String resolvePathPrefix(String value) {
            if (isWebOrca()) {
                return "/api";
            }
            return normalizePathPrefix(value);
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

        private boolean isWebOrca() {
            if (weborcaExplicit) {
                return true;
            }
            if (host == null || host.isBlank()) {
                return false;
            }
            String lower = host.toLowerCase(Locale.ROOT);
            return lower.contains("weborca-") || lower.startsWith("weborca.");
        }

        private boolean isHttps() {
            String resolvedScheme = scheme != null ? scheme : "http";
            return "https".equalsIgnoreCase(resolvedScheme);
        }

        private static String safe(String value) {
            return value != null ? value : "unknown";
        }

        private static int parseInt(String value, int defaultValue) {
            if (value == null || value.isBlank()) {
                return defaultValue;
            }
            try {
                return Integer.parseInt(value.trim());
            } catch (NumberFormatException ex) {
                LOGGER.log(Level.WARNING, "Invalid ORCA retry max: {0}", value);
                return defaultValue;
            }
        }

        private static long parseLong(String value, long defaultValue) {
            if (value == null || value.isBlank()) {
                return defaultValue;
            }
            try {
                return Long.parseLong(value.trim());
            } catch (NumberFormatException ex) {
                LOGGER.log(Level.WARNING, "Invalid ORCA retry backoff ms: {0}", value);
                return defaultValue;
            }
        }

        private static boolean parseBoolean(String value) {
            if (value == null || value.isBlank()) {
                return false;
            }
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            return normalized.equals("true") || normalized.equals("1") || normalized.equals("yes") || normalized.equals("y")
                    || normalized.equals("on");
        }

        private static String normalizeEndpointPath(String value) {
            if (value == null) {
                return "";
            }
            String corrected = value.replace("/medicationmodv2", "/medicatonmodv2");
            return corrected.trim();
        }

        private static String joinPath(String prefix, String path) {
            String trimmedPrefix = trimSlashes(prefix);
            String trimmedPath = trimSlashes(path);
            if (trimmedPrefix.isEmpty() && trimmedPath.isEmpty()) {
                return "/";
            }
            if (trimmedPrefix.isEmpty()) {
                return "/" + trimmedPath;
            }
            if (trimmedPath.isEmpty()) {
                return "/" + trimmedPrefix;
            }
            return "/" + trimmedPrefix + "/" + trimmedPath;
        }

        private static String trimSlashes(String value) {
            if (value == null) {
                return "";
            }
            String result = value.trim();
            while (result.startsWith("/")) {
                result = result.substring(1);
            }
            while (result.endsWith("/")) {
                result = result.substring(0, result.length() - 1);
            }
            return result;
        }
    }

    private static void logMissingBody(String traceId, OrcaEndpoint endpoint, OrcaTransportSettings settings) {
        java.util.List<String> fields = endpoint != null ? endpoint.requiredFields() : java.util.List.of();
        String fieldSummary = fields.isEmpty() ? "unknown" : String.join(",", fields);
        LOGGER.log(Level.WARNING, "ORCA request body is missing traceId={0} path={1} requiredFields={2} target={3}",
                new Object[]{traceId, endpoint != null ? endpoint.getPath() : "unknown", fieldSummary,
                        settings != null ? settings.auditSummary() : "orca.host=unknown"});
    }

    private static String extractQueryFromMeta(OrcaEndpoint endpoint, String payload) {
        if (endpoint == null || !endpoint.usesQueryFromMeta()) {
            return null;
        }
        if (payload == null || payload.isBlank()) {
            return null;
        }
        int start = payload.indexOf("<!--");
        if (start < 0) {
            return null;
        }
        int metaIndex = payload.indexOf("orca-meta:", start);
        if (metaIndex < 0) {
            return null;
        }
        int end = payload.indexOf("-->", metaIndex);
        if (end < 0) {
            return null;
        }
        String content = payload.substring(metaIndex + "orca-meta:".length(), end).trim();
        String[] parts = content.split("\\s+");
        for (String part : parts) {
            if (part.startsWith("query=")) {
                return part.substring("query=".length());
            }
        }
        return null;
    }
}
