package open.dolphin.touch;

import open.dolphin.util.LegacyBase64;

/**
 *
 * @author kazushi Minagawa, Digital Globe, Inc.
 */
@Deprecated(forRemoval = true)
public class Base64Utils {

    public static byte[] encode(byte[] b) throws Exception {
        String encoded = LegacyBase64.encode(b);
        return encoded != null ? encoded.getBytes() : null;
    }

    public static byte[] decode(byte[] b) throws Exception {
        return LegacyBase64.decode(b);
    }
}
