package open.dolphin.rest.dto.orca;

import java.util.ArrayList;
import java.util.List;

/**
 * Response payload for patient identifier synchronization.
 */
public class PatientIdListResponse extends OrcaApiResponse {

    private int targetPatientCount;
    private final List<PatientSyncEntry> patients = new ArrayList<>();

    public int getTargetPatientCount() {
        return targetPatientCount;
    }

    public void setTargetPatientCount(int targetPatientCount) {
        this.targetPatientCount = targetPatientCount;
    }

    public List<PatientSyncEntry> getPatients() {
        return patients;
    }

    public static class PatientSyncEntry {
        private PatientSummary summary;
        private String createDate;
        private String updateDate;
        private String updateTime;

        public PatientSummary getSummary() {
            return summary;
        }

        public void setSummary(PatientSummary summary) {
            this.summary = summary;
        }

        public String getCreateDate() {
            return createDate;
        }

        public void setCreateDate(String createDate) {
            this.createDate = createDate;
        }

        public String getUpdateDate() {
            return updateDate;
        }

        public void setUpdateDate(String updateDate) {
            this.updateDate = updateDate;
        }

        public String getUpdateTime() {
            return updateTime;
        }

        public void setUpdateTime(String updateTime) {
            this.updateTime = updateTime;
        }
    }
}
