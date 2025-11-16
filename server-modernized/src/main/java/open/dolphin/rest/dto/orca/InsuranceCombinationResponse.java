package open.dolphin.rest.dto.orca;

import java.util.ArrayList;
import java.util.List;

/**
 * Response payload for POST /orca/insurance/combinations.
 */
public class InsuranceCombinationResponse extends OrcaApiResponse {

    private PatientSummary patient;
    private final List<InsuranceCombination> combinations = new ArrayList<>();

    public PatientSummary getPatient() {
        return patient;
    }

    public void setPatient(PatientSummary patient) {
        this.patient = patient;
    }

    public List<InsuranceCombination> getCombinations() {
        return combinations;
    }
}
