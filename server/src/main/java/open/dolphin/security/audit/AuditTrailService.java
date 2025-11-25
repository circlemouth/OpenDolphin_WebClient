package open.dolphin.security.audit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.xml.bind.DatatypeConverter;
import open.dolphin.infomodel.AuditEvent;
import org.codehaus.jackson.map.ObjectMapper;

/**
 * Legacy サーバー向けの監査ログ記録サービス。
 */
@Stateless
public class AuditTrailService {

    @PersistenceContext
    private EntityManager em;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuditEvent record(AuditEventPayload payload) {
        Instant now = Instant.now();
        String previousHash = "";
        List<String> hashes = em.createQuery("select a.eventHash from AuditEvent a order by a.eventTime desc", String.class)
                .setMaxResults(1)
                .getResultList();
        if (!hashes.isEmpty()) {
            previousHash = hashes.get(0);
        }

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
        return event;
    }

    private String serializePayload(Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize audit payload", e);
        }
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return DatatypeConverter.printHexBinary(hashed).toLowerCase();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Missing SHA-256 implementation", e);
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String determineTraceId(AuditEventPayload payload) {
        if (payload.getTraceId() != null && !payload.getTraceId().isEmpty()) {
            return payload.getTraceId();
        }
        return payload.getRequestId();
    }
}
