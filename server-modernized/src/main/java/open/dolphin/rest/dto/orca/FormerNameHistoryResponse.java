package open.dolphin.rest.dto.orca;

import java.util.ArrayList;
import java.util.List;

/**
 * Response payload for POST /orca/patients/former-names.
 */
public class FormerNameHistoryResponse extends OrcaApiResponse {

    private PatientSummary patient;
    private final List<FormerNameRecord> formerNames = new ArrayList<>();

    public PatientSummary getPatient() {
        return patient;
    }

    public void setPatient(PatientSummary patient) {
        this.patient = patient;
    }

    public List<FormerNameRecord> getFormerNames() {
        return formerNames;
    }

    public static class FormerNameRecord {
        private String changeDate;
        private String wholeName;
        private String wholeNameKana;
        private String nickName;

        public String getChangeDate() {
            return changeDate;
        }

        public void setChangeDate(String changeDate) {
            this.changeDate = changeDate;
        }

        public String getWholeName() {
            return wholeName;
        }

        public void setWholeName(String wholeName) {
            this.wholeName = wholeName;
        }

        public String getWholeNameKana() {
            return wholeNameKana;
        }

        public void setWholeNameKana(String wholeNameKana) {
            this.wholeNameKana = wholeNameKana;
        }

        public String getNickName() {
            return nickName;
        }

        public void setNickName(String nickName) {
            this.nickName = nickName;
        }
    }
}
