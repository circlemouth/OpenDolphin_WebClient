package open.dolphin.rest.dto.orca;

/**
 * Simplified projection of ORCA HealthInsurance_Information nodes.
 */
public class InsuranceCombination {

    private String combinationNumber;
    private String insuranceProviderClass;
    private String insuranceProviderNumber;
    private String insuranceProviderName;
    private String insuredPersonSymbol;
    private String insuredPersonNumber;
    private String rateAdmission;
    private String rateOutpatient;
    private String certificateStartDate;
    private String certificateExpiredDate;

    public String getCombinationNumber() {
        return combinationNumber;
    }

    public void setCombinationNumber(String combinationNumber) {
        this.combinationNumber = combinationNumber;
    }

    public String getInsuranceProviderClass() {
        return insuranceProviderClass;
    }

    public void setInsuranceProviderClass(String insuranceProviderClass) {
        this.insuranceProviderClass = insuranceProviderClass;
    }

    public String getInsuranceProviderNumber() {
        return insuranceProviderNumber;
    }

    public void setInsuranceProviderNumber(String insuranceProviderNumber) {
        this.insuranceProviderNumber = insuranceProviderNumber;
    }

    public String getInsuranceProviderName() {
        return insuranceProviderName;
    }

    public void setInsuranceProviderName(String insuranceProviderName) {
        this.insuranceProviderName = insuranceProviderName;
    }

    public String getInsuredPersonSymbol() {
        return insuredPersonSymbol;
    }

    public void setInsuredPersonSymbol(String insuredPersonSymbol) {
        this.insuredPersonSymbol = insuredPersonSymbol;
    }

    public String getInsuredPersonNumber() {
        return insuredPersonNumber;
    }

    public void setInsuredPersonNumber(String insuredPersonNumber) {
        this.insuredPersonNumber = insuredPersonNumber;
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

    public String getCertificateStartDate() {
        return certificateStartDate;
    }

    public void setCertificateStartDate(String certificateStartDate) {
        this.certificateStartDate = certificateStartDate;
    }

    public String getCertificateExpiredDate() {
        return certificateExpiredDate;
    }

    public void setCertificateExpiredDate(String certificateExpiredDate) {
        this.certificateExpiredDate = certificateExpiredDate;
    }
}
