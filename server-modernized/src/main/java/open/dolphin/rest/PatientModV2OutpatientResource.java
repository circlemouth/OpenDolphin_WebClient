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
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.SimpleAddressModel;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.PatientServiceBean;

/**
 * Web client compatible endpoint for /orca12/patientmodv2/outpatient.
 */
@Path("/orca12/patientmodv2/outpatient")
public class PatientModV2OutpatientResource extends AbstractResource {

    private static final String DATA_SOURCE_SERVER = "server";
    private static final String DATA_SOURCE_MOCK = "mock";
    private static final DateTimeFormatter RUN_ID_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response mutatePatient(@Context HttpServletRequest request, Map<String, Object> payload) {
        return handleMutation(request, payload, DATA_SOURCE_SERVER, false);
    }

    @POST
    @Path("/mock")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response mutatePatientMock(@Context HttpServletRequest request, Map<String, Object> payload) {
        return handleMutation(request, payload, DATA_SOURCE_MOCK, true);
    }

    private Response handleMutation(HttpServletRequest request,
            Map<String, Object> payload,
            String dataSource,
            boolean fallbackUsed) {
        String runId = resolveRunId(request, payload);
        String traceId = resolveTraceId(request);
        String requestId = resolveRequestId(request, traceId);

        String facilityId = resolveFacilityId(request);
        if (facilityId == null || facilityId.isBlank()) {
            throw restError(request, Response.Status.UNAUTHORIZED, "facility_missing",
                    "Facility is required");
        }

        String operation = getString(payload, "operation");
        if (operation == null || operation.isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "invalid_request",
                    "operation is required");
        }

        PatientPayload patientPayload = toPatientPayload(payload);
        if (patientPayload.patientId == null || patientPayload.patientId.isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "invalid_request",
                    "patientId is required");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("runId", runId);
        response.put("traceId", traceId);
        response.put("requestId", requestId);
        response.put("dataSource", dataSource);
        response.put("dataSourceTransition", dataSource);
        response.put("cacheHit", Boolean.FALSE);
        response.put("missingMaster", Boolean.FALSE);
        response.put("fallbackUsed", fallbackUsed);
        response.put("fetchedAt", Instant.now().toString());
        response.put("facilityId", facilityId);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("resource", request != null ? request.getRequestURI() : "/orca12/patientmodv2/outpatient");
        details.put("operation", operation);
        details.put("patientId", patientPayload.patientId);
        details.put("runId", runId);
        details.put("dataSource", dataSource);
        details.put("dataSourceTransition", dataSource);
        details.put("cacheHit", Boolean.FALSE);
        details.put("missingMaster", Boolean.FALSE);
        details.put("fallbackUsed", fallbackUsed);
        details.put("fetchedAt", response.get("fetchedAt"));
        details.put("facilityId", facilityId);

        boolean success = false;
        String apiResult = "00";
        String apiResultMessage = "OK";
        Response.Status status = Response.Status.OK;

        try {
            switch (operation.toLowerCase()) {
                case "create" -> {
                    PatientModel model = toPatientModel(patientPayload, facilityId);
                    long id = patientServiceBean.addPatient(model);
                    response.put("patientDbId", id);
                    apiResultMessage = "登録完了";
                    success = true;
                }
                case "update" -> {
                    PatientModel existing = patientServiceBean.getPatientById(facilityId, patientPayload.patientId);
                    if (existing == null) {
                        apiResult = "01";
                        apiResultMessage = "Patient not found";
                        throw restError(request, Response.Status.NOT_FOUND, "patient_not_found", "Patient not found");
                    }
                    PatientModel model = toPatientModel(patientPayload, facilityId);
                    model.setId(existing.getId());
                    patientServiceBean.update(model);
                    response.put("patientDbId", existing.getId());
                    apiResultMessage = "更新完了";
                    success = true;
                }
                case "delete" -> {
                    apiResult = "79";
                    apiResultMessage = "Trial環境では患者削除APIが利用できません";
                    response.put("warningMessage", "Spec-based implementation / Trial未検証");
                    success = false;
                    status = Response.Status.FORBIDDEN;
                }
                default -> {
                    apiResult = "99";
                    apiResultMessage = "Unsupported operation: " + operation;
                    throw restError(request, Response.Status.BAD_REQUEST, "invalid_request",
                            "Unsupported operation: " + operation);
                }
            }
        } catch (RuntimeException ex) {
            details.put("errorMessage", ex.getMessage());
            dispatchAuditEvent(request, details, "PATIENTMODV2_OUTPATIENT_MUTATE", AuditEventEnvelope.Outcome.FAILURE);
            throw ex;
        }

        response.put("apiResult", apiResult);
        response.put("apiResultMessage", apiResultMessage);
        response.put("patient", patientPayload.toResponse());
        response.put("operation", operation);
        response.put("status", status.getStatusCode());

        String outcome = success ? "SUCCESS" : "FAILURE";
        Map<String, Object> auditEvent = new LinkedHashMap<>();
        auditEvent.put("action", "PATIENTMODV2_OUTPATIENT_MUTATE");
        auditEvent.put("resource", details.get("resource"));
        auditEvent.put("outcome", outcome);
        auditEvent.put("details", details);
        auditEvent.put("traceId", traceId);
        auditEvent.put("requestId", requestId);
        response.put("auditEvent", auditEvent);

