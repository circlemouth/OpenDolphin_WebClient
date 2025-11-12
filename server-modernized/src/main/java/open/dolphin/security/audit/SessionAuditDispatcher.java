package open.dolphin.security.audit;

import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.ConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.ObjectMessage;
import jakarta.jms.Queue;
import jakarta.transaction.Transactional;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.msg.gateway.MessagingHeaders;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * AuditTrailService が生成した監査イベントを JMS へも多重送信し、
 * Appo/Schedule など REST 経由の操作で traceId 付きの証跡を確実に残すディスパッチャ。
 */
@ApplicationScoped
public class SessionAuditDispatcher {

    private static final Logger LOGGER = LoggerFactory.getLogger(SessionAuditDispatcher.class);
    private static final String PAYLOAD_TYPE_AUDIT = "AUDIT_EVENT";

    @Inject
    private AuditTrailService auditTrailService;

    @Resource(lookup = "java:/JmsXA")
    private ConnectionFactory connectionFactory;

    @Resource(lookup = "java:/queue/dolphin")
    private Queue dolphinQueue;

    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public AuditEventEnvelope dispatch(AuditEventEnvelope envelope) {
        if (envelope == null) {
            throw new IllegalArgumentException("AuditEventEnvelope must not be null");
        }
        AuditEventEnvelope persisted = auditTrailService.write(envelope);
        publishToJms(persisted);
        return persisted;
    }

    private void publishToJms(AuditEventEnvelope envelope) {
        if (connectionFactory == null || dolphinQueue == null) {
            LOGGER.debug("JMS resources unavailable; skipping audit JMS publish [action={}, traceId={}]", envelope.getAction(), envelope.getTraceId());
            return;
        }
        try (JMSContext context = connectionFactory.createContext(JMSContext.AUTO_ACKNOWLEDGE)) {
            ObjectMessage message = context.createObjectMessage(envelope);
            String traceId = envelope.getTraceId();
            if (traceId != null && !traceId.isBlank()) {
                message.setStringProperty(MessagingHeaders.TRACE_ID, traceId);
            }
            message.setStringProperty(MessagingHeaders.PAYLOAD_TYPE, PAYLOAD_TYPE_AUDIT);
            context.createProducer().send(dolphinQueue, message);
            LOGGER.debug("Audit envelope enqueued to JMS queue [action={}, traceId={}]", envelope.getAction(), traceId);
        } catch (Exception ex) {
            LOGGER.warn("Failed to publish audit envelope to JMS [traceId={}]", envelope.getTraceId(), ex);
        }
    }
}
