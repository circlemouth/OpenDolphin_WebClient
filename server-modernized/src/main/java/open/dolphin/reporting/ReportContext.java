package open.dolphin.reporting;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Immutable context passed to Velocity templates and PDF renderers.
 */
public final class ReportContext {

    private final Locale locale;
    private final String documentTitle;
    private final ReportPatient patient;
    private final String attendingDoctor;
    private final ReportDate encounterDate;
    private final ReportDateTime generatedAt;
    private final List<ReportSummaryItem> summaryItems;

    private ReportContext(Builder builder) {
        this.locale = builder.locale;
        this.documentTitle = builder.documentTitle;
        this.patient = builder.patient;
        this.attendingDoctor = builder.attendingDoctor;
        this.encounterDate = builder.encounterDate;
        this.generatedAt = builder.generatedAt;
        this.summaryItems = Collections.unmodifiableList(new ArrayList<>(builder.summaryItems));
    }

    public Locale getLocale() {
        return locale;
    }

    public String getDocumentTitle() {
        return documentTitle;
    }

    public ReportPatient getPatient() {
        return patient;
    }

    public String getAttendingDoctor() {
        return attendingDoctor;
    }

    public ReportDate getEncounterDate() {
        return encounterDate;
    }

    public ReportDateTime getGeneratedAt() {
        return generatedAt;
    }

    public List<ReportSummaryItem> getSummaryItems() {
        return summaryItems;
    }

    public static Builder builder(Locale locale) {
        return new Builder(locale);
    }

    public static final class Builder {

        private final Locale locale;
        private String documentTitle;
        private ReportPatient patient;
        private String attendingDoctor;
        private ReportDate encounterDate;
        private ReportDateTime generatedAt;
        private final List<ReportSummaryItem> summaryItems = new ArrayList<>();

        private Builder(Locale locale) {
            this.locale = Objects.requireNonNull(locale, "locale must not be null");
        }

        public Builder documentTitle(String documentTitle) {
            this.documentTitle = Objects.requireNonNull(documentTitle, "documentTitle must not be null");
            return this;
        }

        public Builder patient(String fullName, LocalDate birthDate) {
            this.patient = new ReportPatient(fullName, birthDate, locale);
            return this;
        }

        public Builder attendingDoctor(String attendingDoctor) {
            this.attendingDoctor = Objects.requireNonNull(attendingDoctor, "attendingDoctor must not be null");
            return this;
        }

        public Builder encounterDate(LocalDate encounterDate) {
            this.encounterDate = new ReportDate(Objects.requireNonNull(encounterDate, "encounterDate must not be null"), locale);
            return this;
        }

        public Builder generatedAt(ZonedDateTime generatedAt) {
            this.generatedAt = new ReportDateTime(Objects.requireNonNull(generatedAt, "generatedAt must not be null"), locale);
            return this;
        }

        public Builder addSummaryItem(String label, String labelEn, String value) {
            this.summaryItems.add(new ReportSummaryItem(label, labelEn, Objects.requireNonNull(value, "value must not be null")));
            return this;
        }

        public ReportContext build() {
            Objects.requireNonNull(documentTitle, "documentTitle must not be null");
            Objects.requireNonNull(patient, "patient must not be null");
            Objects.requireNonNull(attendingDoctor, "attendingDoctor must not be null");
            Objects.requireNonNull(encounterDate, "encounterDate must not be null");
            Objects.requireNonNull(generatedAt, "generatedAt must not be null");
            return new ReportContext(this);
        }
    }
}
