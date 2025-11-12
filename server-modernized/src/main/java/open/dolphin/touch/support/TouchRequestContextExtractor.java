package open.dolphin.touch.support;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.rest.LogFilter;

/**
 * {@link HttpServletRequest} から Touch 系 API に必要な文脈情報を抽出する。
 */
public final class TouchRequestContextExtractor {

    public static final String HEADER_ACCESS_REASON = "X-Access-Reason";
    public static final String HEADER_CONSENT_TOKEN = "X-Consent-Token";
    public static final String HEADER_TRACE_ID = "X-Trace-Id";
    public static final String HEADER_CLIENT_UUID = "clientUUID";
    private static final String ATTRIBUTE_TRACE_ID = LogFilter.TRACE_ID_ATTRIBUTE;
    private static final String HEADER_USER_NAME = "userName";
    private static final String HEADER_FACILITY_OVERRIDE = "X-Facility-Id";
    private static final String HEADER_FACILITY_ID = "facilityId";
    private static final String ANONYMOUS_PRINCIPAL = "anonymous";
    private static final Logger LOGGER = Logger.getLogger(TouchRequestContextExtractor.class.getName());

    private TouchRequestContextExtractor() {
    }

    public static TouchRequestContext from(HttpServletRequest request) {
        RemoteIdentity identity = resolveRemoteIdentity(request);

        String traceId = resolveTraceId(request);
        String accessReason = normalise(request.getHeader(HEADER_ACCESS_REASON));
        String consentToken = normalise(request.getHeader(HEADER_CONSENT_TOKEN));

        String clientIp = resolveClientIp(request);
        String userAgent = normalise(request.getHeader("User-Agent"));

        return new TouchRequestContext(identity.remoteUser(), identity.facilityId(), identity.userId(),
                traceId, accessReason, consentToken, clientIp, userAgent);
    }

    private static RemoteIdentity resolveRemoteIdentity(HttpServletRequest request) {
        String remoteCandidate = sanitizePrincipal(normalise(request.getRemoteUser()));
        String headerUser = normalise(request.getHeader(HEADER_USER_NAME));
        PathPrincipal pathPrincipal = extractPrincipalFromPath(request);
        String facilityHeader = firstNonBlank(resolveFacilityHeader(request), pathPrincipal.facilityId());

        String remoteUser = compositeOrNull(remoteCandidate);
        if (remoteUser == null) {
            remoteUser = compositeOrNull(headerUser);
        }

        if (remoteUser == null && facilityHeader != null) {
            String userSegment = firstNonBlank(
                    extractUserSegment(remoteCandidate),
                    extractUserSegment(headerUser),
                    pathPrincipal.userId());
            if (userSegment != null) {
                remoteUser = facilityHeader + IInfoModel.COMPOSITE_KEY_MAKER + userSegment;
                logFallback("Synthesised remote user from facility header", facilityHeader, userSegment);
            }
        }

        if (remoteUser == null) {
            remoteUser = firstNonBlank(remoteCandidate, headerUser, pathPrincipal.userId());
        }

        if (remoteUser == null) {
            throw new IllegalStateException("Remote user is not available.");
        }

        int separator = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator < 0) {
            if (facilityHeader != null) {
                remoteUser = facilityHeader + IInfoModel.COMPOSITE_KEY_MAKER + remoteUser;
                separator = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
                logFallback("Augmented remote user with facility header", facilityHeader, remoteUser);
            } else {
                throw new IllegalStateException("Remote user does not contain facility separator.");
            }
        }

        String facilityId = remoteUser.substring(0, separator);
        String userId = separator + 1 < remoteUser.length() ? remoteUser.substring(separator + 1) : null;

        if ((facilityId == null || facilityId.isBlank()) && facilityHeader != null) {
            facilityId = facilityHeader;
            remoteUser = facilityHeader + IInfoModel.COMPOSITE_KEY_MAKER + (userId != null ? userId : "");
            logFallback("Replaced facility from header", facilityHeader, remoteUser);
        }

        if (userId == null || userId.isBlank()) {
            userId = firstNonBlank(
                    extractUserSegment(remoteCandidate),
                    extractUserSegment(headerUser),
                    pathPrincipal.userId());
            if (userId != null && facilityId != null) {
                remoteUser = facilityId + IInfoModel.COMPOSITE_KEY_MAKER + userId;
            }
        }

        if (facilityId == null || facilityId.isBlank() || userId == null || userId.isBlank()) {
            throw new IllegalStateException("Remote user is not available.");
        }

        return new RemoteIdentity(remoteUser, facilityId, userId);
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

    private static String compositeOrNull(String candidate) {
        if (candidate == null) {
            return null;
        }
        return candidate.contains(IInfoModel.COMPOSITE_KEY_MAKER) ? candidate : null;
    }

    private static String extractUserSegment(String candidate) {
        if (candidate == null) {
            return null;
        }
        int separator = candidate.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator >= 0 && separator + 1 < candidate.length()) {
            return candidate.substring(separator + 1);
        }
        return candidate;
    }

    private static String resolveFacilityHeader(HttpServletRequest request) {
        String override = normalise(request.getHeader(HEADER_FACILITY_OVERRIDE));
        if (override != null) {
            return override;
        }
        return normalise(request.getHeader(HEADER_FACILITY_ID));
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static void logFallback(String message, String facilityId, String detail) {
        if (LOGGER.isLoggable(Level.FINE)) {
            LOGGER.log(Level.FINE, "{0}: facility={1}, detail={2}",
                    new Object[]{message, facilityId, detail});
        }
    }

    private static PathPrincipal extractPrincipalFromPath(HttpServletRequest request) {
        if (request == null) {
            return PathPrincipal.EMPTY;
        }
        String uri = normalise(request.getRequestURI());
        if (uri == null) {
            return PathPrincipal.EMPTY;
        }
        int question = uri.indexOf('?');
        if (question >= 0) {
            uri = uri.substring(0, question);
        }
        int idx = uri.lastIndexOf('/');
        if (idx < 0 || idx + 1 >= uri.length()) {
            return PathPrincipal.EMPTY;
        }
        String candidate = uri.substring(idx + 1);
        if (!candidate.contains(",")) {
            return PathPrincipal.EMPTY;
        }
        String[] parts = candidate.split(",");
        if (parts.length < 2) {
            return PathPrincipal.EMPTY;
        }
        String userSegment = normalise(parts[0]);
        String facilitySegment = normalise(parts[1]);
        return new PathPrincipal(facilitySegment, userSegment);
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

    private record PathPrincipal(String facilityId, String userId) {
        private static final PathPrincipal EMPTY = new PathPrincipal(null, null);
    }
}

