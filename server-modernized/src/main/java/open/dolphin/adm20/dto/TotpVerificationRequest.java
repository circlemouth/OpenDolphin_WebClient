package open.dolphin.adm20.dto;

/**
 * TOTP 登録確定リクエスト。
 */
public class TotpVerificationRequest {

    private long userPk;
    private long credentialId;
    private String code;

    public long getUserPk() {
        return userPk;
    }

    public void setUserPk(long userPk) {
        this.userPk = userPk;
    }

    public long getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(long credentialId) {
        this.credentialId = credentialId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
