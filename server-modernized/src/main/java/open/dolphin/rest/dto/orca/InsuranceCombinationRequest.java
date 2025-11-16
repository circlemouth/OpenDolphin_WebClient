package open.dolphin.rest.dto.orca;

/**
 * Request payload for POST /orca/insurance/combinations.
 */
public class InsuranceCombinationRequest {

    private String patientId;
    private String rangeStart;
    private String rangeEnd;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getRangeStart() {
        return rangeStart;
    }

    public void setRangeStart(String rangeStart) {
        this.rangeStart = rangeStart;
    }

    public String getRangeEnd() {
        return rangeEnd;
    }

    public void setRangeEnd(String rangeEnd) {
        this.rangeEnd = rangeEnd;
    }
}
