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
 * ２要素認証の信頼済み認証器を表すエンティティ。
 */
@Entity
@Table(name = "d_factor2_credential")
public class Factor2Credential implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "user_pk", nullable = false)
    private long userPK;

    @Enumerated(EnumType.STRING)
    @Column(name = "credential_type", nullable = false, length = 32)
    private Factor2CredentialType credentialType;

    @Column(name = "label", length = 255)
    private String label;

    /**
     * WebAuthn 認証器の場合は credentialId を Base64URL で保持する。
     * TOTP の場合は参照用の内部 ID を格納する。
     */
    @Column(name = "credential_id", length = 512)
    private String credentialId;

    /**
     * FIDO2 公開鍵など長文になる可能性がある値は LOB とする。
     */
    @Lob
    @Column(name = "public_key")
    private String publicKey;

    /**
     * 暗号化された TOTP シークレット等の保護対象データ。
     */
    @Lob
    @Column(name = "secret")
    private String secret;

    @Column(name = "sign_count")
    private long signCount;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    @Lob
    @Column(name = "transports")
    private String transports;

    @Lob
    @Column(name = "metadata")
    private String metadata;

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

    public Factor2CredentialType getCredentialType() {
        return credentialType;
    }

    public void setCredentialType(Factor2CredentialType credentialType) {
        this.credentialType = credentialType;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(String credentialId) {
        this.credentialId = credentialId;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getSignCount() {
        return signCount;
    }

    public void setSignCount(long signCount) {
        this.signCount = signCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(Instant lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getTransports() {
        return transports;
    }

    public void setTransports(String transports) {
        this.transports = transports;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}
