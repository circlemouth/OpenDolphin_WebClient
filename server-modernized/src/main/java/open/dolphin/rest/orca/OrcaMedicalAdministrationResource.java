package open.dolphin.rest.orca;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.util.HashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.dto.orca.BirthDeliveryRequest;
import open.dolphin.rest.dto.orca.BirthDeliveryResponse;
import open.dolphin.rest.dto.orca.MedicalSetMutationRequest;
import open.dolphin.rest.dto.orca.MedicalSetMutationResponse;
import open.dolphin.rest.dto.orca.MedicationModRequest;
import open.dolphin.rest.dto.orca.MedicationModResponse;

/**
 * Spec-based stubs for medical set / tensu / birth delivery APIs that are closed on Trial.
 */
@Path("/orca")
public class OrcaMedicalAdministrationResource extends AbstractOrcaRestResource {

    @POST
    @Path("/medical-sets")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public MedicalSetMutationResponse postMedicalSets(@Context HttpServletRequest request,
            MedicalSetMutationRequest payload) {
        requireRemoteUser(request);
        requireFacilityId(request);
        MedicalSetMutationResponse response = new MedicalSetMutationResponse();
        response.setApiResult("79");
        response.setApiResultMessage("Spec-based implementation / Trial未検証");
        response.setRunId(RUN_ID);
        response.setMessageDetail("診療セット API は Trial で POST が閉鎖されているため stub 応答のみ提供しています。");
        Map<String, Object> audit = new HashMap<>();
        audit.put("status", "blocked");
        recordAudit(request, "ORCA_MEDICAL_SET_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
        return response;
    }

    @POST
    @Path("/tensu/sync")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public MedicationModResponse postMedicationSync(@Context HttpServletRequest request,
            MedicationModRequest payload) {
        requireRemoteUser(request);
        requireFacilityId(request);
        MedicationModResponse response = new MedicationModResponse();
        response.setApiResult("79");
        response.setApiResultMessage("Spec-based implementation / Trial未検証");
        response.setRunId(RUN_ID);
        response.setMessageDetail("点数マスタ同期 API は Trial 未開放のため stub 応答を返します。");
        Map<String, Object> audit = new HashMap<>();
        audit.put("status", "blocked");
        recordAudit(request, "ORCA_MEDICATION_MOD", audit, AuditEventEnvelope.Outcome.FAILURE);
        return response;
    }

    @POST
    @Path("/birth-delivery")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public BirthDeliveryResponse postBirthDelivery(@Context HttpServletRequest request,
            BirthDeliveryRequest payload) {
        requireRemoteUser(request);
        requireFacilityId(request);
        BirthDeliveryResponse response = new BirthDeliveryResponse();
        response.setApiResult("79");
        response.setApiResultMessage("Spec-based implementation / Trial未検証");
        response.setRunId(RUN_ID);
        response.setMessageDetail("出産育児一時金 API は Trial が閉鎖されているため stub 応答を返します。");
        Map<String, Object> audit = new HashMap<>();
        audit.put("status", "blocked");
        recordAudit(request, "ORCA_BIRTH_DELIVERY", audit, AuditEventEnvelope.Outcome.FAILURE);
        return response;
    }
}
