package open.dolphin.storage.attachment;

import java.net.URI;
import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

/**
 * 読み込んだ設定値。
 */
public final class AttachmentStorageSettings {

    private final AttachmentStorageMode mode;
    private final DatabaseSettings database;
    private final S3Settings s3;
    private final Path sourcePath;

    public AttachmentStorageSettings(AttachmentStorageMode mode, DatabaseSettings database,
                                     S3Settings s3, Path sourcePath) {
        this.mode = Objects.requireNonNull(mode, "mode");
        this.database = database;
        this.s3 = s3;
        this.sourcePath = sourcePath;
    }

    public AttachmentStorageMode getMode() {
        return mode;
    }

    public DatabaseSettings getDatabase() {
        return database;
    }

    public Optional<S3Settings> getS3() {
        return Optional.ofNullable(s3);
    }

    public Optional<Path> getSourcePath() {
        return Optional.ofNullable(sourcePath);
    }

    public static final class DatabaseSettings {
        private final String lobTable;

        public DatabaseSettings(String lobTable) {
            this.lobTable = lobTable;
        }

        public String getLobTable() {
            return lobTable;
        }
    }

    public static final class S3Settings {
        private final String bucket;
        private final String region;
        private final URI endpoint;
        private final String basePath;
        private final boolean forcePathStyle;
        private final String serverSideEncryption;
        private final String kmsKeyId;
        private final int multipartUploadThresholdMb;
        private final String accessKey;
        private final String secretKey;

        public S3Settings(String bucket,
                          String region,
                          URI endpoint,
                          String basePath,
                          boolean forcePathStyle,
                          String serverSideEncryption,
                          String kmsKeyId,
                          int multipartUploadThresholdMb,
                          String accessKey,
                          String secretKey) {
            this.bucket = Objects.requireNonNull(bucket, "bucket");
            this.region = Objects.requireNonNull(region, "region");
            this.endpoint = endpoint;
            this.basePath = basePath;
            this.forcePathStyle = forcePathStyle;
            this.serverSideEncryption = serverSideEncryption;
            this.kmsKeyId = kmsKeyId;
            this.multipartUploadThresholdMb = multipartUploadThresholdMb;
            this.accessKey = Objects.requireNonNull(accessKey, "accessKey");
            this.secretKey = Objects.requireNonNull(secretKey, "secretKey");
        }

        public String getBucket() {
            return bucket;
        }

        public String getRegion() {
            return region;
        }

        public Optional<URI> getEndpoint() {
            return Optional.ofNullable(endpoint);
        }

        public String getBasePath() {
            return basePath;
        }

        public boolean isForcePathStyle() {
            return forcePathStyle;
        }

        public Optional<String> getServerSideEncryption() {
            return Optional.ofNullable(serverSideEncryption);
        }

        public Optional<String> getKmsKeyId() {
            return Optional.ofNullable(kmsKeyId);
        }

        public int getMultipartUploadThresholdMb() {
            return multipartUploadThresholdMb;
        }

        public long getMultipartUploadThresholdBytes() {
            long threshold = multipartUploadThresholdMb * 1024L * 1024L;
            long min = 5L * 1024L * 1024L;
            return Math.max(min, threshold);
        }

        public String getAccessKey() {
            return accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }
    }
}
