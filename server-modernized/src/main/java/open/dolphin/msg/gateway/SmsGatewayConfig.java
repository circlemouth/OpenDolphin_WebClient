package open.dolphin.msg.gateway;

import com.plivo.api.models.base.LogLevel;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Plivo SMS ゲートウェイ設定を読み込む。環境変数が最優先で、
 * 指定が無い場合は WildFly の custom.properties から補完する。
 */
@ApplicationScoped
public class SmsGatewayConfig {

    private static final Logger LOGGER = Logger.getLogger(SmsGatewayConfig.class.getName());

    private static final String ENV_AUTH_ID = "PLIVO_AUTH_ID";
    private static final String ENV_AUTH_TOKEN = "PLIVO_AUTH_TOKEN";
    private static final String ENV_SOURCE_NUMBER = "PLIVO_SOURCE_NUMBER";
    private static final String ENV_BASE_URL = "PLIVO_BASE_URL";
    private static final String ENV_ENVIRONMENT = "PLIVO_ENVIRONMENT";
    private static final String ENV_LOG_LEVEL = "PLIVO_LOG_LEVEL";
    private static final String ENV_LOG_CONTENT = "PLIVO_LOG_MESSAGE_CONTENT";
    private static final String ENV_DEFAULT_COUNTRY = "PLIVO_DEFAULT_COUNTRY";
    private static final String ENV_HTTP_CONNECT_TIMEOUT = "PLIVO_HTTP_CONNECT_TIMEOUT";
    private static final String ENV_HTTP_READ_TIMEOUT = "PLIVO_HTTP_READ_TIMEOUT";
    private static final String ENV_HTTP_WRITE_TIMEOUT = "PLIVO_HTTP_WRITE_TIMEOUT";
    private static final String ENV_HTTP_CALL_TIMEOUT = "PLIVO_HTTP_CALL_TIMEOUT";
    private static final String ENV_HTTP_RETRY_ON_FAILURE = "PLIVO_HTTP_RETRY_ON_CONNECTION_FAILURE";

    private static final String PROP_AUTH_ID = "plivo.auth.id";
    private static final String PROP_AUTH_TOKEN = "plivo.auth.token";
    private static final String PROP_SOURCE_NUMBER = "plivo.source.number";
    private static final String PROP_BASE_URL = "plivo.baseUrl";
    private static final String PROP_ENVIRONMENT = "plivo.environment";
    private static final String PROP_LOG_LEVEL = "plivo.log.level";
    private static final String PROP_LOG_CONTENT = "plivo.log.messageContent";
    private static final String PROP_DEFAULT_COUNTRY = "plivo.defaultCountry";
    private static final String PROP_HTTP_CONNECT_TIMEOUT = "plivo.http.connectTimeout";
    private static final String PROP_HTTP_READ_TIMEOUT = "plivo.http.readTimeout";
    private static final String PROP_HTTP_WRITE_TIMEOUT = "plivo.http.writeTimeout";
    private static final String PROP_HTTP_CALL_TIMEOUT = "plivo.http.callTimeout";
    private static final String PROP_HTTP_RETRY_ON_FAILURE = "plivo.http.retryOnConnectionFailure";

    private static final String ENVIRONMENT_SANDBOX = "sandbox";
    private static final String DEFAULT_PROD_BASE = "https://api.plivo.com/v1/";
    private static final String DEFAULT_SANDBOX_BASE = "https://api.sandbox.plivo.com/v1/";

    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration DEFAULT_WRITE_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration DEFAULT_CALL_TIMEOUT = Duration.ofSeconds(45);

    private volatile PlivoSettings cachedSettings;

    public PlivoSettings plivoSettings() {
        PlivoSettings settings = cachedSettings;
        if (settings == null) {
            settings = reload();
        }
        return settings;
    }

