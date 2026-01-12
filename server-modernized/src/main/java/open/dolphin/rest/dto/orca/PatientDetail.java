package open.dolphin.rest.dto.orca;

import java.util.ArrayList;
import java.util.List;

/**
 * Detailed patient payload for batch/name-search endpoints.
 */
public class PatientDetail {

    private PatientSummary summary;
    private String zipCode;
    private String address;
    private String outpatientClass;
    private final List<InsuranceCombination> insurances = new ArrayList<>();
    private final List<PublicInsuranceInfo> publicInsurances = new ArrayList<>();

    public PatientSummary getSummary() {
        return summary;
    }

    public void setSummary(PatientSummary summary) {
        this.summary = summary;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getOutpatientClass() {
        return outpatientClass;
    }

    public void setOutpatientClass(String outpatientClass) {
        this.outpatientClass = outpatientClass;
    }

    public List<InsuranceCombination> getInsurances() {
        return insurances;
    }

    public List<PublicInsuranceInfo> getPublicInsurances() {
        return publicInsurances;
    }
}
