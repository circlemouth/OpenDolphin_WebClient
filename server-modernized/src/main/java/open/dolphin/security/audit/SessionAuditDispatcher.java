package open.dolphin.security.audit;

import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.ConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.ObjectMessage;
import jakarta.jms.Queue;
import jakarta.transaction.Transactional;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.audit.AuditEventEnvelope.Outcome;
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

    public AuditEventEnvelope record(AuditEventPayload payload) {
        return record(payload, null, null, null);
    }

    public AuditEventEnvelope record(AuditEventPayload payload, Outcome overrideOutcome, String errorCode, String errorMessage) {
        if (payload == null) {
            throw new IllegalArgumentException("AuditEventPayload must not be null");
        }
        AuditEventEnvelope.Builder builder = buildEnvelopeFromPayload(payload);
        Outcome normalized = normalizeOutcome(payload, overrideOutcome);
        if (normalized != null) {
            builder.outcome(normalized);
        }
        if (errorCode != null || errorMessage != null) {
            builder.error(errorCode, errorMessage);
        }
        return dispatch(builder.build());
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

    private AuditEventEnvelope.Builder buildEnvelopeFromPayload(AuditEventPayload payload) {
        String action = optional(payload.getAction()).orElse("UNSPECIFIED_ACTION");
        String resource = optional(payload.getResource()).orElse("/resources");
        String requestId = optional(payload.getRequestId()).orElseGet(() -> optional(payload.getTraceId()).orElse(UUID.randomUUID().toString()));
        String traceId = optional(payload.getTraceId()).orElse(requestId);

        Map<String, Object> details = payload.getDetails();
        AuditEventEnvelope.Builder builder = AuditEventEnvelope.builder(action, resource)
                .requestId(requestId)
                .traceId(traceId)
                .runId(resolveRunId(payload, details))
                .screen(resolveScreen(payload, details))
                .uiAction(resolveUiAction(payload, details))
                .actorId(payload.getActorId())
                .actorDisplayName(payload.getActorDisplayName())
                .actorRole(payload.getActorRole())
                .ipAddress(payload.getIpAddress())
                .userAgent(payload.getUserAgent())
                .patientId(payload.getPatientId())
                .details(cloneDetails(payload.getDetails()));

        resolveFacility(details).ifPresent(builder::facilityId);
        resolveOperation(details).ifPresent(builder::operation);
        return builder;
    }

    private Outcome normalizeOutcome(AuditEventPayload payload, Outcome overrideOutcome) {
        if (overrideOutcome == Outcome.FAILURE) {
            return Outcome.FAILURE;
        }
        Outcome detailOutcome = determineOutcome(payload);
        if (detailOutcome != null && detailOutcome != Outcome.SUCCESS) {
            return detailOutcome;
        }
        if (overrideOutcome != null) {
            return overrideOutcome;
        }
        return detailOutcome;
    }

    private Outcome determineOutcome(AuditEventPayload payload) {
        if (payload == null) {
            return null;
        }
        Outcome explicit = resolveOutcome(payload.getOutcome());
        if (explicit != null) {
            return explicit;
        }
        Map<String, Object> details = payload.getDetails();
        if (details == null) {
            return null;
        }
        Outcome detailOutcome = resolveOutcome(optionalString(details.get("outcome")));
        if (detailOutcome != null) {
            return detailOutcome;
        }
        Object status = details.get("status");
        if (status instanceof String statusText && "failed".equalsIgnoreCase(statusText)) {
            return Outcome.FAILURE;
        }
        if (status instanceof String statusText && "blocked".equalsIgnoreCase(statusText)) {
            return Outcome.BLOCKED;
        }
        if (status instanceof String statusText && "success".equalsIgnoreCase(statusText)) {
            return Outcome.SUCCESS;
        }
        return null;
    }

    private Optional<String> resolveFacility(Map<String, Object> details) {
        if (details == null) {
            return Optional.empty();
        }
        Object facility = details.get("facilityId");
        if (facility instanceof String value && !value.isBlank()) {
            return Optional.of(value);
        }
        return Optional.empty();
    }

    private String resolveRunId(AuditEventPayload payload, Map<String, Object> details) {
        String runId = optional(payload.getRunId()).orElse(null);
        if (runId != null) {
            return runId;
        }
        return optionalString(details != null ? details.get("runId") : null);
    }

    private String resolveScreen(AuditEventPayload payload, Map<String, Object> details) {
        String screen = optional(payload.getScreen()).orElse(null);
        if (screen != null) {
            return screen;
        }
        return optionalString(details != null ? details.get("screen") : null);
    }

    private String resolveUiAction(AuditEventPayload payload, Map<String, Object> details) {
        String action = optional(payload.getUiAction()).orElse(null);
        if (action != null) {
            return action;
        }
        return optionalString(details != null ? details.get("uiAction") : null);
    }

    private Outcome resolveOutcome(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "SUCCESS" -> Outcome.SUCCESS;
            case "MISSING" -> Outcome.MISSING;
            case "BLOCKED" -> Outcome.BLOCKED;
            case "FAILURE", "FAILED", "ERROR" -> Outcome.FAILURE;
            default -> null;
        };
    }

    private String optionalString(Object value) {
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        return null;
    }

    private Optional<String> resolveOperation(Map<String, Object> details) {
        if (details == null) {
            return Optional.empty();
        }
        Object operation = details.get("operation");
        if (operation instanceof String value && !value.isBlank()) {
            return Optional.of(value);
        }
        return Optional.empty();
    }

    private Map<String, Object> cloneDetails(Map<String, Object> details) {
        if (details == null) {
            return Collections.emptyMap();
        }
        return new HashMap<>(details);
    }

    private Optional<String> optional(String value) {
        return value == null || value.isBlank() ? Optional.empty() : Optional.of(value);
    }
}
