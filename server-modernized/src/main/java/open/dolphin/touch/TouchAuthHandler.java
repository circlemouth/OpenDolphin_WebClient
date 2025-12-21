package open.dolphin.touch;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.rest.LogFilter;
import open.dolphin.touch.support.TouchFailureAuditLogger;

/**
 * Centralised facility authorization helper for Touch endpoints.
 */
@ApplicationScoped
public class TouchAuthHandler {

    public static final String FACILITY_HEADER = "X-Facility-Id";
    public static final String USER_NAME_HEADER = "userName";
    public static final String PASSWORD_HEADER = "password";
    public static final String CLIENT_UUID_HEADER = "clientUUID";
    public static final String ACCESS_REASON_HEADER = "X-Access-Reason";
    public static final String CONSENT_TOKEN_HEADER = "X-Consent-Token";
    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String DEVICE_ID_HEADER = "X-Device-Id";
    public static final String DEMO_MODE_HEADER = "X-Demo-Mode";

    private static final Logger LOGGER = Logger.getLogger(TouchAuthHandler.class.getName());
    private static final String ANONYMOUS_PRINCIPAL = "anonymous";
    private static final String LEGACY_FACILITY_HEADER = "facilityId";
    private static final String AUTH_CHALLENGE = "Basic realm=\"OpenDolphin\"";
    private static final String HEADER_USER_NAME = USER_NAME_HEADER;

    public static final HeaderRequirement REQUIRED_USER_NAME =
            new HeaderRequirement(USER_NAME_HEADER, Response.Status.UNAUTHORIZED, "missing_user_name", "missing userName header");
    public static final HeaderRequirement REQUIRED_PASSWORD =
            new HeaderRequirement(PASSWORD_HEADER, Response.Status.UNAUTHORIZED, "missing_password", "missing password header");
    public static final HeaderRequirement REQUIRED_CLIENT_UUID =
            new HeaderRequirement(CLIENT_UUID_HEADER, Response.Status.BAD_REQUEST, "missing_client_uuid", "missing clientUUID header");
    public static final HeaderRequirement REQUIRED_DEVICE_ID =
            new HeaderRequirement(DEVICE_ID_HEADER, Response.Status.BAD_REQUEST, "missing_device_id", "missing X-Device-Id header");
    public static final HeaderRequirement REQUIRED_ACCESS_REASON =
            new HeaderRequirement(ACCESS_REASON_HEADER, Response.Status.FORBIDDEN, "access_reason_required", "missing X-Access-Reason header");
    public static final HeaderRequirement REQUIRED_CONSENT_TOKEN =
            new HeaderRequirement(CONSENT_TOKEN_HEADER, Response.Status.FORBIDDEN, "consent_token_required", "missing X-Consent-Token header");
    public static final HeaderRequirement REQUIRED_TRACE_ID =
            new HeaderRequirement(TRACE_ID_HEADER, Response.Status.BAD_REQUEST, "missing_trace_id", "missing X-Trace-Id header");

    @Inject
    TouchFailureAuditLogger failureAuditLogger;

    /**
     * Ensures the X-Facility-Id header is present and matches the authenticated user.
     *
     * @param request  inbound request
     * @param endpoint endpoint label for diagnostics
     * @return resolved facility id
     */
    public String requireFacilityHeader(HttpServletRequest request, String endpoint) {
        Objects.requireNonNull(request, "request must not be null");
        String headerValue = normalize(request.getHeader(FACILITY_HEADER));
        if (headerValue == null) {
            recordAuthorizationFailure(request, endpoint, Response.Status.BAD_REQUEST,
                    "missing_facility_header",
                    Map.of("headerFacility", null));
            throw failure(Response.Status.BAD_REQUEST, endpoint, "missing X-Facility-Id header");
        }
        String remoteFacilityRaw = resolveRemoteFacility(request);
        String remoteFacility = normalize(remoteFacilityRaw);
        if (remoteFacility != null && !remoteFacility.equals(headerValue)) {
            Map<String, Object> details = new HashMap<>();
            details.put("headerFacility", headerValue);
            details.put("remoteFacility", remoteFacilityRaw);
            recordAuthorizationFailure(request, endpoint, Response.Status.FORBIDDEN,
                    "facility_mismatch_header", details);
            throw failure(Response.Status.FORBIDDEN, endpoint,
                    () -> "facility mismatch header=" + headerValue + " remote=" + remoteFacilityRaw);
        }
        return headerValue;
    }

    /**
     * Validates that the current remote user belongs to the provided facility.
     *
     * @param request     inbound request
     * @param facilityId  facility to verify
     * @param endpoint    endpoint label for diagnostics
     */
    public void verifyFacilityOwnership(HttpServletRequest request, String facilityId, String endpoint) {
        if (facilityId == null || facilityId.isEmpty()) {
            return;
        }
        String remoteFacilityRaw = resolveRemoteFacility(request);
        String remoteFacility = normalize(remoteFacilityRaw);
        String expected = normalize(facilityId);
        if (remoteFacility == null) {
            recordAuthorizationFailure(request, endpoint, Response.Status.UNAUTHORIZED,
                    "remote_facility_missing",
                    Map.of("facilityId", facilityId));
            throw failure(Response.Status.UNAUTHORIZED, endpoint,
                    () -> "remote facility unavailable for facility=" + facilityId);
        }
        if (remoteFacility != null && expected != null && !remoteFacility.equals(expected)) {
            Map<String, Object> details = new HashMap<>();
            details.put("expectedFacility", expected);
            details.put("remoteFacility", remoteFacilityRaw);
            details.put("facilityId", facilityId);
            recordAuthorizationFailure(request, endpoint, Response.Status.FORBIDDEN,
                    "facility_mismatch_remote", details);
            throw failure(Response.Status.FORBIDDEN, endpoint,
                    () -> "facility mismatch expected=" + expected + " remote=" + remoteFacilityRaw);
        }
    }

