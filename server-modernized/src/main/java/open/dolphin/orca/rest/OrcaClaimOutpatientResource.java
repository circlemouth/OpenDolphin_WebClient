package open.dolphin.orca.rest;

import jakarta.ws.rs.Path;
import open.dolphin.rest.OutpatientClaimResource;

/**
 * New API endpoint for outpatient claim based on local data.
 */
@Path("/orca/claim/outpatient")
public class OrcaClaimOutpatientResource extends OutpatientClaimResource {

    @Override
    protected String getDefaultResourcePath() {
        return "/orca/claim/outpatient";
    }
}
