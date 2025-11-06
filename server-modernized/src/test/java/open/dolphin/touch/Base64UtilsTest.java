package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.nio.charset.StandardCharsets;
import open.dolphin.util.LegacyBase64;
import org.junit.jupiter.api.Test;

class Base64UtilsTest {

    @Test
    void encodeMatchesLegacyBase64() throws Exception {
        byte[] source = "診療情報".getBytes(StandardCharsets.UTF_8);
        byte[] encoded = Base64Utils.encode(source);

        String expected = LegacyBase64.encode(source);
        assertEquals(expected, new String(encoded, StandardCharsets.UTF_8));
    }

    @Test
    void decodeReversesEncoding() throws Exception {
        byte[] original = "カルテPDF".getBytes(StandardCharsets.UTF_8);
        byte[] encoded = Base64Utils.encode(original);
        assertArrayEquals(original, Base64Utils.decode(encoded));
    }
}
