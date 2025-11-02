package open.dolphin.infomodel;

/**
 * 認証器の種別を区別する列挙体。
 */
public enum Factor2CredentialType {

    /**
     * タイムベースワンタイムパスワード認証器。
     */
    TOTP,

    /**
     * FIDO2 / WebAuthn ハードウェア認証器。
     */
    FIDO2
}
