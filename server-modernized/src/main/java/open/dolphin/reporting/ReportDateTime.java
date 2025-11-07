package open.dolphin.reporting;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;

/**
 * Zoned date time wrapper that offers Velocity-friendly formatting helpers.
 */
public final class ReportDateTime {

    private final ZonedDateTime value;
    private final Locale locale;

    public ReportDateTime(ZonedDateTime value, Locale locale) {
        this.value = Objects.requireNonNull(value, "value must not be null");
        this.locale = Objects.requireNonNull(locale, "locale must not be null");
    }

    public ZonedDateTime getValue() {
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
