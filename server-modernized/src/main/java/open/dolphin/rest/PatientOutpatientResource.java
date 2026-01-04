package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.SimpleAddressModel;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;
import open.dolphin.rest.dto.outpatient.PatientOutpatientResponse;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.PatientServiceBean;

/**
 * Outpatient patient list endpoint for web client compatibility.
 */
@Path("/api01rv2/patient/outpatient")
public class PatientOutpatientResource extends AbstractResource {

    private static final String DATA_SOURCE = "server";
    private static final DateTimeFormatter RUN_ID_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PatientOutpatientResponse postPatients(@Context HttpServletRequest request, Map<String, Object> payload) {
        String runId = resolveRunId(request);
        String traceId = resolveTraceId(request);
        String requestId = resolveRequestId(request, traceId);

        String facilityId = resolveFacilityId(request);
        String keyword = payload != null ? toString(payload.get("keyword")) : null;
        String paymentMode = payload != null ? toString(payload.get("paymentMode")) : null;

        List<PatientModel> models = resolvePatients(facilityId, keyword);
        List<PatientOutpatientResponse.PatientRecord> records = new ArrayList<>();
        for (PatientModel model : models) {
            PatientOutpatientResponse.PatientRecord record = toRecord(model);
            if (record != null) {
                records.add(record);
            }
        }

        PatientOutpatientResponse response = new PatientOutpatientResponse();
        response.setRunId(runId);
        response.setTraceId(traceId);
        response.setRequestId(requestId);
        response.setDataSource(DATA_SOURCE);
        response.setDataSourceTransition(DATA_SOURCE);
        response.setCacheHit(false);
        response.setMissingMaster(false);
        response.setFallbackUsed(false);
        response.setFetchedAt(Instant.now().toString());
        response.setRecordsReturned(records.size());
        response.setPatients(records);
        response.setApiResult("00");
        response.setApiResultMessage("OK");

        Map<String, Object> details = new LinkedHashMap<>();
        if (facilityId != null && !facilityId.isBlank()) {
            details.put("facilityId", facilityId);
        }
        details.put("resource", "/api01rv2/patient/outpatient");
        details.put("runId", runId);
        details.put("dataSource", DATA_SOURCE);
        details.put("dataSourceTransition", DATA_SOURCE);
        details.put("cacheHit", false);
        details.put("missingMaster", false);
        details.put("fallbackUsed", false);
        details.put("fetchedAt", response.getFetchedAt());
        details.put("recordsReturned", records.size());
        if (keyword != null && !keyword.isBlank()) {
            details.put("keyword", keyword);
        }
        if (paymentMode != null && !paymentMode.isBlank()) {
            details.put("paymentMode", paymentMode);
        }

        OutpatientFlagResponse.AuditEvent auditEvent = new OutpatientFlagResponse.AuditEvent();
        auditEvent.setAction("PATIENT_OUTPATIENT_FETCH");
        auditEvent.setResource("/api01rv2/patient/outpatient");
        auditEvent.setOutcome("SUCCESS");
        auditEvent.setDetails(details);
        auditEvent.setTraceId(traceId);
        auditEvent.setRequestId(requestId);
        response.setAuditEvent(auditEvent);

        dispatchAuditEvent(request, auditEvent);
        return response;
    }

    private void dispatchAuditEvent(HttpServletRequest request, OutpatientFlagResponse.AuditEvent auditEvent) {
        if (sessionAuditDispatcher == null || auditEvent == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(auditEvent.getAction());
        payload.setResource(auditEvent.getResource());
        payload.setDetails(auditEvent.getDetails());
        payload.setTraceId(auditEvent.getTraceId());
        payload.setRequestId(auditEvent.getRequestId());
        if (request != null) {
            payload.setActorId(request.getRemoteUser());
            payload.setIpAddress(request.getRemoteAddr());
            payload.setUserAgent(request.getHeader("User-Agent"));
        }
        sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.SUCCESS, null, null);
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

    private List<PatientModel> resolvePatients(String facilityId, String keyword) {
        if (patientServiceBean == null) {
            return List.of();
        }
        if (facilityId == null || facilityId.isBlank()) {
            return List.of();
        }
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        if (keyword.matches("\\d+")) {
            return patientServiceBean.getPatientsByDigit(facilityId, keyword);
        }
        if (keyword.matches("[ぁ-んァ-ヶー]+")) {
            return patientServiceBean.getPatientsByKana(facilityId, keyword);
        }
        return patientServiceBean.getPatientsByName(facilityId, keyword);
    }

    private PatientOutpatientResponse.PatientRecord toRecord(PatientModel model) {
        if (model == null) {
            return null;
        }
        PatientOutpatientResponse.PatientRecord record = new PatientOutpatientResponse.PatientRecord();
        record.setPatientId(model.getPatientId());
        record.setName(model.getFullName());
        record.setKana(model.getKanaName());
        record.setBirthDate(model.getBirthday());
        record.setSex(model.getGender());
        record.setMemo(model.getMemo());
        record.setLastVisit(model.getPvtDateTrimDate());
        String phone = firstNonBlank(model.getTelephone(), model.getMobilePhone());
        record.setPhone(phone);
        SimpleAddressModel address = model.getAddress();
        if (address != null) {
            record.setZip(address.getZipCode());
            record.setAddress(address.getAddress());
        }
        return record;
    }

    private String toString(Object value) {
        return value instanceof String text ? text : null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
