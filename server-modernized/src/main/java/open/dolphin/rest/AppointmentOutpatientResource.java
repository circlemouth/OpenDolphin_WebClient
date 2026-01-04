package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.orca.rest.AbstractOrcaWrapperResource;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.rest.dto.orca.OrcaAppointmentListRequest;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
import open.dolphin.rest.dto.orca.VisitPatientListRequest;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;
import open.dolphin.rest.dto.outpatient.AppointmentOutpatientResponse;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;

/**
 * Outpatient appointment list endpoint for web client compatibility.
 */
@Path("/api01rv2/appointment/outpatient")
public class AppointmentOutpatientResource extends AbstractOrcaWrapperResource {

    private static final String DATA_SOURCE = "server";
    private static final DateTimeFormatter RUN_ID_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    @Inject
    private OrcaWrapperService wrapperService;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AppointmentOutpatientResponse postAppointment(@Context HttpServletRequest request, Map<String, Object> payload) {
        return buildResponse(request, payload, "/api01rv2/appointment/outpatient");
    }

    @POST
    @Path("/list")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AppointmentOutpatientResponse postAppointmentList(@Context HttpServletRequest request, Map<String, Object> payload) {
        return buildResponse(request, payload, "/api01rv2/appointment/outpatient/list");
    }

    private AppointmentOutpatientResponse buildResponse(HttpServletRequest request, Map<String, Object> payload, String resourcePath) {
        String runId = resolveRunId(request);
        String traceId = resolveTraceId(request);
        String requestId = resolveRequestId(request, traceId);

        String dateText = toString(payload, "appointmentDate", "date", "visitDate");
        if (dateText == null || dateText.isBlank()) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("resource", resourcePath);
            details.put("operation", "appointment_list");
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.appointment.invalid", "appointmentDate is required");
            details.put("runId", runId);
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.invalid",
                    "appointmentDate is required");
        }

        LocalDate appointmentDate;
        try {
            appointmentDate = LocalDate.parse(dateText);
        } catch (DateTimeParseException ex) {
            Map<String, Object> details = newAuditDetails(request);
            details.put("resource", resourcePath);
            details.put("operation", "appointment_list");
            details.put("appointmentDate", dateText);
            markFailureDetails(details, Response.Status.BAD_REQUEST.getStatusCode(),
                    "orca.appointment.invalid", "appointmentDate is invalid");
            details.put("runId", runId);
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.invalid",
                    "appointmentDate is invalid");
        }

        OrcaAppointmentListRequest listRequest = new OrcaAppointmentListRequest();
        listRequest.setAppointmentDate(appointmentDate);
        String keyword = toString(payload, "keyword");
        if (keyword != null && !keyword.isBlank()) {
            listRequest.setMedicalInformation(keyword);
        }
        String physicianCode = toString(payload, "physicianCode");
        if (physicianCode != null && !physicianCode.isBlank()) {
            listRequest.setPhysicianCode(physicianCode);
        }

        VisitPatientListRequest visitRequest = new VisitPatientListRequest();
        visitRequest.setVisitDate(appointmentDate);

        Map<String, Object> details = newAuditDetails(request);
        details.put("resource", resourcePath);
        details.put("operation", "appointment_list");
        details.put("appointmentDate", appointmentDate.toString());
        if (keyword != null && !keyword.isBlank()) {
            details.put("keyword", keyword);
        }
        String departmentCode = toString(payload, "departmentCode");
        if (departmentCode != null && !departmentCode.isBlank()) {
            details.put("departmentCode", departmentCode);
        }
        if (physicianCode != null && !physicianCode.isBlank()) {
            details.put("physicianCode", physicianCode);
        }
        Integer page = toInteger(payload, "page");
        Integer size = toInteger(payload, "size");
        if (page != null) {
            details.put("page", page);
        }
        if (size != null) {
            details.put("size", size);
        }

        try {
            OrcaAppointmentListResponse listResponse = wrapperService.getAppointmentList(listRequest);
            VisitPatientListResponse visitResponse = wrapperService.getVisitList(visitRequest);

            AppointmentOutpatientResponse response = new AppointmentOutpatientResponse();
            response.setRunId(runId);
            response.setTraceId(traceId);
            response.setRequestId(requestId);
            response.setDataSource(DATA_SOURCE);
            response.setDataSourceTransition(DATA_SOURCE);
            response.setCacheHit(false);
            response.setMissingMaster(false);
            response.setFallbackUsed(false);
            response.setFetchedAt(Instant.now().toString());

            if (listResponse != null) {
                response.setAppointmentDate(listResponse.getAppointmentDate());
                response.setSlots(listResponse.getSlots());
                response.setApiResult(listResponse.getApiResult());
                response.setApiResultMessage(listResponse.getApiResultMessage());
                response.setBlockerTag(listResponse.getBlockerTag());
                applyResponseAuditDetails(listResponse, details);
            }
            if (visitResponse != null) {
                response.setVisitDate(visitResponse.getVisitDate());
                response.setVisits(visitResponse.getVisits());
            }

            int slotCount = listResponse != null ? listResponse.getSlots().size() : 0;
            int visitCount = visitResponse != null ? visitResponse.getVisits().size() : 0;
            int recordsReturned = slotCount + visitCount;
            response.setRecordsReturned(recordsReturned);
            details.put("recordsReturned", recordsReturned);
            details.put("runId", runId);
            markSuccessDetails(details);
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.SUCCESS);

            OutpatientFlagResponse.AuditEvent auditEvent = new OutpatientFlagResponse.AuditEvent();
            auditEvent.setAction("ORCA_APPOINTMENT_OUTPATIENT");
            auditEvent.setResource(resourcePath);
            auditEvent.setOutcome("SUCCESS");
            auditEvent.setDetails(details);
            auditEvent.setTraceId(traceId);
            auditEvent.setRequestId(requestId);
            response.setAuditEvent(auditEvent);
            return response;
        } catch (RuntimeException ex) {
            markFailureDetails(details, Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                    "orca.appointment.error", ex.getMessage());
            details.put("runId", runId);
            recordAudit(request, ACTION_APPOINTMENT_OUTPATIENT, details, AuditEventEnvelope.Outcome.FAILURE);
            throw ex;
        }
    }

    private String resolveRunId(HttpServletRequest request) {
        if (request != null) {
            String header = request.getHeader("X-Run-Id");
            if (header != null && !header.isBlank()) {
                return header.trim();
            }
        }
        return RUN_ID_FORMAT.format(Instant.now());
    }

    private String resolveRequestId(HttpServletRequest request, String traceId) {
        if (request != null) {
            String header = request.getHeader("X-Request-Id");
            if (header != null && !header.isBlank()) {
                return header.trim();
            }
        }
        return traceId;
    }

    private String toString(Map<String, Object> payload, String... keys) {
        if (payload == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            Object value = payload.get(key);
            if (value instanceof String text && !text.isBlank()) {
                return text;
            }
        }
        return null;
    }

    private Integer toInteger(Map<String, Object> payload, String key) {
        if (payload == null || key == null) {
            return null;
        }
        Object value = payload.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }
}
