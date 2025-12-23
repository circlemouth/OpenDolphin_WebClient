package open.dolphin.adm20.export;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.PHRAsyncJob;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;

@ApplicationScoped
public class S3PhrExportStorage implements PhrExportStorage {

    private static final Logger LOGGER = Logger.getLogger(S3PhrExportStorage.class.getName());

    @Inject
    private PhrExportConfig config;

    private S3Client s3Client;
    private String bucket;
    private String region;
    private String prefix;
    private boolean forcePathStyle;
    private String kmsKeyId;
    private URI endpoint;
    private String accessKey;
    private String secretKey;
    private String serverSideEncryption;

    @PostConstruct
    void init() {
        if (config == null) {
            return;
        }
        bucket = trimToNull(config.getS3Bucket());
        region = trimToNull(config.getS3Region());
        prefix = trimToNull(config.getS3Prefix());
        forcePathStyle = config.isS3ForcePathStyle();
        kmsKeyId = trimToNull(config.getS3KmsKeyId());
        endpoint = parseEndpoint(config.getS3Endpoint());
        accessKey = trimToNull(config.getS3AccessKey());
        secretKey = trimToNull(config.getS3SecretKey());
        serverSideEncryption = trimToNull(config.getS3ServerSideEncryption());
    }

    @PreDestroy
    void shutdown() {
        if (s3Client != null) {
            s3Client.close();
        }
    }

    @Override
    public StorageResult storeArtifact(PHRAsyncJob job, InputStream data, long size, String contentType) throws IOException {
        if (job == null) {
            throw new IOException("PHRAsyncJob is required for S3 storage.");
        }
        S3Client client = ensureClient();
        String key = resolveObjectKey(job);
        if (size < 0) {
            throw new IOException("Invalid content length for S3 upload (bucket=" + bucket + ", key=" + key + ", size=" + size + ").");
        }
        PutObjectRequest.Builder builder = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentLength(size);
        String resolvedContentType = contentType != null && !contentType.isBlank()
                ? contentType
                : "application/zip";
        builder.contentType(resolvedContentType);
        ServerSideEncryption encryption = resolveServerSideEncryption(serverSideEncryption, kmsKeyId);
        if (encryption != null) {
            builder.serverSideEncryption(encryption);
            if (encryption == ServerSideEncryption.AWS_KMS) {
                if (kmsKeyId != null && !kmsKeyId.isBlank()) {
                    builder.ssekmsKeyId(kmsKeyId);
                } else {
                    LOGGER.warning("PHR_EXPORT_S3_SERVER_SIDE_ENCRYPTION requires AWS KMS, but PHR_EXPORT_S3_KMS_KEY is not configured.");
                }
            }
        }
        try {
            client.putObject(builder.build(), RequestBody.fromInputStream(data, size));
        } catch (Exception ex) {
            throw new IOException("Failed to upload PHR export artifact to S3 bucket=" + bucket + ", key=" + key, ex);
        }
        String location = String.format("s3://%s/%s", bucket, key);
        LOGGER.log(Level.FINE, "Stored PHR export artifact at {0}", location);
        return new StorageResult(location, size);
    }

    @Override
    public StoredArtifact loadArtifact(PHRAsyncJob job, String location) throws IOException {
        if (location == null || location.isBlank()) {
            throw new IOException("PHR export artifact location is missing.");
        }
        S3Client client = ensureClient();
        S3ObjectLocation objectLocation = resolveLocation(job, location);
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(objectLocation.bucket)
                .key(objectLocation.key)
                .build();
        String jobSuffix = job != null && job.getJobId() != null ? job.getJobId().toString() : "unknown";
        Path tempFile = Files.createTempFile("phr-export-" + jobSuffix + "-", ".zip");
        tempFile.toFile().deleteOnExit();
        try (ResponseInputStream<GetObjectResponse> response = client.getObject(request)) {
            Files.copy(response, tempFile, StandardCopyOption.REPLACE_EXISTING);
            String responseContentType = response.response().contentType();
            String resolvedType = responseContentType != null && !responseContentType.isBlank()
                    ? responseContentType
                    : "application/zip";
            return new StoredArtifact(tempFile, resolvedType);
        } catch (Exception ex) {
            throw new IOException("Failed to download PHR export artifact from S3: " + objectLocation, ex);
        }
    }

