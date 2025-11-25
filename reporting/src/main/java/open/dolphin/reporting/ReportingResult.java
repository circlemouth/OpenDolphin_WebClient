package open.dolphin.reporting;

import java.util.Arrays;
import java.util.Locale;
import java.util.Objects;

/**
 * Result of Rendering a report.
 */
public final class ReportingResult {

    private final byte[] data;
    private final String fileName;
    private final String templateName;
    private final Locale locale;

    public ReportingResult(byte[] data, String fileName, String templateName, Locale locale) {
        this.data = Objects.requireNonNull(data, "data must not be null").clone();
        this.fileName = Objects.requireNonNull(fileName, "fileName must not be null");
        this.templateName = Objects.requireNonNull(templateName, "templateName must not be null");
        this.locale = Objects.requireNonNull(locale, "locale must not be null");
    }

    public byte[] getData() {
        return data.clone();
    }

    public String getFileName() {
        return fileName;
    }

    public String getTemplateName() {
        return templateName;
    }

    public Locale getLocale() {
        return locale;
    }

    @Override
    public String toString() {
        return "ReportingResult{" +
                "fileName='" + fileName + '\'' +
                ", templateName='" + templateName + '\'' +
                ", locale=" + locale +
                ", size=" + data.length +
                '}';
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof ReportingResult)) {
            return false;
        }
        ReportingResult other = (ReportingResult) obj;
        return fileName.equals(other.fileName)
                && templateName.equals(other.templateName)
                && locale.equals(other.locale)
                && Arrays.equals(data, other.data);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(fileName, templateName, locale);
        result = 31 * result + Arrays.hashCode(data);
        return result;
    }
}
