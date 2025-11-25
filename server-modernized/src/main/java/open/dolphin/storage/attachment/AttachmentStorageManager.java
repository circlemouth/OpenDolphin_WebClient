package open.dolphin.storage.attachment;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.Objects;
import java.util.Optional;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Status;
import jakarta.transaction.Synchronization;
import jakarta.transaction.TransactionSynchronizationRegistry;
import open.dolphin.infomodel.AttachmentModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;
import software.amazon.awssdk.utils.IoUtils;
import software.amazon.awssdk.core.sync.RequestBody;

/**
 * 添付ファイルの保存先を制御するマネージャー。
 */
@ApplicationScoped
public class AttachmentStorageManager {

    private static final Logger LOGGER = LoggerFactory.getLogger(AttachmentStorageManager.class);

    @Inject
    AttachmentStorageConfigLoader configLoader;

    @Resource
    private TransactionSynchronizationRegistry registry;

    private AttachmentStorageSettings settings;
    private AttachmentKeyResolver keyResolver;
    private S3Client s3Client;

    @PostConstruct
    void init() {
        settings = configLoader.load();
        if (settings.getMode().isS3()) {
            AttachmentStorageSettings.S3Settings s3Settings = settings.getS3()
                    .orElseThrow(() -> new AttachmentStorageException("S3 settings are missing"));
            keyResolver = new AttachmentKeyResolver(s3Settings);
            s3Client = createClient(s3Settings);
            LOGGER.info("Attachment storage initialized in S3 mode (bucket={}, region={}, config={})",
                    s3Settings.getBucket(), s3Settings.getRegion(), settings.getSourcePath().orElse(null));
        } else {
            LOGGER.info("Attachment storage initialized in database mode (config={})",
                    settings.getSourcePath().orElse(null));
        }
    }

    @PreDestroy
    void shutdown() {
        if (s3Client != null) {
            s3Client.close();
        }
    }

    public AttachmentStorageMode getMode() {
        return settings.getMode();
    }

    public void persistExternalAssets(Collection<AttachmentModel> attachments) {
        if (!settings.getMode().isS3() || attachments == null || attachments.isEmpty()) {
            return;
        }
        attachments.stream()
                .filter(Objects::nonNull)
                .forEach(this::uploadToS3);
    }

    public void populateBinary(AttachmentModel attachment) {
        if (!settings.getMode().isS3() || attachment == null) {
            return;
        }
        S3ObjectLocation location = resolveLocation(attachment)
                .orElse(null);
        if (location == null) {
            LOGGER.debug("Attachment {} has no S3 URI; skip download", attachment.getId());
            return;
        }

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(location.bucket)
                .key(location.key)
                .build();

        try (software.amazon.awssdk.core.ResponseInputStream<GetObjectResponse> response = s3Client.getObject(request)) {
            byte[] data = IoUtils.toByteArray((InputStream) response);
            attachment.setBytes(data);
        } catch (IOException ex) {
            throw new AttachmentStorageException("Failed to download attachment " + location.key, ex);
        } catch (Exception ex) {
            throw new AttachmentStorageException("Failed to download attachment " + location.key, ex);
        }
    }

