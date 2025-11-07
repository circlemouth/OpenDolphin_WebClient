package open.dolphin.common;

import static org.junit.Assert.assertEquals;

import java.nio.charset.StandardCharsets;
import org.apache.commons.codec.binary.Base64;
import org.junit.Test;

public class OrcaApiEncodingTest {

    @Test
    public void basicAuthHeaderUsesUtf8() {
        String credentials = "user:パスワード";
        byte[] encoded = Base64.encodeBase64(credentials.getBytes(StandardCharsets.UTF_8));
        assertEquals("dXNlcjrjg5Hjgrnjg6/jg7zjg4k=", new String(encoded, StandardCharsets.UTF_8));
    }
}
