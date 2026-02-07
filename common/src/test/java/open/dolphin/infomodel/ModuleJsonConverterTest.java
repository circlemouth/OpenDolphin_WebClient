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

    @Test
    public void decode_plainJsonWithoutClass_usesFallbackMapper() throws Exception {
        ModuleJsonConverter converter = ModuleJsonConverter.getInstance();
        Map<String, Object> payload = new HashMap<>();
        payload.put("text", "plain-json");

        String plainJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);

        ModuleModel module = new ModuleModel();
        module.setBeanJson(plainJson);

        Object decoded = converter.decode(module);
        assertNotNull("decode should succeed even without @class type info", decoded);
        assertEquals(payload, decoded);
    }

    @Test
    public void serializeAndDecode_bundleDolphinWithArrayClaims() {
        ModuleJsonConverter converter = ModuleJsonConverter.getInstance();
        BundleDolphin bundle = new BundleDolphin();
        bundle.setOrderName("json-bundle");
        bundle.setBundleNumber("1");
        bundle.setClassCode("001");
        bundle.setClassCodeSystem("1.2.392.200119.4.22.3");
        bundle.setClassName("test");
        bundle.setAdmin("oral");

        ClaimItem item = new ClaimItem();
        item.setName("item");
        item.setCode("CODE");
        item.setNumber("1");
        item.setUnit("pack");
        bundle.setClaimItem(new ClaimItem[]{item});

        String json = converter.serialize(bundle);
        assertNotNull("beanJson should be generated", json);

        ModuleModel module = new ModuleModel();
        module.setBeanJson(json);
        Object decoded = converter.decode(module);
        assertNotNull("bundle should be restored from beanJson", decoded);
        assertEquals(BundleDolphin.class, decoded.getClass());
        BundleDolphin restored = (BundleDolphin) decoded;
        assertEquals("json-bundle", restored.getOrderName());
        assertNotNull(restored.getClaimItem());
        assertEquals(1, restored.getClaimItem().length);
        assertEquals("item", restored.getClaimItem()[0].getName());
    }
}
