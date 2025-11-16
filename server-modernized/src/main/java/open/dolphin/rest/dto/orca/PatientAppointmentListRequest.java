package open.dolphin.rest.dto.orca;

import java.time.LocalDate;

/**
 * Request payload for patient specific appointment lookups.
 */
public class PatientAppointmentListRequest {

    private String patientId;
    private LocalDate baseDate;
    private String departmentCode;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public LocalDate getBaseDate() {
        return baseDate;
    }

    public void setBaseDate(LocalDate baseDate) {
        this.baseDate = baseDate;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }
}
