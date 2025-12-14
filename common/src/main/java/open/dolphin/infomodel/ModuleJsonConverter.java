package open.dolphin.infomodel;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility to serialize/deserialize module payloads with polymorphic typing.
 * beanJson を優先し、失敗時は呼び出し元で beanBytes をフォールバック利用できるようにする。
 */
public final class ModuleJsonConverter {

    private static final Logger LOG = LoggerFactory.getLogger(ModuleJsonConverter.class);

    private static final ModuleJsonConverter INSTANCE = new ModuleJsonConverter();

    private final ObjectMapper mapper;

    private ModuleJsonConverter() {
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("open.dolphin")
                .allowIfSubType("java.util")
                .allowIfSubType("java.time")
                .build();

        mapper = JsonMapper.builder()
                .activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY)
                .findAndAddModules()
                .build();
    }

    public static ModuleJsonConverter getInstance() {
        return INSTANCE;
    }

    /**
     * モジュールの payload を JSON へ直列化する。失敗時は null を返し beanBytes へのフォールバックを許容する。
     */
    public String serialize(Object payload) {
        if (payload == null) {
            return null;
        }
        try {
            return mapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            LOG.warn("Failed to serialize module payload to beanJson; keep beanBytes for fallback. type={}"
                    , payload.getClass().getName(), e);
            return null;
        }
    }

    /**
     * beanJson を復元する。復元失敗時は null を返し、呼び出し側で beanBytes を利用してもらう。
     */
    public Object deserialize(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return mapper.readValue(json, Object.class);
        } catch (Exception e) {
            LOG.warn("Failed to deserialize module payload from beanJson; beanBytes fallback may be used.", e);
            return null;
        }
    }

    /**
     * ModuleModel から payload を復元する。beanJson を優先し、復元できない場合のみ XML バイトにフォールバックする。
     */
    public Object decode(ModuleModel module) {
        if (module == null) {
            return null;
        }
        Object decoded = deserialize(module.getBeanJson());
        if (decoded != null) {
            return decoded;
        }
        return ModelUtils.xmlDecode(module.getBeanBytes());
    }
}
