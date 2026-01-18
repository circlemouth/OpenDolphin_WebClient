package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
import open.dolphin.orca.transport.OrcaTransportRequest;
import open.dolphin.orca.transport.OrcaTransportResult;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.rest.orca.AbstractOrcaRestResource;

/**
 * ORCA system management endpoints (system01lstv2/manageusersv2/insprogetv2).
 */
@Path("/")
public class OrcaSystemManagementResource extends AbstractResource {

    @Inject
    OrcaTransport orcaTransport;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Path("/api01rv2/system01lstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSystemList(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondSystemList(request, classCode, "/api01rv2/system01lstv2", payload);
    }

    @POST
    @Path("/api/api01rv2/system01lstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSystemListWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondSystemList(request, classCode, "/api/api01rv2/system01lstv2", payload);
    }

    @POST
    @Path("/orca101/manageusersv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postManageUsers(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MANAGE_USERS, "/orca101/manageusersv2", payload,
                buildDefaultManageUsersPayload(), "ORCA_MANAGE_USERS");
    }

    @POST
    @Path("/api/orca101/manageusersv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postManageUsersWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MANAGE_USERS, "/api/orca101/manageusersv2", payload,
                buildDefaultManageUsersPayload(), "ORCA_MANAGE_USERS");
    }

    @POST
    @Path("/api01rv2/insprogetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postInsuranceProvider(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.INSURANCE_PROVIDER, "/api01rv2/insprogetv2", payload,
                buildDefaultInsuranceProviderPayload(), "ORCA_INSURANCE_PROVIDER");
    }

    @POST
    @Path("/api/api01rv2/insprogetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postInsuranceProviderWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.INSURANCE_PROVIDER, "/api/api01rv2/insprogetv2", payload,
                buildDefaultInsuranceProviderPayload(), "ORCA_INSURANCE_PROVIDER");
    }

    private Response respondSystemList(HttpServletRequest request, String classCode, String resourcePath,
            String payload) {
        String effectiveClass = (classCode == null || classCode.isBlank()) ? "02" : classCode.trim();
        String resolvedPayload = payload;
        if (resolvedPayload == null || resolvedPayload.isBlank()) {
            resolvedPayload = buildDefaultSystemListPayload(effectiveClass);
        }
        if (isJsonPayload(resolvedPayload)) {
            throw new BadRequestException("system01lstv2 requires xml2 payload");
        }
        resolvedPayload = applyQueryMeta(resolvedPayload, OrcaEndpoint.SYSTEM_MANAGEMENT_LIST, effectiveClass);
        String pathWithClass = resourcePath + "?class=" + effectiveClass;
        return respondXml(request, OrcaEndpoint.SYSTEM_MANAGEMENT_LIST, pathWithClass, resolvedPayload,
                null, "ORCA_SYSTEM_LIST");
    }

    private Response respondXml(HttpServletRequest request, OrcaEndpoint endpoint, String resourcePath,
            String payload, String defaultPayload, String action) {
        String runId = resolveRunId(request);
        Map<String, Object> details = buildAuditDetails(request, resourcePath, runId);
        try {
            if (orcaTransport == null) {
                throw new OrcaGatewayException("ORCA transport is not available");
            }
            String resolvedPayload = payload;
            if (resolvedPayload == null || resolvedPayload.isBlank()) {
                resolvedPayload = defaultPayload;
            }
            if (resolvedPayload == null || resolvedPayload.isBlank()) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            if (isJsonPayload(resolvedPayload)) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result, runId);
        } catch (RuntimeException ex) {
            String errorCode = "orca.system.error";
            String errorMessage = ex.getMessage();
            int status = (ex instanceof BadRequestException)
                    ? Response.Status.BAD_REQUEST.getStatusCode()
                    : Response.Status.BAD_GATEWAY.getStatusCode();
            markFailure(details, status, errorCode, errorMessage);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.FAILURE, errorCode, errorMessage);
            throw ex;
        }
    }

    private String buildDefaultSystemListPayload(String classCode) {
        StringBuilder builder = new StringBuilder();
        builder.append("<!-- orca-meta: path=")
                .append(OrcaEndpoint.SYSTEM_MANAGEMENT_LIST.getPath())
                .append(" method=POST query=class=").append(classCode).append(" -->");
        builder.append("<data>");
        builder.append("<system01lstv2req type=\"record\">");
        builder.append("<Request_Number type=\"string\">").append(classCode).append("</Request_Number>");
        builder.append("</system01lstv2req>");
        builder.append("</data>");
        return builder.toString();
    }

    private String buildDefaultManageUsersPayload() {
        StringBuilder builder = new StringBuilder();
        builder.append("<!-- orca-meta: path=")
                .append(OrcaEndpoint.MANAGE_USERS.getPath())
                .append(" method=POST -->");
        builder.append("<data>");
        builder.append("<manageusersreq type=\"record\">");
        builder.append("<Request_Number type=\"string\">01</Request_Number>");
        builder.append("</manageusersreq>");
        builder.append("</data>");
        return builder.toString();
    }

    private String buildDefaultInsuranceProviderPayload() {
        StringBuilder builder = new StringBuilder();
        builder.append("<!-- orca-meta: path=")
                .append(OrcaEndpoint.INSURANCE_PROVIDER.getPath())
                .append(" method=POST -->");
        builder.append("<data>");
        builder.append("<insprogetreq type=\"record\">");
        builder.append("</insprogetreq>");
        builder.append("</data>");
        return builder.toString();
    }

    private boolean isJsonPayload(String payload) {
        if (payload == null) {
            return false;
        }
        String trimmed = payload.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private String applyQueryMeta(String payload, OrcaEndpoint endpoint, String classCode) {
        if (payload == null || payload.isBlank()) {
            return payload;
        }
        if (classCode == null || classCode.isBlank()) {
            return payload;
        }
        String trimmed = payload.trim();
        String meta = "<!-- orca-meta: path=" + endpoint.getPath()
                + " method=POST query=class=" + classCode.trim() + " -->";
        if (trimmed.startsWith("<!--") && trimmed.contains("orca-meta:")) {
            return meta + trimmed;
        }
        return meta + trimmed;
    }

    private Map<String, Object> buildAuditDetails(HttpServletRequest request, String resourcePath, String runId) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("runId", runId);
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

    private void recordAudit(HttpServletRequest request, String resourcePath, String action, Map<String, Object> details,
            AuditEventEnvelope.Outcome outcome, String errorCode, String errorMessage) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(action);
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

    private String resolveRunId(HttpServletRequest request) {
        return AbstractOrcaRestResource.resolveRunIdValue(request);
    }
}
