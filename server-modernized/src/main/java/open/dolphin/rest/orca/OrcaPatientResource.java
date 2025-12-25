package open.dolphin.rest.orca;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.SimpleAddressModel;
import open.dolphin.rest.dto.orca.PatientMutationRequest;
import open.dolphin.rest.dto.orca.PatientMutationRequest.PatientPayload;
import open.dolphin.rest.dto.orca.PatientMutationResponse;
import open.dolphin.session.PatientServiceBean;

/**
 * Patient mutation wrapper (`/orca/patient/mutation`).
 */
@Path("/orca/patient")
public class OrcaPatientResource extends AbstractOrcaRestResource {

    @Inject
    private PatientServiceBean patientServiceBean;

    @POST
    @Path("/mutation")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PatientMutationResponse mutatePatient(@Context HttpServletRequest request,
            PatientMutationRequest payload) {

        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);

        if (payload == null || payload.getOperation() == null) {
            Map<String, Object> auditDetails = new HashMap<>();
            auditDetails.put("facilityId", facilityId);
            auditDetails.put("validationError", Boolean.TRUE);
            auditDetails.put("field", "operation");
            markFailureDetails(auditDetails, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "operation is required");
            recordAudit(request, "ORCA_PATIENT_MUTATION", auditDetails, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "operation", "operation is required");
        }
        if (payload.getPatient() == null || payload.getPatient().getPatientId() == null
                || payload.getPatient().getPatientId().isBlank()) {
            Map<String, Object> auditDetails = new HashMap<>();
            auditDetails.put("facilityId", facilityId);
            auditDetails.put("operation", payload.getOperation());
            auditDetails.put("validationError", Boolean.TRUE);
            auditDetails.put("field", "patient.patientId");
            markFailureDetails(auditDetails, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "patientId is required");
            recordAudit(request, "ORCA_PATIENT_MUTATION", auditDetails, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "patient.patientId", "patientId is required");
        }

        PatientMutationResponse response = new PatientMutationResponse();
        response.setRunId(RUN_ID);
        response.setPatientId(payload.getPatient().getPatientId());

        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("facilityId", facilityId);
        auditDetails.put("patientId", payload.getPatient().getPatientId());
        auditDetails.put("operation", payload.getOperation());

        switch (payload.getOperation().toLowerCase()) {
            case "create" -> {
                PatientModel model = toPatientModel(payload.getPatient(), facilityId);
                long id = patientServiceBean.addPatient(model);
                response.setApiResult("00");
                response.setApiResultMessage("登録完了");
                response.setPatientDbId(id);
                recordAudit(request, "ORCA_PATIENT_MUTATION", auditDetails, AuditEventEnvelope.Outcome.SUCCESS);
                return response;
            }
            case "update" -> {
                PatientModel existing = patientServiceBean.getPatientById(facilityId, payload.getPatient().getPatientId());
                if (existing == null) {
                    Map<String, Object> missingAudit = new HashMap<>(auditDetails);
                    markFailureDetails(missingAudit, Response.Status.NOT_FOUND.getStatusCode(),
                            "patient_not_found", "Patient not found");
                    recordAudit(request, "ORCA_PATIENT_MUTATION", missingAudit, AuditEventEnvelope.Outcome.FAILURE);
                    throw restError(request, Response.Status.NOT_FOUND, "patient_not_found",
                            "Patient not found");
                }
                PatientModel update = toPatientModel(payload.getPatient(), facilityId);
                update.setId(existing.getId());
                patientServiceBean.update(update);
                response.setApiResult("00");
                response.setApiResultMessage("更新完了");
                response.setPatientDbId(existing.getId());
                recordAudit(request, "ORCA_PATIENT_MUTATION", auditDetails, AuditEventEnvelope.Outcome.SUCCESS);
                return response;
            }
            case "delete" -> {
                response.setApiResult("79");
                response.setApiResultMessage("Spec-based implementation / Trial未検証");
                response.setWarningMessage("Trial では患者削除 API が閉鎖されているためローカル DB を変更していません。");
                recordAudit(request, "ORCA_PATIENT_MUTATION", auditDetails, AuditEventEnvelope.Outcome.FAILURE);
                return response;
            }
            default -> {
                Map<String, Object> unsupportedAudit = new HashMap<>(auditDetails);
                unsupportedAudit.put("validationError", Boolean.TRUE);
                unsupportedAudit.put("field", "operation");
                markFailureDetails(unsupportedAudit, Response.Status.BAD_REQUEST.getStatusCode(),
                        "invalid_request", "Unsupported operation: " + payload.getOperation());
                recordAudit(request, "ORCA_PATIENT_MUTATION", unsupportedAudit, AuditEventEnvelope.Outcome.FAILURE);
                throw validationError(request, "operation", "Unsupported operation: " + payload.getOperation());
            }
        }
    }

    private PatientModel toPatientModel(PatientPayload payload, String facilityId) {
        PatientModel model = new PatientModel();
        model.setFacilityId(facilityId);
        model.setPatientId(payload.getPatientId());
        if (payload.getWholeName() != null) {
            model.setFullName(payload.getWholeName());
            String[] parts = payload.getWholeName().trim().split("\\s+", 2);
            if (parts.length > 0) {
                model.setFamilyName(parts[0]);
            }
            if (parts.length > 1) {
                model.setGivenName(parts[1]);
            }
        }
        model.setKanaName(payload.getWholeNameKana());
        model.setGender(Optional.ofNullable(payload.getSex()).orElse("0"));
        model.setBirthday(payload.getBirthDate());
        model.setTelephone(payload.getTelephone());
        model.setMobilePhone(payload.getMobilePhone());
        if (payload.getAddressLine() != null || payload.getZipCode() != null) {
            SimpleAddressModel address = new SimpleAddressModel();
            address.setAddress(payload.getAddressLine());
            address.setZipCode(payload.getZipCode());
            model.setAddress(address);
        }
        return model;
    }
}
