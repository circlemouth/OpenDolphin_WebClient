package open.dolphin.infomodel;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 *
 * @author kazushi
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class PHRContainer implements java.io.Serializable {
    
    private List<PHRCatch> docList = Collections.emptyList();
    
    private List<PHRLabModule> labList = Collections.emptyList();

    public List<PHRCatch> getDocList() {
        return docList;
    }

    public void setDocList(List<PHRCatch> docList) {
        this.docList = normalize(docList, "docList");
    }

    public List<PHRLabModule> getLabList() {
        return labList;
    }

    public void setLabList(List<PHRLabModule> labList) {
        this.labList = normalize(labList, "labList");
    }

    private static <T> List<T> normalize(List<T> source, String fieldName) {
        Objects.requireNonNull(source, fieldName + " must not be null");
        return source.isEmpty() ? Collections.emptyList() : List.copyOf(source);
    }
}
