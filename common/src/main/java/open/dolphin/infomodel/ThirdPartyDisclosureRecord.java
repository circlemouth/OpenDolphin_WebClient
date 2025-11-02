package open.dolphin.infomodel;

import java.io.Serializable;
import java.time.Instant;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

/**
 * 個人情報の第三者提供記録を保持するエンティティ。
 */
@Entity
@Table(name = "d_third_party_disclosure")
public class ThirdPartyDisclosureRecord implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId;

    @Column(name = "actor_id", length = 128)
    private String actorId;

    @Column(name = "actor_role", length = 128)
    private String actorRole;

    @Column(name = "recipient", nullable = false, length = 255)
    private String recipient;

    @Column(name = "purpose", length = 512)
    private String purpose;

    @Lob
    @Column(name = "description")
    private String description;

    @Column(name = "legal_basis", length = 255)
    private String legalBasis;

    @Column(name = "disclosed_at", nullable = false)
    private Instant disclosedAt;

    @Column(name = "reference_id", length = 128)
    private String referenceId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLegalBasis() {
        return legalBasis;
    }

    public void setLegalBasis(String legalBasis) {
        this.legalBasis = legalBasis;
    }

    public Instant getDisclosedAt() {
        return disclosedAt;
    }

    public void setDisclosedAt(Instant disclosedAt) {
        this.disclosedAt = disclosedAt;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
}
