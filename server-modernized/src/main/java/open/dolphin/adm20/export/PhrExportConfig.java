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
    private static final String S3_ACCESS_KEY_KEY = "phr-export.storage.s3.access-key";
    private static final String S3_ACCESS_KEY_ENV = "PHR_EXPORT_S3_ACCESS_KEY";
    private static final String S3_SECRET_KEY_KEY = "phr-export.storage.s3.secret-key";
    private static final String S3_SECRET_KEY_ENV = "PHR_EXPORT_S3_SECRET_KEY";
    private static final String S3_SERVER_SIDE_ENCRYPTION_KEY = "phr-export.storage.s3.server-side-encryption";
    private static final String S3_SERVER_SIDE_ENCRYPTION_ENV = "PHR_EXPORT_S3_SERVER_SIDE_ENCRYPTION";

    private static final String JOB_MAX_RETRIES_KEY = "phr-export.job.max-retries";
    private static final String JOB_MAX_RETRIES_ENV = "PHR_EXPORT_JOB_MAX_RETRIES";
    private static final String JOB_RETRY_BACKOFF_SECONDS_KEY = "phr-export.job.retry.backoff-seconds";
    private static final String JOB_RETRY_BACKOFF_SECONDS_ENV = "PHR_EXPORT_JOB_RETRY_BACKOFF_SECONDS";
    private static final String JOB_RETRY_BACKOFF_MAX_SECONDS_KEY = "phr-export.job.retry.backoff-max-seconds";
    private static final String JOB_RETRY_BACKOFF_MAX_SECONDS_ENV = "PHR_EXPORT_JOB_RETRY_BACKOFF_MAX_SECONDS";
    private static final String JOB_HEARTBEAT_TIMEOUT_SECONDS_KEY = "phr-export.job.heartbeat-timeout.seconds";
    private static final String JOB_HEARTBEAT_TIMEOUT_SECONDS_ENV = "PHR_EXPORT_JOB_HEARTBEAT_TIMEOUT_SECONDS";
    private static final String JOB_MAX_RUNTIME_SECONDS_KEY = "phr-export.job.max-runtime.seconds";
    private static final String JOB_MAX_RUNTIME_SECONDS_ENV = "PHR_EXPORT_JOB_MAX_RUNTIME_SECONDS";
    private static final String JOB_RECOVERY_INTERVAL_SECONDS_KEY = "phr-export.job.recovery-interval.seconds";
    private static final String JOB_RECOVERY_INTERVAL_SECONDS_ENV = "PHR_EXPORT_JOB_RECOVERY_INTERVAL_SECONDS";
    private static final String JOB_RECOVERY_ENABLED_KEY = "phr-export.job.recovery.enabled";
    private static final String JOB_RECOVERY_ENABLED_ENV = "PHR_EXPORT_JOB_RECOVERY_ENABLED";

    private static final String DEFAULT_FILESYSTEM_PATH = "/var/opendolphin/phr-export";
    private static final long DEFAULT_TOKEN_TTL_SECONDS = 300L;
    private static final boolean DEFAULT_S3_FORCE_PATH_STYLE = true;
    private static final int DEFAULT_JOB_MAX_RETRIES = 3;
    private static final long DEFAULT_JOB_RETRY_BACKOFF_SECONDS = 30L;
    private static final long DEFAULT_JOB_RETRY_BACKOFF_MAX_SECONDS = 300L;
    private static final long DEFAULT_JOB_HEARTBEAT_TIMEOUT_SECONDS = 300L;
    private static final long DEFAULT_JOB_MAX_RUNTIME_SECONDS = 1800L;
    private static final long DEFAULT_JOB_RECOVERY_INTERVAL_SECONDS = 60L;
    private static final boolean DEFAULT_JOB_RECOVERY_ENABLED = true;

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
    private String s3AccessKey;
    private String s3SecretKey;
    private String s3ServerSideEncryption;
    private int jobMaxRetries = DEFAULT_JOB_MAX_RETRIES;
    private long jobRetryBackoffSeconds = DEFAULT_JOB_RETRY_BACKOFF_SECONDS;
    private long jobRetryBackoffMaxSeconds = DEFAULT_JOB_RETRY_BACKOFF_MAX_SECONDS;
    private long jobHeartbeatTimeoutSeconds = DEFAULT_JOB_HEARTBEAT_TIMEOUT_SECONDS;
    private long jobMaxRuntimeSeconds = DEFAULT_JOB_MAX_RUNTIME_SECONDS;
    private long jobRecoveryIntervalSeconds = DEFAULT_JOB_RECOVERY_INTERVAL_SECONDS;
    private boolean jobRecoveryEnabled = DEFAULT_JOB_RECOVERY_ENABLED;

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
        s3AccessKey = resolveTrimmedProperty(S3_ACCESS_KEY_KEY, S3_ACCESS_KEY_ENV, null);
        s3SecretKey = resolveTrimmedProperty(S3_SECRET_KEY_KEY, S3_SECRET_KEY_ENV, null);
        s3ServerSideEncryption = resolveTrimmedProperty(S3_SERVER_SIDE_ENCRYPTION_KEY, S3_SERVER_SIDE_ENCRYPTION_ENV, null);
        jobMaxRetries = resolveIntProperty(JOB_MAX_RETRIES_KEY, JOB_MAX_RETRIES_ENV, DEFAULT_JOB_MAX_RETRIES);
        jobRetryBackoffSeconds = resolveLongProperty(JOB_RETRY_BACKOFF_SECONDS_KEY, JOB_RETRY_BACKOFF_SECONDS_ENV, DEFAULT_JOB_RETRY_BACKOFF_SECONDS);
        jobRetryBackoffMaxSeconds = resolveLongProperty(JOB_RETRY_BACKOFF_MAX_SECONDS_KEY, JOB_RETRY_BACKOFF_MAX_SECONDS_ENV, DEFAULT_JOB_RETRY_BACKOFF_MAX_SECONDS);
        jobHeartbeatTimeoutSeconds = resolveLongProperty(JOB_HEARTBEAT_TIMEOUT_SECONDS_KEY, JOB_HEARTBEAT_TIMEOUT_SECONDS_ENV, DEFAULT_JOB_HEARTBEAT_TIMEOUT_SECONDS);
        jobMaxRuntimeSeconds = resolveLongProperty(JOB_MAX_RUNTIME_SECONDS_KEY, JOB_MAX_RUNTIME_SECONDS_ENV, DEFAULT_JOB_MAX_RUNTIME_SECONDS);
        jobRecoveryIntervalSeconds = resolveLongProperty(JOB_RECOVERY_INTERVAL_SECONDS_KEY, JOB_RECOVERY_INTERVAL_SECONDS_ENV, DEFAULT_JOB_RECOVERY_INTERVAL_SECONDS);
        jobRecoveryEnabled = resolveBooleanProperty(JOB_RECOVERY_ENABLED_KEY, JOB_RECOVERY_ENABLED_ENV, DEFAULT_JOB_RECOVERY_ENABLED);
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

    public String getS3AccessKey() {
        return s3AccessKey;
    }

    public String getS3SecretKey() {
        return s3SecretKey;
    }

    public String getS3ServerSideEncryption() {
        return s3ServerSideEncryption;
    }

    public int getJobMaxRetries() {
        return jobMaxRetries;
    }

    public long getJobRetryBackoffSeconds() {
        return jobRetryBackoffSeconds;
    }

    public long getJobRetryBackoffMaxSeconds() {
        return jobRetryBackoffMaxSeconds;
    }

    public long getJobHeartbeatTimeoutSeconds() {
        return jobHeartbeatTimeoutSeconds;
    }

    public long getJobMaxRuntimeSeconds() {
        return jobMaxRuntimeSeconds;
    }

    public long getJobRecoveryIntervalSeconds() {
        return jobRecoveryIntervalSeconds;
    }

    public boolean isJobRecoveryEnabled() {
        return jobRecoveryEnabled;
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

    private int resolveIntProperty(String key, String envKey, int defaultValue) {
        String value = resolveProperty(key, envKey, null);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
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
