package open.dolphin.adm20.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.adm20.dto.PhrExportRequest;
import open.dolphin.adm20.session.PHRAsyncJobServiceBean;
import open.dolphin.infomodel.PHRAsyncJob;
import open.dolphin.infomodel.PHRAsyncJob.State;
import open.dolphin.infrastructure.concurrent.ConcurrencyResourceNames;

@ApplicationScoped
public class PhrExportJobManager {

    private static final Logger LOGGER = Logger.getLogger(PhrExportJobManager.class.getName());
    private static final String JOB_TYPE = "PHR_EXPORT";
    private static final String ERROR_STORAGE = "STORAGE_ERROR";
    private static final String ERROR_UNEXPECTED = "UNEXPECTED_ERROR";
    private static final String ERROR_HEARTBEAT_TIMEOUT = "HEARTBEAT_TIMEOUT";
    private static final String ERROR_RUNTIME_TIMEOUT = "RUNTIME_TIMEOUT";
    private static final String ERROR_RETRY_EXHAUSTED = "RETRY_EXHAUSTED";

    private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

    @Resource(lookup = ConcurrencyResourceNames.DEFAULT_EXECUTOR)
    private ExecutorService executor;

    @Inject
    private PHRAsyncJobServiceBean jobService;

    @Inject
    private PhrExportJobWorker worker;

    @Inject
    private PhrExportConfig exportConfig;

    public PHRAsyncJob submit(String facilityId, String userId, PhrExportRequest request) throws IOException {
        if (request == null || request.isEmpty()) {
            throw new IllegalArgumentException("PhrExportRequest must contain at least one patientId.");
        }
        String scopeJson = MAPPER.writeValueAsString(request);
        PHRAsyncJob job = jobService.createJob(facilityId, JOB_TYPE, scopeJson);
        if (executor == null) {
            throw new IllegalStateException("Managed executor is not available for PHR export jobs.");
        }
        scheduleExecution(job.getJobId(), facilityId, userId, request);
        return job;
    }

    public PhrExportRequest readScope(PHRAsyncJob job) throws IOException {
        return MAPPER.readValue(job.getPatientScope(), PhrExportRequest.class);
    }

    public void reconcileJobs() {
        if (executor == null) {
            LOGGER.warning("Managed executor is not available; skip PHR export job reconciliation.");
            return;
        }
        OffsetDateTime now = OffsetDateTime.now();
        Duration heartbeatTimeout = Duration.ofSeconds(Math.max(1, exportConfig.getJobHeartbeatTimeoutSeconds()));
        Duration maxRuntime = Duration.ofSeconds(Math.max(1, exportConfig.getJobMaxRuntimeSeconds()));

        List<PHRAsyncJob> pendingJobs = jobService.findByState(State.PENDING);
        List<PHRAsyncJob> runningJobs = jobService.findByState(State.RUNNING);
        List<PHRAsyncJob> staleJobs = jobService.findStaleRunningJobs(now.minus(heartbeatTimeout));
        List<PHRAsyncJob> failedJobs = jobService.findByState(State.FAILED);

        LOGGER.log(Level.INFO,
                "PHR export job reconcile: pending={0}, running={1}, stale={2}, failed={3}",
                new Object[]{pendingJobs.size(), runningJobs.size(), staleJobs.size(), failedJobs.size()});

        Set<java.util.UUID> handled = new HashSet<>();
        for (PHRAsyncJob stale : staleJobs) {
            handled.add(stale.getJobId());
            handleFailureAndRetry(stale, ERROR_HEARTBEAT_TIMEOUT, "Heartbeat timeout detected.", now);
        }

        for (PHRAsyncJob running : runningJobs) {
            if (handled.contains(running.getJobId())) {
                continue;
            }
            if (isRuntimeExceeded(running, now, maxRuntime)) {
                handled.add(running.getJobId());
                handleFailureAndRetry(running, ERROR_RUNTIME_TIMEOUT, "Runtime timeout detected.", now);
            }
        }

        for (PHRAsyncJob failed : failedJobs) {
            if (handled.contains(failed.getJobId())) {
                continue;
            }
            scheduleRetryIfEligible(failed, now);
        }

        for (PHRAsyncJob pending : pendingJobs) {
            if (handled.contains(pending.getJobId())) {
                continue;
            }
            scheduleFromStoredScope(pending);
        }
    }

