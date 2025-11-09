package open.dolphin.reporting.api;

/**
 * Optional signing configuration embedded in the payload.
 */
public class ReportingSigningPayload {

    private String keystorePath;
    private String keystorePassword;
    private String keyAlias;
    private String tsaUrl;
    private String tsaUsername;
    private String tsaPassword;
    private String reason;
    private String location;

    public String getKeystorePath() {
        return keystorePath;
    }

    public void setKeystorePath(String keystorePath) {
        this.keystorePath = keystorePath;
    }

    public String getKeystorePassword() {
        return keystorePassword;
    }

    public void setKeystorePassword(String keystorePassword) {
        this.keystorePassword = keystorePassword;
    }

    public String getKeyAlias() {
        return keyAlias;
    }

    public void setKeyAlias(String keyAlias) {
        this.keyAlias = keyAlias;
    }

    public String getTsaUrl() {
        return tsaUrl;
    }

    public void setTsaUrl(String tsaUrl) {
        this.tsaUrl = tsaUrl;
    }

    public String getTsaUsername() {
        return tsaUsername;
    }

    public void setTsaUsername(String tsaUsername) {
        this.tsaUsername = tsaUsername;
    }

    public String getTsaPassword() {
        return tsaPassword;
    }

    public void setTsaPassword(String tsaPassword) {
        this.tsaPassword = tsaPassword;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
