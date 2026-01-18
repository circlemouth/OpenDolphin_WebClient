package open.dolphin.rest.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Properties;
import org.eclipse.microprofile.config.Config;
import org.eclipse.microprofile.config.ConfigProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Demo API 設定のローダー。
 * <p>
 * 読み込み順:
 * <ol>
 *   <li>クラスパスの config/demo-api.properties（プロファイルでフィルタリング）</li>
 *   <li>外部ファイル（System property demo.api.config.path / env DEMO_API_CONFIG_PATH / /opt/jboss/config/demo-api.properties）</li>
 *   <li>MicroProfile Config / 環境変数による上書き</li>
 * </ol>
 * 最終的に demo.api.enabled=false の場合、欠落項目は検証しない。
 */
public class DemoApiSettingsLoader {

    private static final Logger LOGGER = LoggerFactory.getLogger(DemoApiSettingsLoader.class);
    private static final String CLASSPATH_CONFIG = "config/demo-api.properties";
    private static final String PROP_CONFIG_PATH = "demo.api.config.path";
    private static final String ENV_CONFIG_PATH = "DEMO_API_CONFIG_PATH";
    private static final String DEFAULT_EXTERNAL_PATH = "/opt/jboss/config/demo-api.properties";

    public DemoApiSettings load() {
        Properties properties = loadClasspathDefaults();
        applyExternalFile(properties);
        overrideFromConfig(properties);

        boolean enabled = Boolean.parseBoolean(valueOrDefault(properties, "demo.api.enabled", "false"));
        String facilityId = require(properties, "demo.api.facilityId", enabled);
        String facilityName = require(properties, "demo.api.facilityName", enabled);
        String padFacilityId = valueOrDefault(properties, "demo.api.padFacilityId", facilityId);
        String padFacilityName = valueOrDefault(properties, "demo.api.padFacilityName", facilityName);
        String userId = require(properties, "demo.api.userId", enabled);
        String userName = valueOrDefault(properties, "demo.api.userName", userId);
        String passwordMd5 = require(properties, "demo.api.passwordMd5", enabled);
        String memberType = valueOrDefault(properties, "demo.api.memberType", "touchTester");
        String demoFacilityId = require(properties, "demo.api.demoFacilityId", enabled);
        String demoPatientId = require(properties, "demo.api.demoPatientId", enabled);

        return new DemoApiSettings(enabled, facilityId, facilityName, padFacilityId, padFacilityName, userId, userName,
                passwordMd5, memberType, demoFacilityId, demoPatientId);
    }

    private Properties loadClasspathDefaults() {
        Properties properties = new Properties();
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(CLASSPATH_CONFIG)) {
            if (in != null) {
                properties.load(in);
            } else {
                LOGGER.warn("Demo API config [{}] not found on classpath. Defaults will be empty.", CLASSPATH_CONFIG);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load demo API defaults", ex);
        }
        return properties;
    }

    private void applyExternalFile(Properties properties) {
        Path path = resolveConfigPath();
        if (path == null || !Files.exists(path)) {
            return;
        }
        try (InputStream in = Files.newInputStream(path)) {
            Properties external = new Properties();
            external.load(in);
            properties.putAll(external);
            LOGGER.info("Loaded demo API config from {}", path);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load demo API config from " + path, ex);
        }
    }

    private Path resolveConfigPath() {
        String explicit = System.getProperty(PROP_CONFIG_PATH);
        if (hasText(explicit)) {
            return Paths.get(explicit);
        }
        String envPath = System.getenv(ENV_CONFIG_PATH);
        if (hasText(envPath)) {
            return Paths.get(envPath);
        }
        return Paths.get(DEFAULT_EXTERNAL_PATH);
    }

    private void overrideFromConfig(Properties properties) {
        Config config = null;
        try {
            config = ConfigProvider.getConfig();
        } catch (IllegalStateException ex) {
            LOGGER.debug("MicroProfile Config is not available. Falling back to environment variables.");
        }
        if (config != null) {
            override(properties, config, "demo.api.enabled");
            override(properties, config, "demo.api.facilityId");
            override(properties, config, "demo.api.facilityName");
            override(properties, config, "demo.api.padFacilityId");
            override(properties, config, "demo.api.padFacilityName");
            override(properties, config, "demo.api.userId");
            override(properties, config, "demo.api.userName");
            override(properties, config, "demo.api.passwordMd5");
            override(properties, config, "demo.api.memberType");
            override(properties, config, "demo.api.demoFacilityId");
            override(properties, config, "demo.api.demoPatientId");
        }
        overrideFromEnv(properties, "demo.api.enabled", "DEMO_API_ENABLED");
        overrideFromEnv(properties, "demo.api.facilityId", "DEMO_API_FACILITY_ID");
        overrideFromEnv(properties, "demo.api.facilityName", "DEMO_API_FACILITY_NAME");
        overrideFromEnv(properties, "demo.api.padFacilityId", "DEMO_API_PAD_FACILITY_ID");
        overrideFromEnv(properties, "demo.api.padFacilityName", "DEMO_API_PAD_FACILITY_NAME");
        overrideFromEnv(properties, "demo.api.userId", "DEMO_API_USER_ID");
        overrideFromEnv(properties, "demo.api.userName", "DEMO_API_USER_NAME");
        overrideFromEnv(properties, "demo.api.passwordMd5", "DEMO_API_PASSWORD_MD5");
        overrideFromEnv(properties, "demo.api.memberType", "DEMO_API_MEMBER_TYPE");
        overrideFromEnv(properties, "demo.api.demoFacilityId", "DEMO_API_DEMO_FACILITY_ID");
        overrideFromEnv(properties, "demo.api.demoPatientId", "DEMO_API_DEMO_PATIENT_ID");
    }

    private void override(Properties properties, Config config, String key) {
        if (config == null) {
            return;
        }
        config.getOptionalValue(key, String.class)
                .filter(this::hasText)
                .ifPresent(value -> properties.setProperty(key, value));
    }

    private void overrideFromEnv(Properties properties, String propertyName, String envName) {
        String envValue = System.getenv(envName);
        if (hasText(envValue)) {
            properties.setProperty(propertyName, envValue);
        }
    }

    private String require(Properties properties, String key, boolean enabled) {
        String value = properties.getProperty(key);
        if (enabled && !hasText(value)) {
            throw new IllegalStateException("Demo API config is missing required key: " + key);
        }
        return value;
    }

    private String valueOrDefault(Properties properties, String key, String defaultValue) {
        String value = properties.getProperty(key);
        return hasText(value) ? value : defaultValue;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    /**
     * デバッグ用に整形した設定概要を返す。
     */
    public static String summarize(DemoApiSettings settings) {
        return String.format(Locale.JAPAN,
                "enabled=%s, facilityId=%s, userId=%s, demoFacilityId=%s",
                settings.enabled(), settings.facilityId(), settings.userId(), settings.demoFacilityId());
    }
}
