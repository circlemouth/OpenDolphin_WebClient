package open.dolphin.storage.attachment;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.Config;
import org.eclipse.microprofile.config.ConfigProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;

/**
 * attachment-storage.yaml を読み込むローダー。
 */
@ApplicationScoped
public class AttachmentStorageConfigLoader {

    private static final Logger LOGGER = LoggerFactory.getLogger(AttachmentStorageConfigLoader.class);
    private static final String DEFAULT_CONFIG_PATH = "/opt/jboss/config/attachment-storage.yaml";

    public AttachmentStorageSettings load() {
        Config config = ConfigProvider.getConfig();
        Path configPath = resolveConfigPath(config);
        AttachmentStorageYaml yaml = readYaml(configPath);

        AttachmentStorageMode mode = resolveMode(config, yaml);
        AttachmentStorageSettings.DatabaseSettings databaseSettings = new AttachmentStorageSettings.DatabaseSettings(
                Optional.ofNullable(yaml.getStorage())
                        .map(AttachmentStorageYaml.Storage::getDatabase)
                        .map(AttachmentStorageYaml.Database::getLobTable)
                        .filter(s -> !s.isBlank())
                        .orElse("d_attachment"));

        AttachmentStorageSettings.S3Settings s3Settings = null;
        if (mode.isS3()) {
            s3Settings = buildS3Settings(config, yaml);
        }

        return new AttachmentStorageSettings(mode, databaseSettings, s3Settings, configPath);
    }

    private Path resolveConfigPath(Config config) {
        String override = configValue(config, "ATTACHMENT_STORAGE_CONFIG_PATH").orElse(DEFAULT_CONFIG_PATH);
        return Paths.get(override);
    }

    private AttachmentStorageMode resolveMode(Config config, AttachmentStorageYaml yaml) {
        return configValue(config, "MODERNIZED_STORAGE_MODE")
                .map(AttachmentStorageMode::from)
                .or(() -> Optional.ofNullable(yaml.getStorage())
                        .map(AttachmentStorageYaml.Storage::getType)
                        .map(AttachmentStorageMode::from))
                .orElse(AttachmentStorageMode.DATABASE);
    }

    private AttachmentStorageYaml readYaml(Path path) {
        if (path == null || !Files.exists(path)) {
            LOGGER.warn("attachment-storage.yaml not found at {}. Fallback to defaults.", path);
            return new AttachmentStorageYaml();
        }
        try (InputStream in = Files.newInputStream(path)) {
            Yaml yaml = new Yaml(new Constructor(AttachmentStorageYaml.class, new LoaderOptions()));
            AttachmentStorageYaml data = yaml.load(in);
            return data != null ? data : new AttachmentStorageYaml();
        } catch (IOException ex) {
            throw new AttachmentStorageException("Failed to read attachment storage config at " + path, ex);
        }
    }

    private AttachmentStorageSettings.S3Settings buildS3Settings(Config config, AttachmentStorageYaml yaml) {
        AttachmentStorageYaml.S3 yamlS3 = Optional.ofNullable(yaml.getStorage())
                .map(AttachmentStorageYaml.Storage::getS3)
                .orElse(new AttachmentStorageYaml.S3());

        String bucket = configValue(config, "ATTACHMENT_S3_BUCKET")
                .orElseGet(() -> requireNonBlank(yamlS3.getBucket(), "ATTACHMENT_S3_BUCKET"));
        String region = configValue(config, "ATTACHMENT_S3_REGION")
                .orElseGet(() -> requireNonBlank(yamlS3.getRegion(), "ATTACHMENT_S3_REGION"));
        String endpointRaw = configValue(config, "ATTACHMENT_S3_ENDPOINT")
                .orElse(yamlS3.getEndpoint());
        URI endpoint = endpointRaw == null || endpointRaw.isBlank() ? null : URI.create(endpointRaw);

        String basePath = configValue(config, "ATTACHMENT_S3_BASE_PATH")
                .orElse(Optional.ofNullable(yamlS3.getBasePath()).filter(s -> !s.isBlank()).orElse("attachments"));

        boolean forcePathStyle = configValue(config, "ATTACHMENT_S3_FORCE_PATH_STYLE")
                .map(Boolean::parseBoolean)
                .orElse(Optional.ofNullable(yamlS3.getForcePathStyle()).orElse(Boolean.TRUE));

        String sse = configValue(config, "ATTACHMENT_S3_SERVER_SIDE_ENCRYPTION")
                .orElse(yamlS3.getServerSideEncryption());
        String kmsKeyId = configValue(config, "ATTACHMENT_S3_KMS_KEY_ID")
                .orElse(yamlS3.getKmsKeyId());
        int multipartThreshold = configValue(config, "ATTACHMENT_S3_MULTIPART_THRESHOLD_MB")
                .map(Integer::parseInt)
                .orElse(Optional.ofNullable(yamlS3.getMultipartUploadThresholdMb()).orElse(64));

        String accessKey = configValue(config, "ATTACHMENT_S3_ACCESS_KEY")
                .orElseGet(() -> requireNonBlank(yamlS3.getAccessKey(), "ATTACHMENT_S3_ACCESS_KEY"));
        String secretKey = configValue(config, "ATTACHMENT_S3_SECRET_KEY")
                .orElseGet(() -> requireNonBlank(yamlS3.getSecretKey(), "ATTACHMENT_S3_SECRET_KEY"));

        return new AttachmentStorageSettings.S3Settings(
                bucket,
                region,
                endpoint,
                basePath,
                forcePathStyle,
                sse,
                kmsKeyId,
                multipartThreshold,
                accessKey,
                secretKey
        );
    }

