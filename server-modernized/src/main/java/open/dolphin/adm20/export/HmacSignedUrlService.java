package open.dolphin.adm20.export;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@ApplicationScoped
public class HmacSignedUrlService implements SignedUrlService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    @Inject
    private PhrExportConfig config;

    @Override
    public String createSignedUrl(String basePath, String facilityId, long ttlSeconds) {
        long expires = Instant.now().getEpochSecond() + requirePositiveTtl(ttlSeconds);
        String signature = sign(basePath, facilityId, expires, requireSigningSecret());
        return basePath + "?expires=" + expires + "&token=" + signature;
    }

    @Override
    public boolean verify(String basePath, String facilityId, long expiresEpochSeconds, String token) {
        if (Instant.now().getEpochSecond() > expiresEpochSeconds) {
            return false;
        }
        String expected = sign(basePath, facilityId, expiresEpochSeconds, requireSigningSecret());
        return constantTimeEquals(expected, token);
    }

    private String sign(String basePath, String facilityId, long expires, String secret) {
        String payload = basePath + "|" + facilityId + "|" + expires;
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to sign URL", ex);
        }
    }

    private long requirePositiveTtl(long ttlSeconds) {
        if (ttlSeconds <= 0) {
            throw new IllegalStateException("Signed URL TTL must be greater than zero.");
        }
        return ttlSeconds;
    }

    private String requireSigningSecret() {
        if (config == null) {
            throw new IllegalStateException("PhrExportConfig is not available.");
        }
        String secret = config.getSigningSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("PHR_EXPORT_SIGNING_SECRET is not configured.");
        }
        return secret;
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
