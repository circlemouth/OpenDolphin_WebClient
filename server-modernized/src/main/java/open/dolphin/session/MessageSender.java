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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * JMS メッセージドリブン Bean。リソースアダプタの指定は Jakarta Connectors のデプロイ記述子
 * （META-INF/ejb-jar.xml）に委譲し、実行時プロパティ {@code messaging.resource.adapter}
 * で外部化している。
 */
@MessageDriven(activationConfig = {
        @ActivationConfigProperty(propertyName = "destinationLookup", propertyValue = "java:/queue/dolphin"),
        @ActivationConfigProperty(propertyName = "destinationType", propertyValue = "jakarta.jms.Queue"),
        @ActivationConfigProperty(propertyName = "acknowledgeMode", propertyValue = "Auto-acknowledge")
})
public class MessageSender implements MessageListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(MessageSender.class);
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
                LOGGER.warn("Unsupported JMS message type received: {}", message.getClass().getName());
            }
        } catch (Exception ex) {
            LOGGER.error("MessageSender processing failure [traceId={}]", traceId, ex);
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
            LOGGER.warn("Unsupported payload received on JMS queue: {}", payload.getClass().getName());
        }
    }

    private void handleDocument(DocumentModel document, String traceId) throws Exception {
        MessagingConfig.ClaimSettings settings = messagingConfig.claimSettings();
        if (!settings.isReady()) {
            LOGGER.warn("CLAIM send skipped because claim settings are incomplete [traceId={}]", traceId);
            return;
        }
        LOGGER.info("Processing CLAIM JMS message [traceId={}]", traceId);
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
            LOGGER.warn("Diagnosis send skipped because claim settings are incomplete [traceId={}]", traceId);
            return;
        }
        LOGGER.info("Processing Diagnosis JMS message [traceId={}]", traceId);
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
            LOGGER.warn("Facility ID unavailable; skipping PVT import [traceId={}]", traceId);
            return;
        }
        LOGGER.info("Processing PVT JMS message [traceId={}]", traceId);
        PatientVisitModel model = parsePvt(pvtXml, facilityId);
        if (model == null) {
            LOGGER.debug("Parsed PVT model is null; skipping addPvt [traceId={}]", traceId);
            return;
        }
        pvtServiceBean.addPvt(model);
    }

    private void handleAccountSummary(AccountSummary summary, String traceId) throws Exception {
        LOGGER.info("Processing AccountSummary JMS message [traceId={}]", traceId);
        OidSender sender = new OidSender();
        sender.send(summary);
    }

    private void handleActivityReport(ActivityModel[] activities, String traceId) throws Exception {
        LOGGER.info("Processing ActivityModel JMS message [traceId={}]", traceId);
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
            LOGGER.debug("Failed to read traceId from JMS message", ex);
        }
        return null;
    }
}
