package open.dolphin.session;

import jakarta.ejb.ActivationConfigProperty;
import jakarta.ejb.MessageDriven;
import jakarta.inject.Inject;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;
import jakarta.jms.ObjectMessage;
import java.io.BufferedReader;
import java.io.StringReader;
import java.util.Collection;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.ActivityModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.mbean.PVTBuilder;
import open.dolphin.msg.ClaimSender;
import open.dolphin.msg.DiagnosisSender;
import open.dolphin.msg.OidSender;
import open.dolphin.msg.gateway.ExternalServiceAuditLogger;
import open.dolphin.msg.gateway.MessagingConfig;
import org.jboss.ejb3.annotation.ResourceAdapter;

@MessageDriven(activationConfig = {
        @ActivationConfigProperty(propertyName = "destinationLookup", propertyValue = "java:/queue/dolphin"),
        @ActivationConfigProperty(propertyName = "destinationType", propertyValue = "jakarta.jms.Queue"),
        @ActivationConfigProperty(propertyName = "acknowledgeMode", propertyValue = "Auto-acknowledge")
})
@ResourceAdapter("activemq-ra.rar")
public class MessageSender implements MessageListener {

    private static final Logger LOGGER = Logger.getLogger(MessageSender.class.getName());
    private static final String TRACE_ID_PROPERTY = "open.dolphin.traceId";

    @Inject
    private PVTServiceBean pvtServiceBean;

    @Inject
    private MessagingConfig messagingConfig;

    @Override
    public void onMessage(Message message) {
        String traceId = readTraceId(message);
        try {
            if (message instanceof ObjectMessage objectMessage) {
                Object payload = objectMessage.getObject();
                handlePayload(payload, traceId);
            } else {
                LOGGER.warning(() -> "Unsupported JMS message type received: " + message.getClass().getName());
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, String.format("MessageSender processing failure [traceId=%s]", traceId), ex);
            throw new RuntimeException("Failed to process messaging payload", ex);
        }
    }

    private void handlePayload(Object payload, String traceId) throws Exception {
        if (payload instanceof DocumentModel document) {
            handleDocument(document, traceId);
        } else if (payload instanceof DiagnosisSendWrapper wrapper) {
            handleDiagnosis(wrapper, traceId);
        } else if (payload instanceof String pvtXml) {
            handlePvt(pvtXml, traceId);
        } else if (payload instanceof AccountSummary summary) {
            handleAccountSummary(summary, traceId);
        } else if (payload instanceof ActivityModel[] activities) {
            handleActivityReport(activities, traceId);
        } else {
            LOGGER.warning(() -> "Unsupported payload received on JMS queue: " + payload.getClass().getName());
        }
    }

    private void handleDocument(DocumentModel document, String traceId) throws Exception {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (!settings.isReady()) {
            LOGGER.warning(() -> String.format("CLAIM send skipped because claim settings are incomplete [traceId=%s]", traceId));
            return;
        }
        LOGGER.info(() -> String.format("Processing CLAIM JMS message [traceId=%s]", traceId));
        ExternalServiceAuditLogger.logClaimRequest(traceId, document, settings);
        try {
            ClaimSender sender = new ClaimSender(settings.host(), settings.port(), settings.encodingOrDefault());
            sender.send(document);
            ExternalServiceAuditLogger.logClaimSuccess(traceId, document, settings);
        } catch (Exception ex) {
            ExternalServiceAuditLogger.logClaimFailure(traceId, document, settings, ex);
            throw ex;
        }
    }

    private void handleDiagnosis(DiagnosisSendWrapper wrapper, String traceId) throws Exception {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (!settings.isReady()) {
            LOGGER.warning(() -> String.format("Diagnosis send skipped because claim settings are incomplete [traceId=%s]", traceId));
            return;
        }
        LOGGER.info(() -> String.format("Processing Diagnosis JMS message [traceId=%s]", traceId));
        ExternalServiceAuditLogger.logDiagnosisRequest(traceId, wrapper, settings);
        try {
            DiagnosisSender sender = new DiagnosisSender(settings.host(), settings.port(), settings.encodingOrDefault());
            sender.send(wrapper);
            ExternalServiceAuditLogger.logDiagnosisSuccess(traceId, wrapper, settings);
        } catch (Exception ex) {
            ExternalServiceAuditLogger.logDiagnosisFailure(traceId, wrapper, settings, ex);
            throw ex;
        }
    }

    private void handlePvt(String pvtXml, String traceId) throws Exception {
        String facilityId = resolveFacilityId();
        if (facilityId == null || facilityId.isBlank()) {
            LOGGER.warning(() -> String.format("Facility ID unavailable; skipping PVT import [traceId=%s]", traceId));
            return;
        }
        LOGGER.info(() -> String.format("Processing PVT JMS message [traceId=%s]", traceId));
        PatientVisitModel model = parsePvt(pvtXml, facilityId);
        if (model == null) {
            LOGGER.fine(() -> String.format("Parsed PVT model is null; skipping addPvt [traceId=%s]", traceId));
            return;
        }
        pvtServiceBean.addPvt(model);
    }

    private void handleAccountSummary(AccountSummary summary, String traceId) throws Exception {
        LOGGER.info(() -> String.format("Processing AccountSummary JMS message [traceId=%s]", traceId));
        OidSender sender = new OidSender();
        sender.send(summary);
    }

    private void handleActivityReport(ActivityModel[] activities, String traceId) throws Exception {
        LOGGER.info(() -> String.format("Processing ActivityModel JMS message [traceId=%s]", traceId));
        OidSender sender = new OidSender();
        sender.sendActivity(activities);
    }

    private PatientVisitModel parsePvt(String pvtXml, String facilityId) throws Exception {
        BufferedReader reader = new BufferedReader(new StringReader(pvtXml));
        PVTBuilder builder = new PVTBuilder();
        builder.parse(reader);
        PatientVisitModel model = builder.getProduct();
        if (model == null) {
            return null;
        }

        model.setFacilityId(facilityId);
        if (model.getPatientModel() != null) {
            model.getPatientModel().setFacilityId(facilityId);
            Collection<HealthInsuranceModel> insurances = model.getPatientModel().getHealthInsurances();
            if (insurances != null) {
                for (HealthInsuranceModel insurance : insurances) {
                    insurance.setPatient(model.getPatientModel());
                }
            }
        }
        return model;
    }

    private String resolveFacilityId() {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (settings.facilityId() != null && !settings.facilityId().isBlank()) {
            return settings.facilityId();
        }
        MessagingConfig.ClaimSettings reloaded = messagingConfig.reloadClaimSettings();
        return reloaded.facilityId();
    }

    private String readTraceId(Message message) {
        try {
            if (message.propertyExists(TRACE_ID_PROPERTY)) {
                return message.getStringProperty(TRACE_ID_PROPERTY);
            }
        } catch (JMSException ex) {
            LOGGER.log(Level.FINE, "Failed to read traceId from JMS message", ex);
        }
        return null;
    }
}
