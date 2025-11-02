package open.dolphin.adm20.dto;

/**
 * FIDO2 認証開始レスポンス。
 */
public class FidoAssertionOptionsResponse {

    private String requestId;
    private String publicKeyCredentialRequestOptions;

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getPublicKeyCredentialRequestOptions() {
        return publicKeyCredentialRequestOptions;
    }

    public void setPublicKeyCredentialRequestOptions(String publicKeyCredentialRequestOptions) {
        this.publicKeyCredentialRequestOptions = publicKeyCredentialRequestOptions;
    }
}
