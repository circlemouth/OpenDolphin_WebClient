package open.dolphin.reporting.api;

/**
 * Patient section of ReportingPayload.
 */
public class ReportingPatientPayload {

    private String fullName;
    private String birthDate;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }
}
