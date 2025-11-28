package open.dolphin.infomodel;

import java.io.Serializable;
import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

/**
 * 改ざん耐性を持たせた監査イベントログ。
 */
@Entity
@Table(name = "d_audit_event")
public class AuditEvent implements Serializable {

    @Id
    @SequenceGenerator(name = "AuditEventSeq", sequenceName = "d_audit_event_id_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "AuditEventSeq")
    private Long id;

    @Column(name = "event_time", nullable = false)
    private Instant eventTime;

    @Column(name = "actor_id", length = 128)
    private String actorId;

    @Column(name = "actor_display_name", length = 255)
    private String actorDisplayName;

    @Column(name = "actor_role", length = 128)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 64)
    private String action;

    @Column(name = "resource", length = 255)
    private String resource;

    @Column(name = "patient_id", length = 64)
    private String patientId;

    @Column(name = "request_id", length = 64)
    private String requestId;

    @Column(name = "trace_id", length = 64)
    private String traceId;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "payload_hash", length = 128, nullable = false)
    private String payloadHash;

    @Column(name = "previous_hash", length = 128)
    private String previousHash;

    @Column(name = "event_hash", length = 128, nullable = false)
    private String eventHash;

    @Column(name = "payload", columnDefinition = "text")
    private String payload;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getEventTime() {
        return eventTime;
    }

    public void setEventTime(Instant eventTime) {
        this.eventTime = eventTime;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorDisplayName() {
        return actorDisplayName;
    }

    public void setActorDisplayName(String actorDisplayName) {
        this.actorDisplayName = actorDisplayName;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public void setPayloadHash(String payloadHash) {
        this.payloadHash = payloadHash;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getEventHash() {
        return eventHash;
    }

    public void setEventHash(String eventHash) {
        this.eventHash = eventHash;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }
}
