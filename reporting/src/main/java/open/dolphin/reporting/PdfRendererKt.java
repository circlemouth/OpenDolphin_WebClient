package open.dolphin.reporting;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Command line entry point invoked by CI to render sample PDFs.
 */
public final class PdfRendererKt {

    private PdfRendererKt() {
    }

    public static void main(String[] args) throws Exception {
        Map<String, String> options = parseArgs(args);
        if (options.containsKey("help")) {
            printUsage();
            return;
        }
        Path templateRoot = resolveTemplateRoot(options.get("templates"));
        if (templateRoot == null) {
            System.err.println("テンプレートディレクトリが見つかりません。--templates で明示的に指定してください。");
            System.exit(1);
            return;
        }
        Locale locale = ReportLocales.parseOrDefault(options.get("locale"), Locale.JAPAN);
        String templateName = options.getOrDefault("template", "patient_summary");
        Path outputPath = Paths.get(options.getOrDefault("output", "reporting/output/sample.pdf"));

        SigningConfig signingConfig = null;
        String configPathValue = options.get("config");
        if (configPathValue != null) {
            Path configPath = Paths.get(configPathValue);
            if (!Files.exists(configPath)) {
                System.err.println("署名設定ファイルが見つかりません: " + configPath);
                System.exit(2);
                return;
            }
            try {
                signingConfig = SigningConfig.fromJson(configPath);
            } catch (IOException e) {
                System.err.println("署名設定の読み込みに失敗しました: " + e.getMessage());
                System.exit(3);
                return;
            }
        }

        ReportContext context = buildSampleContext(locale);
        PdfRenderer renderer = new PdfRenderer(new ReportTemplateEngine(templateRoot),
                new PdfDocumentWriter(), new PdfSigningService());
        renderer.render(templateName, context, outputPath, signingConfig);
        System.out.println("Generated PDF: " + outputPath.toAbsolutePath());
    }

    private static Path resolveTemplateRoot(String explicitPath) {
        if (explicitPath != null) {
            Path path = Paths.get(explicitPath);
            if (Files.isDirectory(path)) {
                return path;
            }
            return null;
        }
        return ReportTemplateEngine.detectDefaultTemplateRoot();
    }

    private static ReportContext buildSampleContext(Locale locale) {
        boolean english = "en".equalsIgnoreCase(locale.getLanguage());
        String documentTitle = english ? "Patient Summary" : "患者サマリー";
        String attendingDoctor = english ? "Dr. Alice Smith" : "医師 山田花子";
        String patientName = english ? "John Doe" : "山田 太郎";
        LocalDate birthDate = LocalDate.of(1985, 5, 23);
        LocalDate encounterDate = LocalDate.now();
        ZonedDateTime generatedAt = ZonedDateTime.now(ZoneId.systemDefault());

        ReportContext.Builder builder = ReportContext.builder(locale)
                .documentTitle(documentTitle)
                .patient(patientName, birthDate)
                .attendingDoctor(attendingDoctor)
                .encounterDate(encounterDate)
                .generatedAt(generatedAt);

        builder.addSummaryItem(english ? "Chief Complaint" : "主訴",
                "Chief Complaint",
                english ? "Fever and sore throat" : "発熱と咽頭痛");
        builder.addSummaryItem(english ? "Allergies" : "アレルギー",
                "Allergies",
                english ? "None" : "特記事項なし");
        builder.addSummaryItem(english ? "Current Medication" : "内服薬",
                "Current Medication",
                english ? "Acetaminophen 500mg" : "アセトアミノフェン 500mg");
        builder.addSummaryItem(english ? "Next Appointment" : "次回予約",
                "Next Appointment",
                english ? "Follow-up in two weeks" : "2週間後に再診");
        return builder.build();
    }

    private static Map<String, String> parseArgs(String[] args) {
        Map<String, String> options = new HashMap<>();
        for (int i = 0; i < args.length; i++) {
            String arg = args[i];
            if (arg.startsWith("--")) {
                String key = arg.substring(2);
                String value = "true";
                if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                    value = args[++i];
                }
                options.put(key, value);
            }
        }
        return options;
    }

    private static void printUsage() {
        System.out.println("Usage: PdfRendererKt --templates <dir> --output <file> --locale <ja-JP|en-US> --config <json>");
        System.out.println("  --template    Base template name (default: patient_summary)");
        System.out.println("  --templates   Template directory. Defaults to detected reporting/templates");
        System.out.println("  --output      Output PDF path (default: reporting/output/sample.pdf)");
        System.out.println("  --locale      Locale tag (default: ja-JP)");
        System.out.println("  --config      Optional signing-config JSON");
    }
}
