package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Response payload for disease mutation APIs.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DiseaseMutationResponse {

    private String apiResult;
    private String apiResultMessage;
    private String runId;
    private List<Long> createdDiagnosisIds;
    private List<Long> updatedDiagnosisIds;
    private List<Long> removedDiagnosisIds;
    private String messageDetail;

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

    public List<Long> getCreatedDiagnosisIds() {
        return createdDiagnosisIds;
    }

    public void setCreatedDiagnosisIds(List<Long> createdDiagnosisIds) {
        this.createdDiagnosisIds = createdDiagnosisIds;
    }

    public List<Long> getUpdatedDiagnosisIds() {
        return updatedDiagnosisIds;
    }

    public void setUpdatedDiagnosisIds(List<Long> updatedDiagnosisIds) {
        this.updatedDiagnosisIds = updatedDiagnosisIds;
    }

    public List<Long> getRemovedDiagnosisIds() {
        return removedDiagnosisIds;
    }

    public void setRemovedDiagnosisIds(List<Long> removedDiagnosisIds) {
        this.removedDiagnosisIds = removedDiagnosisIds;
    }

    public String getMessageDetail() {
        return messageDetail;
    }

    public void setMessageDetail(String messageDetail) {
        this.messageDetail = messageDetail;
    }
}
