package open.dolphin.rest.dto.orca;

/**
 * Common fields shared by ORCA wrapper responses.
 */
public abstract class OrcaApiResponse {

    private String apiResult;
    private String apiResultMessage;
    private String runId;
    private String blockerTag;
    private String dataSource;

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

    public String getBlockerTag() {
        return blockerTag;
    }

    public void setBlockerTag(String blockerTag) {
        this.blockerTag = blockerTag;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }
}
