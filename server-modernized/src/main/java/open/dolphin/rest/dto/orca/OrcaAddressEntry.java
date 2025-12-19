package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrcaAddressEntry {

    private String zip;
    private String prefCode;
    private String cityCode;
    private String city;
    private String town;
    private String kana;
    private String roman;
    private String fullAddress;
    private OrcaMasterMeta meta;

    public String getZip() {
        return zip;
    }

    public void setZip(String zip) {
        this.zip = zip;
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getTown() {
        return town;
    }

    public void setTown(String town) {
        this.town = town;
    }

    public String getKana() {
        return kana;
    }

    public void setKana(String kana) {
        this.kana = kana;
    }

    public String getRoman() {
        return roman;
    }

    public void setRoman(String roman) {
        this.roman = roman;
    }

    public String getFullAddress() {
        return fullAddress;
    }

    public void setFullAddress(String fullAddress) {
        this.fullAddress = fullAddress;
    }

    public OrcaMasterMeta getMeta() {
        return meta;
    }

    public void setMeta(OrcaMasterMeta meta) {
        this.meta = meta;
    }
}
