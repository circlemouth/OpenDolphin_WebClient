package open.dolphin.rest.dto.orca;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Request payload for POST /orca/billing/estimate.
 */
public class BillingSimulationRequest {

    private String patientId;
    private String departmentCode;
    private LocalDate performDate;
    private final List<BillingItem> items = new ArrayList<>();

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public LocalDate getPerformDate() {
        return performDate;
    }

    public void setPerformDate(LocalDate performDate) {
        this.performDate = performDate;
    }

    public List<BillingItem> getItems() {
        return items;
    }

    public static class BillingItem {
        private String medicalCode;
        private int quantity;

        public String getMedicalCode() {
            return medicalCode;
        }

        public void setMedicalCode(String medicalCode) {
            this.medicalCode = medicalCode;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}
