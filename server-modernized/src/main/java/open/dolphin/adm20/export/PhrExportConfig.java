package open.dolphin.adm20.export;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

@ApplicationScoped
public class PhrExportConfig {

    public enum StorageType {
        FILESYSTEM,
        S3
    }

    private static final Logger LOGGER = Logger.getLogger(PhrExportConfig.class.getName());

    private static final String STORAGE_TYPE_KEY = "phr-export.storage.type";
    private static final String STORAGE_TYPE_ENV = "PHR_EXPORT_STORAGE_TYPE";
    private static final String FILESYSTEM_PATH_KEY = "phr-export.storage.filesystem.base-path";
    private static final String FILESYSTEM_PATH_ENV = "PHR_EXPORT_STORAGE_FILESYSTEM_BASE_PATH";
    private static final String SIGNING_SECRET_KEY = "phr-export.signing.secret";
    private static final String SIGNING_SECRET_ENV = "PHR_EXPORT_SIGNING_SECRET";
    private static final String TOKEN_TTL_KEY = "phr-export.token.ttl.seconds";
    private static final String TOKEN_TTL_ENV = "PHR_EXPORT_TOKEN_TTL_SECONDS";

    private static final String DEFAULT_FILESYSTEM_PATH = "/var/opendolphin/phr-export";
    private static final long DEFAULT_TOKEN_TTL_SECONDS = 300L;

    private StorageType storageType = StorageType.FILESYSTEM;
    private Path filesystemBasePath;
    private String signingSecret;
    private long tokenTtlSeconds = DEFAULT_TOKEN_TTL_SECONDS;

    @PostConstruct
    void init() {
        storageType = resolveStorageType();
        filesystemBasePath = Paths.get(resolveProperty(FILESYSTEM_PATH_KEY, FILESYSTEM_PATH_ENV, DEFAULT_FILESYSTEM_PATH));
        signingSecret = resolveSigningSecret();
        tokenTtlSeconds = resolveLongProperty(TOKEN_TTL_KEY, TOKEN_TTL_ENV, DEFAULT_TOKEN_TTL_SECONDS);
    }

    public StorageType getStorageType() {
        return storageType;
    }

    public Path getFilesystemBasePath() {
        return filesystemBasePath;
    }

    public String getSigningSecret() {
        return signingSecret;
    }

    public long getTokenTtlSeconds() {
        return tokenTtlSeconds;
    }

    private StorageType resolveStorageType() {
        String value = resolveProperty(STORAGE_TYPE_KEY, STORAGE_TYPE_ENV, "filesystem");
        try {
            return StorageType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            LOGGER.log(Level.WARNING, "Unknown storage type {0}, falling back to FILESYSTEM", value);
            return StorageType.FILESYSTEM;
        }
    }

    private String resolveSigningSecret() {
        String secret = resolveProperty(SIGNING_SECRET_KEY, SIGNING_SECRET_ENV, null);
        if (secret == null || secret.isBlank()) {
            secret = UUID.randomUUID().toString().replace("-", "");
            LOGGER.warning("phr-export.signing.secret is not configured. Generated ephemeral secret; tokens will rotate on restart.");
        }
        return secret;
    }

    private long resolveLongProperty(String key, String envKey, long defaultValue) {
        String value = resolveProperty(key, envKey, null);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            LOGGER.log(Level.WARNING, "Invalid numeric value for {0}: {1}", new Object[]{key, value});
            return defaultValue;
        }
    }

    private String resolveProperty(String propertyKey, String envKey, String fallback) {
        String value = System.getProperty(propertyKey);
        if (value != null && !value.isBlank()) {
            return value;
        }
        value = System.getenv(envKey);
        if (value != null && !value.isBlank()) {
            return value;
        }
        return fallback;
    }
}
