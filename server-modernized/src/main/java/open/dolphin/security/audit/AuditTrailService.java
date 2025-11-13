package open.dolphin.security.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.AuditEvent;

/**
 * 改ざん検知付きの監査ログを記録するサービス。
 */
@ApplicationScoped
@Transactional(Transactional.TxType.REQUIRES_NEW)
public class AuditTrailService implements open.dolphin.audit.AuditTrailService {

    @PersistenceContext
    private EntityManager em;

    private final ObjectMapper objectMapper = new ObjectMapper();

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
        event.setIpAddress(payload.getIpAddress());
        event.setUserAgent(payload.getUserAgent());
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

    private String serializePayload(Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize audit payload", e);
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
        em.createNativeQuery("update d_audit_event set trace_id = :traceId, payload = :payload where id = :id")
                .setParameter("traceId", traceId)
                .setParameter("payload", serializedPayload)
                .setParameter("id", id)
                .executeUpdate();
    }
}
