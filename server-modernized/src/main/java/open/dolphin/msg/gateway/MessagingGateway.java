package open.dolphin.msg.gateway;

import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.ConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.ObjectMessage;
import jakarta.jms.Queue;
import java.io.Serializable;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.msg.ClaimSender;
import open.dolphin.msg.DiagnosisSender;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;

@ApplicationScoped
public class MessagingGateway {

    private static final Logger LOGGER = Logger.getLogger(MessagingGateway.class.getName());
    private static final String TRACE_ID_PROPERTY = "open.dolphin.traceId";
    private static final String PAYLOAD_TYPE_PROPERTY = "open.dolphin.payloadType";
    private static final String PAYLOAD_TYPE_CLAIM = "CLAIM";
    private static final String PAYLOAD_TYPE_DIAGNOSIS = "DIAGNOSIS";

    @Resource(lookup = "java:/JmsXA")
    private ConnectionFactory connectionFactory;

    @Resource(lookup = "java:/queue/dolphin")
    private Queue dolphinQueue;

    @Inject
    private MessagingConfig messagingConfig;

    @Inject
    private SessionTraceManager traceManager;

    public void dispatchClaim(DocumentModel document) {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (!settings.isReady()) {
            LOGGER.fine("Claim dispatch skipped because server-side messaging is disabled or incomplete.");
            return;
        }
        String traceId = currentTraceId();
        ExternalServiceAuditLogger.logClaimRequest(traceId, document, settings);
        if (enqueue(document, traceId, PAYLOAD_TYPE_CLAIM)) {
            LOGGER.info(() -> String.format("Claim message enqueued to JMS queue java:/queue/dolphin [traceId=%s]", traceId));
            return;
        }
        LOGGER.warning(() -> String.format("Claim JMS enqueue failed. Falling back to synchronous send [traceId=%s]", traceId));
        sendClaimDirect(document, settings, traceId);
    }

    public void dispatchDiagnosis(DiagnosisSendWrapper wrapper) {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (!settings.isReady()) {
            LOGGER.fine("Diagnosis dispatch skipped because server-side messaging is disabled or incomplete.");
            return;
        }
        String traceId = currentTraceId();
        ExternalServiceAuditLogger.logDiagnosisRequest(traceId, wrapper, settings);
        if (enqueue(wrapper, traceId, PAYLOAD_TYPE_DIAGNOSIS)) {
            LOGGER.info(() -> String.format("Diagnosis message enqueued to JMS queue java:/queue/dolphin [traceId=%s]", traceId));
            return;
        }
        LOGGER.warning(() -> String.format("Diagnosis JMS enqueue failed. Falling back to synchronous send [traceId=%s]", traceId));
        sendDiagnosisDirect(wrapper, settings, traceId);
    }

    private boolean enqueue(Serializable payload, String traceId, String payloadType) {
        if (connectionFactory == null || dolphinQueue == null) {
            LOGGER.fine(() -> "JMS resources unavailable; skipping enqueue for payload type " + payloadType);
            return false;
        }
        try (JMSContext context = connectionFactory.createContext(JMSContext.AUTO_ACKNOWLEDGE)) {
            ObjectMessage message = context.createObjectMessage(payload);
            if (traceId != null) {
                message.setStringProperty(TRACE_ID_PROPERTY, traceId);
            }
            message.setStringProperty(PAYLOAD_TYPE_PROPERTY, payloadType);
            context.createProducer().send(dolphinQueue, message);
            return true;
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "Failed to enqueue messaging payload type " + payloadType, ex);
            return false;
        }
    }

    private void sendClaimDirect(DocumentModel document, MessagingConfig.ClaimSettings settings, String traceId) {
        try {
            LOGGER.info(() -> String.format("Claim fallback send started [traceId=%s]", traceId));
            ClaimSender sender = new ClaimSender(settings.host(), settings.port(), settings.encodingOrDefault());
            sender.send(document);
            ExternalServiceAuditLogger.logClaimSuccess(traceId, document, settings);
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, () -> String.format("Claim send error [traceId=%s]", traceId), ex);
            ExternalServiceAuditLogger.logClaimFailure(traceId, document, settings, ex);
        }
    }

    private void sendDiagnosisDirect(DiagnosisSendWrapper wrapper, MessagingConfig.ClaimSettings settings, String traceId) {
        try {
            LOGGER.info(() -> String.format("Diagnosis fallback send started [traceId=%s]", traceId));
            DiagnosisSender sender = new DiagnosisSender(settings.host(), settings.port(), settings.encodingOrDefault());
            sender.send(wrapper);
            ExternalServiceAuditLogger.logDiagnosisSuccess(traceId, wrapper, settings);
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, () -> String.format("Diagnosis send error [traceId=%s]", traceId), ex);
            ExternalServiceAuditLogger.logDiagnosisFailure(traceId, wrapper, settings, ex);
        }
    }

    private String currentTraceId() {
        return Optional.ofNullable(traceManager.current())
                .map(SessionTraceContext::getTraceId)
                .orElse(null);
    }
}
