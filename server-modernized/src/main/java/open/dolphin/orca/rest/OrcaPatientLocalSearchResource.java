package open.dolphin.orca.rest;

import jakarta.ws.rs.Path;
import open.dolphin.rest.PatientOutpatientResource;

/**
 * Local-only patient search endpoint under /orca.
 */
@Path("/orca/patients/local-search")
public class OrcaPatientLocalSearchResource extends PatientOutpatientResource {

    @Override
    protected String getDefaultResourcePath() {
        return "/orca/patients/local-search";
    }
}
