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
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.rest.AbstractResource;
import open.dolphin.rest.dto.orca.FormerNameHistoryRequest;
import open.dolphin.rest.dto.orca.FormerNameHistoryResponse;
import open.dolphin.rest.dto.orca.InsuranceCombinationRequest;
import open.dolphin.rest.dto.orca.InsuranceCombinationResponse;
import open.dolphin.rest.dto.orca.PatientBatchRequest;
import open.dolphin.rest.dto.orca.PatientBatchResponse;
import open.dolphin.rest.dto.orca.PatientIdListRequest;
import open.dolphin.rest.dto.orca.PatientIdListResponse;
import open.dolphin.rest.dto.orca.PatientNameSearchRequest;
import open.dolphin.rest.dto.orca.PatientSearchResponse;

/**
 * REST wrapper for patient synchronization endpoints.
 */
@Path("/orca")
public class OrcaPatientBatchResource extends AbstractResource {

    private OrcaWrapperService wrapperService;

    public OrcaPatientBatchResource() {
    }

    @Inject
    public OrcaPatientBatchResource(OrcaWrapperService wrapperService) {
        this.wrapperService = wrapperService;
    }

    @POST
    @Path("/patients/id-list")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PatientIdListResponse patientIdList(@Context HttpServletRequest request,
            PatientIdListRequest body) {
        if (body == null || body.getStartDate() == null || body.getEndDate() == null) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.patient.id.invalid",
                    "startDate and endDate are required");
        }
        return wrapperService.getPatientIdList(body);
    }

    @POST
    @Path("/patients/batch")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PatientBatchResponse patientBatch(@Context HttpServletRequest request,
            PatientBatchRequest body) {
        if (body == null || body.getPatientIds().isEmpty()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.patient.batch.invalid",
                    "patientIds must contain at least one entry");
        }
        return wrapperService.getPatientBatch(body);
    }

    @POST
    @Path("/patients/name-search")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PatientSearchResponse patientSearch(@Context HttpServletRequest request,
            PatientNameSearchRequest body) {
        if (body == null || ((body.getName() == null || body.getName().isBlank())
                && (body.getKana() == null || body.getKana().isBlank()))) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.patient.search.invalid",
                    "name or kana is required");
        }
        return wrapperService.searchPatients(body);
    }

    @POST
    @Path("/insurance/combinations")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public InsuranceCombinationResponse insuranceCombinations(@Context HttpServletRequest request,
            InsuranceCombinationRequest body) {
        if (body == null || body.getPatientId() == null || body.getPatientId().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.patient.insurance.invalid",
                    "patientId is required");
        }
        return wrapperService.getInsuranceCombinations(body);
    }

    @POST
    @Path("/patients/former-names")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public FormerNameHistoryResponse formerNames(@Context HttpServletRequest request,
            FormerNameHistoryRequest body) {
        if (body == null || body.getPatientId() == null || body.getPatientId().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.patient.former-name.invalid",
                    "patientId is required");
        }
        return wrapperService.getFormerNames(body);
    }

    void setWrapperService(OrcaWrapperService wrapperService) {
        this.wrapperService = wrapperService;
    }
}
