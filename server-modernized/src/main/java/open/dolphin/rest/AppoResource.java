package open.dolphin.rest;

import java.io.IOException;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.infomodel.AppoList;
import open.dolphin.session.AppoServiceBean;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * REST Web Service
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@Path("/appo")
public class AppoResource extends AbstractResource {
    
    @Inject
    private AppoServiceBean appoServiceBean;

    /** Creates a new instance of AppoResource */
    public AppoResource() {
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putXml(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        AppoList list = mapper.readValue(json, AppoList.class);
        
        int count = appoServiceBean.putAppointments(list.getList());
        String cntStr = String.valueOf(count);
        debug(cntStr);

        return cntStr;
    }
}
