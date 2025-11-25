package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response payload for POST /orca/birth-delivery.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BirthDeliveryResponse {

    private String apiResult;
    private String apiResultMessage;
    private String runId;
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

    public String getMessageDetail() {
        return messageDetail;
    }

    public void setMessageDetail(String messageDetail) {
        this.messageDetail = messageDetail;
    }
}
