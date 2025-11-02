package open.dolphin.adm20.dto;

/**
 * FIDO2 認証完了リクエスト。
 */
public class FidoAssertionFinishRequest {

    private long userPk;
    private String requestId;
    private String credentialResponse;

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
}
