package open.dolphin.adm20.export;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
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
    private static final String S3_BUCKET_KEY = "phr-export.storage.s3.bucket";
    private static final String S3_BUCKET_ENV = "PHR_EXPORT_S3_BUCKET";
    private static final String S3_REGION_KEY = "phr-export.storage.s3.region";
    private static final String S3_REGION_ENV = "PHR_EXPORT_S3_REGION";
    private static final String AWS_REGION_KEY = "aws.region";
    private static final String AWS_REGION_ENV = "AWS_REGION";
    private static final String S3_PREFIX_KEY = "phr-export.storage.s3.prefix";
    private static final String S3_PREFIX_ENV = "PHR_EXPORT_S3_PREFIX";
    private static final String S3_ENDPOINT_KEY = "phr-export.storage.s3.endpoint";
    private static final String S3_ENDPOINT_ENV = "PHR_EXPORT_S3_ENDPOINT";
    private static final String S3_FORCE_PATH_STYLE_KEY = "phr-export.storage.s3.force-path-style";
    private static final String S3_FORCE_PATH_STYLE_ENV = "PHR_EXPORT_S3_FORCE_PATH_STYLE";
    private static final String S3_KMS_KEY_KEY = "phr-export.storage.s3.kms-key-id";
    private static final String S3_KMS_KEY_ENV = "PHR_EXPORT_S3_KMS_KEY";

    private static final String DEFAULT_FILESYSTEM_PATH = "/var/opendolphin/phr-export";
    private static final long DEFAULT_TOKEN_TTL_SECONDS = 300L;
    private static final boolean DEFAULT_S3_FORCE_PATH_STYLE = true;

    private StorageType storageType = StorageType.FILESYSTEM;
    private Path filesystemBasePath;
    private String signingSecret;
    private long tokenTtlSeconds = DEFAULT_TOKEN_TTL_SECONDS;
    private String s3Bucket;
    private String s3Region;
    private String s3Prefix;
    private String s3Endpoint;
    private boolean s3ForcePathStyle = DEFAULT_S3_FORCE_PATH_STYLE;
    private String s3KmsKeyId;

    @PostConstruct
    void init() {
        storageType = resolveStorageType();
        filesystemBasePath = Paths.get(resolveProperty(FILESYSTEM_PATH_KEY, FILESYSTEM_PATH_ENV, DEFAULT_FILESYSTEM_PATH));
        signingSecret = resolveSigningSecret();
        tokenTtlSeconds = resolveLongProperty(TOKEN_TTL_KEY, TOKEN_TTL_ENV, DEFAULT_TOKEN_TTL_SECONDS);
        s3Bucket = resolveTrimmedProperty(S3_BUCKET_KEY, S3_BUCKET_ENV, null);
        s3Region = resolveS3Region();
        s3Prefix = resolveTrimmedProperty(S3_PREFIX_KEY, S3_PREFIX_ENV, null);
        s3Endpoint = resolveTrimmedProperty(S3_ENDPOINT_KEY, S3_ENDPOINT_ENV, null);
        s3ForcePathStyle = resolveBooleanProperty(S3_FORCE_PATH_STYLE_KEY, S3_FORCE_PATH_STYLE_ENV, DEFAULT_S3_FORCE_PATH_STYLE);
        s3KmsKeyId = resolveTrimmedProperty(S3_KMS_KEY_KEY, S3_KMS_KEY_ENV, null);
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

    public String getS3Bucket() {
        return s3Bucket;
    }

    public String getS3Region() {
        return s3Region;
    }

    public String getS3Prefix() {
        return s3Prefix;
    }

    public String getS3Endpoint() {
        return s3Endpoint;
    }

    public boolean isS3ForcePathStyle() {
        return s3ForcePathStyle;
    }

    public String getS3KmsKeyId() {
        return s3KmsKeyId;
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
            LOGGER.warning("phr-export.signing.secret is not configured.");
            return null;
        }
        return secret.trim();
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

    private boolean resolveBooleanProperty(String key, String envKey, boolean defaultValue) {
        String value = resolveProperty(key, envKey, null);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value.trim());
    }

    private String resolveTrimmedProperty(String key, String envKey, String fallback) {
        String value = resolveProperty(key, envKey, fallback);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String resolveS3Region() {
        String region = resolveTrimmedProperty(S3_REGION_KEY, S3_REGION_ENV, null);
        if (region != null && !region.isBlank()) {
            return region;
        }
        return resolveTrimmedProperty(AWS_REGION_KEY, AWS_REGION_ENV, null);
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
