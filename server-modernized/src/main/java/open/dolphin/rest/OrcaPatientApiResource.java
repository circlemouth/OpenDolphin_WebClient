package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
 * ORCA patient-related API bridge (patientgetv2/patientmodv2/patientlst7v2/patientmemomodv2).
 */
@Path("/")
public class OrcaPatientApiResource extends AbstractResource {

    static final String RUN_ID_FALLBACK = "fallback"; // deprecated sentinel; dynamic runId now used

    @Inject
    OrcaTransport orcaTransport;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @GET
    @Path("/api01rv2/patientgetv2")
    @Produces({MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON})
    public Response getPatient(@Context HttpServletRequest request,
            @QueryParam("id") String patientId,
            @QueryParam("class") String classCode,
            @QueryParam("format") String format) {
        return respondPatientGet(request, patientId, classCode, format, "/api01rv2/patientgetv2");
    }

    @GET
    @Path("/api/api01rv2/patientgetv2")
    @Produces({MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON})
    public Response getPatientWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("id") String patientId,
            @QueryParam("class") String classCode,
            @QueryParam("format") String format) {
        return respondPatientGet(request, patientId, classCode, format, "/api/api01rv2/patientgetv2");
    }

    @POST
    @Path("/orca12/patientmodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON})
    public Response postPatientMod(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.PATIENT_MOD, classCode,
                "/orca12/patientmodv2", payload, "ORCA_PATIENT_MOD");
    }

    @POST
    @Path("/api/orca12/patientmodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON})
    public Response postPatientModWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.PATIENT_MOD, classCode,
                "/api/orca12/patientmodv2", payload, "ORCA_PATIENT_MOD");
    }

    @POST
    @Path("/api01rv2/patientlst7v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postPatientMemoList(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.PATIENT_MEMO_LIST,
                "/api01rv2/patientlst7v2", payload, "ORCA_PATIENT_MEMO_LIST");
    }

    @POST
    @Path("/api/api01rv2/patientlst7v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postPatientMemoListWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.PATIENT_MEMO_LIST,
                "/api/api01rv2/patientlst7v2", payload, "ORCA_PATIENT_MEMO_LIST");
    }

    @POST
    @Path("/orca06/patientmemomodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postPatientMemoMod(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.PATIENT_MEMO_MOD,
                "/orca06/patientmemomodv2", payload, "ORCA_PATIENT_MEMO_MOD");
    }

    @POST
    @Path("/api/orca06/patientmemomodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postPatientMemoModWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.PATIENT_MEMO_MOD,
                "/api/orca06/patientmemomodv2", payload, "ORCA_PATIENT_MEMO_MOD");
    }

    private Response respondPatientGet(HttpServletRequest request, String patientId, String classCode, String format,
            String resourcePath) {
        String runId = AbstractOrcaRestResource.resolveRunIdValue(request);
        Map<String, Object> details = buildAuditDetails(request, resourcePath, runId);
        try {
            if (orcaTransport == null) {
                throw new OrcaGatewayException("ORCA transport is not available");
            }
            if (patientId == null || patientId.isBlank()) {
                throw new BadRequestException("id is required");
            }
            String query = "id=" + encode(patientId);
            if (classCode != null && !classCode.isBlank()) {
                query = query + "&class=" + encode(classCode);
                details.put("class", classCode);
            }
            if (format != null && !format.isBlank()) {
                query = query + "&format=" + encode(format);
                details.put("format", format);
            }
            details.put("patientId", patientId);
            OrcaTransportResult result = orcaTransport.invokeDetailed(OrcaEndpoint.PATIENT_GET, OrcaTransportRequest.get(query));
            markSuccess(details);
            recordAudit(request, resourcePath, "ORCA_PATIENT_GET", details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result, runId);
        } catch (RuntimeException ex) {
            String errorCode = "orca.patientget.error";
            String errorMessage = ex.getMessage();
            int status = (ex instanceof BadRequestException)
                    ? Response.Status.BAD_REQUEST.getStatusCode()
                    : Response.Status.BAD_GATEWAY.getStatusCode();
            markFailure(details, status, errorCode, errorMessage);
            recordAudit(request, resourcePath, "ORCA_PATIENT_GET", details, AuditEventEnvelope.Outcome.FAILURE,
                    errorCode, errorMessage);
            throw ex;
        }
    }

    private Response respondXml(HttpServletRequest request, OrcaEndpoint endpoint, String resourcePath,
            String payload, String action) {
        String runId = AbstractOrcaRestResource.resolveRunIdValue(request);
        Map<String, Object> details = buildAuditDetails(request, resourcePath, runId);
        try {
            if (orcaTransport == null) {
                throw new OrcaGatewayException("ORCA transport is not available");
            }
            String resolvedPayload = payload;
            if (resolvedPayload == null || resolvedPayload.isBlank()) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            if (OrcaApiProxySupport.isJsonPayload(resolvedPayload)) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            if (endpoint == OrcaEndpoint.PATIENT_MEMO_MOD) {
                validatePatientMemoPayload(resolvedPayload);
            }
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result, runId);
        } catch (RuntimeException ex) {
            String errorCode = "orca.patient.error";
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

    private Response respondXmlWithClass(HttpServletRequest request, OrcaEndpoint endpoint, String classCode,
            String resourcePath, String payload, String action) {
        String runId = AbstractOrcaRestResource.resolveRunIdValue(request);
        Map<String, Object> details = buildAuditDetails(request, resourcePath, runId);
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
            validatePatientModPayload(resolvedPayload, classCode);
            resolvedPayload = OrcaApiProxySupport.applyQueryMeta(resolvedPayload, endpoint, classCode);
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result, runId);
        } catch (RuntimeException ex) {
            String errorCode = "orca.patient.error";
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

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private void validatePatientModPayload(String payload, String classCode) {
        requireTag(payload, "Patient_ID", "Patient_ID is required");
        if ("03".equals(classCode)) {
            return;
        }
        if ("04".equals(classCode)) {
            requireTag(payload, "HealthInsurance_Information", "HealthInsurance_Information is required");
            return;
        }
        requireTag(payload, "WholeName", "WholeName is required");
        requireTag(payload, "WholeName_inKana", "WholeName_inKana is required");
        requireTag(payload, "BirthDate", "BirthDate is required");
        requireTag(payload, "Sex", "Sex is required");
    }

    private void validatePatientMemoPayload(String payload) {
        requireTag(payload, "Patient_ID", "Patient_ID is required");
        requireTag(payload, "Request_Number", "Request_Number is required");
        String requestNumber = extractTagValue(payload, "Request_Number");
        if ("01".equals(requestNumber) || "02".equals(requestNumber)) {
            requireTag(payload, "Department_Code", "Department_Code is required");
            requireTag(payload, "Patient_Memo", "Patient_Memo is required");
        }
    }

    private void requireTag(String payload, String tag, String message) {
        if (!hasXmlTagWithValue(payload, tag)) {
            throw new BadRequestException(message);
        }
    }

    private boolean hasXmlTagWithValue(String payload, String tag) {
        if (payload == null || payload.isBlank() || tag == null || tag.isBlank()) {
            return false;
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "<" + tag + "\\b[^>]*>(.*?)</" + tag + ">", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcher = pattern.matcher(payload);
        while (matcher.find()) {
            String content = matcher.group(1);
            if (content != null && !content.trim().isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private String extractTagValue(String payload, String tag) {
        if (payload == null || tag == null) {
            return null;
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "<" + tag + "\\b[^>]*>(.*?)</" + tag + ">", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcher = pattern.matcher(payload);
        if (matcher.find()) {
            String value = matcher.group(1);
            return value != null ? value.trim() : null;
        }
        return null;
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

}