    private synchronized S3Client ensureClient() throws IOException {
        if (s3Client != null) {
            return s3Client;
        }
        if (bucket == null || bucket.isBlank()) {
            throw new IOException("PHR_EXPORT_S3_BUCKET is not configured.");
        }
        if (region == null || region.isBlank()) {
            throw new IOException("PHR_EXPORT_S3_REGION is not configured.");
        }
        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(forcePathStyle)
                .build();
        if ((accessKey == null) != (secretKey == null)) {
            LOGGER.warning("PHR_EXPORT_S3_ACCESS_KEY and PHR_EXPORT_S3_SECRET_KEY must be set together. Falling back to default credentials.");
            accessKey = null;
            secretKey = null;
        }
        S3ClientBuilder builder = S3Client.builder()
                .credentialsProvider(resolveCredentialsProvider(accessKey, secretKey))
                .region(Region.of(region))
                .serviceConfiguration(serviceConfiguration);
        if (endpoint != null) {
            builder.endpointOverride(endpoint);
        }
        s3Client = builder.build();
        return s3Client;
    }

    private static software.amazon.awssdk.auth.credentials.AwsCredentialsProvider resolveCredentialsProvider(
            String accessKeyValue,
            String secretKeyValue
    ) {
        if (accessKeyValue != null && secretKeyValue != null) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyValue, secretKeyValue));
        }
        return DefaultCredentialsProvider.create();
    }

    private ServerSideEncryption resolveServerSideEncryption(String rawValue, String kmsKeyIdValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return kmsKeyIdValue != null ? ServerSideEncryption.AWS_KMS : null;
        }
        String normalized = rawValue.trim().toLowerCase();
        if ("aes256".equals(normalized)) {
            return ServerSideEncryption.AES256;
        }
        if ("aws:kms".equals(normalized) || "kms".equals(normalized)) {
            return ServerSideEncryption.AWS_KMS;
        }
        LOGGER.log(Level.WARNING, "Unknown PHR_EXPORT_S3_SERVER_SIDE_ENCRYPTION value: {0}", rawValue);
        return kmsKeyIdValue != null ? ServerSideEncryption.AWS_KMS : null;
    }

    private String resolveObjectKey(PHRAsyncJob job) {
        String jobId = job.getJobId().toString();
        String base = prefix == null ? "" : prefix;
        boolean hasJobIdPlaceholder = base.contains("{jobId}");
        String resolved = base.replace("{facilityId}", job.getFacilityId())
                .replace("{jobId}", jobId);
        if (resolved.isBlank()) {
            return jobId + ".zip";
        }
        if (hasJobIdPlaceholder || resolved.endsWith(".zip")) {
            return resolved;
        }
        String normalized = resolved.endsWith("/") ? resolved : resolved + "/";
        return normalized + jobId + ".zip";
    }

    private S3ObjectLocation resolveLocation(PHRAsyncJob job, String location) throws IOException {
        if (location.startsWith("s3://")) {
            String withoutScheme = location.substring(5);
            int slashIndex = withoutScheme.indexOf('/');
            if (slashIndex <= 0 || slashIndex == withoutScheme.length() - 1) {
                throw new IOException("Invalid S3 location: " + location);
            }
            String parsedBucket = withoutScheme.substring(0, slashIndex);
            String key = withoutScheme.substring(slashIndex + 1);
            return new S3ObjectLocation(parsedBucket, key);
        }
        if (bucket == null || bucket.isBlank()) {
            throw new IOException("PHR_EXPORT_S3_BUCKET is not configured.");
        }
        String normalized = location.startsWith("/") ? location.substring(1) : location;
        if (normalized.isBlank()) {
            String fallbackKey = resolveObjectKey(job);
            return new S3ObjectLocation(bucket, fallbackKey);
        }
        return new S3ObjectLocation(bucket, normalized);
    }

    private URI parseEndpoint(String rawEndpoint) {
        if (rawEndpoint == null || rawEndpoint.isBlank()) {
            return null;
        }
        try {
            return URI.create(rawEndpoint.trim());
        } catch (IllegalArgumentException ex) {
            LOGGER.log(Level.WARNING, "Invalid S3 endpoint: {0}", rawEndpoint);
            return null;
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private static final class S3ObjectLocation {
        private final String bucket;
        private final String key;

        private S3ObjectLocation(String bucket, String key) {
            this.bucket = bucket;
            this.key = key;
        }

        @Override
        public String toString() {
            return String.format("s3://%s/%s", bucket, key);
        }
    }
}
