package open.dolphin.infomodel;

import java.io.Serializable;
import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/**
 * WebAuthn などのチャレンジ情報を保持するエンティティ。
 */
@Entity
@Table(name = "d_factor2_challenge")
public class Factor2Challenge implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "user_pk", nullable = false)
    private long userPK;

    @Enumerated(EnumType.STRING)
    @Column(name = "challenge_type", nullable = false, length = 64)
    private Factor2ChallengeType challengeType;

    @Column(name = "request_id", nullable = false, length = 64, unique = true)
    private String requestId;

    @Lob
    @Column(name = "challenge_payload", nullable = false)
    private String challengePayload;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "rp_id", length = 255)
    private String rpId;

    @Column(name = "origin", length = 512)
    private String origin;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public long getUserPK() {
        return userPK;
    }

    public void setUserPK(long userPK) {
        this.userPK = userPK;
    }

    public Factor2ChallengeType getChallengeType() {
        return challengeType;
    }

    public void setChallengeType(Factor2ChallengeType challengeType) {
        this.challengeType = challengeType;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getChallengePayload() {
        return challengePayload;
    }

    public void setChallengePayload(String challengePayload) {
        this.challengePayload = challengePayload;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getRpId() {
        return rpId;
    }

    public void setRpId(String rpId) {
        this.rpId = rpId;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }
}
