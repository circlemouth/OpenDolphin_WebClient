package open.dolphin.security.fido;

import java.util.Arrays;
import java.util.List;
import java.util.logging.Logger;

/**
 * FIDO2 / WebAuthn の設定値。
 */
public class Fido2Config {

    private static final Logger LOGGER = Logger.getLogger(Fido2Config.class.getName());
    private static final String ENV_RP_ID = "FIDO2_RP_ID";
    private static final String ENV_RP_NAME = "FIDO2_RP_NAME";
    private static final String ENV_ORIGINS = "FIDO2_ALLOWED_ORIGINS";

    private final String relyingPartyId;
    private final String relyingPartyName;
    private final List<String> allowedOrigins;

    public Fido2Config(String relyingPartyId, String relyingPartyName, List<String> allowedOrigins) {
        this.relyingPartyId = relyingPartyId;
        this.relyingPartyName = relyingPartyName;
        this.allowedOrigins = allowedOrigins;
    }

    public String getRelyingPartyId() {
        return relyingPartyId;
    }

    public String getRelyingPartyName() {
        return relyingPartyName;
    }

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public static Fido2Config fromEnvironment() {
        String rpId = System.getenv(ENV_RP_ID);
        if (rpId == null || rpId.isBlank()) {
            rpId = "localhost";
            LOGGER.warning("FIDO2_RP_ID is not set. Using localhost for development.");
        }
        String rpName = System.getenv(ENV_RP_NAME);
        if (rpName == null || rpName.isBlank()) {
            rpName = "OpenDolphin Dev";
        }
        String origins = System.getenv(ENV_ORIGINS);
        List<String> allowedOrigins = origins == null || origins.isBlank()
                ? List.of("https://localhost:8443", "http://localhost:8080")
                : Arrays.stream(origins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        return new Fido2Config(rpId.trim(), rpName.trim(), allowedOrigins);
    }
}
