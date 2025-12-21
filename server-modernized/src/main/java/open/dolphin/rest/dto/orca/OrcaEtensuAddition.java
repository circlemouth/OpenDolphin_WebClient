package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrcaEtensuAddition {

    private Integer nGroup;
    private String srycd;
    private Integer additionCode;

    public Integer getNGroup() {
        return nGroup;
    }

    public void setNGroup(Integer nGroup) {
        this.nGroup = nGroup;
    }

    public String getSrycd() {
        return srycd;
    }

    public void setSrycd(String srycd) {
        this.srycd = srycd;
    }

    public Integer getAdditionCode() {
        return additionCode;
    }

    public void setAdditionCode(Integer additionCode) {
        this.additionCode = additionCode;
    }
}
