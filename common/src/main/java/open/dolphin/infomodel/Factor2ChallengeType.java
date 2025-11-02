package open.dolphin.infomodel;

/**
 * 二段階認証のチャレンジ種別。
 */
public enum Factor2ChallengeType {

    /** FIDO2 の登録チャレンジ。 */
    FIDO2_REGISTRATION,

    /** FIDO2 の認証チャレンジ。 */
    FIDO2_ASSERTION
}
