package open.dolphin.security.audit;

import javax.ejb.Stateless;
import javax.inject.Inject;
import open.dolphin.infomodel.AuditEvent;

/**
 * Legacy サーバーで AuditTrailService への記録を集約する Dispatcher。
 */
@Stateless
public class SessionAuditDispatcher {

    @Inject
    private AuditTrailService auditTrailService;

    public AuditEvent record(AuditEventPayload payload) {
        if (payload == null) {
            throw new IllegalArgumentException("AuditEventPayload must not be null");
        }
        return auditTrailService.record(payload);
    }
}
