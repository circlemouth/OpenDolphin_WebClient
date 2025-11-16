package open.dolphin.rest.dto.orca;

import java.time.LocalDate;

/**
 * Request payload for POST /orca/visits/list.
 */
public class VisitPatientListRequest {

    private LocalDate visitDate;
    private String requestNumber;

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }
}
