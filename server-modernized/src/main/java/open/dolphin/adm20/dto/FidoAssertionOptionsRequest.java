package open.dolphin.adm20.dto;

/**
 * FIDO2 認証開始リクエスト。
 */
public class FidoAssertionOptionsRequest {

    private long userPk;
    private String userId;

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
}
