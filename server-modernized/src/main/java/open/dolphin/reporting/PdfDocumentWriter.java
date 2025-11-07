package open.dolphin.reporting;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.List;
import com.lowagie.text.ListItem;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converts rendered Velocity output into an accessible PDF using OpenPDF.
 */
public final class PdfDocumentWriter {

    public void write(String templateOutput, ReportContext context, Path outputPath) throws IOException {
        if (outputPath.getParent() != null) {
            Files.createDirectories(outputPath.getParent());
        }
        Document document = new Document(PageSize.A4, 36, 36, 54, 54);
        try (OutputStream outputStream = Files.newOutputStream(outputPath)) {
            PdfWriter.getInstance(document, outputStream);
            document.open();
            BaseFont baseFont = createBaseFont();
            Font titleFont = new Font(baseFont, 16, Font.BOLD);
            Font bodyFont = new Font(baseFont, 12, Font.NORMAL);
            Font footerFont = new Font(baseFont, 10, Font.ITALIC);
            renderContent(document, templateOutput, context, titleFont, bodyFont, footerFont);
        } catch (DocumentException e) {
            throw new IOException("Failed to render PDF", e);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
    }

    private void renderContent(Document document, String templateOutput, ReportContext context,
            Font titleFont, Font bodyFont, Font footerFont) throws DocumentException {
        String bodyContent = extractTagContent(templateOutput, "body");
        if (bodyContent == null) {
            bodyContent = templateOutput;
        }

        String heading = context.getDocumentTitle();
        Matcher headingMatcher = Pattern.compile("(?is)<h1>(.*?)</h1>").matcher(bodyContent);
        if (headingMatcher.find()) {
            heading = htmlDecode(headingMatcher.group(1).trim());
            bodyContent = headingMatcher.replaceAll("");
        }

        String footerContent = extractTagContent(bodyContent, "footer");
        if (footerContent != null) {
            bodyContent = bodyContent.replaceFirst("(?is)<footer[^>]*>.*?</footer>", "");
        }

        bodyContent = bodyContent.replaceAll("(?i)<br\\s*/?>", "\n");
        bodyContent = bodyContent.replaceAll("(?is)</p>", "\n");
        bodyContent = bodyContent.replaceAll("(?is)<p[^>]*>", "");
        bodyContent = bodyContent.replaceAll("(?is)<[^>]+>", "");
        bodyContent = htmlDecode(bodyContent);

        document.add(new Paragraph(heading, titleFont));
        document.add(Chunk.NEWLINE);

        List currentList = null;
        for (String rawLine : bodyContent.split("\r?\n")) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                continue;
            }
            if (line.startsWith("* ")) {
                if (currentList == null) {
                    currentList = new List(List.UNORDERED);
                }
                currentList.add(new ListItem(line.substring(2).trim(), bodyFont));
            } else {
                if (currentList != null) {
                    document.add(currentList);
                    currentList = null;
                }
                document.add(new Paragraph(line, bodyFont));
            }
        }
        if (currentList != null) {
            document.add(currentList);
        }

        String footerText;
        if (footerContent != null) {
            footerText = htmlDecode(footerContent.replaceAll("(?is)<[^>]+>", "").trim());
        } else {
            footerText = context.getGeneratedAt().format("yyyy-MM-dd HH:mm");
        }
        if (!footerText.isEmpty()) {
            document.add(Chunk.NEWLINE);
            document.add(new Paragraph(footerText, footerFont));
        }
    }

    private String extractTagContent(String html, String tagName) {
        Matcher matcher = Pattern.compile("(?is)<" + tagName + "[^>]*>(.*?)</" + tagName + ">").matcher(html);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private BaseFont createBaseFont() throws DocumentException, IOException {
        try {
            return BaseFont.createFont("HeiseiKakuGo-W5", "UniJIS-UCS2-H", BaseFont.NOT_EMBEDDED);
        } catch (DocumentException | IOException ex) {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        }
    }

    private String htmlDecode(String value) {
        String decoded = value.replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&amp;", "&");
        return decoded;
    }
}
