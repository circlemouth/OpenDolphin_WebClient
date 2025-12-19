package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrcaInsurerEntry {

    private String payerCode;
    private String payerName;
    private String payerType;
    private Double payerRatio;
    private String prefCode;
    private String cityCode;
    private String zip;
    private String addressLine;
    private String phone;
    private String validFrom;
    private String validTo;
    private OrcaMasterMeta meta;

    public String getPayerCode() {
        return payerCode;
    }

    public void setPayerCode(String payerCode) {
        this.payerCode = payerCode;
    }

    public String getPayerName() {
        return payerName;
    }

    public void setPayerName(String payerName) {
        this.payerName = payerName;
    }

    public String getPayerType() {
        return payerType;
    }

    public void setPayerType(String payerType) {
        this.payerType = payerType;
    }

    public Double getPayerRatio() {
        return payerRatio;
    }

    public void setPayerRatio(Double payerRatio) {
        this.payerRatio = payerRatio;
    }

    public String getPrefCode() {
        return prefCode;
    }

    public void setPrefCode(String prefCode) {
        this.prefCode = prefCode;
    }

    public String getCityCode() {
        return cityCode;
    }

    public void setCityCode(String cityCode) {
        this.cityCode = cityCode;
    }

    public String getZip() {
        return zip;
    }

    public void setZip(String zip) {
        this.zip = zip;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(String validFrom) {
        this.validFrom = validFrom;
    }

    public String getValidTo() {
        return validTo;
    }

    public void setValidTo(String validTo) {
        this.validTo = validTo;
    }

    public OrcaMasterMeta getMeta() {
        return meta;
    }

    public void setMeta(OrcaMasterMeta meta) {
        this.meta = meta;
    }
}
