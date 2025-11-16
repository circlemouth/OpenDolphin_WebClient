package open.dolphin.rest.dto;

import java.util.List;

/**
 * RP history entry response.
 */
public class RpHistoryEntryResponse {

    private final String issuedDate;
    private final String memo;
    private final List<RpHistoryDrugResponse> rpList;

    public RpHistoryEntryResponse(String issuedDate, String memo, List<RpHistoryDrugResponse> rpList) {
        this.issuedDate = issuedDate;
        this.memo = memo;
        this.rpList = rpList;
    }

    public String getIssuedDate() {
        return issuedDate;
    }

    public String getMemo() {
        return memo;
    }

    public List<RpHistoryDrugResponse> getRpList() {
        return rpList;
    }
}