        dispatchAuditEvent(request, details, "PATIENTMODV2_OUTPATIENT_MUTATE",
                success ? AuditEventEnvelope.Outcome.SUCCESS : AuditEventEnvelope.Outcome.FAILURE);

        Response.ResponseBuilder builder = Response.status(status).entity(response);
        applyObservabilityHeaders(builder, runId, traceId, requestId, dataSource, fallbackUsed);
        return builder.build();
    }

    private void dispatchAuditEvent(HttpServletRequest request, Map<String, Object> details, String action, AuditEventEnvelope.Outcome outcome) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(action);
        payload.setResource(request != null ? request.getRequestURI() : "/orca12/patientmodv2/outpatient");
        payload.setDetails(details);
        payload.setTraceId(resolveTraceId(request));
        payload.setRequestId(request != null ? request.getHeader("X-Request-Id") : null);
        if (request != null) {
            payload.setActorId(request.getRemoteUser());
            payload.setIpAddress(request.getRemoteAddr());
            payload.setUserAgent(request.getHeader("User-Agent"));
        }
        sessionAuditDispatcher.record(payload, outcome, null, null);
    }

    private String resolveRunId(HttpServletRequest request, Map<String, Object> payload) {
        if (request != null) {
            String header = request.getHeader("X-Run-Id");
            if (header != null && !header.isBlank()) {
                return header.trim();
            }
        }
        if (payload != null) {
            Object runId = payload.get("runId");
            if (runId instanceof String text && !text.isBlank()) {
                return text;
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

    private String resolveFacilityId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteUser = request.getRemoteUser();
        String facilityId = getRemoteFacility(remoteUser);
        if (facilityId != null && !facilityId.isBlank()) {
            return facilityId;
        }
        String header = request.getHeader("X-Facility-Id");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        String legacy = request.getHeader("facilityId");
        if (legacy != null && !legacy.isBlank()) {
            return legacy.trim();
        }
        return null;
    }

    private PatientPayload toPatientPayload(Map<String, Object> payload) {
        PatientPayload result = new PatientPayload();
        result.patientId = getString(payload, "patientId", "Patient_ID");
        result.name = getString(payload, "name", "wholeName", "Patient_Name");
        result.kana = getString(payload, "kana", "wholeNameKana", "Patient_Kana");
        result.birthDate = getString(payload, "birthDate", "Patient_BirthDate");
        result.sex = getString(payload, "sex", "Patient_Sex");
        result.phone = getString(payload, "phone", "telephone", "tel", "PhoneNumber");
        result.zip = getString(payload, "zip", "zipCode", "postal");
        result.address = getString(payload, "address", "addressLine");
        return result;
    }

    private PatientModel toPatientModel(PatientPayload payload, String facilityId) {
        PatientModel model = new PatientModel();
        model.setFacilityId(facilityId);
        model.setPatientId(payload.patientId);
        model.setFullName(payload.name);
        if (payload.name != null && !payload.name.isBlank()) {
            String[] parts = payload.name.trim().split("\\s+", 2);
            if (parts.length > 0) model.setFamilyName(parts[0]);
            if (parts.length > 1) model.setGivenName(parts[1]);
        }
        model.setKanaName(payload.kana);
        model.setBirthday(payload.birthDate);
        model.setGender(payload.sex);
        model.setTelephone(payload.phone);
        if (payload.address != null || payload.zip != null) {
            SimpleAddressModel addressModel = new SimpleAddressModel();
            addressModel.setAddress(payload.address);
            addressModel.setZipCode(payload.zip);
            model.setAddress(addressModel);
        }
        return model;
    }

    private void applyObservabilityHeaders(Response.ResponseBuilder builder, String runId, String traceId,
            String requestId, String dataSourceTransition, boolean fallbackUsed) {
        if (builder == null) {
            return;
        }
        if (runId != null && !runId.isBlank()) {
            builder.header("x-run-id", runId);
        }
        if (traceId != null && !traceId.isBlank()) {
            builder.header("x-trace-id", traceId);
        }
        if (requestId != null && !requestId.isBlank()) {
            builder.header("x-request-id", requestId);
        }
        if (dataSourceTransition != null && !dataSourceTransition.isBlank()) {
            builder.header("x-data-source-transition", dataSourceTransition);
            builder.header("x-datasource-transition", dataSourceTransition);
        }
        builder.header("x-cache-hit", "false");
        builder.header("x-missing-master", "false");
        builder.header("x-fallback-used", String.valueOf(fallbackUsed));
    }

    private String getString(Map<String, Object> payload, String... keys) {
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

    private static class PatientPayload {
        private String patientId;
        private String name;
        private String kana;
        private String birthDate;
        private String sex;
        private String phone;
        private String zip;
        private String address;

        private Map<String, Object> toResponse() {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("patientId", patientId);
            response.put("name", name);
            response.put("kana", kana);
            response.put("birthDate", birthDate);
            response.put("sex", sex);
            response.put("phone", phone);
            response.put("zip", zip);
            response.put("address", address);
            return response;
        }
    }
}
