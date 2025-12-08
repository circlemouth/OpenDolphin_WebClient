package open.dolphin.rest.orca;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;

/**
 * `/orca21/medicalmodv2/outpatient` をモダナイズ版サーバー側で提供する。
 */
@Path("/orca21/medicalmodv2")
public class OrcaMedicalModV2Resource extends AbstractOrcaRestResource {

    private static final String RUN_ID = "20251208T113620Z";

    @POST
    @Path("/outpatient")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public OutpatientFlagResponse postOutpatientMedical(@Context HttpServletRequest request, Map<String, Object> payload) {
        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        String patientId = extractPatientId(payload);

        OutpatientFlagResponse response = OutpatientFlagResponse.withDefaults(RUN_ID);
        response.setCacheHit(true);
        response.setMissingMaster(false);
        response.setRecordsReturned(1);
        response.setFetchedAt(Instant.now().toString());

        Map<String, Object> details = buildAuditDetails(facilityId, patientId, response);

        OutpatientFlagResponse.AuditEvent auditEvent = new OutpatientFlagResponse.AuditEvent();
        auditEvent.setAction("ORCA_MEDICAL_GET");
        auditEvent.setResource("/orca21/medicalmodv2/outpatient");
        auditEvent.setOutcome("SUCCESS");
        auditEvent.setDetails(details);
        auditEvent.setTraceId(resolveTraceId(request));
        auditEvent.setRequestId(request != null ? request.getHeader("X-Request-Id") : null);
        response.setAuditEvent(auditEvent);

        Map<String, Object> auditPayload = new LinkedHashMap<>(details);
        auditPayload.put("recordsReturned", response.getRecordsReturned());
        recordAudit(request, "ORCA_MEDICAL_GET", auditPayload, AuditEventEnvelope.Outcome.SUCCESS);

        return response;
    }

    private Map<String, Object> buildAuditDetails(String facilityId, String patientId, OutpatientFlagResponse response) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("facilityId", facilityId);
        details.put("patientId", patientId);
        details.put("runId", RUN_ID);
        details.put("dataSource", response.getDataSource());
        details.put("dataSourceTransition", response.getDataSourceTransition());
        details.put("cacheHit", response.isCacheHit());
        details.put("missingMaster", response.isMissingMaster());
        details.put("fallbackUsed", response.isFallbackUsed());
        details.put("fetchedAt", response.getFetchedAt());
        return details;
    }

    private String extractPatientId(Map<String, Object> payload) {
        if (payload == null) {
            return null;
        }
        Object patient = payload.get("Patient_ID");
        if (patient instanceof String id && !id.isBlank()) {
            return id;
        }
        Object patientInformation = payload.get("patientInformation");
        if (patientInformation instanceof Map<?, ?> info) {
            Object id = info.get("Patient_ID");
            if (id instanceof String text && !text.isBlank()) {
                return text;
            }
        }
        return null;
    }
}
