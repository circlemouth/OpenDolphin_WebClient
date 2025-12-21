package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrcaEtensuBundlingMember {

    private String groupCode;
    private String srycd;
    private Integer specialCondition;
    private Boolean excluded;

    public String getGroupCode() {
        return groupCode;
    }

    public void setGroupCode(String groupCode) {
        this.groupCode = groupCode;
    }

    public String getSrycd() {
        return srycd;
    }

    public void setSrycd(String srycd) {
        this.srycd = srycd;
    }

    public Integer getSpecialCondition() {
        return specialCondition;
    }

    public void setSpecialCondition(Integer specialCondition) {
        this.specialCondition = specialCondition;
    }

    public Boolean getExcluded() {
        return excluded;
    }

    public void setExcluded(Boolean excluded) {
        this.excluded = excluded;
    }
}
