package open.dolphin.reporting;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.reporting.api.ReportingPayload;
import open.dolphin.reporting.api.ReportingPatientPayload;
import open.dolphin.reporting.api.ReportingSigningPayload;
import open.dolphin.reporting.api.ReportingSummaryItemPayload;

/**
 * High level façade for REST resources and CLI tools.
 */
public final class ReportingEngine {

    private static final Logger LOGGER = Logger.getLogger(ReportingEngine.class.getName());
    private static final String DEFAULT_TEMPLATE = "patient_summary";
    private static final DateTimeFormatter FILE_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final PdfRenderer renderer;

    public ReportingEngine() {
        this(ReportTemplateEngine.detectDefaultTemplateRoot());
    }

    public ReportingEngine(Path templateRoot) {
        ReportTemplateEngine templateEngine = new ReportTemplateEngine(templateRoot);
        this.renderer = new PdfRenderer(templateEngine, new PdfDocumentWriter(), new PdfSigningService());
        if (templateRoot == null) {
            LOGGER.info("Template root not specified. Falling back to classpath resources.");
        } else {
            LOGGER.info(() -> "Reporting templates directory: " + templateRoot.toAbsolutePath());
        }
    }

    public ReportingResult render(ReportingPayload payload) throws IOException {
        Objects.requireNonNull(payload, "payload must not be null");
        String templateName = sanitize(requireOrDefault(payload.getTemplate(), DEFAULT_TEMPLATE));
        Locale locale = ReportLocales.parseOrDefault(payload.getLocale(), Locale.JAPAN);
        RenderingContext renderingContext = buildContext(payload, locale, templateName);
        Path output = Files.createTempFile("opendolphin-report-", ".pdf");
        try {
            renderer.render(templateName, renderingContext.reportContext(), output, renderingContext.signingConfig());
            byte[] bytes = Files.readAllBytes(output);
            return new ReportingResult(bytes, renderingContext.fileName(), templateName, locale);
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "PDF rendering failed", ex);
            if (ex instanceof IOException) {
                throw (IOException) ex;
            }
            throw new IOException("Failed to render PDF", ex);
        } finally {
            Files.deleteIfExists(output);
        }
    }

    private RenderingContext buildContext(ReportingPayload payload, Locale locale, String templateName) {
        String documentTitle = require(payload.getDocumentTitle(), "documentTitle");
        ReportingPatientPayload patient = require(payload.getPatient(), "patient");
        String fullName = require(patient.getFullName(), "patient.fullName");
        LocalDate birthDate = parseLocalDate(require(patient.getBirthDate(), "patient.birthDate"), "patient.birthDate");
        LocalDate encounterDate = parseLocalDate(require(payload.getEncounterDate(), "encounterDate"), "encounterDate");
        ZonedDateTime generatedAt = parseGeneratedAt(payload.getGeneratedAt());
        ReportContext.Builder builder = ReportContext.builder(locale)
                .documentTitle(documentTitle)
                .patient(fullName, birthDate)
                .attendingDoctor(require(payload.getAttendingDoctor(), "attendingDoctor"))
                .encounterDate(encounterDate)
                .generatedAt(generatedAt);
        if (payload.getSummaryItems() != null) {
            for (ReportingSummaryItemPayload item : payload.getSummaryItems()) {
                if (item == null) {
                    continue;
                }
                String label = require(item.getLabel(), "summaryItems.label");
                String labelEn = require(item.getLabelEn(), "summaryItems.labelEn");
                String value = require(item.getValue(), "summaryItems.value");
                builder.addSummaryItem(label, labelEn, value);
            }
        }
        ReportContext context = builder.build();
        SigningConfig signingConfig = buildSigningConfig(payload.getSigning());
        String fileName = resolveFileName(payload.getOutputFileName(), templateName, locale, generatedAt);
        return new RenderingContext(context, signingConfig, fileName);
    }

    private String resolveFileName(String requested, String templateName, Locale locale, ZonedDateTime generatedAt) {
        String base = requested;
        if (isBlank(base)) {
            base = templateName + '-' + locale.toLanguageTag() + '-' + FILE_TIMESTAMP.format(generatedAt);
        }
        base = sanitize(base);
        if (!base.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            base = base + ".pdf";
        }
        return base;
    }

    private SigningConfig buildSigningConfig(ReportingSigningPayload signing) {
        if (signing == null) {
            return null;
        }
        SigningConfig.Builder builder = new SigningConfig.Builder()
                .keystorePath(Paths.get(require(signing.getKeystorePath(), "signing.keystorePath")))
                .keystorePassword(require(signing.getKeystorePassword(), "signing.keystorePassword").toCharArray())
                .keyAlias(require(signing.getKeyAlias(), "signing.keyAlias"));
        if (!isBlank(signing.getTsaUrl())) {
            builder.tsaUrl(signing.getTsaUrl());
        }
        if (!isBlank(signing.getTsaUsername())) {
            builder.tsaUsername(signing.getTsaUsername());
        }
        if (!isBlank(signing.getTsaPassword())) {
            builder.tsaPassword(signing.getTsaPassword().toCharArray());
        }
        if (signing.getReason() != null) {
            builder.reason(signing.getReason());
        }
        if (signing.getLocation() != null) {
            builder.location(signing.getLocation());
        }
        return builder.build();
    }

    private LocalDate parseLocalDate(String value, String field) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Invalid " + field + ": " + value, ex);
        }
    }

    private ZonedDateTime parseGeneratedAt(String value) {
        if (isBlank(value)) {
            return ZonedDateTime.now();
        }
        try {
            return ZonedDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            try {
                return OffsetDateTime.parse(value).toZonedDateTime();
            } catch (DateTimeParseException ignored) {
                try {
                    return LocalDateTime.parse(value).atZone(ZonedDateTime.now().getZone());
                } catch (DateTimeParseException finalEx) {
                    throw new IllegalArgumentException("Invalid generatedAt: " + value, finalEx);
                }
            }
        }
    }

    private String sanitize(String raw) {
        String value = raw.replaceAll("[^A-Za-z0-9._-]", "_");
        if (isBlank(value)) {
            return "report.pdf";
        }
        return value;
    }

    private String requireOrDefault(String value, String defaultValue) {
        if (isBlank(value)) {
            return defaultValue;
        }
        return value.trim();
    }

    private <T> T require(T value, String field) {
        if (value == null) {
            throw new IllegalArgumentException("Missing required field: " + field);
        }
        if (value instanceof String) {
            String str = ((String) value).trim();
            if (str.isEmpty()) {
                throw new IllegalArgumentException("Missing required field: " + field);
            }
        }
        return value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static final class RenderingContext {
        private final ReportContext reportContext;
        private final SigningConfig signingConfig;
        private final String fileName;

        private RenderingContext(ReportContext reportContext, SigningConfig signingConfig, String fileName) {
            this.reportContext = reportContext;
            this.signingConfig = signingConfig;
            this.fileName = fileName;
        }

        private ReportContext reportContext() {
            return reportContext;
        }

        private SigningConfig signingConfig() {
            return signingConfig;
        }

        private String fileName() {
            return fileName;
        }
    }
}
