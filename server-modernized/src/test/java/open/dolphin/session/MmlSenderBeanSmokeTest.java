package open.dolphin.session;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import open.dolphin.adm20.converter.ISendPackage;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.msg.dto.MmlDispatchResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MmlSenderBeanSmokeTest {

    @Test
    @DisplayName("send() generates SHIFT_JIS MML payload from CLI fixtures without CDI container")
    void sendGeneratesMmlPayload() throws Exception {
        Path payloadPath = Path.of("..", "tmp", "mml-tests", "send_mml_success.json").normalize();
        assertTrue(Files.exists(payloadPath), "fixture not found: " + payloadPath);

        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ISendPackage pkg = mapper.readValue(payloadPath.toFile(), ISendPackage.class);

        DocumentModel document = pkg.documentModel();
        assertNotNull(document, "documentModel conversion failed");
        assertTrue(document.getDocInfoModel().isSendMml(), "fixture must set sendMml=true");

        MmlSenderBean bean = new MmlSenderBean();
        MmlDispatchResult result = bean.send(document);

        assertNotNull(result);
        assertNotNull(result.payload());
        assertFalse(result.payload().isBlank(), "payload should contain serialized MML");
        assertEquals("SHIFT_JIS", result.encoding().toUpperCase(Locale.ROOT));
        assertTrue(result.byteLength() > 0);
        assertNotNull(result.sha256());
        assertEquals(document.getDocInfoModel().getDocId(), result.documentId());
    }
}