    private Optional<String> configValue(Config config, String key) {
        return config.getOptionalValue(key, String.class)
                .map(String::trim)
                .filter(value -> !value.isEmpty());
    }

    private String requireNonBlank(String value, String propertyName) {
        if (value == null || value.isBlank()) {
            throw new AttachmentStorageException(propertyName + " is required for S3 storage mode");
        }
        return value;
    }

    /** YAML バインディング用の POJO 群。 */
    public static final class AttachmentStorageYaml {
        private Storage storage;

        public Storage getStorage() {
            return storage;
        }

        public void setStorage(Storage storage) {
            this.storage = storage;
        }

        public static final class Storage {
            private String type;
            private Database database;
            private S3 s3;

            public String getType() {
                return type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public Database getDatabase() {
                return database;
            }

            public void setDatabase(Database database) {
                this.database = database;
            }

            public S3 getS3() {
                return s3;
            }

            public void setS3(S3 s3) {
                this.s3 = s3;
            }
        }

        public static final class Database {
            private String lobTable;

            public String getLobTable() {
                return lobTable;
            }

            public void setLobTable(String lobTable) {
                this.lobTable = lobTable;
            }
        }

        public static final class S3 {
            private String bucket;
            private String region;
            private String endpoint;
            private String basePath;
            private Boolean forcePathStyle;
            private String serverSideEncryption;
            private String kmsKeyId;
            private Integer multipartUploadThresholdMb;
            private String accessKey;
            private String secretKey;

            public String getBucket() {
                return bucket;
            }

            public void setBucket(String bucket) {
                this.bucket = bucket;
            }

            public String getRegion() {
                return region;
            }

            public void setRegion(String region) {
                this.region = region;
            }

            public String getEndpoint() {
                return endpoint;
            }

            public void setEndpoint(String endpoint) {
                this.endpoint = endpoint;
            }

            public String getBasePath() {
                return basePath;
            }

            public void setBasePath(String basePath) {
                this.basePath = basePath;
            }

            public Boolean getForcePathStyle() {
                return forcePathStyle;
            }

            public void setForcePathStyle(Boolean forcePathStyle) {
                this.forcePathStyle = forcePathStyle;
            }

            public String getServerSideEncryption() {
                return serverSideEncryption;
            }

            public void setServerSideEncryption(String serverSideEncryption) {
                this.serverSideEncryption = serverSideEncryption;
            }

            public String getKmsKeyId() {
                return kmsKeyId;
            }

            public void setKmsKeyId(String kmsKeyId) {
                this.kmsKeyId = kmsKeyId;
            }

            public Integer getMultipartUploadThresholdMb() {
                return multipartUploadThresholdMb;
            }

            public void setMultipartUploadThresholdMb(Integer multipartUploadThresholdMb) {
                this.multipartUploadThresholdMb = multipartUploadThresholdMb;
            }

            public String getAccessKey() {
                return accessKey;
            }

            public void setAccessKey(String accessKey) {
                this.accessKey = accessKey;
            }

            public String getSecretKey() {
                return secretKey;
            }

            public void setSecretKey(String secretKey) {
                this.secretKey = secretKey;
            }
        }
    }
}
