package open.dolphin.rest.dto;

/**
 * Phase2: append-only revision write response.
 */
public class KarteRevisionWriteResponse {

    private String operation;
    private String operationPhase;
    private Long karteId;
    private String visitDate;
    private Long rootRevisionId;
    private Long sourceRevisionId;
    private Long baseRevisionId;
    private Long parentRevisionId;
    private Long createdRevisionId;
    private String createdAt;

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getOperationPhase() {
        return operationPhase;
    }

    public void setOperationPhase(String operationPhase) {
        this.operationPhase = operationPhase;
    }

    public Long getKarteId() {
        return karteId;
    }

    public void setKarteId(Long karteId) {
        this.karteId = karteId;
    }

    public String getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(String visitDate) {
        this.visitDate = visitDate;
    }

    public Long getRootRevisionId() {
        return rootRevisionId;
    }

    public void setRootRevisionId(Long rootRevisionId) {
        this.rootRevisionId = rootRevisionId;
    }

    public Long getSourceRevisionId() {
        return sourceRevisionId;
    }

    public void setSourceRevisionId(Long sourceRevisionId) {
        this.sourceRevisionId = sourceRevisionId;
    }

    public Long getBaseRevisionId() {
        return baseRevisionId;
    }

    public void setBaseRevisionId(Long baseRevisionId) {
        this.baseRevisionId = baseRevisionId;
    }

    public Long getParentRevisionId() {
        return parentRevisionId;
    }

    public void setParentRevisionId(Long parentRevisionId) {
        this.parentRevisionId = parentRevisionId;
    }

    public Long getCreatedRevisionId() {
        return createdRevisionId;
    }

    public void setCreatedRevisionId(Long createdRevisionId) {
        this.createdRevisionId = createdRevisionId;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}

