package open.dolphin.msg.gateway;

import jakarta.annotation.Resource;
import jakarta.enterprise.concurrent.ManagedExecutorService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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

    @Resource
    private ManagedExecutorService executorService;

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
        executeAsync(() -> sendClaimInternal(document, settings, traceId));
    }

    public void dispatchDiagnosis(DiagnosisSendWrapper wrapper) {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (!settings.isReady()) {
            LOGGER.fine("Diagnosis dispatch skipped because server-side messaging is disabled or incomplete.");
            return;
        }
        String traceId = currentTraceId();
        executeAsync(() -> sendDiagnosisInternal(wrapper, settings, traceId));
    }

    private void sendClaimInternal(DocumentModel document, MessagingConfig.ClaimSettings settings, String traceId) {
        try {
            LOGGER.info(() -> String.format("Document message received. Sending ORCA will start (async) [traceId=%s]", traceId));
            ExternalServiceAuditLogger.logClaimRequest(traceId, document, settings);
            ClaimSender sender = new ClaimSender(settings.host(), settings.port(), settings.encodingOrDefault());
            sender.send(document);
            ExternalServiceAuditLogger.logClaimSuccess(traceId, document, settings);
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, () -> String.format("Claim send error [traceId=%s]", traceId), ex);
            ExternalServiceAuditLogger.logClaimFailure(traceId, document, settings, ex);
        }
    }

    private void sendDiagnosisInternal(DiagnosisSendWrapper wrapper, MessagingConfig.ClaimSettings settings, String traceId) {
        try {
            LOGGER.info(() -> String.format("Diagnosis message received. Sending ORCA will start (async) [traceId=%s]", traceId));
            ExternalServiceAuditLogger.logDiagnosisRequest(traceId, wrapper, settings);
            DiagnosisSender sender = new DiagnosisSender(settings.host(), settings.port(), settings.encodingOrDefault());
            sender.send(wrapper);
            ExternalServiceAuditLogger.logDiagnosisSuccess(traceId, wrapper, settings);
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, () -> String.format("Diagnosis claim send error [traceId=%s]", traceId), ex);
            ExternalServiceAuditLogger.logDiagnosisFailure(traceId, wrapper, settings, ex);
        }
    }

    private void executeAsync(Runnable task) {
        if (executorService != null) {
            try {
                executorService.execute(task);
                return;
            } catch (Exception ex) {
                LOGGER.log(Level.SEVERE, "Failed to submit messaging task", ex);
            }
        }
        task.run();
    }

    private String currentTraceId() {
        return Optional.ofNullable(traceManager.current())
                .map(SessionTraceContext::getTraceId)
                .orElse(null);
    }
}
