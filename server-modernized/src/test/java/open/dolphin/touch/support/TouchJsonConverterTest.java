package open.dolphin.touch.support;

import static org.junit.jupiter.api.Assertions.*;

import java.beans.XMLEncoder;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import open.dolphin.infomodel.IStampTreeModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.infomodel.StampTreeModel;
import open.dolphin.infomodel.TextStampModel;
import open.dolphin.rest.jackson.LegacyObjectMapperProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;

class TouchJsonConverterTest {

    private TouchJsonConverter converter;

    @BeforeEach
    void setUp() throws Exception {
        converter = new TouchJsonConverter();
        ObjectMapper mapper = new LegacyObjectMapperProducer().provideLegacyAwareMapper();
        Field field = TouchJsonConverter.class.getDeclaredField("legacyTouchMapper");
        field.setAccessible(true);
        field.set(converter, mapper);
    }

    @Test
    void convertsStampTreeXml() throws Exception {
        IStampTreeModel model = new StampTreeModel();
        String xml = "<stampBox><stampTree name=\"diagnosis\" entity=\"diagnosis\"><root name=\"Root\" entity=\"diagnosis\"><stampInfo name=\"Test\" role=\"role\" entity=\"entity\" editable=\"true\" memo=\"memo\" stampId=\"stamp-1\"/></root></stampTree></stampBox>";
        model.setTreeBytes(xml.getBytes(StandardCharsets.UTF_8));

        String json = converter.convertStampTree(model);

        assertNotNull(json);
        assertTrue(json.contains("stampTreeList"));
    }

    @Test
    void convertsStampXml() throws Exception {
        TextStampModel text = new TextStampModel();
        text.setText("sample");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (XMLEncoder encoder = new XMLEncoder(baos)) {
            encoder.writeObject(text);
        }
        StampModel stamp = new StampModel();
        stamp.setStampBytes(baos.toByteArray());

        String json = converter.convertStamp(stamp);

        assertNotNull(json);
        assertFalse(json.isBlank());
    }

    @Test
    void readsLegacyPayloadWithJavaTime() throws Exception {
        String payload = "{\"issuedAt\":\"2026-06-18T09:15:30+09:00\"}";

        JavaTimeEnvelope envelope = converter.readLegacy(payload, JavaTimeEnvelope.class);

        assertEquals(OffsetDateTime.parse("2026-06-18T00:15:30Z"), envelope.getIssuedAt());
    }

    private static class JavaTimeEnvelope {
        private OffsetDateTime issuedAt;

        OffsetDateTime getIssuedAt() {
            return issuedAt;
        }

        void setIssuedAt(OffsetDateTime issuedAt) {
            this.issuedAt = issuedAt;
        }
    }
}
