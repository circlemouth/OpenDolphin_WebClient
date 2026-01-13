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
import open.dolphin.orca.support.PushEventDeduplicator;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
import open.dolphin.orca.transport.OrcaTransportRequest;
import open.dolphin.orca.transport.OrcaTransportResult;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * ORCA additional API bridge (tmedicalgetv2/medicalmodv23/incomeinfv2/subjectives/contraindication/medication/masters).
 */
@Path("/")
public class OrcaAdditionalApiResource extends AbstractResource {

    static final String RUN_ID = OrcaApiProxySupport.RUN_ID;
    private static final PushEventDeduplicator PUSH_EVENT_DEDUPLICATOR = PushEventDeduplicator.createDefault();

    @Inject
    OrcaTransport orcaTransport;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    @POST
    @Path("/api01rv2/tmedicalgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postTempMedicalGet(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.TEMP_MEDICAL_GET,
                "/api01rv2/tmedicalgetv2", payload, "ORCA_TEMP_MEDICAL_GET", false);
    }

    @POST
    @Path("/api/api01rv2/tmedicalgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postTempMedicalGetWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.TEMP_MEDICAL_GET,
                "/api/api01rv2/tmedicalgetv2", payload, "ORCA_TEMP_MEDICAL_GET", false);
    }

    @POST
    @Path("/api21/medicalmodv23")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalModV23(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MEDICAL_MOD_V23,
                "/api21/medicalmodv23", payload, "ORCA_MEDICAL_MOD_V23", false);
    }

    @POST
    @Path("/api/api21/medicalmodv23")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalModV23WithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MEDICAL_MOD_V23,
                "/api/api21/medicalmodv23", payload, "ORCA_MEDICAL_MOD_V23", false);
    }

    @POST
    @Path("/api01rv2/incomeinfv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postIncomeInfo(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.INCOME_INFO,
                "/api01rv2/incomeinfv2", payload, "ORCA_INCOME_INFO", false);
    }

    @POST
    @Path("/api/api01rv2/incomeinfv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postIncomeInfoWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.INCOME_INFO,
                "/api/api01rv2/incomeinfv2", payload, "ORCA_INCOME_INFO", false);
    }

    @POST
    @Path("/api01rv2/subjectiveslstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSubjectivesList(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.SUBJECTIVES_LIST,
                "/api01rv2/subjectiveslstv2", payload, "ORCA_SUBJECTIVES_LIST", false);
    }

    @POST
    @Path("/api/api01rv2/subjectiveslstv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSubjectivesListWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.SUBJECTIVES_LIST,
                "/api/api01rv2/subjectiveslstv2", payload, "ORCA_SUBJECTIVES_LIST", false);
    }

    @POST
    @Path("/orca25/subjectivesv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSubjectivesMod(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.SUBJECTIVES_MOD, classCode,
                "/orca25/subjectivesv2", payload, "ORCA_SUBJECTIVES_MOD");
    }

    @POST
    @Path("/api/orca25/subjectivesv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSubjectivesModWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.SUBJECTIVES_MOD, classCode,
                "/api/orca25/subjectivesv2", payload, "ORCA_SUBJECTIVES_MOD");
    }

    @POST
    @Path("/api01rv2/contraindicationcheckv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postContraindication(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.CONTRAINDICATION_CHECK,
                "/api01rv2/contraindicationcheckv2", payload, "ORCA_CONTRAINDICATION", false);
    }

    @POST
    @Path("/api/api01rv2/contraindicationcheckv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postContraindicationWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.CONTRAINDICATION_CHECK,
                "/api/api01rv2/contraindicationcheckv2", payload, "ORCA_CONTRAINDICATION", false);
    }

    @POST
    @Path("/api01rv2/medicationgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicationGet(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MEDICATION_GET,
                "/api01rv2/medicationgetv2", payload, "ORCA_MEDICATION_GET", false);
    }

    @POST
    @Path("/api/api01rv2/medicationgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicationGetWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MEDICATION_GET,
                "/api/api01rv2/medicationgetv2", payload, "ORCA_MEDICATION_GET", false);
    }

    @POST
    @Path("/orca102/medicatonmodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicationMod(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.MEDICATION_MOD, classCode,
                "/orca102/medicatonmodv2", payload, "ORCA_MEDICATION_MOD");
    }

    @POST
    @Path("/api/orca102/medicatonmodv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicationModWithApiPrefix(@Context HttpServletRequest request,
            @QueryParam("class") String classCode,
            String payload) {
        return respondXmlWithClass(request, OrcaEndpoint.MEDICATION_MOD, classCode,
                "/api/orca102/medicatonmodv2", payload, "ORCA_MEDICATION_MOD");
    }

    @POST
    @Path("/orca51/masterlastupdatev3")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMasterLastUpdate(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MASTER_LAST_UPDATE,
                "/orca51/masterlastupdatev3", payload, "ORCA_MASTER_LAST_UPDATE", true);
    }

    @POST
    @Path("/api/orca51/masterlastupdatev3")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMasterLastUpdateWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MASTER_LAST_UPDATE,
                "/api/orca51/masterlastupdatev3", payload, "ORCA_MASTER_LAST_UPDATE", true);
    }

    @POST
    @Path("/api01rv2/systeminfv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSystemInfo(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.SYSTEM_INFO,
                "/api01rv2/systeminfv2", payload, "ORCA_SYSTEM_INFO", false);
    }

    @POST
    @Path("/api/api01rv2/systeminfv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSystemInfoWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.SYSTEM_INFO,
                "/api/api01rv2/systeminfv2", payload, "ORCA_SYSTEM_INFO", false);
    }

    @POST
    @Path("/api01rv2/system01dailyv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSystemDaily(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.SYSTEM_DAILY,
                "/api01rv2/system01dailyv2", payload, "ORCA_SYSTEM_DAILY", false);
    }

    @POST
    @Path("/api/api01rv2/system01dailyv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postSystemDailyWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.SYSTEM_DAILY,
                "/api/api01rv2/system01dailyv2", payload, "ORCA_SYSTEM_DAILY", false);
    }

    @POST
    @Path("/api01rv2/insuranceinf1v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postInsuranceList(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.INSURANCE_LIST,
                "/api01rv2/insuranceinf1v2", payload, "ORCA_INSURANCE_LIST", false);
    }

    @POST
    @Path("/api/api01rv2/insuranceinf1v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postInsuranceListWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.INSURANCE_LIST,
                "/api/api01rv2/insuranceinf1v2", payload, "ORCA_INSURANCE_LIST", false);
    }

    @POST
    @Path("/orca21/medicalsetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalSet(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MEDICAL_SET,
                "/orca21/medicalsetv2", payload, "ORCA_MEDICAL_SET", false);
    }

    @POST
    @Path("/api/orca21/medicalsetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_XML)
    public Response postMedicalSetWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondXml(request, OrcaEndpoint.MEDICAL_SET,
                "/api/orca21/medicalsetv2", payload, "ORCA_MEDICAL_SET", false);
    }

    @POST
    @Path("/api01rv2/pusheventgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_JSON)
    public Response postPushEventGet(@Context HttpServletRequest request, String payload) {
        return respondPushEvent(request, OrcaEndpoint.PUSH_EVENT_GET,
                "/api01rv2/pusheventgetv2", payload, "ORCA_PUSH_EVENT_GET");
    }

    @POST
    @Path("/api/api01rv2/pusheventgetv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces(MediaType.APPLICATION_JSON)
    public Response postPushEventGetWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondPushEvent(request, OrcaEndpoint.PUSH_EVENT_GET,
                "/api/api01rv2/pusheventgetv2", payload, "ORCA_PUSH_EVENT_GET");
    }

    private Response respondPushEvent(HttpServletRequest request, OrcaEndpoint endpoint, String resourcePath,
            String payload, String action) {
        Map<String, Object> details = buildAuditDetails(request, resourcePath);
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
            validatePayload(endpoint, resolvedPayload);
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            OrcaTransportResult filtered = applyPushEventDeduplication(result);
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(filtered);
        } catch (RuntimeException ex) {
            String errorCode = "orca.additional.error";
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

    private OrcaTransportResult applyPushEventDeduplication(OrcaTransportResult result) {
        if (result == null || result.getBody() == null || result.getBody().isBlank()) {
            return result;
        }
        PushEventDeduplicator.Result filtered = PUSH_EVENT_DEDUPLICATOR.filter(result.getBody());
        if (filtered.total() == 0) {
            return result;
        }
        java.util.Map<String, java.util.List<String>> headers = new java.util.LinkedHashMap<>(result.getHeaders());
        headers.put("X-Orca-PushEvent-Total", java.util.List.of(Integer.toString(filtered.total())));
        headers.put("X-Orca-PushEvent-Kept", java.util.List.of(Integer.toString(filtered.kept())));
        headers.put("X-Orca-PushEvent-Deduped", java.util.List.of(Integer.toString(filtered.deduped())));
        headers.put("X-Orca-PushEvent-New", java.util.List.of(Integer.toString(filtered.newlyAdded())));
        String body = filtered.modified() ? filtered.body() : result.getBody();
        return new OrcaTransportResult(result.getUrl(), result.getMethod(), result.getStatus(),
                body, result.getContentType(), headers);
    }

    private Response respondXml(HttpServletRequest request, OrcaEndpoint endpoint, String resourcePath,
            String payload, String action, boolean allowEmpty) {
        Map<String, Object> details = buildAuditDetails(request, resourcePath);
        try {
            if (orcaTransport == null) {
                throw new OrcaGatewayException("ORCA transport is not available");
            }
            String resolvedPayload = payload;
            if (resolvedPayload == null || resolvedPayload.isBlank()) {
                if (allowEmpty) {
                    resolvedPayload = "<data></data>";
                } else {
                    throw new BadRequestException("ORCA xml2 payload is required");
                }
            }
            if (OrcaApiProxySupport.isJsonPayload(resolvedPayload)) {
                throw new BadRequestException("ORCA xml2 payload is required");
            }
            validatePayload(endpoint, resolvedPayload);
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result);
        } catch (RuntimeException ex) {
            String errorCode = "orca.additional.error";
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
            validateClassPayload(endpoint, resolvedPayload, classCode);
            resolvedPayload = OrcaApiProxySupport.applyQueryMeta(resolvedPayload, endpoint, classCode);
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result);
        } catch (RuntimeException ex) {
            String errorCode = "orca.additional.error";
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

    private void validatePayload(OrcaEndpoint endpoint, String payload) {
        if (endpoint == null) {
            return;
        }
        switch (endpoint) {
            case TEMP_MEDICAL_GET -> requireTag(payload, "Request_Number", "Request_Number is required");
            case MEDICAL_MOD_V23 -> requireTag(payload, "Request_Number", "Request_Number is required");
            case INCOME_INFO -> requireTag(payload, "Request_Number", "Request_Number is required");
            case INSURANCE_LIST -> {
                requireTag(payload, "Request_Number", "Request_Number is required");
                requireTag(payload, "Base_Date", "Base_Date is required");
            }
            case SYSTEM_INFO -> {
                requireTag(payload, "Request_Date", "Request_Date is required");
                requireTag(payload, "Request_Time", "Request_Time is required");
            }
            case SYSTEM_DAILY -> requireTag(payload, "Request_Number", "Request_Number is required");
            case MEDICATION_GET -> {
                requireTag(payload, "Request_Number", "Request_Number is required");
                requireTag(payload, "Request_Code", "Request_Code is required");
            }
            case CONTRAINDICATION_CHECK -> {
                requireTag(payload, "Patient_ID", "Patient_ID is required");
                requireTag(payload, "Perform_Month", "Perform_Month is required");
            }
            case SUBJECTIVES_LIST -> requireTag(payload, "Request_Number", "Request_Number is required");
            case MEDICAL_SET -> requireTag(payload, "Request_Number", "Request_Number is required");
            case PUSH_EVENT_GET -> requireTag(payload, "Request_Number", "Request_Number is required");
            default -> {
            }
        }
    }

    private void validateClassPayload(OrcaEndpoint endpoint, String payload, String classCode) {
        if (endpoint == null) {
            return;
        }
        if (endpoint == OrcaEndpoint.SUBJECTIVES_MOD) {
            requireTag(payload, "Patient_ID", "Patient_ID is required");
            requireTag(payload, "Perform_Date", "Perform_Date is required");
            requireTag(payload, "InOut", "InOut is required");
            requireTag(payload, "Department_Code", "Department_Code is required");
            requireTag(payload, "Insurance_Combination_Number", "Insurance_Combination_Number is required");
            requireTag(payload, "Subjectives_Detail_Record", "Subjectives_Detail_Record is required");
            requireTag(payload, "Subjectives_Code", "Subjectives_Code is required");
        }
        if (endpoint == OrcaEndpoint.MEDICATION_MOD) {
            requireTag(payload, "Request_Number", "Request_Number is required");
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
