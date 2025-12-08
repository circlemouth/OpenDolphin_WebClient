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
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * `/api01rv2/claim/outpatient/*` のモックレスポンスを返し、telemetry 用フラグを供給する。
 */
@Path("/api01rv2/claim/outpatient")
public class OutpatientClaimResource extends AbstractResource {

    private static final String RUN_ID = "20251208T124645Z";

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Path("/mock")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public OutpatientFlagResponse postOutpatientClaimMock(@Context HttpServletRequest request) {
        OutpatientFlagResponse response = OutpatientFlagResponse.withDefaults(RUN_ID);
        response.setCacheHit(false);
        response.setMissingMaster(false);
        response.setRecordsReturned(1);
        response.setFetchedAt(Instant.now().toString());

        Map<String, Object> details = buildAuditDetails(request, "/api01rv2/claim/outpatient/mock");

        OutpatientFlagResponse.AuditEvent auditEvent = new OutpatientFlagResponse.AuditEvent();
        auditEvent.setAction("ORCA_CLAIM_OUTPATIENT");
        auditEvent.setResource("/api01rv2/claim/outpatient/mock");
        auditEvent.setOutcome("SUCCESS");
        auditEvent.setDetails(details);
        auditEvent.setTraceId(resolveTraceId(request));
        auditEvent.setRequestId(request != null ? request.getHeader("X-Request-Id") : null);
        response.setAuditEvent(auditEvent);

        dispatchAuditEvent(request, auditEvent);

        return response;
    }

    private Map<String, Object> buildAuditDetails(HttpServletRequest request, String resource) {
        Map<String, Object> details = new LinkedHashMap<>();
        String remoteUser = request != null ? request.getRemoteUser() : null;
        details.put("facilityId", getRemoteFacility(remoteUser));
        details.put("resource", resource);
        details.put("runId", RUN_ID);
        details.put("dataSource", "server");
        details.put("dataSourceTransition", "server");
        details.put("cacheHit", false);
        details.put("missingMaster", false);
        details.put("fallbackUsed", false);
        details.put("fetchedAt", Instant.now().toString());
        details.put("recordsReturned", 1);
        details.put("telemetryFunnelStage", "resolve_master");
        return details;
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
        if (payload.getTraceId() == null || payload.getTraceId().isBlank()) {
            payload.setTraceId(resolveTraceId(request));
        }
        if (payload.getRequestId() == null || payload.getRequestId().isBlank()) {
            payload.setRequestId(payload.getTraceId());
        }
        sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.SUCCESS, null, null);
    }
}
