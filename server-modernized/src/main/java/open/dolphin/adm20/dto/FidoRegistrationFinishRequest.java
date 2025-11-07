package open.dolphin.adm20.dto;

/**
 * FIDO2 登録完了リクエスト。
 */
public class FidoRegistrationFinishRequest {

    private long userPk;
    private String requestId;
    private String credentialResponse;
    private String label;

    public long getUserPk() {
        return userPk;
    }

    public void setUserPk(long userPk) {
        this.userPk = userPk;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getCredentialResponse() {
        return credentialResponse;
    }

    public void setCredentialResponse(String credentialResponse) {
        this.credentialResponse = credentialResponse;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
