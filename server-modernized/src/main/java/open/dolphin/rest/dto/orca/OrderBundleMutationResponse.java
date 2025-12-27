package open.dolphin.rest.dto.orca;

import java.util.List;

/**
 * Response payload for order bundle mutation API.
 */
public class OrderBundleMutationResponse {

    private String apiResult;
    private String apiResultMessage;
    private String runId;
    private List<Long> createdDocumentIds;
    private List<Long> updatedDocumentIds;
    private List<Long> deletedDocumentIds;

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

    public List<Long> getCreatedDocumentIds() {
        return createdDocumentIds;
    }

    public void setCreatedDocumentIds(List<Long> createdDocumentIds) {
        this.createdDocumentIds = createdDocumentIds;
    }

    public List<Long> getUpdatedDocumentIds() {
        return updatedDocumentIds;
    }

    public void setUpdatedDocumentIds(List<Long> updatedDocumentIds) {
        this.updatedDocumentIds = updatedDocumentIds;
    }

    public List<Long> getDeletedDocumentIds() {
        return deletedDocumentIds;
    }

    public void setDeletedDocumentIds(List<Long> deletedDocumentIds) {
        this.deletedDocumentIds = deletedDocumentIds;
    }
}
