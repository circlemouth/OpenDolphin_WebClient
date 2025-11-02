package open.dolphin.reporting;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Objects;

/**
 * Patient snapshot exposed to templates.
 */
public final class ReportPatient {

    private final String fullName;
    private final ReportDate birthDate;

    public ReportPatient(String fullName, LocalDate birthDate, Locale locale) {
        this.fullName = Objects.requireNonNull(fullName, "fullName must not be null");
        this.birthDate = new ReportDate(Objects.requireNonNull(birthDate, "birthDate must not be null"),
                Objects.requireNonNull(locale, "locale must not be null"));
    }

    public String getFullName() {
        return fullName;
    }

    public ReportDate getBirthDate() {
        return birthDate;
    }
}
