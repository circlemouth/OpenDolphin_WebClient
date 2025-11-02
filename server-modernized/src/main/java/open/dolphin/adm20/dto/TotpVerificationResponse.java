package open.dolphin.adm20.dto;

import java.util.List;

/**
 * TOTP 登録確定レスポンス。
 */
public class TotpVerificationResponse {

    private boolean verified;
    private List<String> backupCodes;

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public List<String> getBackupCodes() {
        return backupCodes;
    }

    public void setBackupCodes(List<String> backupCodes) {
        this.backupCodes = backupCodes;
    }
}
