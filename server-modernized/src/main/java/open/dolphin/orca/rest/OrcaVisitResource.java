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
import java.util.Locale;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.rest.dto.orca.VisitMutationRequest;
import open.dolphin.rest.dto.orca.VisitMutationResponse;
import open.dolphin.rest.dto.orca.VisitPatientListRequest;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;
import open.dolphin.session.framework.SessionOperation;

/**
 * REST wrapper for acceptmodv2 (reception mutations).
 */
@Path("/orca/visits")
@SessionOperation
public class OrcaVisitResource extends AbstractOrcaWrapperResource {

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
            Map<String, Object> details = newAuditDetails(request);
            details.put("operation", "visitMutation");
            markFailureDetails(details, Response.Status.UNAUTHORIZED.getStatusCode(),
                    "remote_user_missing", "Authenticated user is required");
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.UNAUTHORIZED, "remote_user_missing",
                    "Authenticated user is required");
        }
        if (body == null) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("operation", "visitMutation");
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.visit.mutation.invalid", "Request payload is required");
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "Request payload is required");
        }
        if (body.getRequestNumber() == null || body.getRequestNumber().isBlank()) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("operation", "visitMutation");
            details.put("patientId", body.getPatientId());
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.visit.mutation.invalid", "requestNumber is required");
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "requestNumber is required");
        }
        if (body.getPatientId() == null || body.getPatientId().isBlank()) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("operation", "visitMutation");
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.visit.mutation.invalid", "patientId is required");
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "patientId is required");
        }
        if (!isQueryRequest(body.getRequestNumber())
                && (body.getAcceptanceDate() == null || body.getAcceptanceDate().isBlank()
                || body.getAcceptanceTime() == null || body.getAcceptanceTime().isBlank())) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("operation", "visitMutation");
            details.put("patientId", body.getPatientId());
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.visit.mutation.invalid", "acceptanceDate and acceptanceTime are required");
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.mutation.invalid",
                    "acceptanceDate and acceptanceTime are required");
        }
        Map<String, Object> details = newAuditDetails(request);
        details.put("operation", "visitMutation");
        details.put("requestNumber", body.getRequestNumber());
        details.put("patientId", body.getPatientId());
        details.put("acceptanceDate", body.getAcceptanceDate());
        details.put("acceptanceTime", body.getAcceptanceTime());
        try {
            VisitMutationResponse response = wrapperService.mutateVisit(body);
            applyResponseAuditDetails(response, details);
            if (response.getAcceptanceId() != null && !response.getAcceptanceId().isBlank()) {
                details.put("acceptanceId", response.getAcceptanceId());
            }
            markSuccessDetails(details);
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.SUCCESS);
            return response;
        } catch (RuntimeException ex) {
            markFailureDetails(details, Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                    "orca.visit.mutation.error", ex.getMessage());
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw ex;
        }
    }

    @POST
    @Path("/list")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VisitPatientListResponse visitList(@Context HttpServletRequest request,
            VisitPatientListRequest body) {
        if (body == null || body.getVisitDate() == null) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("operation", "visitList");
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.visit.invalid", "visitDate is required");
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.invalid",
                    "visitDate is required");
        }
        Map<String, Object> details = newAuditDetails(request);
        details.put("operation", "visitList");
        details.put("visitDate", body.getVisitDate().toString());
        try {
            VisitPatientListResponse response = wrapperService.getVisitList(body);
            applyResponseAuditDetails(response, details);
            markSuccessDetails(details);
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.SUCCESS);
            return response;
        } catch (RuntimeException ex) {
            markFailureDetails(details, Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                    "orca.visit.error", ex.getMessage());
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw ex;
        }
    }

    private boolean isQueryRequest(String requestNumber) {
        if (requestNumber == null || requestNumber.isBlank()) {
            return false;
        }
        String normalized = requestNumber.trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("class=")) {
            normalized = normalized.substring("class=".length());
        } else if (normalized.startsWith("?class=")) {
            normalized = normalized.substring("?class=".length());
        } else if (normalized.startsWith("request_number=")) {
            normalized = normalized.substring("request_number=".length());
        }
        if (normalized.matches("\\d+")) {
            if (normalized.length() == 1) {
                normalized = "0" + normalized;
            }
            return "00".equals(normalized);
        }
        return switch (normalized) {
            case "query", "read", "get", "list", "inquiry" -> true;
            default -> false;
        };
    }
}
