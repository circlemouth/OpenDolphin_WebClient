package open.dolphin.rest.dto;

import java.util.List;
import java.util.Map;

/**
 * Phase1: best-effort diff summary between two revisions.
 */
public class KarteRevisionDiffResponse {

    private Long fromRevisionId;
    private Long toRevisionId;
    private Map<String, Object> summary;
    private List<String> changedEntities;
    private String generatedAt;

    public Long getFromRevisionId() {
        return fromRevisionId;
    }

    public void setFromRevisionId(Long fromRevisionId) {
        this.fromRevisionId = fromRevisionId;
    }

    public Long getToRevisionId() {
        return toRevisionId;
    }

    public void setToRevisionId(Long toRevisionId) {
        this.toRevisionId = toRevisionId;
    }

    public Map<String, Object> getSummary() {
        return summary;
    }

    public void setSummary(Map<String, Object> summary) {
        this.summary = summary;
    }

    public List<String> getChangedEntities() {
        return changedEntities;
    }

    public void setChangedEntities(List<String> changedEntities) {
        this.changedEntities = changedEntities;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }
}

