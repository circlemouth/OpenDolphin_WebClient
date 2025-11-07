package open.dolphin.security.totp;

/**
 * TOTP 登録開始時のレスポンス情報。
 */
public record TotpRegistrationResult(long credentialId, String secret, String provisioningUri) {
}
