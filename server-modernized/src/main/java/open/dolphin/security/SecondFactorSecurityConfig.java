package open.dolphin.security;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.logging.Logger;
import open.dolphin.security.fido.Fido2Config;
import open.dolphin.security.totp.TotpSecretProtector;

/**
 * ２要素認証に関するセキュリティ設定を集約するクラス。
 */
@ApplicationScoped
public class SecondFactorSecurityConfig {

    private static final Logger LOGGER = Logger.getLogger(SecondFactorSecurityConfig.class.getName());
    private static final String ENV_TOTP_KEY = "FACTOR2_AES_KEY";
    private static final String ENV_TOTP_KEY_BASE64 = "FACTOR2_AES_KEY_B64";

    private TotpSecretProtector totpSecretProtector;
    private Fido2Config fido2Config;

    @PostConstruct
    public void init() {
        this.totpSecretProtector = TotpSecretProtector.fromBase64(resolveTotpKey());
        this.fido2Config = Fido2Config.fromEnvironment();
    }

    public TotpSecretProtector getTotpSecretProtector() {
        return totpSecretProtector;
    }

    public Fido2Config getFido2Config() {
        return fido2Config;
    }

    private String resolveTotpKey() {
        String key = System.getenv(ENV_TOTP_KEY_BASE64);
        if (key != null && !key.isBlank()) {
            return key.trim();
        }
        String raw = System.getenv(ENV_TOTP_KEY);
        if (raw != null && !raw.isBlank()) {
            LOGGER.info(() -> "Deriving base64 TOTP key from " + ENV_TOTP_KEY);
            byte[] bytes = raw.getBytes(StandardCharsets.UTF_8);
            return Base64.getEncoder().encodeToString(bytes);
        }
        LOGGER.warning("FACTOR2_AES_KEY_B64 is not set. Falling back to development default key.");
        byte[] devKey = "opendolphin-dev-factor2-key-32bytes".getBytes(StandardCharsets.UTF_8);
        return Base64.getEncoder().encodeToString(devKey);
    }
}
