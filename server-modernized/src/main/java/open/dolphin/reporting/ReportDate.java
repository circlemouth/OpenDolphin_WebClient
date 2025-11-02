package open.dolphin.reporting;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;

/**
 * Value object that exposes locale-aware formatting helpers for Velocity templates.
 */
public final class ReportDate {

    private final LocalDate value;
    private final Locale locale;

    public ReportDate(LocalDate value, Locale locale) {
        this.value = Objects.requireNonNull(value, "value must not be null");
        this.locale = Objects.requireNonNull(locale, "locale must not be null");
    }

    public LocalDate getValue() {
        return value;
    }

    public Locale getLocale() {
        return locale;
    }

    public String format(String pattern) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern, locale);
        return value.format(formatter);
    }
}
