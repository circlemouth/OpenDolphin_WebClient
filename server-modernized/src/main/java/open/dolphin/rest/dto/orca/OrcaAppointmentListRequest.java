package open.dolphin.rest.dto.orca;

import java.time.LocalDate;

/**
 * Request payload for POST /orca/appointments/list.
 */
public class OrcaAppointmentListRequest {

    private LocalDate appointmentDate;
    private String medicalInformation;
    private String physicianCode;

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getMedicalInformation() {
        return medicalInformation;
    }

    public void setMedicalInformation(String medicalInformation) {
        this.medicalInformation = medicalInformation;
    }

    public String getPhysicianCode() {
        return physicianCode;
    }

    public void setPhysicianCode(String physicianCode) {
        this.physicianCode = physicianCode;
    }
}
