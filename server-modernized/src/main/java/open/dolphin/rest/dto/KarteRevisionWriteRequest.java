package open.dolphin.rest.dto;

/**
 * Phase2: append-only revision write request (revise/restore/do_copy).
 *
 * Minimal contract:
 * - sourceRevisionId: the revision to base the new snapshot on (required)
 * - baseRevisionId: expected latest revision at the time of writing (required; conflict detection)
 */
public class KarteRevisionWriteRequest {

    private Long sourceRevisionId;
    private Long baseRevisionId;

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
}

