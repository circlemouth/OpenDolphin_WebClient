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

/**
 * Centralised facility authorization helper for Touch endpoints.
 */
@ApplicationScoped
public class TouchAuthHandler {

    public static final String FACILITY_HEADER = "X-Facility-Id";

    private static final Logger LOGGER = Logger.getLogger(TouchAuthHandler.class.getName());

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
        String remoteUser = request.getRemoteUser();
        if (remoteUser == null || remoteUser.isEmpty()) {
            LOGGER.log(Level.FINE, "Remote user not available for Touch request");
            return null;
        }
        int separator = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator <= 0) {
            LOGGER.log(Level.FINE, "Remote user does not contain facility separator: {0}", remoteUser);
            return null;
        }
        return remoteUser.substring(0, separator);
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
        Response response = Response.status(status)
                .type(MediaType.TEXT_PLAIN_TYPE)
                .entity(builder.toString())
                .build();
        return new WebApplicationException(response);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
    }
}
