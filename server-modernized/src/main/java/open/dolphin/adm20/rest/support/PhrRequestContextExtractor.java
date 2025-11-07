package open.dolphin.adm20.rest.support;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import open.dolphin.infomodel.IInfoModel;

/**
 * {@link HttpServletRequest} から {@link PhrRequestContext} を生成するユーティリティ。
 */
public final class PhrRequestContextExtractor {

    private static final String TRACE_ID_ATTRIBUTE = open.dolphin.rest.LogFilter.class.getName() + ".TRACE_ID";
    private static final String HEADER_TRACE_ID = "X-Trace-Id";
    private static final String HEADER_REQUEST_ID = "X-Request-Id";

    private PhrRequestContextExtractor() {
    }

    public static PhrRequestContext from(HttpServletRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        String remoteUser = Optional.ofNullable(request.getRemoteUser())
                .orElseThrow(() -> new IllegalStateException("Remote user is not available."));

        int separator = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator < 0) {
            throw new IllegalStateException("Remote user does not contain facility separator.");
        }
        String facilityId = remoteUser.substring(0, separator);
        String userId = remoteUser.substring(separator + 1);

        String traceId = resolveTraceId(request);
        String clientIp = resolveClientIp(request);
        String userAgent = Optional.ofNullable(request.getHeader("User-Agent")).orElse("unknown");
        String requestUri = Optional.ofNullable(request.getRequestURI()).orElse("/");
        String requestId = resolveRequestId(request);

        return new PhrRequestContext(remoteUser, facilityId, userId, traceId, clientIp, userAgent, requestUri, requestId);
    }

    private static String resolveTraceId(HttpServletRequest request) {
        Object attribute = request.getAttribute(TRACE_ID_ATTRIBUTE);
        if (attribute instanceof String trace && !trace.isBlank()) {
            return trace;
        }
        String header = request.getHeader(HEADER_TRACE_ID);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return comma >= 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        return Optional.ofNullable(request.getRemoteAddr()).orElse("unknown");
    }

    private static String resolveRequestId(HttpServletRequest request) {
        String header = request.getHeader(HEADER_REQUEST_ID);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }
}
