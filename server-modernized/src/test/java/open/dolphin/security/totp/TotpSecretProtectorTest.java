package open.dolphin.security.totp;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.SecureRandom;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TotpSecretProtectorTest {

    private TotpSecretProtector protector;

    @BeforeEach
    void setUp() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        protector = TotpSecretProtector.fromBase64(Base64.getEncoder().encodeToString(key));
    }

    @Test
    void encryptDecryptRoundTrip() {
        String plaintext = "OPEN-DOLPHIN-SECRET";
        String cipher = protector.encrypt(plaintext);
        assertThat(cipher).isNotBlank();

        String decrypted = protector.decrypt(cipher);
        assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    void encryptProducesDifferentCiphertextForSameInput() {
        String plaintext = "otp-secret";
        String first = protector.encrypt(plaintext);
        String second = protector.encrypt(plaintext);

        assertThat(first)
                .isNotBlank()
                .isNotEqualTo(second);
        assertThat(protector.decrypt(first)).isEqualTo(plaintext);
        assertThat(protector.decrypt(second)).isEqualTo(plaintext);
    }
}
