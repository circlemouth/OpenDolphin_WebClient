package open.dolphin.rest.dto;

/**
 * Phase1: revision list entry (immutable snapshot).
 */
public class KarteRevisionEntryResponse {

    private Long revisionId;
    private Long parentRevisionId;
    private Long rootRevisionId;
    private String confirmedAt;
    private String startedAt;
    private String status;
    private String creatorUserId;
    private String docType;
    private String title;

    public Long getRevisionId() {
        return revisionId;
    }

    public void setRevisionId(Long revisionId) {
        this.revisionId = revisionId;
    }

    public Long getParentRevisionId() {
        return parentRevisionId;
    }

    public void setParentRevisionId(Long parentRevisionId) {
        this.parentRevisionId = parentRevisionId;
    }

    public Long getRootRevisionId() {
        return rootRevisionId;
    }

    public void setRootRevisionId(Long rootRevisionId) {
        this.rootRevisionId = rootRevisionId;
    }

    public String getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(String confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(String startedAt) {
        this.startedAt = startedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatorUserId() {
        return creatorUserId;
    }

    public void setCreatorUserId(String creatorUserId) {
        this.creatorUserId = creatorUserId;
    }

    public String getDocType() {
        return docType;
    }

    public void setDocType(String docType) {
        this.docType = docType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}

