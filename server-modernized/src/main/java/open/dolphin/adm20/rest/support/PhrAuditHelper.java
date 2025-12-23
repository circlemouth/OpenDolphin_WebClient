package open.dolphin.adm20.rest.support;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;

/**
 * PHR 系 API の監査ログ出力を補助するヘルパー。
 */
@ApplicationScoped
public class PhrAuditHelper {

    @Inject
    AuditTrailService auditTrailService;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    SessionTraceManager sessionTraceManager;

    public void recordSuccess(PhrRequestContext context,
                              String action,
                              String patientId,
                              Map<String, Object> additionalDetails) {
        record(context, action, patientId, "success", null, additionalDetails);
    }

    public void recordFailure(PhrRequestContext context,
                              String action,
                              String patientId,
                              String reason,
                              Map<String, Object> additionalDetails) {
        record(context, action, patientId, "failed", reason, additionalDetails);
    }

    private void record(PhrRequestContext context,
                        String action,
                        String patientId,
                        String status,
                        String reason,
                        Map<String, Object> additionalDetails) {
        if (sessionAuditDispatcher == null && auditTrailService == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        Map<String, Object> details = buildDetails(context, status, reason, additionalDetails);
        attachTraceDetails(details, context);
        if (context != null) {
            payload.setActorId(context.remoteUser());
            payload.setActorDisplayName(context.userId());
            payload.setAction(action);
            payload.setResource(context.requestUri());
            payload.setRequestId(context.requestId());
            payload.setTraceId(context.traceId());
            payload.setIpAddress(context.clientIp());
            payload.setUserAgent(context.userAgent());
            payload.setPatientId(patientId);
        } else {
            payload.setAction(action);
            payload.setResource("/20/adm/phr");
            applyActorFromDetails(payload, details);
        }
        payload.setDetails(details);
        ensureTraceIdentifiers(payload, details);
        dispatch(payload, status, reason);
    }

    private void dispatch(AuditEventPayload payload, String status, String reason) {
        if (sessionAuditDispatcher != null) {
            AuditEventEnvelope.Outcome outcome = "failed".equalsIgnoreCase(status)
                    ? AuditEventEnvelope.Outcome.FAILURE
                    : AuditEventEnvelope.Outcome.SUCCESS;
            sessionAuditDispatcher.record(payload, outcome, reason, null);
        } else if (auditTrailService != null) {
            auditTrailService.record(payload);
        }
    }

    private void ensureTraceIdentifiers(AuditEventPayload payload, Map<String, Object> details) {
        if (payload.getRequestId() == null || payload.getRequestId().isBlank()) {
            payload.setRequestId(payload.getTraceId());
        }
        if (payload.getTraceId() == null || payload.getTraceId().isBlank()) {
            Object trace = details != null ? details.get("traceId") : null;
            if (trace instanceof String traceId && !traceId.isBlank()) {
                payload.setTraceId(traceId);
            } else {
                payload.setTraceId(payload.getRequestId());
            }
        }
    }

    private void applyActorFromDetails(AuditEventPayload payload, Map<String, Object> details) {
        if (payload == null || details == null) {
            return;
        }
        Object actorId = details.get("actorId");
        if (actorId instanceof String actor && !actor.isBlank()) {
            payload.setActorId(actor);
        }
        Object display = details.get("actorDisplayName");
        if (display instanceof String displayName && !displayName.isBlank()) {
            payload.setActorDisplayName(displayName);
        } else if (payload.getActorDisplayName() == null || payload.getActorDisplayName().isBlank()) {
            Object userId = details.get("userId");
            if (userId instanceof String user && !user.isBlank()) {
                payload.setActorDisplayName(user);
            }
        }
    }

    private void attachTraceDetails(Map<String, Object> details, PhrRequestContext context) {
        if (details == null) {
            return;
        }
        if (context != null && context.traceId() != null) {
            details.putIfAbsent("traceId", context.traceId());
        }
        if (sessionTraceManager != null) {
            SessionTraceContext trace = sessionTraceManager.current();
            if (trace != null) {
                details.putIfAbsent("traceId", trace.getTraceId());
                details.putIfAbsent("sessionOperation", trace.getOperation());
            }
        }
    }

    private Map<String, Object> buildDetails(PhrRequestContext context,
                                             String status,
                                             String reason,
                                             Map<String, Object> additionalDetails) {
        Map<String, Object> details = new HashMap<>();
        details.put("status", status);
        if (context != null) {
            details.put("facilityId", context.facilityId());
            details.put("userId", context.userId());
        }
        if (reason != null) {
            details.put("reason", reason);
            details.putIfAbsent("errorCode", reason);
        }
        if (additionalDetails != null && !additionalDetails.isEmpty()) {
            details.putAll(additionalDetails);
        }
        return details;
    }
}
