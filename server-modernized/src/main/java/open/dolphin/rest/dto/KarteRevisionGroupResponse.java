package open.dolphin.rest.dto;

import java.util.List;

/**
 * Phase1: revision group for a single logical chart document.
 */
public class KarteRevisionGroupResponse {

    private Long rootRevisionId;
    private Long latestRevisionId;
    private Long karteId;
    private String visitDate;
    private List<KarteRevisionEntryResponse> items;

    public Long getRootRevisionId() {
        return rootRevisionId;
    }

    public void setRootRevisionId(Long rootRevisionId) {
        this.rootRevisionId = rootRevisionId;
    }

    public Long getLatestRevisionId() {
        return latestRevisionId;
    }

    public void setLatestRevisionId(Long latestRevisionId) {
        this.latestRevisionId = latestRevisionId;
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

    public List<KarteRevisionEntryResponse> getItems() {
        return items;
    }

    public void setItems(List<KarteRevisionEntryResponse> items) {
        this.items = items;
    }
}

