package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import open.dolphin.rest.admin.AdminConfigSnapshot;
import open.dolphin.rest.admin.AdminConfigStore;
import open.dolphin.rest.orca.AbstractOrcaRestResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/api/orca/queue")
public class OrcaQueueResource extends AbstractResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrcaQueueResource.class);

    @Inject
    private AdminConfigStore adminConfigStore;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getQueue(@Context HttpServletRequest request,
            @QueryParam("patientId") String patientId,
            @QueryParam("retry") String retry) {
        return buildQueueResponse(request, patientId, retry);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteQueue(@Context HttpServletRequest request,
            @QueryParam("patientId") String patientId) {
        return buildQueueResponse(request, patientId, null);
    }

    private Response buildQueueResponse(HttpServletRequest request, String patientId, String retry) {
        AdminConfigSnapshot snapshot = adminConfigStore.getSnapshot();
        Boolean useMockHeader = readBooleanHeader(request, "x-use-mock-orca-queue");
        Boolean verifyHeader = readBooleanHeader(request, "x-verify-admin-delivery");
        boolean useMock = useMockHeader != null ? useMockHeader : Boolean.TRUE.equals(snapshot.getUseMockOrcaQueue());
        boolean verify = verifyHeader != null ? verifyHeader : Boolean.TRUE.equals(snapshot.getVerified());

        List<Map<String, Object>> queue = useMock ? mockQueue() : new ArrayList<>();
        if (patientId != null && !patientId.isBlank()) {
            queue.removeIf(entry -> !patientId.equals(entry.get("patientId")));
        }

        String runId = resolveRunId(request);
        String traceId = resolveTraceId(request);
        if (traceId == null || traceId.isBlank()) {
            traceId = runId;
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", runId);
        body.put("traceId", traceId);
        body.put("fetchedAt", Instant.now().toString());
        body.put("source", useMock ? "mock" : "live");
        body.put("verifyAdminDelivery", verify);
        body.put("queue", queue);
        if (patientId != null && !patientId.isBlank()) {
            body.put("patientId", patientId);
        }

        boolean retryRequested = isTrue(retry);
        if (retryRequested) {
            String retryReason;
            if (patientId == null || patientId.isBlank()) {
                retryReason = "patientId_required";
            } else if (useMock) {
                retryReason = "mock_noop";
            } else {
                retryReason = "not_implemented";
            }
            body.put("retryRequested", true);
            body.put("retryApplied", false);
            body.put("retryReason", retryReason);
            LOGGER.info("Orca queue retry requested but not applied (patientId={}, source={}, reason={})",
                    patientId, useMock ? "mock" : "live", retryReason);
        } else {
            body.put("retryRequested", false);
        }

        Response.ResponseBuilder builder = Response.ok(body);
        builder.header("x-run-id", runId);
        builder.header("x-trace-id", traceId);
        builder.header("x-orca-queue-mode", useMock ? "mock" : "live");
        builder.header("x-admin-delivery-verification", verify ? "enabled" : "disabled");
        return builder.build();
    }

    private List<Map<String, Object>> mockQueue() {
        List<Map<String, Object>> queue = new ArrayList<>();
        Map<String, Object> pending = new LinkedHashMap<>();
        pending.put("patientId", "MOCK-001");
        pending.put("status", "pending");
        pending.put("retryable", Boolean.TRUE);
        pending.put("lastDispatchAt", Instant.now().toString());
        queue.add(pending);

        Map<String, Object> delivered = new LinkedHashMap<>();
        delivered.put("patientId", "MOCK-002");
        delivered.put("status", "delivered");
        delivered.put("retryable", Boolean.FALSE);
        delivered.put("lastDispatchAt", Instant.now().minusSeconds(90).toString());
        queue.add(delivered);
        return queue;
    }

    private Boolean readBooleanHeader(HttpServletRequest request, String headerName) {
        if (request == null || headerName == null) {
            return null;
        }
        String value = request.getHeader(headerName);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if ("1".equals(trimmed) || "true".equalsIgnoreCase(trimmed)) {
            return Boolean.TRUE;
        }
        if ("0".equals(trimmed) || "false".equalsIgnoreCase(trimmed)) {
            return Boolean.FALSE;
        }
        return null;
    }

    private String resolveRunId(HttpServletRequest request) {
        return AbstractOrcaRestResource.resolveRunIdValue(request);
    }

    private boolean isTrue(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        return "1".equals(trimmed) || "true".equalsIgnoreCase(trimmed);
    }
}
