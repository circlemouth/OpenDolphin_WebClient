package open.dolphin.rest;

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
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;

/**
 * `/api01rv2/claim/outpatient/*` のモックレスポンスを返し、telemetry 用フラグを供給する。
 */
@Path("/api01rv2/claim/outpatient")
public class OutpatientClaimResource extends AbstractResource {

    private static final String RUN_ID = "20251208T113620Z";

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
        details.put("telemetryFunnelStage", "resolve_master");
        return details;
    }
}
