package open.dolphin.rest.jackson;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Dependent;
import jakarta.enterprise.inject.Produces;
import open.dolphin.rest.AbstractResource;

/**
 * CDI producer that supplies a legacy-compatible {@link ObjectMapper}.
 * Consolidates serialization defaults from {@link AbstractResource#getSerializeMapper()}
 * and ADM系が必要とするデシリアライズ設定をひとつにまとめる。
 */
@ApplicationScoped
public class LegacyObjectMapperProducer {

    @Produces
    @Dependent
    public ObjectMapper provideLegacyAwareMapper() {
        ObjectMapper mapper = AbstractResource.getSerializeMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        return mapper;
    }
}
