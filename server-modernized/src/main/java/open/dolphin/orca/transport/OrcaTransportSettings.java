package open.dolphin.orca.transport;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Locale;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.orca.rest.ORCAConnection;

/**
 * Shared configuration resolver for ORCA HTTP transport.
 */
public final class OrcaTransportSettings {

    private static final Logger LOGGER = Logger.getLogger(OrcaTransportSettings.class.getName());

    private static final String ENV_ORCA_API_HOST = "ORCA_API_HOST";
    private static final String ENV_ORCA_API_PORT = "ORCA_API_PORT";
    private static final String ENV_ORCA_API_SCHEME = "ORCA_API_SCHEME";
    private static final String ENV_ORCA_API_USER = "ORCA_API_USER";
    private static final String ENV_ORCA_API_PASSWORD = "ORCA_API_PASSWORD";
    private static final String ENV_ORCA_API_PATH_PREFIX = "ORCA_API_PATH_PREFIX";
    private static final String ENV_ORCA_API_WEBORCA = "ORCA_API_WEBORCA";
    private static final String ENV_ORCA_API_RETRY_MAX = "ORCA_API_RETRY_MAX";
    private static final String ENV_ORCA_API_RETRY_BACKOFF_MS = "ORCA_API_RETRY_BACKOFF_MS";
    private static final String ENV_ORCA_BASE_URL = "ORCA_BASE_URL";
    private static final String ENV_ORCA_MODE = "ORCA_MODE";

    private static final String PROP_ORCA_API_HOST = "orca.orcaapi.ip";
    private static final String PROP_ORCA_API_PORT = "orca.orcaapi.port";
    private static final String PROP_ORCA_API_USER = "orca.id";
    private static final String PROP_ORCA_API_PASSWORD = "orca.password";

    private static final int DEFAULT_RETRY_MAX = 0;
    private static final long DEFAULT_RETRY_BACKOFF_MS = 200L;

    private final String host;
    private final int port;
    private final String scheme;
    private final String user;
    private final String password;
    private final String pathPrefix;
    private final boolean weborcaExplicit;
    final int retryMax;
    final long retryBackoffMs;
    private final String baseUrl;
    private final String mode;
    private final String modeNormalized;

    private OrcaTransportSettings(String host, int port, String scheme, String user, String password,
            String pathPrefix, boolean weborcaExplicit, int retryMax, long retryBackoffMs,
            String baseUrl, String mode) {
        this.host = host;
        this.port = port;
        this.scheme = scheme;
        this.user = user;
        this.password = password;
        this.pathPrefix = pathPrefix;
        this.weborcaExplicit = weborcaExplicit;
        this.retryMax = retryMax;
        this.retryBackoffMs = retryBackoffMs;
        this.baseUrl = trim(baseUrl);
        this.mode = trim(mode);
        this.modeNormalized = normalizeMode(this.mode);
    }

