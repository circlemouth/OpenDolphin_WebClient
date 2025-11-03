package open.dolphin.infomodel;

import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 看護記録モデル
 * 
 * @author kazushi Minagawa
 */
@Entity
@Table(name = "d_nurse_progress_course")
public class NurseProgressCourseModel extends KarteEntryBean implements java.io.Serializable {
    
    @Lob
    @JdbcTypeCode(SqlTypes.CLOB)
    private String progressText;
    
    // 看護記録の文字数
    private int textLength;

    public String getProgressText() {
        return progressText;
    }

    public void setProgressText(String progressText) {
        this.progressText = progressText;
    }

    public int getTextLength() {
        return textLength;
    }

    public void setTextLength(int textLength) {
        this.textLength = textLength;
    }
}
