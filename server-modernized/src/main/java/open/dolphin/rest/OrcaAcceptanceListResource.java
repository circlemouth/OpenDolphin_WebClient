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
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * Minimal acceptlstv2 stub to avoid 404 during ORCA prod bridge検証.
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
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML, MediaType.APPLICATION_JSON, MediaType.WILDCARD})
    @Produces(MediaType.APPLICATION_XML)
    public Response postAcceptList(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondAcceptList(request, classCode, "/api01rv2/acceptlstv2");
    }

    @POST
    @Path("/api/api01rv2/acceptlstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML, MediaType.APPLICATION_JSON, MediaType.WILDCARD})
    @Produces(MediaType.APPLICATION_XML)
    public Response postAcceptListWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondAcceptList(request, classCode, "/api/api01rv2/acceptlstv2");
    }

    private Response respondAcceptList(HttpServletRequest request, String classCode, String resourcePath) {
        String body = resolveStub();
        recordAudit(request, classCode, resourcePath);
        return Response.ok(body, MediaType.APPLICATION_XML_TYPE)
                .header("X-Run-Id", RUN_ID)
                .build();
    }

    private String resolveStub() {
        if (orcaTransport != null) {
            return orcaTransport.invoke(OrcaEndpoint.ACCEPTANCE_LIST, "");
        }
        // Fallback: minimal payload to keep endpoint alive even if DI fails in tests.
        return """
                <xmlio2><acceptlstres><Api_Result>0000</Api_Result><Api_Result_Message>正常終了</Api_Result_Message></acceptlstres></xmlio2>
                """;
    }

    private void recordAudit(HttpServletRequest request, String classCode, String resourcePath) {
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

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("runId", RUN_ID);
        details.put("resource", resourcePath);
        if (classCode != null && !classCode.isBlank()) {
            details.put("class", classCode);
        }
        payload.setDetails(details);

        sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.SUCCESS, null, null);
    }
}
