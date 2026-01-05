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
import java.util.Properties;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.ActivityModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.mbean.PVTBuilder;
import open.dolphin.msg.OidSender;
import open.dolphin.msg.dto.AccountSummaryMessage;
import open.dolphin.msg.gateway.MessagingHeaders;
import open.orca.rest.ORCAConnection;
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
    private static final String TRACE_ID_PROPERTY = MessagingHeaders.TRACE_ID;

    @Inject
    private PVTServiceBean pvtServiceBean;

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
        if (payload instanceof String pvtXml) {
            handlePvt(pvtXml, traceId);
        } else if (payload instanceof AccountSummaryMessage summary) {
            handleAccountSummary(summary, traceId);
        } else if (payload instanceof ActivityModel[] activities) {
            handleActivityReport(activities, traceId);
        } else if (payload instanceof AuditEventEnvelope envelope) {
            handleAuditEvent(envelope, traceId);
        } else {
            LOGGER.warn("Unsupported payload received on JMS queue: {}", payload.getClass().getName());
        }
    }

    private void handleAuditEvent(AuditEventEnvelope envelope, String traceId) {
        LOGGER.info("Audit envelope drained from JMS queue [traceId={}, action={}, resource={}, outcome={}]",
                traceId,
                envelope.getAction(),
                envelope.getResource(),
                envelope.getOutcome());
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

    private void handleAccountSummary(AccountSummaryMessage summary, String traceId) throws Exception {
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
        String systemProp = System.getProperty("dolphin.facilityId");
        if (systemProp != null && !systemProp.isBlank()) {
            return systemProp;
        }
        try {
            Properties props = ORCAConnection.getInstance().getProperties();
            if (props != null) {
                return props.getProperty("dolphin.facilityId");
            }
        } catch (Exception ex) {
            LOGGER.debug("Failed to resolve facilityId from ORCAConnection properties", ex);
        }
        return null;
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
