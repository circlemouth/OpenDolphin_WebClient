package open.dolphin.touch;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Locale;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.rest.LogFilter;

/**
 * Centralised facility authorization helper for Touch endpoints.
 */
@ApplicationScoped
public class TouchAuthHandler {

    public static final String FACILITY_HEADER = "X-Facility-Id";

    private static final Logger LOGGER = Logger.getLogger(TouchAuthHandler.class.getName());
    private static final String ANONYMOUS_PRINCIPAL = "anonymous";
    private static final String HEADER_USER_NAME = "userName";
    private static final String LEGACY_FACILITY_HEADER = "facilityId";
    private static final String AUTH_CHALLENGE = "Basic realm=\"OpenDolphin\"";

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
            throw failure(Response.Status.BAD_REQUEST, endpoint, "missing X-Facility-Id header");
        }
        String remoteFacilityRaw = resolveRemoteFacility(request);
        String remoteFacility = normalize(remoteFacilityRaw);
        if (remoteFacility != null && !remoteFacility.equals(headerValue)) {
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
            throw failure(Response.Status.UNAUTHORIZED, endpoint,
                    () -> "remote facility unavailable for facility=" + facilityId);
        }
        if (remoteFacility != null && expected != null && !remoteFacility.equals(expected)) {
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

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
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
}
