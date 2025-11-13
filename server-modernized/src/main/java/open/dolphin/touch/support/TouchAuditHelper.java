package open.dolphin.touch.support;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;

/**
 * Touch API の監査ログ出力を補助する。
 */
@ApplicationScoped
public class TouchAuditHelper {

    @Inject
    AuditTrailService auditTrailService;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    SessionTraceManager sessionTraceManager;

    public Optional<AuditEventEnvelope> record(TouchRequestContext context,
                                               String action,
                                               String resource,
                                               Map<String, Object> additionalDetails) {
        if ((sessionAuditDispatcher == null && auditTrailService == null) || context == null) {
            return Optional.empty();
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setActorId(context.remoteUser());
        payload.setActorDisplayName(context.userId());
        payload.setActorRole(determineRole());
        payload.setAction(action);
        payload.setResource(resource);
        payload.setRequestId(context.traceId());
        payload.setTraceId(context.traceId());
        payload.setIpAddress(context.clientIp());
        payload.setUserAgent(context.userAgent());
        payload.setDetails(mergeDetails(context, additionalDetails));
        if (sessionAuditDispatcher != null) {
            return Optional.of(sessionAuditDispatcher.record(payload));
        }
        auditTrailService.record(payload);
        return Optional.empty();
    }

    private String determineRole() {
        if (sessionTraceManager == null) {
            return null;
        }
        SessionTraceContext traceContext = sessionTraceManager.current();
        if (traceContext == null) {
            return null;
        }
        return traceContext.getActorRole();
    }

    private Map<String, Object> mergeDetails(TouchRequestContext context, Map<String, Object> additionalDetails) {
        Map<String, Object> details = new HashMap<>();
        if (context.accessReason() != null) {
            details.put("accessReason", context.accessReason());
        }
        if (context.hasConsentToken()) {
            details.put("consentToken", context.consentToken());
        }
        details.put("facilityId", context.facilityId());
        details.put("userId", context.userId());
        if (additionalDetails != null && !additionalDetails.isEmpty()) {
            details.putAll(additionalDetails);
        }
        boolean traceCaptured = false;
        if (sessionTraceManager != null) {
            SessionTraceContext traceContext = sessionTraceManager.current();
            if (traceContext != null) {
                details.put("traceId", traceContext.getTraceId());
                details.put("sessionOperation", traceContext.getOperation());
                traceCaptured = true;
            }
        }
        if (!traceCaptured) {
            String traceId = context.traceId();
            if (traceId != null && !traceId.isBlank()) {
                details.put("traceId", traceId);
            }
        }
        return details;
    }
}
