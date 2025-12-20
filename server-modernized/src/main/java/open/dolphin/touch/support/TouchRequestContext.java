package open.dolphin.touch.support;

import java.util.Objects;

/**
 * Touch 系 API で共通利用するリクエストコンテキスト情報。
 */
public record TouchRequestContext(
        String remoteUser,
        String facilityId,
        String userId,
        String traceId,
        String requestId,
        String accessReason,
        String consentToken,
        String clientIp,
        String userAgent) {

    public TouchRequestContext {
        Objects.requireNonNull(remoteUser, "remoteUser must not be null");
        Objects.requireNonNull(facilityId, "facilityId must not be null");
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(traceId, "traceId must not be null");
        Objects.requireNonNull(requestId, "requestId must not be null");
        Objects.requireNonNull(clientIp, "clientIp must not be null");
    }

    public boolean hasConsentToken() {
        return consentToken != null && !consentToken.isBlank();
    }
}

