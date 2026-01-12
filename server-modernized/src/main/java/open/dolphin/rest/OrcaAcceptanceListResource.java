package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * ORCA accept list bridge (acceptlstv2).
 */
@Path("/")
public class OrcaAcceptanceListResource extends AbstractResource {

    static final String RUN_ID = "20251210T234513Z";

    @Inject
    OrcaTransport orcaTransport;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Path("/api01rv2/acceptlstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postAcceptList(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondAcceptList(request, classCode, "/api01rv2/acceptlstv2", payload);
    }

    @POST
    @Path("/api/api01rv2/acceptlstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postAcceptListWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondAcceptList(request, classCode, "/api/api01rv2/acceptlstv2", payload);
    }

    private Response respondAcceptList(HttpServletRequest request, String classCode, String resourcePath, String payload) {
        Map<String, Object> details = buildAuditDetails(request, classCode, resourcePath);
        try {
            String body = resolveAcceptListPayload(payload, classCode);
            markSuccess(details);
            recordAudit(request, resourcePath, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return Response.ok(body, MediaType.APPLICATION_XML_TYPE)
                    .header("X-Run-Id", RUN_ID)
                    .build();
        } catch (RuntimeException ex) {
            String errorCode = "orca.acceptlist.error";
            String errorMessage = ex.getMessage();
            markFailure(details, Response.Status.BAD_GATEWAY.getStatusCode(), errorCode, errorMessage);
            recordAudit(request, resourcePath, details, AuditEventEnvelope.Outcome.FAILURE, errorCode, errorMessage);
            throw ex;
        }
    }

    private String resolveAcceptListPayload(String payload, String classCode) {
        if (orcaTransport == null) {
            throw new OrcaGatewayException("ORCA transport is not available");
        }
        String resolvedPayload = payload;
        if (resolvedPayload == null || resolvedPayload.isBlank()) {
            resolvedPayload = buildDefaultAcceptListPayload(classCode);
        }
        resolvedPayload = applyQueryMeta(resolvedPayload, classCode);
        return orcaTransport.invoke(OrcaEndpoint.ACCEPTANCE_LIST, resolvedPayload);
    }

    private String buildDefaultAcceptListPayload(String classCode) {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalTime now = java.time.LocalTime.now().withNano(0);
        StringBuilder builder = new StringBuilder();
        builder.append("<!-- orca-meta: path=")
                .append(OrcaEndpoint.ACCEPTANCE_LIST.getPath())
                .append(" method=POST");
        if (classCode != null && !classCode.isBlank()) {
            builder.append(" query=class=").append(classCode.trim());
        }
        builder.append(" -->");
        builder.append("<data>");
        builder.append("<acceptlstv2req type=\"record\">");
        builder.append("<Acceptance_Date type=\"string\">").append(today).append("</Acceptance_Date>");
        builder.append("<Acceptance_Time type=\"string\">").append(now).append("</Acceptance_Time>");
        builder.append("</acceptlstv2req>");
        builder.append("</data>");
        return builder.toString();
    }

    private String applyQueryMeta(String payload, String classCode) {
        if (payload == null || payload.isBlank()) {
            return payload;
        }
        if (classCode == null || classCode.isBlank()) {
            return payload;
        }
        String trimmed = payload.trim();
        String meta = "<!-- orca-meta: path=" + OrcaEndpoint.ACCEPTANCE_LIST.getPath()
                + " method=POST query=class=" + classCode.trim() + " -->";
        if (trimmed.startsWith("<!--") && trimmed.contains("orca-meta:")) {
            return meta + trimmed;
        }
        return meta + trimmed;
    }

    private Map<String, Object> buildAuditDetails(HttpServletRequest request, String classCode, String resourcePath) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("runId", RUN_ID);
        details.put("resource", resourcePath);
        String remoteUser = request != null ? request.getRemoteUser() : null;
        String facilityId = getRemoteFacility(remoteUser);
        if (facilityId != null && !facilityId.isBlank()) {
            details.put("facilityId", facilityId);
        }
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            details.put("traceId", traceId);
        }
        String requestId = request != null ? request.getHeader("X-Request-Id") : null;
        if (requestId != null && !requestId.isBlank()) {
            details.put("requestId", requestId);
        } else if (traceId != null && !traceId.isBlank()) {
            details.put("requestId", traceId);
        }
        if (classCode != null && !classCode.isBlank()) {
            details.put("class", classCode);
        }
        return details;
    }

    private void markSuccess(Map<String, Object> details) {
        if (details != null) {
            details.put("status", "success");
        }
    }

    private void markFailure(Map<String, Object> details, int httpStatus, String errorCode, String errorMessage) {
        if (details == null) {
            return;
        }
        details.put("status", "failed");
        details.put("httpStatus", httpStatus);
        if (errorCode != null && !errorCode.isBlank()) {
            details.put("errorCode", errorCode);
        }
        if (errorMessage != null && !errorMessage.isBlank()) {
            details.put("errorMessage", errorMessage);
        }
    }

    private void recordAudit(HttpServletRequest request, String resourcePath, Map<String, Object> details,
            AuditEventEnvelope.Outcome outcome, String errorCode, String errorMessage) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction("ORCA_ACCEPT_LIST");
        payload.setResource(resourcePath);
        payload.setActorId(request != null ? request.getRemoteUser() : null);
        payload.setIpAddress(request != null ? request.getRemoteAddr() : null);
        payload.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            payload.setTraceId(traceId);
        }
        String requestId = request != null ? request.getHeader("X-Request-Id") : null;
        if (requestId != null && !requestId.isBlank()) {
            payload.setRequestId(requestId);
        } else if (traceId != null && !traceId.isBlank()) {
            payload.setRequestId(traceId);
        }

        payload.setDetails(details);

        sessionAuditDispatcher.record(payload, outcome, errorCode, errorMessage);
    }
}
