package open.dolphin.rest.dto.orca;

/**
 * Basic patient attributes shared across ORCA wrapper responses.
 */
public class PatientSummary {

    private String patientId;
    private String wholeName;
    private String wholeNameKana;
    private String birthDate;
    private String sex;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
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

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }
}
