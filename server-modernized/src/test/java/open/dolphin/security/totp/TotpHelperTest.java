package open.dolphin.security.totp;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class TotpHelperTest {

    private static final Pattern BASE32_PATTERN = Pattern.compile("^[A-Z2-7]+$");

    @Test
    void generateSecretProducesBase32WithoutPadding() {
        String secret = TotpHelper.generateSecret();
        assertThat(secret)
                .isNotBlank()
                .matches(BASE32_PATTERN);
    }

    @Test
    void verifyCurrentWindowAcceptsPlusMinusNinetySeconds() {
        String secret = TotpHelper.generateSecret();
        Instant now = Instant.now().with(java.time.temporal.ChronoField.MILLI_OF_SECOND, 0);

        int currentCode = TotpHelper.generateCode(secret, now);
        int minusNinety = TotpHelper.generateCode(secret, now.minusSeconds(90));
        int plusNinety = TotpHelper.generateCode(secret, now.plusSeconds(90));

        assertThat(TotpHelper.verifyCurrentWindow(secret, currentCode)).isTrue();
        assertThat(TotpHelper.verifyCurrentWindow(secret, minusNinety)).isTrue();
        assertThat(TotpHelper.verifyCurrentWindow(secret, plusNinety)).isTrue();
    }

    @Test
    void verifyCurrentWindowRejectsBeyondGracePeriod() {
        String secret = TotpHelper.generateSecret();
        Instant now = Instant.now().with(java.time.temporal.ChronoField.MILLI_OF_SECOND, 0);
        int codeBeyondWindow = TotpHelper.generateCode(secret, now.plusSeconds(120));

        assertThat(TotpHelper.verifyCurrentWindow(secret, codeBeyondWindow)).isFalse();
    }
}
