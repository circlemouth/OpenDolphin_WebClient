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

/**
 * ORCA medical-related API bridge (medicalgetv2/medicalmodv2).
 */
@Path("/")
public class OrcaMedicalApiResource extends AbstractResource {

    static final String RUN_ID = OrcaApiProxySupport.RUN_ID;

    @Inject
    OrcaTransport orcaTransport;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Path("/api01rv2/medicalgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalGet(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.MEDICAL_GET, classCode,
                "/api01rv2/medicalgetv2", payload, "ORCA_MEDICAL_GET");
    }

    @POST
    @Path("/api/api01rv2/medicalgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalGetWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.MEDICAL_GET, classCode,
                "/api/api01rv2/medicalgetv2", payload, "ORCA_MEDICAL_GET");
    }

    @POST
    @Path("/api21/medicalmodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalMod(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.MEDICAL_MOD, classCode,
                "/api21/medicalmodv2", payload, "ORCA_MEDICAL_MOD");
    }

    @POST
    @Path("/api/api21/medicalmodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalModWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.MEDICAL_MOD, classCode,
                "/api/api21/medicalmodv2", payload, "ORCA_MEDICAL_MOD");
    }

    private Response respondXmlWithClass(HttpServletRequest request, OrcaEndpoint endpoint, String classCode,
            String resourcePath, String payload, String action) {
        Map<String, Object> details = buildAuditDetails(request, resourcePath);
        if (classCode != null && !classCode.isBlank()) {
            details.put("class", classCode);
        }
        try {
            if (orcaTransport == null) {
                throw new OrcaGatewayException("ORCA transport is not available");
            }
            if (classCode == null || classCode.isBlank()) {
                throw new BadRequestException("class is required");
            }
            String resolvedPayload = payload;
            if (resolvedPayload == null || resolvedPayload.isBlank()) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            if (OrcaApiProxySupport.isJsonPayload(resolvedPayload)) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            resolvedPayload = OrcaApiProxySupport.applyQueryMeta(resolvedPayload, endpoint, classCode);
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result);
        } catch (RuntimeException ex) {
            String errorCode = "orca.medical.error";
            String errorMessage = ex.getMessage();
            int status = (ex instanceof BadRequestException)
                    ? Response.Status.BAD_REQUEST.getStatusCode()
                    : Response.Status.BAD_GATEWAY.getStatusCode();
            markFailure(details, status, errorCode, errorMessage);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.FAILURE,
                    errorCode, errorMessage);
            throw ex;
        }
    }

    private Map<String, Object> buildAuditDetails(HttpServletRequest request, String resourcePath) {
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
}