    public void deleteExternalAsset(AttachmentModel attachment) {
        if (!settings.getMode().isS3() || attachment == null) {
            return;
        }
        resolveLocation(attachment).ifPresent(location -> {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(location.bucket)
                        .key(location.key)
                        .build());
            } catch (Exception ex) {
                LOGGER.warn("Failed to delete S3 object {} for attachment {}: {}",
                        location, attachment.getId(), ex.getMessage());
            }
        });
    }

    private void uploadToS3(AttachmentModel attachment) {
        // Idempotency check: if already uploaded to S3, skip
        if ("s3".equals(attachment.getLocation()) && attachment.getUri() != null && !attachment.getUri().isBlank()) {
            LOGGER.debug("Attachment {} is already in S3 ({}); skipping upload.", attachment.getId(), attachment.getUri());
            return;
        }

        byte[] bytes = attachment.getBytes();
        if (bytes == null || bytes.length == 0) {
            LOGGER.debug("Attachment {} has no binary payload; skip upload", attachment.getId());
            return;
        }
        AttachmentStorageSettings.S3Settings s3Settings = settings.getS3()
                .orElseThrow(() -> new AttachmentStorageException("S3 settings missing"));
        String key = keyResolver.resolve(attachment);
        PutObjectRequest.Builder builder = PutObjectRequest.builder()
                .bucket(s3Settings.getBucket())
                .key(key)
                .contentLength((long) bytes.length);
        if (attachment.getContentType() != null && !attachment.getContentType().isBlank()) {
            builder.contentType(attachment.getContentType());
        }
        s3Settings.getServerSideEncryption()
                .map(String::toUpperCase)
                .ifPresent(mode -> applyServerSideEncryption(builder, mode, s3Settings));

        try {
            s3Client.putObject(builder.build(), RequestBody.fromBytes(bytes));
            String s3Uri = String.format("s3://%s/%s", s3Settings.getBucket(), key);
            attachment.setUri(s3Uri);
            attachment.setLocation("s3");

            // Register rollback hook
            registerRollbackHook(attachment);

        } catch (Exception ex) {
            throw new AttachmentStorageException("Failed to upload attachment to S3: " + key, ex);
        }
    }

    private void registerRollbackHook(AttachmentModel attachment) {
        if (registry == null) {
            LOGGER.warn("TransactionSynchronizationRegistry is not available. Rollback for S3 upload {} cannot be guaranteed.", attachment.getUri());
            return;
        }

        try {
            registry.registerInterposedSynchronization(new Synchronization() {
                @Override
                public void beforeCompletion() {
                    // No action needed
                }

                @Override
                public void afterCompletion(int status) {
                    if (status != Status.STATUS_COMMITTED) {
                        LOGGER.info("Transaction rolled back. Deleting S3 object: {}", attachment.getUri());
                        deleteExternalAsset(attachment);
                    }
                }
            });
        } catch (Exception e) {
            LOGGER.warn("Failed to register synchronization for attachment {}: {}", attachment.getId(), e.getMessage());
        }
    }

    private void applyServerSideEncryption(PutObjectRequest.Builder builder,
                                           String mode,
                                           AttachmentStorageSettings.S3Settings s3Settings) {
        if ("AES256".equalsIgnoreCase(mode)) {
            builder.serverSideEncryption(ServerSideEncryption.AES256);
        } else if ("aws:kms".equalsIgnoreCase(mode) || "KMS".equalsIgnoreCase(mode)) {
            builder.serverSideEncryption(ServerSideEncryption.AWS_KMS);
            s3Settings.getKmsKeyId().ifPresent(builder::ssekmsKeyId);
        }
    }

    private Optional<S3ObjectLocation> resolveLocation(AttachmentModel attachment) {
        AttachmentStorageSettings.S3Settings s3Settings = settings.getS3()
                .orElse(null);
        if (s3Settings == null) {
            return Optional.empty();
        }
        String uri = attachment.getUri();
        if (uri == null || uri.isBlank()) {
            return Optional.of(new S3ObjectLocation(s3Settings.getBucket(), keyResolver.resolve(attachment)));
        }
        if (uri.startsWith("s3://")) {
            String withoutScheme = uri.substring(5);
            int slashIndex = withoutScheme.indexOf('/');
            if (slashIndex <= 0) {
                return Optional.empty();
            }
            String bucket = withoutScheme.substring(0, slashIndex);
            String key = withoutScheme.substring(slashIndex + 1);
            return Optional.of(new S3ObjectLocation(bucket, key));
        }
        return Optional.of(new S3ObjectLocation(s3Settings.getBucket(), uri));
    }

    private S3Client createClient(AttachmentStorageSettings.S3Settings s3Settings) {
        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(s3Settings.isForcePathStyle())
                .build();

        S3ClientBuilder builder = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(s3Settings.getAccessKey(), s3Settings.getSecretKey())))
                .region(Region.of(s3Settings.getRegion()))
                .serviceConfiguration(serviceConfiguration);

        s3Settings.getEndpoint().ifPresent(builder::endpointOverride);
        return builder.build();
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
