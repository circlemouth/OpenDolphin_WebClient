package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Request payload for POST /orca/medical-sets.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MedicalSetMutationRequest {

    private String requestNumber;
    private String patientId;
    private List<SetEntry> sets;

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public List<SetEntry> getSets() {
        return sets;
    }

    public void setSets(List<SetEntry> sets) {
        this.sets = sets;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SetEntry {
        private String medicalClass;
        private String medicationCode;
        private String medicationName;
        private String quantity;
        private String note;

        public String getMedicalClass() {
            return medicalClass;
        }

        public void setMedicalClass(String medicalClass) {
            this.medicalClass = medicalClass;
        }

        public String getMedicationCode() {
            return medicationCode;
        }

        public void setMedicationCode(String medicationCode) {
            this.medicationCode = medicationCode;
        }

        public String getMedicationName() {
            return medicationName;
        }

        public void setMedicationName(String medicationName) {
            this.medicationName = medicationName;
        }

        public String getQuantity() {
            return quantity;
        }

        public void setQuantity(String quantity) {
            this.quantity = quantity;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }
}
