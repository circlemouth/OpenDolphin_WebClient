package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Request payload for POST /orca/appointments/mutation (appointmodv2).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AppointmentMutationRequest {

    /**
     * ORCA Request_Number / class parameter (01=create,02=cancel,03=new patient).
     */
    private String requestNumber;

    private String appointmentId;
    private String appointmentDate;
    private String appointmentTime;
    private String departmentCode;
    private String physicianCode;
    private String medicalInformation;
    private String appointmentInformation;
    private String appointmentNote;
    private String duplicateMode;
    private String visitInformation;
    private PatientSummary patient;

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(String appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(String appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(String appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public String getPhysicianCode() {
        return physicianCode;
    }

    public void setPhysicianCode(String physicianCode) {
        this.physicianCode = physicianCode;
    }

    public String getMedicalInformation() {
        return medicalInformation;
    }

    public void setMedicalInformation(String medicalInformation) {
        this.medicalInformation = medicalInformation;
    }

    public String getAppointmentInformation() {
        return appointmentInformation;
    }

    public void setAppointmentInformation(String appointmentInformation) {
        this.appointmentInformation = appointmentInformation;
    }

    public String getAppointmentNote() {
        return appointmentNote;
    }

    public void setAppointmentNote(String appointmentNote) {
        this.appointmentNote = appointmentNote;
    }

    public String getDuplicateMode() {
        return duplicateMode;
    }

    public void setDuplicateMode(String duplicateMode) {
        this.duplicateMode = duplicateMode;
    }

    public String getVisitInformation() {
        return visitInformation;
    }

    public void setVisitInformation(String visitInformation) {
        this.visitInformation = visitInformation;
    }

    public PatientSummary getPatient() {
        return patient;
    }

    public void setPatient(PatientSummary patient) {
        this.patient = patient;
    }
}
