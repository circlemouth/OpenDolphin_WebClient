package open.dolphin.reporting;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Objects;
import java.util.logging.Logger;

/**
 * High level façade that renders Velocity templates and produces signed PDFs.
 */
public final class PdfRenderer {

    private static final Logger LOGGER = Logger.getLogger(PdfRenderer.class.getName());

    private final ReportTemplateEngine templateEngine;
    private final PdfDocumentWriter documentWriter;
    private final PdfSigningService signingService;

    public PdfRenderer(ReportTemplateEngine templateEngine, PdfDocumentWriter documentWriter,
            PdfSigningService signingService) {
        this.templateEngine = Objects.requireNonNull(templateEngine, "templateEngine must not be null");
        this.documentWriter = Objects.requireNonNull(documentWriter, "documentWriter must not be null");
        this.signingService = Objects.requireNonNull(signingService, "signingService must not be null");
    }

    public Path render(String templateBaseName, ReportContext context, Path outputPath, SigningConfig signingConfig)
            throws IOException {
        Objects.requireNonNull(templateBaseName, "templateBaseName must not be null");
        Objects.requireNonNull(context, "context must not be null");
        Objects.requireNonNull(outputPath, "outputPath must not be null");
        Locale locale = context.getLocale();
        String rendered = templateEngine.render(templateBaseName, locale, context);
        documentWriter.write(rendered, context, outputPath);
        if (signingConfig != null) {
            LOGGER.info(() -> "Applying digital signature using keystore " + signingConfig.getKeystorePath());
            signingService.sign(outputPath, signingConfig);
        }
        return outputPath;
    }
}
