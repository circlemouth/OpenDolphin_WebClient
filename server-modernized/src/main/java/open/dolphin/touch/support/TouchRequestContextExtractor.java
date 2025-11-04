package open.dolphin.touch.support;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import open.dolphin.infomodel.IInfoModel;

/**
 * {@link HttpServletRequest} から Touch 系 API に必要な文脈情報を抽出する。
 */
public final class TouchRequestContextExtractor {

    public static final String HEADER_ACCESS_REASON = "X-Access-Reason";
    public static final String HEADER_CONSENT_TOKEN = "X-Consent-Token";
    public static final String HEADER_TRACE_ID = "X-Trace-Id";
    public static final String HEADER_CLIENT_UUID = "clientUUID";
    private static final String ATTRIBUTE_TRACE_ID = LogFilterTraceIdHolder.TRACE_ID_ATTRIBUTE;

    private TouchRequestContextExtractor() {
    }

    public static TouchRequestContext from(HttpServletRequest request) {
        String remoteUser = Optional.ofNullable(request.getRemoteUser())
                .orElseThrow(() -> new IllegalStateException("Remote user is not available."));

        int separator = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator < 0) {
            throw new IllegalStateException("Remote user does not contain facility separator.");
        }
        String facilityId = remoteUser.substring(0, separator);
        String userId = remoteUser.substring(separator + 1);

        String traceId = resolveTraceId(request);
        String accessReason = normalise(request.getHeader(HEADER_ACCESS_REASON));
        String consentToken = normalise(request.getHeader(HEADER_CONSENT_TOKEN));

        String clientIp = resolveClientIp(request);
        String userAgent = normalise(request.getHeader("User-Agent"));

        return new TouchRequestContext(remoteUser, facilityId, userId, traceId, accessReason, consentToken, clientIp, userAgent);
    }

    private static String resolveTraceId(HttpServletRequest request) {
        Object fromAttribute = request.getAttribute(ATTRIBUTE_TRACE_ID);
        if (fromAttribute instanceof String trace && !trace.isBlank()) {
            return trace;
        }
        String fromHeader = normalise(request.getHeader(HEADER_TRACE_ID));
        if (fromHeader != null) {
            return fromHeader;
        }
        return java.util.UUID.randomUUID().toString();
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = normalise(request.getHeader("X-Forwarded-For"));
        if (forwarded != null) {
            int comma = forwarded.indexOf(',');
            return comma >= 0 ? forwarded.substring(0, comma).trim() : forwarded;
        }
        return Optional.ofNullable(request.getRemoteAddr()).orElse("unknown");
    }

    private static String normalise(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * {@link open.dolphin.rest.LogFilter} が request attribute に設定する TraceId を参照するためのホルダー。
     */
    private static final class LogFilterTraceIdHolder {
        private static final String TRACE_ID_ATTRIBUTE = open.dolphin.rest.LogFilter.class.getName() + ".TRACE_ID";

        private LogFilterTraceIdHolder() {
        }
    }
}

