package open.dolphin.mbean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class KanaToAsciiTest {

    @Test
    void convertsKanaToExpectedAscii() {
        KanaToAscii converter = new KanaToAscii();
        String result = converter.CHGKanatoASCII("フナバシ ケンジ", "");
        assertEquals("FUNABASHI KENJI", result);
    }

    @Test
    void resultIsUsAsciiCompatible() {
        KanaToAscii converter = new KanaToAscii();
        String result = converter.CHGKanatoASCII("ドウクツ ピカソ", "");
        byte[] asciiBytes = result.getBytes(StandardCharsets.US_ASCII);
        assertEquals(result, new String(asciiBytes, StandardCharsets.US_ASCII));
        assertTrue(result.chars().allMatch(c -> c < 0x80));
    }
}