    private void runJob(java.util.UUID jobId, String facilityId, String userId, PhrExportRequest request) {
        try {
            worker.execute(jobId, facilityId, userId, request);
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Unhandled exception while executing PHR export job " + jobId, ex);
        }
    }

    private void scheduleExecution(java.util.UUID jobId, String facilityId, String userId, PhrExportRequest request) {
        executor.submit(() -> runJob(jobId, facilityId, userId, request));
    }

    private void scheduleFromStoredScope(PHRAsyncJob job) {
        try {
            PhrExportRequest request = readScope(job);
            scheduleExecution(job.getJobId(), job.getFacilityId(), null, request);
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "Failed to read PHR export scope for job " + job.getJobId(), ex);
            jobService.completeFailure(job.getJobId(), "INVALID_SCOPE", ex.getMessage());
        }
    }

    private void handleFailureAndRetry(PHRAsyncJob job, String errorCode, String message, OffsetDateTime now) {
        jobService.completeFailure(job.getJobId(), errorCode, message);
        PHRAsyncJob updated = jobService.find(job.getJobId());
        if (updated != null) {
            scheduleRetryIfEligible(updated, now);
        }
    }

    private void scheduleRetryIfEligible(PHRAsyncJob job, OffsetDateTime now) {
        if (!isRetryable(job)) {
            return;
        }
        int maxRetries = Math.max(0, exportConfig.getJobMaxRetries());
        if (job.getRetryCount() > maxRetries) {
            jobService.markExpired(job.getJobId(), ERROR_RETRY_EXHAUSTED, "Retry limit exceeded.");
            return;
        }
        OffsetDateTime finishedAt = job.getFinishedAt();
        long backoffSeconds = computeBackoffSeconds(job.getRetryCount());
        OffsetDateTime readyAt = finishedAt != null ? finishedAt.plusSeconds(backoffSeconds) : now;
        if (readyAt.isAfter(now)) {
            return;
        }
        jobService.resetForRetry(job.getJobId(), now);
        PHRAsyncJob refreshed = jobService.find(job.getJobId());
        if (refreshed != null) {
            scheduleFromStoredScope(refreshed);
        }
    }

    private long computeBackoffSeconds(int retryCount) {
        if (retryCount <= 0) {
            return 0L;
        }
        long base = Math.max(1L, exportConfig.getJobRetryBackoffSeconds());
        long max = Math.max(base, exportConfig.getJobRetryBackoffMaxSeconds());
        int exponent = Math.min(retryCount - 1, 30);
        long multiplier = 1L << exponent;
        long delay;
        try {
            delay = Math.multiplyExact(base, multiplier);
        } catch (ArithmeticException ex) {
            delay = max;
        }
        return Math.min(delay, max);
    }

    private boolean isRetryable(PHRAsyncJob job) {
        if (job == null || job.getErrorCode() == null) {
            return false;
        }
        String code = job.getErrorCode();
        return ERROR_STORAGE.equals(code)
                || ERROR_UNEXPECTED.equals(code)
                || ERROR_HEARTBEAT_TIMEOUT.equals(code)
                || ERROR_RUNTIME_TIMEOUT.equals(code);
    }

    private boolean isRuntimeExceeded(PHRAsyncJob job, OffsetDateTime now, Duration maxRuntime) {
        if (job == null || job.getStartedAt() == null) {
            return false;
        }
        if (maxRuntime.isZero() || maxRuntime.isNegative()) {
            return false;
        }
        return job.getStartedAt().plus(maxRuntime).isBefore(now);
    }
}
