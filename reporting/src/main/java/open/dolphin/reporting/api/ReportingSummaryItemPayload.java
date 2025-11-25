package open.dolphin.reporting.api;

/**
 * Summary item entry transmitted from the caller.
 */
public class ReportingSummaryItemPayload {

    private String label;
    private String labelEn;
    private String value;

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getLabelEn() {
        return labelEn;
    }

    public void setLabelEn(String labelEn) {
        this.labelEn = labelEn;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
