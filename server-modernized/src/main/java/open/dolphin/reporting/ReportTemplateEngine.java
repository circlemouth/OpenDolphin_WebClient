package open.dolphin.reporting;

import java.io.File;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Properties;
import java.util.logging.Logger;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;
import org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader;

/**
 * Wrapper around Velocity that resolves templates based on locale-aware naming conventions.
 */
public final class ReportTemplateEngine {

    private static final Logger LOGGER = Logger.getLogger(ReportTemplateEngine.class.getName());
    private static final Locale DEFAULT_LOCALE = Locale.JAPAN;

    private final VelocityEngine engine;
    private final Locale defaultLocale;

    public ReportTemplateEngine(Path templateRoot) {
        this(templateRoot, DEFAULT_LOCALE);
    }

    public ReportTemplateEngine(Path templateRoot, Locale defaultLocale) {
        Objects.requireNonNull(defaultLocale, "defaultLocale must not be null");
        this.engine = createEngine(templateRoot);
        this.defaultLocale = defaultLocale;
    }

    public String render(String templateBaseName, Locale locale, ReportContext context) {
        Objects.requireNonNull(templateBaseName, "templateBaseName must not be null");
        Objects.requireNonNull(context, "context must not be null");
        Locale effectiveLocale = locale != null ? locale : defaultLocale;
        for (String candidate : buildCandidates(templateBaseName, effectiveLocale)) {
            if (engine.resourceExists(candidate)) {
                VelocityContext velocityContext = new VelocityContext();
                velocityContext.put("context", context);
                StringWriter writer = new StringWriter();
                engine.mergeTemplate(candidate, "UTF-8", velocityContext, writer);
                if (!candidate.equals(templateBaseName)) {
                    LOGGER.fine(() -> "Resolved template " + candidate + " for locale " + effectiveLocale);
                }
                return writer.toString();
            }
        }
        throw new IllegalArgumentException("Template not found for base name " + templateBaseName + " and locale " + effectiveLocale);
    }

    public static Path detectDefaultTemplateRoot() {
        List<Path> candidates = new ArrayList<>();
        String configured = System.getProperty("open.dolphin.templates.dir");
        if (configured != null && !configured.isBlank()) {
            candidates.add(Paths.get(configured));
        }
        String configuredEnv = System.getenv("OPENDOLPHIN_TEMPLATES_DIR");
        if (configuredEnv != null && !configuredEnv.isBlank()) {
            candidates.add(Paths.get(configuredEnv));
        }
        String jbossHome = System.getProperty("jboss.home.dir");
        if (jbossHome != null && !jbossHome.isBlank()) {
            candidates.add(Paths.get(jbossHome, "templates"));
        }
        Path repoTemplates = Paths.get("").toAbsolutePath().resolve("server-modernized").resolve("reporting").resolve("templates");
        candidates.add(repoTemplates);
        for (Path candidate : candidates) {
            if (candidate != null && Files.isDirectory(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private VelocityEngine createEngine(Path templateRoot) {
        Properties properties = new Properties();
        properties.setProperty("resource.loader", "file, classpath");
        properties.setProperty("input.encoding", "UTF-8");
        properties.setProperty("output.encoding", "UTF-8");
        properties.setProperty("runtime.log.logsystem.class", "org.apache.velocity.runtime.log.NullLogChute");
        properties.setProperty("file.resource.loader.cache", "false");
        if (templateRoot != null) {
            properties.setProperty("file.resource.loader.path", templateRoot.toAbsolutePath().toString());
        } else {
            properties.setProperty("file.resource.loader.path", new File("templates").getAbsolutePath());
        }
        properties.setProperty("classpath.resource.loader.class", ClasspathResourceLoader.class.getName());
        VelocityEngine engine = new VelocityEngine();
        engine.init(properties);
        return engine;
    }

    private List<String> buildCandidates(String baseName, Locale locale) {
        List<String> candidates = new ArrayList<>();
        String languageTag = locale.toString();
        if (!languageTag.isEmpty()) {
            candidates.add(baseName + '_' + languageTag + ".vm");
        }
        if (!locale.getLanguage().isEmpty()) {
            candidates.add(baseName + '_' + locale.getLanguage() + ".vm");
        }
        String defaultTag = defaultLocale.toString();
        if (!defaultTag.isEmpty()) {
            candidates.add(baseName + '_' + defaultTag + ".vm");
        }
        candidates.add(baseName + ".vm");
        return candidates;
    }
}
