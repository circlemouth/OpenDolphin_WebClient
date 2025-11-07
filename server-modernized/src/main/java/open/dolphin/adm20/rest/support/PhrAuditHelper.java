package open.dolphin.adm20.rest.support;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
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
        if (auditTrailService == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        if (context != null) {
            payload.setActorId(context.remoteUser());
            payload.setActorDisplayName(context.userId());
            payload.setAction(action);
            payload.setResource(context.requestUri());
            payload.setRequestId(context.requestId());
            payload.setIpAddress(context.clientIp());
            payload.setUserAgent(context.userAgent());
            payload.setPatientId(patientId);
        } else {
            payload.setAction(action);
            payload.setResource("/20/adm/phr");
        }
        payload.setDetails(buildDetails(context, status, reason, additionalDetails));
        Optional.ofNullable(sessionTraceManager)
                .map(SessionTraceManager::current)
                .ifPresent(trace -> {
                    Map<String, Object> details = payload.getDetails();
                    details.putIfAbsent("traceId", trace.getTraceId());
                    details.putIfAbsent("sessionOperation", trace.getOperation());
                });
        auditTrailService.record(payload);
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
        }
        if (additionalDetails != null && !additionalDetails.isEmpty()) {
            details.putAll(additionalDetails);
        }
        return details;
    }
}
