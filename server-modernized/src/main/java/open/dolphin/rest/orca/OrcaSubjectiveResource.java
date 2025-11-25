package open.dolphin.rest.orca;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.dto.orca.SubjectiveEntryRequest;
import open.dolphin.rest.dto.orca.SubjectiveEntryResponse;

/**
 * Spec-based stub for `/orca25/subjectivesv2`.
 */
@Path("/orca/chart")
public class OrcaSubjectiveResource extends AbstractOrcaRestResource {

    @POST
    @Path("/subjectives")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public SubjectiveEntryResponse postSubjective(@Context HttpServletRequest request,
            SubjectiveEntryRequest payload) {

        requireRemoteUser(request);
        requireFacilityId(request);
        if (payload == null || payload.getPatientId() == null || payload.getPatientId().isBlank()) {
            throw validationError(request, "patientId", "patientId is required");
        }

        SubjectiveEntryResponse response = new SubjectiveEntryResponse();
        response.setApiResult("79");
        response.setApiResultMessage("Spec-based implementation / Trial未検証");
        response.setRunId(RUN_ID);
        response.setRecordedAt(Instant.now().toString());
        response.setMessageDetail("WebORCA Trial では subjectivesv2 が未開放のためローカル記録は行っていません。");

        Map<String, Object> audit = new HashMap<>();
        audit.put("patientId", payload.getPatientId());
        audit.put("status", "blocked");
        recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
        return response;
    }
}
