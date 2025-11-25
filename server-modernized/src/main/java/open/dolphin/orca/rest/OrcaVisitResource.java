package open.dolphin.orca.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.rest.AbstractResource;
import open.dolphin.rest.dto.orca.VisitMutationRequest;
import open.dolphin.rest.dto.orca.VisitMutationResponse;

/**
 * REST wrapper for acceptmodv2 (reception mutations).
 */
@Path("/orca/visits")
public class OrcaVisitResource extends AbstractResource {

    private OrcaWrapperService wrapperService;

    public OrcaVisitResource() {
    }

    @Inject
    public OrcaVisitResource(OrcaWrapperService wrapperService) {
        this.wrapperService = wrapperService;
    }

    @POST
    @Path("/mutation")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VisitMutationResponse mutateVisit(@Context HttpServletRequest request,
            VisitMutationRequest body) {
        if (request == null || request.getRemoteUser() == null || request.getRemoteUser().isBlank()) {
            throw restError(request, Response.Status.UNAUTHORIZED, "remote_user_missing",
                    "Authenticated user is required");
        }
        if (body == null) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "Request payload is required");
        }
        if (body.getRequestNumber() == null || body.getRequestNumber().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "requestNumber is required");
        }
        if (body.getPatientId() == null || body.getPatientId().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "patientId is required");
        }
        if (body.getAcceptanceDate() == null || body.getAcceptanceDate().isBlank()
                || body.getAcceptanceTime() == null || body.getAcceptanceTime().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "acceptanceDate and acceptanceTime are required");
        }
        return wrapperService.mutateVisit(body);
    }
}
