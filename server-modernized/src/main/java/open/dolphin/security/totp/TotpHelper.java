package open.dolphin.security.totp;

import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Objects;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Base32;

/**
 * TOTP のシークレット生成・コード計算・検証を担当するユーティリティ。
 * 旧 OTPHelper 相当の機能を提供しつつ、例外処理とエスケープを整理する。
 */
public final class TotpHelper {

    private static final int SECRET_SIZE_BYTES = 20;
    private static final int BACKUP_KEY_BYTES = 8;
    private static final int OTP_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int DEFAULT_PAST_WINDOWS = 3;
    private static final int DEFAULT_FUTURE_WINDOWS = 3;
    private static final int OTP_MODULUS = (int) Math.pow(10, OTP_DIGITS);
    private static final String HMAC_ALGORITHM = "HmacSHA1";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base32 BASE32 = new Base32();

    private TotpHelper() {
    }

    public static String generateSecret() {
        byte[] buffer = new byte[SECRET_SIZE_BYTES];
        RANDOM.nextBytes(buffer);
        return stripPadding(BASE32.encodeToString(buffer));
    }

    public static int generateCurrentCode(String secret) {
        return generateCode(secret, Instant.now());
    }

    public static int generateCode(String secret, Instant timestamp) {
        Objects.requireNonNull(secret, "secret must not be null");
        Objects.requireNonNull(timestamp, "timestamp must not be null");
        long timeWindow = timestamp.getEpochSecond() / TIME_STEP_SECONDS;
        return generateCodeInternal(decodeSecret(secret), timeWindow);
    }

    public static boolean verifyCurrentWindow(String secret, int code) {
        return verify(secret, code, DEFAULT_PAST_WINDOWS, DEFAULT_FUTURE_WINDOWS, Instant.now());
    }

    public static boolean verify(String secret, int code, int pastWindows, int futureWindows, Instant referenceTime) {
        Objects.requireNonNull(secret, "secret must not be null");
        Objects.requireNonNull(referenceTime, "referenceTime must not be null");
        if (pastWindows < 0 || futureWindows < 0) {
            throw new IllegalArgumentException("Window size must be zero or positive.");
        }
        byte[] secretBytes = decodeSecret(secret);
        long currentWindow = referenceTime.getEpochSecond() / TIME_STEP_SECONDS;
        for (int offset = -pastWindows; offset <= futureWindows; offset++) {
            if (generateCodeInternal(secretBytes, currentWindow + offset) == code) {
                return true;
            }
        }
        return false;
    }

    public static String buildProvisioningUri(String secret, String accountName, String issuer) {
        Objects.requireNonNull(secret, "secret must not be null");
        String normalizedSecret = secret.replaceAll("\\s+", "");
        String encodedAccount = accountName == null ? "" : urlEncode(accountName);
        String encodedIssuer = issuer == null ? "" : urlEncode(issuer);
        StringBuilder builder = new StringBuilder("otpauth://totp/");
        if (!encodedIssuer.isEmpty()) {
            builder.append(encodedIssuer).append(':');
        }
        builder.append(encodedAccount);
        builder.append("?secret=").append(normalizedSecret);
        builder.append("&digits=").append(OTP_DIGITS);
        builder.append("&period=").append(TIME_STEP_SECONDS);
        if (!encodedIssuer.isEmpty()) {
            builder.append("&issuer=").append(encodedIssuer);
        }
        return builder.toString();
    }

    public static String generateBackupKey() {
        byte[] buffer = new byte[BACKUP_KEY_BYTES];
        RANDOM.nextBytes(buffer);
        String base32 = stripPadding(BASE32.encodeToString(buffer));
        String normalized = base32.replaceAll("\\s+", "");
        if (normalized.length() < 16) {
            normalized = (normalized + normalized).substring(0, 16);
        }
        return normalized.substring(0, 4) + "-" +
                normalized.substring(4, 8) + "-" +
                normalized.substring(8, 12) + "-" +
                normalized.substring(12, 16);
    }

    public static String generateSmsCode() {
        int value = RANDOM.nextInt(OTP_MODULUS);
        return String.format("%0" + OTP_DIGITS + "d", value);
    }

    private static byte[] decodeSecret(String secret) {
        return BASE32.decode(secret.replaceAll("\\s+", "").toUpperCase());
    }

    private static int generateCodeInternal(byte[] secret, long timeWindow) {
        ByteBuffer buffer = ByteBuffer.allocate(Long.BYTES);
        buffer.putLong(timeWindow);
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            byte[] hash = mac.doFinal(buffer.array());
            int offset = hash[hash.length - 1] & 0x0f;
            int truncated =
                    ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            return truncated % OTP_MODULUS;
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to calculate TOTP code", e);
        }
    }

    private static String stripPadding(String value) {
        return value.replace("=", "");
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8)
                .replace("+", "%20");
    }
}
