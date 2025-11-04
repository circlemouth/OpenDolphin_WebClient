package open.dolphin.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 旧 Dolphin Touch 系 API で利用していた Base64 変換ロジックの置き換え版。
 * <p>
 * 既存クライアントはバイナリデータを MIME Base64 で受け取る想定のため、
 * {@link java.util.Base64} を利用しつつもレガシー API と同じエンコード結果を返す。
 */
public final class LegacyBase64 {

    private LegacyBase64() {
    }

    /**
     * バイト列を Base64 テキストへ変換する。
     *
     * @param bytes 元バイト列
     * @return Base64 エンコード済み文字列
     */
    public static String encode(byte[] bytes) {
        if (bytes == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(bytes);
    }

    /**
     * Base64 テキストを元のバイト列へ復元する。
     *
     * @param base64 Base64 文字列
     * @return 復元されたバイト列
     */
    public static byte[] decode(String base64) {
        if (base64 == null) {
            return null;
        }
        return Base64.getDecoder().decode(base64.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Base64 テキストを元のバイト列へ復元する（バイト列入力版）。
     *
     * @param base64 Base64 文字列のバイト配列
     * @return 復元されたバイト列
     */
    public static byte[] decode(byte[] base64) {
        if (base64 == null) {
            return null;
        }
        return Base64.getDecoder().decode(base64);
    }
}

