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
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
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
        PutObjectRequest.Builder builder = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentLength(size);
        if (contentType != null && !contentType.isBlank()) {
            builder.contentType(contentType);
        }
        if (kmsKeyId != null && !kmsKeyId.isBlank()) {
            builder.serverSideEncryption(ServerSideEncryption.AWS_KMS)
                    .ssekmsKeyId(kmsKeyId);
        }
        try {
            client.putObject(builder.build(), RequestBody.fromInputStream(data, size));
        } catch (Exception ex) {
            throw new IOException("Failed to upload PHR export artifact to S3: " + key, ex);
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
        S3ClientBuilder builder = S3Client.builder()
                .credentialsProvider(DefaultCredentialsProvider.create())
                .region(Region.of(region))
                .serviceConfiguration(serviceConfiguration);
        if (endpoint != null) {
            builder.endpointOverride(endpoint);
        }
        s3Client = builder.build();
        return s3Client;
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
