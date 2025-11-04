package open.dolphin.adm20.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import open.dolphin.infomodel.PHRAsyncJob;

/**
 * REST レスポンス向けの PHR 非同期ジョブサマリ。
 */
public class PhrExportJobResponse {

    private UUID jobId;
    private String state;
    private int progress;
    private OffsetDateTime queuedAt;
    private OffsetDateTime startedAt;
    private OffsetDateTime finishedAt;
    private String downloadUrl;
    private String errorCode;
    private String errorMessage;

    public static PhrExportJobResponse from(PHRAsyncJob job) {
        PhrExportJobResponse response = new PhrExportJobResponse();
        response.setJobId(job.getJobId());
        response.setState(job.getState().name());
        response.setProgress(job.getProgress());
        response.setQueuedAt(job.getQueuedAt());
        response.setStartedAt(job.getStartedAt());
        response.setFinishedAt(job.getFinishedAt());
        response.setErrorCode(job.getErrorCode());
        response.setErrorMessage(job.getErrorMessage());
        return response;
    }

    public UUID getJobId() {
        return jobId;
    }

    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
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

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
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
}
