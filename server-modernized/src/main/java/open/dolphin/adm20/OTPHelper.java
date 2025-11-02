package open.dolphin.adm20;

import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Base32;

/**
 *
 * @author kazushi Minagawa
 */
public class OTPHelper {

    private static final int SECRET_SIZE = 20;
    private static final int OTP_DIGITS = 6;
    private static final int TOLERANCE_WINDOWS = 1;

    public long getOTP() {
        try {
            String secret = generateSecret();
            return generateCode(secret, getTimeIndex());
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            Logger.getLogger(OTPHelper.class.getName()).log(Level.SEVERE, null, ex);
        }
        return 0L;
    }
    
    //--------------------------------------------------------------------------
    // Google Authenticator thus enabled
    // https://weblogs.java.net/blog/evanx/archive/2012/11/07/google-authenticator-thus-enabled
    // Evan Summers
    //--------------------------------------------------------------------------
    private long getTimeIndex() {
        return System.currentTimeMillis()/1000/30;
    }

    public String generateSecret() {
        byte[] buffer = new byte[SECRET_SIZE];
        new SecureRandom().nextBytes(buffer);
        return new String(new Base32().encode(buffer));
    }

    public long generateCode(String secret, long timeIndex) throws NoSuchAlgorithmException, InvalidKeyException {
        byte[] secretBytes = new Base32().decode(secret);
        return getCode(secretBytes, timeIndex);
    }

    private long getCode(byte[] secret, long timeIndex) throws NoSuchAlgorithmException, InvalidKeyException {
        SecretKeySpec signKey = new SecretKeySpec(secret, "HmacSHA1");
        ByteBuffer buffer = ByteBuffer.allocate(8);
        buffer.putLong(timeIndex);
        byte[] timeBytes = buffer.array();
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(signKey);
        byte[] hash = mac.doFinal(timeBytes);
        int offset = hash[19] & 0xf;
        long truncatedHash = hash[offset] & 0x7f;
        for (int i = 1; i < 4; i++) {
            truncatedHash <<= 8;
            truncatedHash |= hash[offset + i] & 0xff;
        }
        long mod = (long) Math.pow(10, OTP_DIGITS);
        return (truncatedHash %= mod);
    }

    public boolean verifyCode(String secret, int code, long timeIndex, int variance) throws Exception {
        byte[] secretBytes = new Base32().decode(secret);
        for (int i = -variance; i <= variance; i++) {
            if (getCode(secretBytes, timeIndex + i) == code) {
                return true;
            }
        }
        return false;
    }
    
    public String getBackupKey() {
        String secret = getSecret();
        StringBuilder sb = new StringBuilder();
        sb.append(secret.substring(0, 4)).append("-");
        sb.append(secret.substring(4, 8)).append("-");
        sb.append(secret.substring(8, 12)).append("-");
        sb.append(secret.substring(12, 16));
        return sb.toString();
    }

    public boolean verifyCurrentWindow(String secret, int code) {
        try {
            return verifyCode(secret, code, getTimeIndex(), TOLERANCE_WINDOWS);
        } catch (Exception ex) {
            Logger.getLogger(OTPHelper.class.getName()).log(Level.WARNING, "TOTP verification failed", ex);
            return false;
        }
    }

    public String buildProvisioningUri(String secret, String accountName, String issuer) {
        String encodedAccount = accountName == null ? "" : accountName.replace(" ", "%20");
        String encodedIssuer = issuer == null ? "" : issuer.replace(" ", "%20");
        StringBuilder builder = new StringBuilder("otpauth://totp/");
        if (!encodedIssuer.isEmpty()) {
            builder.append(encodedIssuer).append(":");
        }
        builder.append(encodedAccount);
        builder.append("?secret=").append(secret);
        builder.append("&digits=").append(OTP_DIGITS);
        builder.append("&period=30");
        if (!encodedIssuer.isEmpty()) {
            builder.append("&issuer=").append(encodedIssuer);
        }
        return builder.toString();
    }
}
