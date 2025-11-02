package open.dolphin.adm20.dto;

/**
 * FIDO2 登録開始レスポンス。
 */
public class FidoRegistrationOptionsResponse {

    private String requestId;
    private String publicKeyCredentialCreationOptions;

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getPublicKeyCredentialCreationOptions() {
        return publicKeyCredentialCreationOptions;
    }

    public void setPublicKeyCredentialCreationOptions(String publicKeyCredentialCreationOptions) {
        this.publicKeyCredentialCreationOptions = publicKeyCredentialCreationOptions;
    }
}
