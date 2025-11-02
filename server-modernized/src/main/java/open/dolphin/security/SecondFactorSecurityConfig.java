package open.dolphin.security;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
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
        if (key == null || key.isBlank()) {
            LOGGER.severe(() -> ENV_TOTP_KEY_BASE64 + " must be provided via Secrets Manager. Raw key fallback has been removed.");
            throw new IllegalStateException("Environment variable " + ENV_TOTP_KEY_BASE64 + " is required for TOTP encryption");
        }
        if (System.getenv(ENV_TOTP_KEY) != null) {
            LOGGER.info(() -> ENV_TOTP_KEY + " is ignored; configure " + ENV_TOTP_KEY_BASE64 + " instead.");
        }
        return key.trim();
    }
}
