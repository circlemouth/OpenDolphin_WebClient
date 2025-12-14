package open.dolphin.infomodel;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;
import java.util.HashMap;
import java.util.Map;

/**
 * ModuleJsonConverter の beanJson 正常系をカバーする簡易テスト。
 */
public class ModuleJsonConverterTest {

    @Test
    public void serializeAndDecode_roundTripsWithBeanJson() {
        ModuleJsonConverter converter = ModuleJsonConverter.getInstance();
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "json-path");
        payload.put("count", 2);

        String json = converter.serialize(payload);
        assertNotNull("beanJson should be generated", json);

        ModuleModel module = new ModuleModel();
        module.setBeanJson(json);

        Object decoded = converter.decode(module);
        assertNotNull("decode should prefer beanJson", decoded);
        assertEquals(payload, decoded);
    }
}