    public synchronized PlivoSettings reload() {
        Properties properties = loadProperties();
        String authId = firstNonBlank(env(ENV_AUTH_ID), properties.getProperty(PROP_AUTH_ID));
        String authToken = firstNonBlank(env(ENV_AUTH_TOKEN), properties.getProperty(PROP_AUTH_TOKEN));
        String sourceNumber = firstNonBlank(env(ENV_SOURCE_NUMBER), properties.getProperty(PROP_SOURCE_NUMBER));
        String environment = firstNonBlank(env(ENV_ENVIRONMENT), properties.getProperty(PROP_ENVIRONMENT));
        String baseUrl = determineBaseUrl(environment, firstNonBlank(env(ENV_BASE_URL), properties.getProperty(PROP_BASE_URL)));
        LogLevel logLevel = parseLogLevel(firstNonBlank(env(ENV_LOG_LEVEL), properties.getProperty(PROP_LOG_LEVEL)));
        boolean logContent = parseBoolean(firstNonBlank(env(ENV_LOG_CONTENT), properties.getProperty(PROP_LOG_CONTENT)), false);
        String defaultCountry = firstNonBlank(env(ENV_DEFAULT_COUNTRY), properties.getProperty(PROP_DEFAULT_COUNTRY));
        Duration connectTimeout = parseDuration(firstNonBlank(env(ENV_HTTP_CONNECT_TIMEOUT), properties.getProperty(PROP_HTTP_CONNECT_TIMEOUT)), DEFAULT_CONNECT_TIMEOUT);
        Duration readTimeout = parseDuration(firstNonBlank(env(ENV_HTTP_READ_TIMEOUT), properties.getProperty(PROP_HTTP_READ_TIMEOUT)), DEFAULT_READ_TIMEOUT);
        Duration writeTimeout = parseDuration(firstNonBlank(env(ENV_HTTP_WRITE_TIMEOUT), properties.getProperty(PROP_HTTP_WRITE_TIMEOUT)), DEFAULT_WRITE_TIMEOUT);
        Duration callTimeout = parseDuration(firstNonBlank(env(ENV_HTTP_CALL_TIMEOUT), properties.getProperty(PROP_HTTP_CALL_TIMEOUT)), DEFAULT_CALL_TIMEOUT);
        boolean retryOnConnectionFailure = parseBoolean(firstNonBlank(env(ENV_HTTP_RETRY_ON_FAILURE), properties.getProperty(PROP_HTTP_RETRY_ON_FAILURE)), true);

        PlivoSettings settings = new PlivoSettings(
                trim(authId),
                trim(authToken),
                trim(sourceNumber),
                baseUrl,
                environmentName(environment),
                logLevel,
                logContent,
                normalizeCountryCode(defaultCountry),
                connectTimeout,
                readTimeout,
                writeTimeout,
                callTimeout,
                retryOnConnectionFailure
        );
        cachedSettings = settings;
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
                LOGGER.log(Level.WARNING, "Failed to load custom.properties for SMS configuration", ex);
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
            LOGGER.log(Level.FINE, "JISAutoDetect unavailable for SMS config, fallback to UTF-8", ex);
            return Charset.forName("UTF-8");
        }
    }

    private String determineBaseUrl(String environment, String candidate) {
        String trimmed = trim(candidate);
        if (trimmed == null || trimmed.isEmpty()) {
            if (ENVIRONMENT_SANDBOX.equalsIgnoreCase(trim(environment))) {
                trimmed = DEFAULT_SANDBOX_BASE;
            } else {
                trimmed = DEFAULT_PROD_BASE;
            }
        }
        try {
            URI uri = new URI(trimmed);
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                throw new IllegalArgumentException("Plivo base URL must use HTTPS");
            }
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Plivo base URL is invalid: " + trimmed, ex);
        }
        return ensureTrailingSlash(trimmed);
    }

    private String ensureTrailingSlash(String value) {
        if (value.endsWith("/")) {
            return value;
        }
        return value + "/";
    }

    private LogLevel parseLogLevel(String value) {
        if (value == null || value.isBlank()) {
            return LogLevel.NONE;
        }
        try {
            return LogLevel.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            LOGGER.log(Level.WARNING, "Invalid PLIVO_LOG_LEVEL value: {0}", value);
            return LogLevel.NONE;
        }
    }

    private Duration parseDuration(String value, Duration defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        String trimmed = value.trim();
        try {
            return Duration.parse(trimmed);
        } catch (DateTimeParseException ex) {
            try {
                if (trimmed.endsWith("ms") || trimmed.endsWith("MS")) {
                    String numeric = trimmed.substring(0, trimmed.length() - 2).trim();
                    return Duration.ofMillis(Long.parseLong(numeric));
                }
                if (trimmed.endsWith("s") || trimmed.endsWith("S")) {
                    String numeric = trimmed.substring(0, trimmed.length() - 1).trim();
                    return Duration.ofSeconds(Long.parseLong(numeric));
                }
                if (trimmed.endsWith("m") || trimmed.endsWith("M")) {
                    String numeric = trimmed.substring(0, trimmed.length() - 1).trim();
                    return Duration.ofMinutes(Long.parseLong(numeric));
                }
                return Duration.ofSeconds(Long.parseLong(trimmed));
            } catch (NumberFormatException inner) {
                LOGGER.log(Level.WARNING, "Invalid Plivo timeout value: {0}", trimmed);
                return defaultValue;
            }
        }
    }

    private boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value.trim());
    }

    private String normalizeCountryCode(String value) {
        if (value == null || value.isBlank()) {
            return "+81";
        }
        String trimmed = value.trim();
        return trimmed.startsWith("+") ? trimmed : "+" + trimmed;
    }

    private String environmentName(String value) {
        String trimmed = trim(value);
        if (trimmed == null) {
            return "production";
        }
        return trimmed.toLowerCase(Locale.ROOT);
    }

    private String env(String key) {
        return System.getenv(key);
    }

    private String firstNonBlank(String primary, String secondary) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (secondary != null && !secondary.isBlank()) {
            return secondary;
        }
        return null;
    }

    private String trim(String value) {
        return value != null ? value.trim() : null;
    }

    public record PlivoSettings(
            String authId,
            String authToken,
            String sourceNumber,
            String baseUrl,
            String environment,
            LogLevel logLevel,
            boolean logMessageContent,
            String defaultCountryCode,
            Duration connectTimeout,
            Duration readTimeout,
            Duration writeTimeout,
            Duration callTimeout,
            boolean retryOnConnectionFailure
    ) {

        public boolean isConfigured() {
            return authId != null && !authId.isBlank()
                    && authToken != null && !authToken.isBlank()
                    && sourceNumber != null && !sourceNumber.isBlank();
        }
    }
}
