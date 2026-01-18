package open.dolphin.touch.support;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.rest.LogFilter;
import open.dolphin.rest.AbstractResource;

/**
 * {@link HttpServletRequest} から Touch 系 API に必要な文脈情報を抽出する。
 */
public final class TouchRequestContextExtractor {

    public static final String HEADER_ACCESS_REASON = "X-Access-Reason";
    public static final String HEADER_CONSENT_TOKEN = "X-Consent-Token";
    public static final String HEADER_TRACE_ID = "X-Trace-Id";
    public static final String HEADER_REQUEST_ID = "X-Request-Id";
    private static final String ATTRIBUTE_TRACE_ID = LogFilter.TRACE_ID_ATTRIBUTE;
    private static final String HEADER_FACILITY = "X-Facility-Id";
    private static final String ANONYMOUS_PRINCIPAL = "anonymous";

    private TouchRequestContextExtractor() {
    }

    public static TouchRequestContext from(HttpServletRequest request) {
        RemoteIdentity identity = resolveRemoteIdentity(request);

        String traceId = resolveTraceId(request);
        String requestId = resolveRequestId(request);
        String accessReason = normalise(request.getHeader(HEADER_ACCESS_REASON));
        String consentToken = normalise(request.getHeader(HEADER_CONSENT_TOKEN));

        String clientIp = resolveClientIp(request);
        String userAgent = normalise(request.getHeader("User-Agent"));

        return new TouchRequestContext(identity.remoteUser(), identity.facilityId(), identity.userId(),
                traceId, requestId, accessReason, consentToken, clientIp, userAgent);
    }

    private static RemoteIdentity resolveRemoteIdentity(HttpServletRequest request) {
        String remoteCandidate = sanitizePrincipal(normalise(request.getRemoteUser()));
        Map<String, Object> context = new HashMap<>();
        context.put("remoteCandidate", remoteCandidate);

        if (remoteCandidate == null) {
            throw identityError(request, Response.Status.UNAUTHORIZED, "remote_user_missing",
                    "Remote user is not available.", context);
        }

        int separator = remoteCandidate.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator < 0) {
            context.put("remoteUser", remoteCandidate);
            throw identityError(request, Response.Status.UNAUTHORIZED, "remote_user_missing_separator",
                    "Remote user does not contain facility separator.", context);
        }

        String facilityId = remoteCandidate.substring(0, separator);
        String userId = separator + 1 < remoteCandidate.length() ? remoteCandidate.substring(separator + 1) : null;

        String headerFacility = resolveFacilityHeader(request);
        context.put("facilityHeader", headerFacility);

        if (facilityId == null || facilityId.isBlank()) {
            facilityId = headerFacility;
        }

        if (facilityId == null || facilityId.isBlank() || userId == null || userId.isBlank()) {
            context.put("remoteUser", remoteCandidate);
            context.put("facilityId", facilityId);
            context.put("userId", userId);
            throw identityError(request, Response.Status.UNAUTHORIZED, "remote_user_incomplete",
                    "Remote user is not available.", context);
        }

        return new RemoteIdentity(facilityId + IInfoModel.COMPOSITE_KEY_MAKER + userId, facilityId, userId);
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
        return UUID.randomUUID().toString();
    }

    private static String resolveRequestId(HttpServletRequest request) {
        String fromHeader = normalise(request.getHeader(HEADER_REQUEST_ID));
        if (fromHeader != null) {
            return fromHeader;
        }
        return UUID.randomUUID().toString();
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = normalise(request.getHeader("X-Forwarded-For"));
        if (forwarded != null) {
            int comma = forwarded.indexOf(',');
            return comma >= 0 ? forwarded.substring(0, comma).trim() : forwarded;
        }
        return Optional.ofNullable(request.getRemoteAddr()).orElse("unknown");
    }

    private static String sanitizePrincipal(String principal) {
        if (principal == null || ANONYMOUS_PRINCIPAL.equalsIgnoreCase(principal)) {
            return null;
        }
        return principal;
    }

    private static String resolveFacilityHeader(HttpServletRequest request) {
        return normalise(request.getHeader(HEADER_FACILITY));
    }

    private static String normalise(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record RemoteIdentity(String remoteUser, String facilityId, String userId) {
    }

    private static WebApplicationException identityError(HttpServletRequest request, Response.Status status,
            String errorCode, String message, Map<String, Object> details) {
        TouchAuditEvents.recordIdentityFailure(request, status, errorCode, message, details);
        return AbstractResource.restError(request, status, errorCode, message, details, null);
    }
}

