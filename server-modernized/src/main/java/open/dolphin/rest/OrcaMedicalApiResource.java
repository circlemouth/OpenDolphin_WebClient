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
 * ORCA medical-related API bridge (medicalgetv2/medicalmodv2).
 */
@Path("/")
public class OrcaMedicalApiResource extends AbstractResource {

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
            if (endpoint == OrcaEndpoint.MEDICAL_GET) {
                requireTag(resolvedPayload, "Request_Number", "Request_Number is required");
            }
            if (endpoint == OrcaEndpoint.MEDICAL_MOD) {
                validateMedicalModPayload(resolvedPayload);
                resolvedPayload = normalizeMedicalModPayload(resolvedPayload);
            }
            resolvedPayload = OrcaApiProxySupport.applyQueryMeta(resolvedPayload, endpoint, classCode);
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(resolvedPayload));
            markSuccess(details);
            recordAudit(request, resourcePath, action, details, AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result, runId);
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

    private String normalizeMedicalModPayload(String payload) {
        if (payload == null || payload.isBlank()) {
            return payload;
        }
        if (!payload.contains("<medicalmodreq")) {
            return payload;
        }
        String patientId = extractTagValue(payload, "Patient_ID");
        String performDate = extractTagValue(payload, "Perform_Date");
        String diagnosisBlock = extractTagBlock(payload, "Diagnosis_Information");
        String normalizedDiagnosis;
        boolean hasDiagnosisBlock = diagnosisBlock != null && !diagnosisBlock.isBlank();
        if (hasDiagnosisBlock) {
            normalizedDiagnosis = normalizeMedicationInfoArray(diagnosisBlock);
        } else {
            StringBuilder diagnosis = new StringBuilder();
            appendTagBlock(payload, "Department_Code", diagnosis);
            appendTagBlock(payload, "Physician_Code", diagnosis);
            appendTagBlock(payload, "HealthInsurance_Information", diagnosis);
            appendTagBlock(payload, "Medical_Information", diagnosis);
            appendTagBlock(payload, "Disease_Information", diagnosis);
            normalizedDiagnosis = normalizeMedicationInfoArray(diagnosis.toString());
        }

        StringBuilder builder = new StringBuilder();
        builder.append("<data>");
        builder.append("<medicalreq type=\"record\">");
        if (patientId != null) {
            builder.append("<Patient_ID type=\"string\">").append(patientId).append("</Patient_ID>");
        }
        if (performDate != null) {
            builder.append("<Perform_Date type=\"string\">").append(performDate).append("</Perform_Date>");
        }
        if (!normalizedDiagnosis.isBlank()) {
            if (hasDiagnosisBlock) {
                builder.append(normalizedDiagnosis);
            } else {
                builder.append("<Diagnosis_Information type=\"record\">");
                builder.append(normalizedDiagnosis);
                builder.append("</Diagnosis_Information>");
            }
        }
        builder.append("</medicalreq>");
        builder.append("</data>");
        return builder.toString();
    }

    private void validateMedicalModPayload(String payload) {
        requireTag(payload, "Patient_ID", "Patient_ID is required");
        requireTag(payload, "Perform_Date", "Perform_Date is required");
        if (!hasXmlTagWithValue(payload, "Medical_Information")
                && !hasXmlTagWithValue(payload, "Diagnosis_Information")) {
            throw new BadRequestException("Medical_Information or Diagnosis_Information is required");
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
            if (value != null) {
                String trimmed = value.trim();
                return trimmed.isEmpty() ? null : trimmed;
            }
        }
        return null;
    }

    private void appendTagBlock(String payload, String tag, StringBuilder target) {
        if (payload == null || tag == null || target == null) {
            return;
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "<" + tag + "\\b[^>]*>.*?</" + tag + ">", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcher = pattern.matcher(payload);
        while (matcher.find()) {
            target.append(matcher.group());
        }
    }

    private String extractTagBlock(String payload, String tag) {
        if (payload == null || tag == null) {
            return null;
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "<" + tag + "\\b[^>]*>.*?</" + tag + ">", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcher = pattern.matcher(payload);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String normalizeMedicationInfoArray(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "(?s)<Medication_info\\b([^>]*)type=\"record\"([^>]*)>(.*?)</Medication_info>");
        java.util.regex.Matcher matcher = pattern.matcher(input);
        if (!matcher.find()) {
            return input;
        }
        StringBuffer buffer = new StringBuffer();
        do {
            String attributes = matcher.group(1) + "type=\"array\"" + matcher.group(2);
            String body = matcher.group(3);
            String replacement = "<Medication_info" + attributes + ">"
                    + "<Medication_info_child type=\"record\">"
                    + body
                    + "</Medication_info_child></Medication_info>";
            matcher.appendReplacement(buffer, java.util.regex.Matcher.quoteReplacement(replacement));
        } while (matcher.find());
        matcher.appendTail(buffer);
        return buffer.toString();
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
