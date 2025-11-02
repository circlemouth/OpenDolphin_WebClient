package open.dolphin.infomodel;

import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import org.hibernate.annotations.Type;

/**
 * MemoModel
 *
 * @author Minagawa, Kazushi
 *
 */
@Entity
@Table(name = "d_patient_memo")
public class PatientMemoModel extends KarteEntryBean implements java.io.Serializable {

    // DolphinPro と crala OpenDolphin -> @Lobアノテーションをつける
    // OpenDolphin ASP アノテーションなし
    private String memo;
//masuda^    
    @Lob
    @Type(type="org.hibernate.type.StringClobType")
    private String memo2;
    
    public String getMemo() {
        return memo2!=null ? memo2: memo;
    }
    
    public void setMemo(String memo) {
        this.memo2 = memo;
    }
//masuda$      
}
