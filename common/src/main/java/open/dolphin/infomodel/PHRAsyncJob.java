package open.dolphin.infomodel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Asynchronous PHR export job entity.
 */
@Entity
@Table(name = "phr_async_job")
public class PHRAsyncJob implements Serializable {

    public enum State {
        PENDING,
        RUNNING,
        SUCCEEDED,
        FAILED,
        CANCELLED,
        EXPIRED
    }

    @Id
    @Column(name = "job_id", columnDefinition = "uuid")
    private UUID jobId;

    @Column(name = "job_type", nullable = false, length = 64)
    private String jobType;

    @Column(name = "facility_id", nullable = false, length = 32)
    private String facilityId;

    @Column(name = "patient_scope", nullable = false, columnDefinition = "jsonb")
    private String patientScope;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 16)
    private State state = State.PENDING;

    @Column(name = "progress", nullable = false)
    private int progress = 0;

    @Column(name = "result_uri")
    private String resultUri;

    @Column(name = "error_code", length = 32)
    private String errorCode;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "queued_at", nullable = false)
    private OffsetDateTime queuedAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "locked_by", length = 64)
    private String lockedBy;

    @Column(name = "heartbeat_at")
    private OffsetDateTime heartbeatAt;

    public UUID getJobId() {
        return jobId;
    }

    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(String facilityId) {
        this.facilityId = facilityId;
    }

    public String getPatientScope() {
        return patientScope;
    }

    public void setPatientScope(String patientScope) {
        this.patientScope = patientScope;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public String getResultUri() {
        return resultUri;
    }

    public void setResultUri(String resultUri) {
        this.resultUri = resultUri;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public OffsetDateTime getQueuedAt() {
        return queuedAt;
    }

    public void setQueuedAt(OffsetDateTime queuedAt) {
        this.queuedAt = queuedAt;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(OffsetDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public OffsetDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(OffsetDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }

    public String getLockedBy() {
        return lockedBy;
    }

    public void setLockedBy(String lockedBy) {
        this.lockedBy = lockedBy;
    }

    public OffsetDateTime getHeartbeatAt() {
        return heartbeatAt;
    }

    public void setHeartbeatAt(OffsetDateTime heartbeatAt) {
        this.heartbeatAt = heartbeatAt;
    }

    @PrePersist
    protected void onCreate() {
        if (jobId == null) {
            jobId = UUID.randomUUID();
        }
        if (queuedAt == null) {
            queuedAt = OffsetDateTime.now();
        }
    }
}
