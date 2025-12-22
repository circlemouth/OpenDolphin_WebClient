package open.dolphin.adm20.mbean;

public class IdentityTokenSecretsException extends RuntimeException {

    public static final String REASON_KEY_MISSING = "identity_token_key_missing";
    public static final String REASON_KEY_NOT_FOUND = "identity_token_key_not_found";
    public static final String REASON_KEY_EMPTY = "identity_token_key_empty";
    public static final String REASON_KEY_INVALID = "identity_token_key_invalid";
    public static final String REASON_KEY_READ_FAILED = "identity_token_key_read_failed";

    private final String reason;
    private final String source;

    public IdentityTokenSecretsException(String reason, String message, String source) {
        super(message);
        this.reason = reason;
        this.source = source;
    }

    public IdentityTokenSecretsException(String reason, String message, String source, Throwable cause) {
        super(message, cause);
        this.reason = reason;
        this.source = source;
    }

    public String getReason() {
        return reason;
    }

    public String getSource() {
        return source;
    }
}
