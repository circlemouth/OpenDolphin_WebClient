package open.dolphin.adm20.dto;

/**
 * FIDO2 認証結果レスポンス。
 */
public class FidoAssertionResponse {

    private boolean authenticated;

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }
}
