package open.dolphin.rest.dto.orca;

/**
 * Simplified projection of ORCA PublicInsurance_Information nodes.
 */
public class PublicInsuranceInfo {

    private String publicInsuranceClass;
    private String publicInsuranceName;
    private String publicInsurerNumber;
    private String publicInsuredPersonNumber;
    private String rateAdmission;
    private String rateOutpatient;
    private String certificateIssuedDate;
    private String certificateExpiredDate;

    public String getPublicInsuranceClass() {
        return publicInsuranceClass;
    }

    public void setPublicInsuranceClass(String publicInsuranceClass) {
        this.publicInsuranceClass = publicInsuranceClass;
    }

    public String getPublicInsuranceName() {
        return publicInsuranceName;
    }

    public void setPublicInsuranceName(String publicInsuranceName) {
        this.publicInsuranceName = publicInsuranceName;
    }

    public String getPublicInsurerNumber() {
        return publicInsurerNumber;
    }

    public void setPublicInsurerNumber(String publicInsurerNumber) {
        this.publicInsurerNumber = publicInsurerNumber;
    }

    public String getPublicInsuredPersonNumber() {
        return publicInsuredPersonNumber;
    }

    public void setPublicInsuredPersonNumber(String publicInsuredPersonNumber) {
        this.publicInsuredPersonNumber = publicInsuredPersonNumber;
    }

    public String getRateAdmission() {
        return rateAdmission;
    }

    public void setRateAdmission(String rateAdmission) {
        this.rateAdmission = rateAdmission;
    }

    public String getRateOutpatient() {
        return rateOutpatient;
    }

    public void setRateOutpatient(String rateOutpatient) {
        this.rateOutpatient = rateOutpatient;
    }

    public String getCertificateIssuedDate() {
        return certificateIssuedDate;
    }

    public void setCertificateIssuedDate(String certificateIssuedDate) {
        this.certificateIssuedDate = certificateIssuedDate;
    }

    public String getCertificateExpiredDate() {
        return certificateExpiredDate;
    }

    public void setCertificateExpiredDate(String certificateExpiredDate) {
        this.certificateExpiredDate = certificateExpiredDate;
    }
}
