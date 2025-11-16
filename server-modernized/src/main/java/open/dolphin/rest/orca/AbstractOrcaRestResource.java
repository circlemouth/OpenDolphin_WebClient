package open.dolphin.rest.orca;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.AbstractResource;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * Shared helpers for ORCA wrapper resources.
 */
public abstract class AbstractOrcaRestResource extends AbstractResource {

    protected static final String RUN_ID = "20251116T170500Z";

    @Inject
    protected SessionAuditDispatcher sessionAuditDispatcher;

    protected String requireRemoteUser(HttpServletRequest request) {
        if (request == null || request.getRemoteUser() == null || request.getRemoteUser().isBlank()) {
            throw restError(request, Response.Status.UNAUTHORIZED, "remote_user_missing", "Authenticated user is required");
        }
        return request.getRemoteUser();
    }

    protected String requireFacilityId(HttpServletRequest request) {
        String remote = request != null ? request.getRemoteUser() : null;
        String facilityId = getRemoteFacility(remote);
        if (facilityId == null || facilityId.isBlank()) {
            throw restError(request, Response.Status.UNAUTHORIZED, "facility_missing",
                    "Remote user must belong to a facility");
        }
        return facilityId;
    }

    protected void recordAudit(HttpServletRequest request, String action, Map<String, Object> details,
            AuditEventEnvelope.Outcome outcome) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(action);
        payload.setResource(request != null ? request.getRequestURI() : "/orca");
        payload.setActorId(request != null ? request.getRemoteUser() : null);
        payload.setIpAddress(request != null ? request.getRemoteAddr() : null);
        payload.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
        payload.setDetails(details != null ? new HashMap<>(details) : Map.of());
        sessionAuditDispatcher.record(payload, outcome, null, null);
    }

    protected WebApplicationException validationError(HttpServletRequest request, String field, String message) {
        Map<String, Object> details = new HashMap<>();
        details.put("field", field);
        return restError(request, Response.Status.BAD_REQUEST, "invalid_request", message, details, null);
    }
}
