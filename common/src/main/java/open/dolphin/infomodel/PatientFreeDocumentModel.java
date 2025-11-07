/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package open.dolphin.infomodel;

import java.util.Date;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * サマリー対応
 * @author S.Oh@Life Sciences Computing Corporation.
 */
@Entity
@Table(name = "d_patient_freedocument")
public class PatientFreeDocumentModel extends InfoModel implements java.io.Serializable {
    
    @Id @GeneratedValue(strategy=GenerationType.AUTO)
    private long id;
    
    @Column(nullable=false)
    private String facilityPatId;
    
    @Column(nullable=false)
    @Temporal(value = TemporalType.TIMESTAMP)
    private Date confirmed;

    @Lob
    @JdbcTypeCode(SqlTypes.CLOB)
    private String comment;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getFacilityPatId() {
        return facilityPatId;
    }

    public void setFacilityPatId(String facilityPatId) {
        this.facilityPatId = facilityPatId;
    }

    public Date getConfirmed() {
        return confirmed;
    }

    public void setConfirmed(Date confirmed) {
        this.confirmed = confirmed;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
