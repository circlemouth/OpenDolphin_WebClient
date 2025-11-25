package open.dolphin.rest.dto.orca;

/**
 * Request payload for POST /orca/patients/former-names.
 */
public class FormerNameHistoryRequest {

    private String patientId;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }
}