    public static OrcaTransportSettings load() {
        Properties props = loadProperties();
        String baseUrl = firstNonBlank(trim(env(ENV_ORCA_BASE_URL)));
        String mode = firstNonBlank(trim(env(ENV_ORCA_MODE)));
        String host = firstNonBlank(trim(env(ENV_ORCA_API_HOST)), property(props, PROP_ORCA_API_HOST));
        int port = resolvePort(parsePort(env(ENV_ORCA_API_PORT)), property(props, PROP_ORCA_API_PORT));
        String scheme = firstNonBlank(trim(env(ENV_ORCA_API_SCHEME)));
        String user = firstNonBlank(trim(env(ENV_ORCA_API_USER)), property(props, PROP_ORCA_API_USER));
        String password = firstNonBlank(trim(env(ENV_ORCA_API_PASSWORD)), property(props, PROP_ORCA_API_PASSWORD));
        String pathPrefix = normalizePathPrefix(firstNonBlank(trim(env(ENV_ORCA_API_PATH_PREFIX))));
        boolean weborcaExplicit = parseBoolean(env(ENV_ORCA_API_WEBORCA));

        HostSpec baseSpec = parseHostSpec(baseUrl, scheme);
        if (baseSpec != null) {
            if (host == null || host.isBlank()) {
                host = baseSpec.host;
            }
            if (scheme == null || scheme.isBlank()) {
                scheme = baseSpec.schemeOverride;
            }
            if (port <= 0 && baseSpec.portOverride > 0) {
                port = baseSpec.portOverride;
            }
            if ((pathPrefix == null || pathPrefix.isBlank()) && baseSpec.pathPrefixOverride != null) {
                pathPrefix = baseSpec.pathPrefixOverride;
            }
        }

        HostSpec spec = parseHostSpec(host, scheme);
        if (spec != null) {
            host = spec.host;
            if (spec.schemeOverride != null && (scheme == null || scheme.isBlank())) {
                scheme = spec.schemeOverride;
            }
            if (spec.portOverride > 0 && port <= 0) {
                port = spec.portOverride;
            }
            if ((pathPrefix == null || pathPrefix.isBlank()) && spec.pathPrefixOverride != null) {
                pathPrefix = spec.pathPrefixOverride;
            }
        }
        boolean weborcaResolved = weborcaExplicit || isWebOrcaMode(mode) || isWebOrcaHost(host);
        scheme = normalizeScheme(scheme, weborcaResolved);
        if (port <= 0) {
            port = isHttpsScheme(scheme) ? 443 : 80;
        }

        return new OrcaTransportSettings(
                host,
                port,
                scheme,
                user,
                password,
                pathPrefix,
                weborcaExplicit,
                parseInt(env(ENV_ORCA_API_RETRY_MAX), DEFAULT_RETRY_MAX),
                parseLong(env(ENV_ORCA_API_RETRY_BACKOFF_MS), DEFAULT_RETRY_BACKOFF_MS),
                baseUrl,
                mode
        );
    }

    public boolean isReady() {
        return hasBaseUrl() || (host != null && !host.isBlank() && port > 0)
                && user != null && !user.isBlank()
                && password != null && !password.isBlank();
    }

    public boolean hasCredentials() {
        return user != null && !user.isBlank()
                && password != null && !password.isBlank();
    }

    public String buildUrl(OrcaEndpoint endpoint, String query) {
        String resolvedPath = normalizeEndpointPath(endpoint != null ? endpoint.getPath() : null);
        String url = buildOrcaUrl(resolvedPath);
        if (query != null && !query.isBlank()) {
            url = url + "?" + query;
        }
        return url;
    }

