package open.dolphin.security.totp;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

/**
 * バックアップコードを生成するユーティリティ。
 */
public class BackupCodeGenerator {

    private static final String DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int CODE_LENGTH = 10;

    private final SecureRandom secureRandom = new SecureRandom();

    public List<String> generateCodes(int count) {
        List<String> result = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            result.add(generateCode());
        }
        return result;
    }

    private String generateCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH + 2);
        for (int i = 0; i < CODE_LENGTH; i++) {
            if (i > 0 && i % 5 == 0) {
                builder.append('-');
            }
            int index = secureRandom.nextInt(DIGITS.length());
            builder.append(DIGITS.charAt(index));
        }
        return builder.toString();
    }
}
