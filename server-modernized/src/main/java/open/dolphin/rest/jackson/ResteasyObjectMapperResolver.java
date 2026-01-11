package open.dolphin.rest.jackson;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.ext.ContextResolver;
import jakarta.ws.rs.ext.Provider;

/**
 * Registers a Jackson mapper with JavaTime support for RESTEasy JSON binding.
 */
@Provider
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
public class ResteasyObjectMapperResolver implements ContextResolver<ObjectMapper> {

    private final ObjectMapper mapper;

    public ResteasyObjectMapperResolver() {
        this.mapper = new LegacyObjectMapperProducer().provideLegacyAwareMapper();
    }

    @Override
    public ObjectMapper getContext(Class<?> type) {
        return mapper;
    }
}