    /**
     * Resolves the facility id from the authenticated principal if possible.
     *
     * @param request inbound request
     * @return facility id or {@code null}
     */
    public String resolveRemoteFacility(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteUser = sanitizeRemoteUser(request.getRemoteUser());
        if (remoteUser == null) {
            remoteUser = sanitizeRemoteUser(request.getHeader(HEADER_USER_NAME));
        }
        if (remoteUser != null) {
            int separator = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
            if (separator > 0) {
                return remoteUser.substring(0, separator);
            }
            LOGGER.log(Level.FINE, "Remote user does not contain facility separator: {0}", remoteUser);
        } else {
            LOGGER.log(Level.FINE, "Remote user not available for Touch request");
        }
        String fallback = resolveFacilityHeader(request);
        if (fallback != null) {
            logFacilityFallback(request, fallback);
        }
        return fallback;
    }

    public void requireHeaders(HttpServletRequest request, String endpoint, HeaderRequirement... requirements) {
        if (requirements == null || requirements.length == 0) {
            return;
        }
        for (HeaderRequirement requirement : requirements) {
            if (requirement == null) {
                continue;
            }
            requireHeaderValue(request, endpoint, requirement);
        }
    }

    public String requireHeaderValue(HttpServletRequest request, String endpoint, HeaderRequirement requirement) {
        Objects.requireNonNull(requirement, "requirement must not be null");
        String headerName = requirement.headerName();
        String value = readHeader(request, headerName);
        if (value == null) {
            recordAuthorizationFailure(request, endpoint, requirement.status(),
                    requirement.errorCode(),
                    Map.of("missingHeader", headerName));
            throw failure(requirement.status(), endpoint,
                    requirement.message() != null ? requirement.message() : ("missing " + headerName + " header"));
        }
        return value;
    }

    private WebApplicationException failure(Response.Status status, String endpoint, String message) {
        return failure(status, endpoint, () -> message);
    }

    private WebApplicationException failure(Response.Status status, String endpoint, java.util.function.Supplier<String> details) {
        StringBuilder builder = new StringBuilder();
        builder.append(Objects.requireNonNullElse(status, Response.Status.INTERNAL_SERVER_ERROR).getStatusCode());
        builder.append(' ').append(endpoint != null ? endpoint : "unknown-endpoint");
        String detail = details != null ? details.get() : null;
        if (detail != null && !detail.isEmpty()) {
            builder.append(" : ").append(detail);
        }
        if (LOGGER.isLoggable(Level.FINE)) {
            LOGGER.fine(builder.toString());
        }
        Response.ResponseBuilder responseBuilder = Response.status(status)
                .type(MediaType.TEXT_PLAIN_TYPE)
                .entity(builder.toString());
        if (Response.Status.UNAUTHORIZED.equals(status)) {
            responseBuilder.header("WWW-Authenticate", AUTH_CHALLENGE);
        }
        Response response = responseBuilder.build();
        return new WebApplicationException(response);
    }

    private void recordAuthorizationFailure(HttpServletRequest request,
                                            String endpoint,
                                            Response.Status status,
                                            String errorCode,
                                            Map<String, Object> details) {
        if (failureAuditLogger == null) {
            return;
        }
        Map<String, Object> enriched = new HashMap<>();
        if (details != null) {
            enriched.putAll(details);
        }
        if (endpoint != null) {
            enriched.put("endpoint", endpoint);
        }
        String principal = sanitizeRemoteUser(request != null ? request.getRemoteUser() : null);
        if (principal == null && request != null) {
            principal = sanitizeRemoteUser(request.getHeader(HEADER_USER_NAME));
        }
        failureAuditLogger.recordAuthorizationFailure(request, endpoint, status, errorCode, null, enriched, principal);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private String readHeader(HttpServletRequest request, String headerName) {
        if (request == null || headerName == null) {
            return null;
        }
        String value = request.getHeader(headerName);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveFacilityHeader(HttpServletRequest request) {
        String value = normalize(request.getHeader(FACILITY_HEADER));
        if (value != null) {
            return value;
        }
        return normalize(request.getHeader(LEGACY_FACILITY_HEADER));
    }

    private String sanitizeRemoteUser(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty() || ANONYMOUS_PRINCIPAL.equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private void logFacilityFallback(HttpServletRequest request, String facilityId) {
        if (!LOGGER.isLoggable(Level.FINE)) {
            return;
        }
        Object traceId = request != null ? request.getAttribute(LogFilter.TRACE_ID_ATTRIBUTE) : null;
        LOGGER.log(Level.FINE, "Fallback facility header detected: {0}, traceId={1}",
                new Object[]{facilityId, traceId});
    }

    public record HeaderRequirement(String headerName,
                                    Response.Status status,
                                    String errorCode,
                                    String message) {
    }
}
