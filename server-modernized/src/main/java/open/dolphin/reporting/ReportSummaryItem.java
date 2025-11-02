package open.dolphin.reporting;

import java.util.Objects;

/**
 * Single summary entry used in clinical report exports.
 */
public final class ReportSummaryItem {

    private final String label;
    private final String labelEn;
    private final String value;

    public ReportSummaryItem(String label, String labelEn, String value) {
        this.label = Objects.requireNonNull(label, "label must not be null");
        this.labelEn = Objects.requireNonNull(labelEn, "labelEn must not be null");
        this.value = Objects.requireNonNull(value, "value must not be null");
    }

    public String getLabel() {
        return label;
    }

    public String getLabelEn() {
        return labelEn;
    }

    public String getValue() {
        return value;
    }
}
