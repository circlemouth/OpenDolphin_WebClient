package open.dolphin.adm20.dto;

/**
 * FIDO2 登録開始リクエスト。
 */
public class FidoRegistrationOptionsRequest {

    private long userPk;
    private String userId;
    private String displayName;
    private String authenticatorAttachment;

    public long getUserPk() {
        return userPk;
    }

    public void setUserPk(long userPk) {
        this.userPk = userPk;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAuthenticatorAttachment() {
        return authenticatorAttachment;
    }

    public void setAuthenticatorAttachment(String authenticatorAttachment) {
        this.authenticatorAttachment = authenticatorAttachment;
    }
}
