package open.dolphin.adm20.rest.support;

import java.util.Objects;

/**
 * PHR 系 REST エンドポイントで利用するリクエストコンテキスト情報。
 */
public record PhrRequestContext(
        String remoteUser,
        String facilityId,
        String userId,
        String traceId,
        String clientIp,
        String userAgent,
        String requestUri,
        String requestId) {

    public PhrRequestContext {
        Objects.requireNonNull(remoteUser, "remoteUser must not be null");
        Objects.requireNonNull(facilityId, "facilityId must not be null");
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(traceId, "traceId must not be null");
        Objects.requireNonNull(clientIp, "clientIp must not be null");
        Objects.requireNonNull(requestUri, "requestUri must not be null");
        Objects.requireNonNull(requestId, "requestId must not be null");
    }
}
