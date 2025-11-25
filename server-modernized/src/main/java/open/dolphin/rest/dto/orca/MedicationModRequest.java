package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Request payload for POST /orca/tensu/sync (medicatonmodv2).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MedicationModRequest {

    private String requestNumber;
    private List<MedicationEntry> medications;

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public List<MedicationEntry> getMedications() {
        return medications;
    }

    public void setMedications(List<MedicationEntry> medications) {
        this.medications = medications;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MedicationEntry {
        private String medicationCode;
        private String medicationName;
        private String kanaName;
        private String unit;
        private String point;
        private String startDate;
        private String endDate;

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

        public String getKanaName() {
            return kanaName;
        }

        public void setKanaName(String kanaName) {
            this.kanaName = kanaName;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public String getPoint() {
            return point;
        }

        public void setPoint(String point) {
            this.point = point;
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
    }
}
