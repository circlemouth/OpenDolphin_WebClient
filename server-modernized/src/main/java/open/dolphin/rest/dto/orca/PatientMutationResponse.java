package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response payload for patient mutation wrapper.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PatientMutationResponse {

    private String apiResult;
    private String apiResultMessage;
    private String runId;
    private Long patientDbId;
    private String patientId;
    private String warningMessage;
    private Boolean idempotent;
    private String idempotentReason;

    public String getApiResult() {
        return apiResult;
    }

    public void setApiResult(String apiResult) {
        this.apiResult = apiResult;
    }

    public String getApiResultMessage() {
        return apiResultMessage;
    }

    public void setApiResultMessage(String apiResultMessage) {
        this.apiResultMessage = apiResultMessage;
    }

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }

    public Long getPatientDbId() {
        return patientDbId;
    }

    public void setPatientDbId(Long patientDbId) {
        this.patientDbId = patientDbId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getWarningMessage() {
        return warningMessage;
    }

    public void setWarningMessage(String warningMessage) {
        this.warningMessage = warningMessage;
    }

    public Boolean getIdempotent() {
        return idempotent;
    }

    public void setIdempotent(Boolean idempotent) {
        this.idempotent = idempotent;
    }

    public String getIdempotentReason() {
        return idempotentReason;
    }

    public void setIdempotentReason(String idempotentReason) {
        this.idempotentReason = idempotentReason;
    }
}
