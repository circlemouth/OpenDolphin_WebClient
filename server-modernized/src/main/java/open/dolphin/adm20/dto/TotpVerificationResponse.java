package open.dolphin.adm20.dto;

import java.util.ArrayList;
import java.util.Collections;
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
        return immutableList(backupCodes);
    }

    public void setBackupCodes(List<String> backupCodes) {
        this.backupCodes = immutableList(backupCodes);
    }

    private static List<String> immutableList(List<String> source) {
        return source == null ? null : Collections.unmodifiableList(new ArrayList<>(source));
    }
}