    public String buildOrcaUrl(String path) {
        String resolvedPath = normalizeEndpointPath(path);
        if (hasBaseUrl()) {
            return buildOrcaUrlFromBase(baseUrl, resolvedPath, isWebOrca());
        }
        StringBuilder builder = new StringBuilder();
        builder.append(scheme != null ? scheme : "http");
        builder.append("://");
        builder.append(host);
        if (!(isHttps() && port == 443)) {
            builder.append(':');
            builder.append(port);
        }
        String resolvedPrefix = resolvePathPrefix(pathPrefix);
        builder.append(joinPath(resolvedPrefix, resolvedPath));
        return builder.toString();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public boolean isWebOrca() {
        if (weborcaExplicit) {
            return true;
        }
        if (modeNormalized != null && "weborca".equals(modeNormalized)) {
            return true;
        }
        return isWebOrcaHost(host);
    }

    public String basicAuthHeader() {
        String token = user + ":" + password;
        String encoded = java.util.Base64.getEncoder().encodeToString(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }

    public String auditSummary() {
        String resolvedScheme = scheme != null ? scheme : "http";
        if (hasBaseUrl()) {
            return String.format(Locale.ROOT, "orca.baseUrl=%s orca.mode=%s", safe(baseUrl), safe(modeNormalized));
        }
        return String.format(Locale.ROOT, "orca.host=%s orca.port=%d orca.scheme=%s", safe(host), port, resolvedScheme);
    }

    public int getRetryMax() {
        return retryMax;
    }

    public long getRetryBackoffMs() {
        return retryBackoffMs;
    }

    private boolean hasBaseUrl() {
        return baseUrl != null && !baseUrl.isBlank();
    }

    private boolean isHttps() {
        return isHttpsScheme(scheme);
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

    private static String normalizeScheme(String value, boolean weborca) {
        String schemeValue = trim(value);
        if (schemeValue == null || schemeValue.isBlank()) {
            return weborca ? "https" : "http";
        }
        return schemeValue.toLowerCase(Locale.ROOT);
    }

    private static boolean isHttpsScheme(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).startsWith("https");
    }

    private static boolean parseBoolean(String value) {
        if (value == null) {
            return false;
        }
        return "true".equalsIgnoreCase(value)
                || "1".equals(value)
                || "yes".equalsIgnoreCase(value)
                || "on".equalsIgnoreCase(value);
    }

    private static int parseInt(String value, int fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static long parseLong(String value, long fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static boolean isWebOrcaHost(String host) {
        if (host == null) {
            return false;
        }
        String normalized = host.toLowerCase(Locale.ROOT);
        return normalized.contains("orca.med.or.jp")
                || normalized.contains("orcamo.jp")
                || normalized.contains("orca-cloud")
                || normalized.contains("weborca");
    }

    private static boolean isWebOrcaMode(String mode) {
        if (mode == null) {
            return false;
        }
        String normalized = mode.trim().toLowerCase(Locale.ROOT);
        return "weborca".equals(normalized) || "cloud".equals(normalized);
    }

    private static String normalizeMode(String mode) {
        if (mode == null) {
            return null;
        }
        String normalized = mode.trim().toLowerCase(Locale.ROOT);
        return normalized.isBlank() ? null : normalized;
    }

    private static String normalizePathPrefix(String value) {
        String trimmed = trim(value);
        if (trimmed == null || trimmed.isBlank()) {
            return null;
        }
        if (!trimmed.startsWith("/")) {
            trimmed = "/" + trimmed;
        }
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private static String resolvePathPrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        return prefix.startsWith("/") ? prefix : "/" + prefix;
    }

    private static String normalizeEndpointPath(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        String resolved = path.trim();
        if (!resolved.startsWith("/")) {
            resolved = "/" + resolved;
        }
        return resolved;
    }

    private static String joinPath(String prefix, String path) {
        String left = trimSlashes(prefix);
        String right = trimSlashes(path);
        if (left.isEmpty()) {
            return "/" + right;
        }
        if (right.isEmpty()) {
            return "/" + left;
        }
        return "/" + left + "/" + right;
    }

    static HostSpec parseHostSpec(String input, String fallbackScheme) {
        if (input == null || input.isBlank()) {
            return null;
        }
        String trimmed = input.trim();
        String schemeOverride = null;
        String host = trimmed;
        int portOverride = -1;
        String pathPrefixOverride = null;
        if (trimmed.contains("://")) {
            try {
                java.net.URI uri = new java.net.URI(trimmed);
                schemeOverride = uri.getScheme();
                host = uri.getHost();
                portOverride = uri.getPort();
                pathPrefixOverride = normalizePathPrefix(uri.getPath());
            } catch (java.net.URISyntaxException ex) {
                LOGGER.log(Level.WARNING, "Invalid ORCA host spec: {0}", trimmed);
            }
        }
        if (host != null && host.contains("/") && !host.startsWith("http")) {
            String[] parts = host.split("/", 2);
            host = parts[0];
            pathPrefixOverride = normalizePathPrefix("/" + parts[1]);
        }
        if (host != null && host.contains(":")) {
            String[] parts = host.split(":", 2);
            host = parts[0];
            portOverride = parsePort(parts[1]);
        }
        if (schemeOverride == null && fallbackScheme != null && !fallbackScheme.isBlank()) {
            schemeOverride = fallbackScheme;
        }
        if (host == null || host.isBlank()) {
            return null;
        }
        return new HostSpec(host, schemeOverride, portOverride, pathPrefixOverride);
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

    private static String buildOrcaUrlFromBase(String baseUrl, String path, boolean weborca) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return path != null ? path : "";
        }
        String base = baseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String normalizedPath = normalizeEndpointPath(path);
        if (weborca && !normalizedPath.startsWith("/api/")) {
            normalizedPath = "/api" + normalizedPath;
        }
        return base + normalizedPath;
    }

    private static String safe(String value) {
        return value != null ? value : "";
    }

    static final class HostSpec {
        private final String host;
        private final String schemeOverride;
        private final int portOverride;
        private final String pathPrefixOverride;

        private HostSpec(String host, String schemeOverride, int portOverride, String pathPrefixOverride) {
            this.host = host;
            this.schemeOverride = schemeOverride;
            this.portOverride = portOverride;
            this.pathPrefixOverride = pathPrefixOverride;
        }
    }
}
