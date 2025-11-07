package open.dolphin.security;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import open.dolphin.security.fido.Fido2Config;
import open.dolphin.security.totp.TotpSecretProtector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ２要素認証に関するセキュリティ設定を集約するクラス。
 */
@ApplicationScoped
public class SecondFactorSecurityConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(SecondFactorSecurityConfig.class);
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
            LOGGER.error("{} must be provided via Secrets Manager. Raw key fallback has been removed.", ENV_TOTP_KEY_BASE64);
            throw new IllegalStateException("Environment variable " + ENV_TOTP_KEY_BASE64 + " is required for TOTP encryption");
        }
        if (System.getenv(ENV_TOTP_KEY) != null) {
            LOGGER.info("{} is ignored; configure {} instead.", ENV_TOTP_KEY, ENV_TOTP_KEY_BASE64);
        }
        return key.trim();
    }
}
