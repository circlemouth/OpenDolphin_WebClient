package open.dolphin.rest.dto.orca;

import java.util.ArrayList;
import java.util.List;

/**
 * Shared structure for patient list style responses.
 */
public abstract class AbstractPatientListResponse extends OrcaApiResponse {

    private int targetPatientCount;
    private int noTargetPatientCount;
    private final List<PatientDetail> patients = new ArrayList<>();

    public int getTargetPatientCount() {
        return targetPatientCount;
    }

    public void setTargetPatientCount(int targetPatientCount) {
        this.targetPatientCount = targetPatientCount;
    }

    public int getNoTargetPatientCount() {
        return noTargetPatientCount;
    }

    public void setNoTargetPatientCount(int noTargetPatientCount) {
        this.noTargetPatientCount = noTargetPatientCount;
    }

    public List<PatientDetail> getPatients() {
        return patients;
    }
}
