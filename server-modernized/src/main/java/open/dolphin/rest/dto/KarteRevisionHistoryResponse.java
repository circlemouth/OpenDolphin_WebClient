package open.dolphin.rest.dto;

import java.util.List;

/**
 * Phase1: response wrapper for encounter-level revision lookup.
 */
public class KarteRevisionHistoryResponse {

    private Long karteId;
    private String visitDate;
    private List<KarteRevisionGroupResponse> groups;

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

    public List<KarteRevisionGroupResponse> getGroups() {
        return groups;
    }

    public void setGroups(List<KarteRevisionGroupResponse> groups) {
        this.groups = groups;
    }
}

