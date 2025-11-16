package open.dolphin.rest.dto.orca;

import java.util.ArrayList;
import java.util.List;

/**
 * Request payload for POST /orca/patients/batch.
 */
public class PatientBatchRequest {

    private final List<String> patientIds = new ArrayList<>();
    private boolean includeInsurance = true;

    public List<String> getPatientIds() {
        return patientIds;
    }

    public boolean isIncludeInsurance() {
        return includeInsurance;
    }

    public void setIncludeInsurance(boolean includeInsurance) {
        this.includeInsurance = includeInsurance;
    }
}
