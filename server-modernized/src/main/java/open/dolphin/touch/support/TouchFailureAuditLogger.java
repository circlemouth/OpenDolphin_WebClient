package open.dolphin.touch.support;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.AbstractResource;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;

/**
 * Touch 系 API で発生する未認証/未承認経路の監査ログをまとめて処理するロガー。
 */
@ApplicationScoped
public class TouchFailureAuditLogger {

    private static final Logger LOGGER = Logger.getLogger(TouchFailureAuditLogger.class.getName());
    private static final String ACTION_IDENTITY_GUARD = "TOUCH_IDENTITY_GUARD";
    private static final String ACTION_AUTH_GUARD = "TOUCH_AUTH_GUARD";

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    private AuditTrailService auditTrailService;

    @Inject
    private SessionTraceManager sessionTraceManager;

    public void recordIdentityFailure(HttpServletRequest request,
                                      Response.Status status,
                                      String errorCode,
                                      String message,
                                      Map<String, Object> details) {
        recordFailure(request, ACTION_IDENTITY_GUARD, status, errorCode, message, details, resolvePrincipalCandidate(request));
    }

    public void recordAuthorizationFailure(HttpServletRequest request,
                                           String action,
                                           Response.Status status,
                                           String errorCode,
                                           String message,
                                           Map<String, Object> details,
                                           String principal) {
        String resolvedAction = action == null || action.isBlank() ? ACTION_AUTH_GUARD : action;
        recordFailure(request, resolvedAction, status, errorCode, message, details, principal);
    }

    private void recordFailure(HttpServletRequest request,
                               String action,
                               Response.Status status,
                               String errorCode,
                               String message,
                               Map<String, Object> details,
                               String principal) {
        if (sessionAuditDispatcher == null && auditTrailService == null) {
            LOGGER.fine(() -> "AuditTrail unavailable; skipping Touch failure audit for " + action);
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(action);
        payload.setResource(resolveResource(request));
        String actorId = principal == null || principal.isBlank() ? "anonymous" : principal;
        payload.setActorId(actorId);
        payload.setActorDisplayName(principal);
        payload.setActorRole("TOUCH");
        payload.setIpAddress(resolveClientIp(request));
        payload.setUserAgent(request != null ? request.getHeader("User-Agent") : null);

        String traceId = AbstractResource.resolveTraceIdValue(request);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }
        payload.setRequestId(traceId);
        payload.setTraceId(traceId);

        Map<String, Object> enriched = new HashMap<>();
        enriched.put("status", "failed");
        if (details != null && !details.isEmpty()) {
            enriched.putAll(details);
        }
        if (status != null) {
            enriched.put("httpStatus", status.getStatusCode());
        }
        if (errorCode != null && !errorCode.isBlank()) {
            enriched.putIfAbsent("reason", errorCode);
        }
        if (message != null && !message.isBlank()) {
            enriched.putIfAbsent("errorMessage", message);
        }
        enrichFacility(enriched, request);
        attachTraceContext(enriched);
        payload.setDetails(enriched);

        if (sessionAuditDispatcher != null) {
            sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.FAILURE, errorCode, message);
        } else {
            auditTrailService.record(payload);
        }
    }

    private void attachTraceContext(Map<String, Object> details) {
        if (sessionTraceManager == null) {
            return;
        }
        SessionTraceContext trace = sessionTraceManager.current();
        if (trace == null) {
            return;
        }
        if (trace.getTraceId() != null) {
            details.putIfAbsent("traceId", trace.getTraceId());
        }
        if (trace.getOperation() != null) {
            details.putIfAbsent("sessionOperation", trace.getOperation());
        }
        String actorId = sessionTraceManager.getAttribute(SessionTraceAttributes.ACTOR_ID);
        if (actorId != null) {
            details.putIfAbsent("actorId", actorId);
        }
        String facilityId = sessionTraceManager.getAttribute(SessionTraceAttributes.FACILITY_ID);
        if (facilityId != null) {
            details.putIfAbsent("facilityId", facilityId);
        }
    }

    private void enrichFacility(Map<String, Object> details, HttpServletRequest request) {
        if (request == null) {
            return;
        }
        String header = firstNonBlank(request.getHeader("X-Facility-Id"), request.getHeader("facilityId"));
        if (header != null) {
            details.putIfAbsent("facilityId", header);
        }
    }

    private String resolveResource(HttpServletRequest request) {
        if (request == null) {
            return "/touch";
        }
        String uri = request.getRequestURI();
        return uri == null || uri.isBlank() ? "/touch" : uri;
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return comma >= 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }

    private String resolvePrincipalCandidate(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remote = sanitize(request.getRemoteUser());
        if (remote != null) {
            return remote;
        }
        return sanitize(request.getHeader("userName"));
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }
        return null;
    }
}
