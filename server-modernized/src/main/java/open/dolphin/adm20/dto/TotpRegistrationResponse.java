package open.dolphin.adm20.dto;

/**
 * TOTP 登録開始レスポンス。
 */
public class TotpRegistrationResponse {

    private long credentialId;
    private String secret;
    private String provisioningUri;

    public long getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(long credentialId) {
        this.credentialId = credentialId;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getProvisioningUri() {
        return provisioningUri;
    }

    public void setProvisioningUri(String provisioningUri) {
        this.provisioningUri = provisioningUri;
    }
}
