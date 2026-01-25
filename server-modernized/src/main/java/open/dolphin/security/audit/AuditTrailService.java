package open.dolphin.security.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.AuditEvent;

/**
 * 改ざん検知付きの監査ログを記録するサービス。
 */
@ApplicationScoped
@Transactional(Transactional.TxType.REQUIRES_NEW)
public class AuditTrailService implements open.dolphin.audit.AuditTrailService {

    private static final Logger LOG = Logger.getLogger(AuditTrailService.class.getName());

    @PersistenceContext
    private EntityManager em;

    private final ObjectMapper objectMapper;

    public AuditTrailService() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper = mapper;
    }

    public AuditEvent record(AuditEventPayload payload) {
        Instant now = Instant.now();
        String previousHash = em.createQuery("select a.eventHash from AuditEvent a order by a.eventTime desc", String.class)
                .setMaxResults(1)
                .getResultStream()
                .findFirst()
                .orElse("");

        String serializedPayload = serializePayload(payload.getDetails());
        String payloadHash = hash(serializedPayload);

        AuditEvent event = new AuditEvent();
        event.setEventTime(now);
        event.setActorId(payload.getActorId());
        event.setActorDisplayName(payload.getActorDisplayName());
        event.setActorRole(payload.getActorRole());
        event.setAction(payload.getAction());
        event.setResource(payload.getResource());
        event.setPatientId(payload.getPatientId());
        event.setRequestId(payload.getRequestId());
        event.setTraceId(determineTraceId(payload));
        event.setRunId(resolveRunId(payload));
        event.setScreen(resolveScreen(payload));
        event.setUiAction(resolveUiAction(payload));
        event.setIpAddress(payload.getIpAddress());
        event.setUserAgent(payload.getUserAgent());
        event.setOutcome(resolveOutcome(payload));
        event.setPayload(serializedPayload);
        event.setPayloadHash(payloadHash);
        event.setPreviousHash(previousHash);
        event.setEventHash(hash(previousHash + payloadHash + now.toEpochMilli() + safe(payload.getActorId())));

        em.persist(event);
        em.flush();
        backfillTraceAndPayload(event.getId(), event.getTraceId(), serializedPayload);
        return event;
    }

    @Override
    public AuditEventEnvelope write(AuditEventEnvelope envelope) {
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(envelope.getAction());
        payload.setResource(envelope.getResource());
        payload.setActorId(envelope.getActorId());
        payload.setActorDisplayName(envelope.getActorDisplayName());
        payload.setActorRole(envelope.getActorRole());
        payload.setPatientId(envelope.getPatientId());
        payload.setRequestId(determineRequestId(envelope));
        payload.setTraceId(determineTraceId(envelope));
        payload.setRunId(envelope.getRunId());
        payload.setScreen(envelope.getScreen());
        payload.setUiAction(envelope.getUiAction());
        payload.setOutcome(envelope.getOutcome() != null ? envelope.getOutcome().name() : null);
        payload.setIpAddress(envelope.getIpAddress());
        payload.setUserAgent(envelope.getUserAgent());
        payload.setDetails(envelope.getDetails());
        record(payload);
        return envelope;
    }

    private String determineRequestId(AuditEventEnvelope envelope) {
        if (envelope.getRequestId() != null && !envelope.getRequestId().isBlank()) {
            return envelope.getRequestId();
        }
        return envelope.getTraceId();
    }

    private String determineTraceId(AuditEventEnvelope envelope) {
        if (envelope.getTraceId() != null && !envelope.getTraceId().isBlank()) {
            return envelope.getTraceId();
        }
        return envelope.getRequestId();
    }

    private String determineTraceId(AuditEventPayload payload) {
        if (payload.getTraceId() != null && !payload.getTraceId().isBlank()) {
            return payload.getTraceId();
        }
        return payload.getRequestId();
    }

    private String resolveRunId(AuditEventPayload payload) {
        if (payload == null) {
            return null;
        }
        if (payload.getRunId() != null && !payload.getRunId().isBlank()) {
            return payload.getRunId();
        }
        return resolveDetailString(payload.getDetails(), "runId");
    }

    private String resolveScreen(AuditEventPayload payload) {
        if (payload == null) {
            return null;
        }
        if (payload.getScreen() != null && !payload.getScreen().isBlank()) {
            return payload.getScreen();
        }
        return resolveDetailString(payload.getDetails(), "screen");
    }

    private String resolveUiAction(AuditEventPayload payload) {
        if (payload == null) {
            return null;
        }
        if (payload.getUiAction() != null && !payload.getUiAction().isBlank()) {
            return payload.getUiAction();
        }
        return resolveDetailString(payload.getDetails(), "uiAction");
    }

    private String resolveOutcome(AuditEventPayload payload) {
        if (payload == null) {
            return null;
        }
        String outcome = normalizeOutcome(payload.getOutcome());
        if (outcome != null) {
            return outcome;
        }
        outcome = normalizeOutcome(resolveDetailString(payload.getDetails(), "outcome"));
        if (outcome != null) {
            return outcome;
        }
        String status = resolveDetailString(payload.getDetails(), "status");
        if (status == null) {
            return null;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if ("FAILED".equals(normalized) || "FAILURE".equals(normalized) || "ERROR".equals(normalized)) {
            return "FAILURE";
        }
        if ("BLOCKED".equals(normalized)) {
            return "BLOCKED";
        }
        if ("SUCCESS".equals(normalized)) {
            return "SUCCESS";
        }
        return null;
    }

    private String normalizeOutcome(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "SUCCESS" -> "SUCCESS";
            case "MISSING" -> "MISSING";
            case "BLOCKED" -> "BLOCKED";
            case "FAILURE", "FAILED", "ERROR" -> "FAILURE";
            default -> null;
        };
    }

    private String resolveDetailString(Map<String, Object> details, String key) {
        if (details == null || key == null) {
            return null;
        }
        Object value = details.get(key);
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        return null;
    }

    private String serializePayload(Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException e) {
            LOG.log(Level.WARNING, "Failed to serialize audit payload; falling back to toString", e);
            return details.toString();
        }
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Missing SHA-256 implementation", e);
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private void backfillTraceAndPayload(Long id, String traceId, String serializedPayload) {
        if (id == null) {
            return;
        }
        em.createQuery("update AuditEvent a set a.traceId = :traceId, a.payload = :payload where a.id = :id")
                .setParameter("traceId", traceId)
                .setParameter("payload", serializedPayload)
                .setParameter("id", id)
                .executeUpdate();
    }
}
