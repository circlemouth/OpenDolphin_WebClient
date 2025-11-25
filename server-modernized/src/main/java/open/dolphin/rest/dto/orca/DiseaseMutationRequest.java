package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Request payload for POST /orca/disease and /orca/disease/v3.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DiseaseMutationRequest {

    private String patientId;
    private List<MutationEntry> operations;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public List<MutationEntry> getOperations() {
        return operations;
    }

    public void setOperations(List<MutationEntry> operations) {
        this.operations = operations;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MutationEntry {
        private String operation; // create/update/delete
        private Long diagnosisId;
        private String diagnosisName;
        private String diagnosisCode;
        private String departmentCode;
        private String insuranceCombinationNumber;
        private String startDate;
        private String endDate;
        private String outcome;
        private String category;
        private String suspectedFlag;
        private String note;

        public String getOperation() {
            return operation;
        }

        public void setOperation(String operation) {
            this.operation = operation;
        }

        public Long getDiagnosisId() {
            return diagnosisId;
        }

        public void setDiagnosisId(Long diagnosisId) {
            this.diagnosisId = diagnosisId;
        }

        public String getDiagnosisName() {
            return diagnosisName;
        }

        public void setDiagnosisName(String diagnosisName) {
            this.diagnosisName = diagnosisName;
        }

        public String getDiagnosisCode() {
            return diagnosisCode;
        }

        public void setDiagnosisCode(String diagnosisCode) {
            this.diagnosisCode = diagnosisCode;
        }

        public String getDepartmentCode() {
            return departmentCode;
        }

        public void setDepartmentCode(String departmentCode) {
            this.departmentCode = departmentCode;
        }

        public String getInsuranceCombinationNumber() {
            return insuranceCombinationNumber;
        }

        public void setInsuranceCombinationNumber(String insuranceCombinationNumber) {
            this.insuranceCombinationNumber = insuranceCombinationNumber;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(String endDate) {
            this.endDate = endDate;
        }

        public String getOutcome() {
            return outcome;
        }

        public void setOutcome(String outcome) {
            this.outcome = outcome;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getSuspectedFlag() {
            return suspectedFlag;
        }

        public void setSuspectedFlag(String suspectedFlag) {
            this.suspectedFlag = suspectedFlag;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }
}
