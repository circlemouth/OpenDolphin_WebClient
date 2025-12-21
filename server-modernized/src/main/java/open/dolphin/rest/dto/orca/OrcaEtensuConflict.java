package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrcaEtensuConflict {

    private String scope;
    private String leftSrycd;
    private String rightSrycd;
    private Integer rule;
    private Integer specialCondition;

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public String getLeftSrycd() {
        return leftSrycd;
    }

    public void setLeftSrycd(String leftSrycd) {
        this.leftSrycd = leftSrycd;
    }

    public String getRightSrycd() {
        return rightSrycd;
    }

    public void setRightSrycd(String rightSrycd) {
        this.rightSrycd = rightSrycd;
    }

    public Integer getRule() {
        return rule;
    }

    public void setRule(Integer rule) {
        this.rule = rule;
    }

    public Integer getSpecialCondition() {
        return specialCondition;
    }

    public void setSpecialCondition(Integer specialCondition) {
        this.specialCondition = specialCondition;
    }
}
