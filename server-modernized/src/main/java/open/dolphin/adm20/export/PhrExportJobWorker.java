package open.dolphin.adm20.export;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import open.dolphin.adm20.dto.PhrExportRequest;
import open.dolphin.adm20.session.PHRAsyncJobServiceBean;
import open.dolphin.adm20.support.PhrDataAssembler;
import open.dolphin.infomodel.PHRAsyncJob;

/**
 * PHR エクスポートジョブを実行するワーカー。
 */
@ApplicationScoped
public class PhrExportJobWorker {

    private static final Logger LOGGER = Logger.getLogger(PhrExportJobWorker.class.getName());
    private static final String ERROR_VALIDATION = "INVALID_REQUEST";
    private static final String ERROR_STORAGE = "STORAGE_ERROR";
    private static final String ERROR_UNEXPECTED = "UNEXPECTED_ERROR";

    @Inject
    private PHRAsyncJobServiceBean jobService;

    @Inject
    private PhrExportStorageFactory storageFactory;

    @Inject
    private PhrDataAssembler dataAssembler;

    public void execute(UUID jobId, String facilityId, String userId, PhrExportRequest request) {
        String workerId = "phr-export-" + Instant.now().toEpochMilli();
        PHRAsyncJob job = jobService.lockForExecution(jobId, workerId);
        if (job == null) {
            LOGGER.log(Level.WARNING, "Job {0} is not ready for execution.", jobId);
            return;
        }
        if (!facilityId.equals(job.getFacilityId())) {
            LOGGER.log(Level.WARNING, "Facility mismatch for job {0}: expected {1}, actual {2}",
                    new Object[]{jobId, facilityId, job.getFacilityId()});
            jobService.completeFailure(jobId, ERROR_VALIDATION, "Facility mismatch.");
            return;
        }
        if (request == null || request.isEmpty()) {
            jobService.completeFailure(jobId, ERROR_VALIDATION, "Patient list is empty.");
            return;
        }
        try {
            performExport(job, request, facilityId);
        } catch (StorageException ex) {
            LOGGER.log(Level.WARNING, "Failed to store export artifact for job " + jobId, ex);
            jobService.completeFailure(jobId, ERROR_STORAGE, ex.getMessage());
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Unhandled exception while executing PHR export job " + jobId, ex);
            jobService.completeFailure(jobId, ERROR_UNEXPECTED, ex.getMessage());
        }
    }

    private void performExport(PHRAsyncJob job, PhrExportRequest request, String facilityId) throws Exception {
        List<String> patientIds = request.getPatientIds();
        int total = patientIds.size();
        int processed = 0;

        try (ByteArrayOutputStream buffer = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(buffer, StandardCharsets.UTF_8)) {
            OutputStreamWriter writer = new OutputStreamWriter(zip, StandardCharsets.UTF_8);

            for (String patientId : patientIds) {
                processed++;
                String entryName = buildEntryName(patientId, processed);
                zip.putNextEntry(new ZipEntry(entryName));

                var container = dataAssembler.buildContainer(
                        facilityId,
                        patientId,
                        request.getDocumentSince(),
                        request.getLabSince(),
                        request.getRpRequest() != null ? request.getRpRequest() : 0,
                        request.getReplyTo());

                writer.write(dataAssembler.toJson(container));
                writer.flush();

                zip.closeEntry();
                int progress = Math.floorDiv(processed * 100, total);
                jobService.updateProgress(job.getJobId(), Math.min(progress, 99));
            }

            zip.putNextEntry(new ZipEntry("metadata.json"));
            String metadata = buildMetadata(request, facilityId, total);
            writer.write(metadata);
            writer.flush();
            zip.closeEntry();
            zip.finish();

            PhrExportStorage storage = resolveStorage();
            byte[] bytes = buffer.toByteArray();
            try (ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes)) {
                PhrExportStorage.StorageResult result = storage.storeArtifact(job, inputStream, bytes.length, "application/zip");
                jobService.completeSuccess(job.getJobId(), result.getLocation(), result.getSize());
            }
        }
    }

    private PhrExportStorage resolveStorage() throws StorageException {
        PhrExportStorage storage = storageFactory.getStorage();
        if (storage == null) {
            throw new StorageException("No storage backend configured for PHR export.");
        }
        return storage;
    }

    private String buildEntryName(String patientId, int index) {
        String sanitized = patientId.replaceAll("[^A-Za-z0-9_-]", "_");
        return "patient-" + index + "-" + sanitized + ".json";
    }

    private String buildMetadata(PhrExportRequest request, String facilityId, int totalPatients) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"facilityId\":\"").append(facilityId).append("\",");
        sb.append("\"generatedAt\":\"").append(Instant.now()).append("\",");
        sb.append("\"patientCount\":").append(totalPatients);
        if (request.getDocumentSince() != null) {
            sb.append(",\"documentSince\":\"").append(request.getDocumentSince()).append("\"");
        }
        if (request.getLabSince() != null) {
            sb.append(",\"labSince\":\"").append(request.getLabSince()).append("\"");
        }
        if (request.getFormat() != null) {
            sb.append(",\"format\":\"").append(request.getFormat()).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static final class StorageException extends Exception {
        private StorageException(String message) {
            super(message);
        }
    }
}
