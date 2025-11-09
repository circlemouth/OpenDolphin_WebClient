package open.dolphin.reporting;

import java.util.Locale;
import java.util.Objects;

/**
 * Helpers for parsing locale strings used in reporting configuration.
 */
public final class ReportLocales {

    private ReportLocales() {
    }

    public static Locale parseOrDefault(String value, Locale defaultLocale) {
        Objects.requireNonNull(defaultLocale, "defaultLocale must not be null");
        if (value == null || value.trim().isEmpty()) {
            return defaultLocale;
        }
        Locale locale = Locale.forLanguageTag(value.replace('_', '-'));
        if (locale.getLanguage().isEmpty()) {
            return defaultLocale;
        }
        return locale;
    }
}
