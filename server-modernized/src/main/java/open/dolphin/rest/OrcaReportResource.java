package open.dolphin.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
import open.dolphin.orca.transport.OrcaTransportRequest;
import open.dolphin.orca.transport.OrcaTransportResult;
import open.dolphin.orca.transport.RestOrcaTransport;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * ORCA report endpoints (prescription/karte/report) and blobapi proxy.
 */
@Path("/")
public class OrcaReportResource extends AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(OrcaReportResource.class.getName());
    static final String RUN_ID = OrcaApiProxySupport.RUN_ID;
    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(30);
    private static final int BLOB_RETRY_MAX = 3;
    private static final long BLOB_RETRY_BACKOFF_MS = 300L;
    private static final ObjectMapper JSON = new ObjectMapper();

    @Inject
    OrcaTransport orcaTransport;

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(DEFAULT_CONNECT_TIMEOUT)
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    @POST
    @Path("/api01rv2/prescriptionv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postPrescription(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.PRESCRIPTION_REPORT,
                "/api01rv2/prescriptionv2", payload, "ORCA_REPORT_PRESCRIPTION");
    }

    @POST
    @Path("/api/api01rv2/prescriptionv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postPrescriptionWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.PRESCRIPTION_REPORT,
                "/api/api01rv2/prescriptionv2", payload, "ORCA_REPORT_PRESCRIPTION");
    }

    @POST
    @Path("/api01rv2/medicinenotebookv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postMedicineNotebook(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.MEDICINE_NOTEBOOK_REPORT,
                "/api01rv2/medicinenotebookv2", payload, "ORCA_REPORT_MEDICINE_NOTEBOOK");
    }

    @POST
    @Path("/api/api01rv2/medicinenotebookv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postMedicineNotebookWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.MEDICINE_NOTEBOOK_REPORT,
                "/api/api01rv2/medicinenotebookv2", payload, "ORCA_REPORT_MEDICINE_NOTEBOOK");
    }

    @POST
    @Path("/api01rv2/karteno1v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postKarteno1(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.KARTENO1_REPORT,
                "/api01rv2/karteno1v2", payload, "ORCA_REPORT_KARTENO1");
    }

    @POST
    @Path("/api/api01rv2/karteno1v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postKarteno1WithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.KARTENO1_REPORT,
                "/api/api01rv2/karteno1v2", payload, "ORCA_REPORT_KARTENO1");
    }

    @POST
    @Path("/api01rv2/karteno3v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postKarteno3(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.KARTENO3_REPORT,
                "/api01rv2/karteno3v2", payload, "ORCA_REPORT_KARTENO3");
    }

    @POST
    @Path("/api/api01rv2/karteno3v2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postKarteno3WithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.KARTENO3_REPORT,
                "/api/api01rv2/karteno3v2", payload, "ORCA_REPORT_KARTENO3");
    }

    @POST
    @Path("/api01rv2/invoicereceiptv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postInvoiceReceipt(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.INVOICE_RECEIPT_REPORT,
                "/api01rv2/invoicereceiptv2", payload, "ORCA_REPORT_INVOICE_RECEIPT");
    }

    @POST
    @Path("/api/api01rv2/invoicereceiptv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postInvoiceReceiptWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.INVOICE_RECEIPT_REPORT,
                "/api/api01rv2/invoicereceiptv2", payload, "ORCA_REPORT_INVOICE_RECEIPT");
    }

    @POST
    @Path("/api01rv2/statementv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postStatement(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.STATEMENT_REPORT,
                "/api01rv2/statementv2", payload, "ORCA_REPORT_STATEMENT");
    }

    @POST
    @Path("/api/api01rv2/statementv2")
    @Consumes({MediaType.APPLICATION_XML, MediaType.TEXT_XML})
    @Produces({MediaType.APPLICATION_JSON, "application/pdf"})
    public Response postStatementWithApiPrefix(@Context HttpServletRequest request, String payload) {
        return respondReport(request, OrcaEndpoint.STATEMENT_REPORT,
                "/api/api01rv2/statementv2", payload, "ORCA_REPORT_STATEMENT");
    }

    @GET
    @Path("/blobapi/{dataId}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response getBlob(@Context HttpServletRequest request, @PathParam("dataId") String dataId) {
        return proxyBlob(request, dataId, "/blobapi/" + dataId);
    }

    @GET
    @Path("/api/blobapi/{dataId}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response getBlobWithApiPrefix(@Context HttpServletRequest request, @PathParam("dataId") String dataId) {
        return proxyBlob(request, dataId, "/api/blobapi/" + dataId);
    }

    private Response respondReport(HttpServletRequest request, OrcaEndpoint endpoint, String resourcePath,
            String payload, String action) {
        Map<String, Object> details = buildAuditDetails(request, resourcePath);
        try {
            if (orcaTransport == null) {
                throw new OrcaGatewayException("ORCA transport is not available");
            }
            if (payload == null || payload.isBlank()) {
                throw new BadRequestException("ORCA report payload is required");
            }
            if (isJsonPayload(payload)) {
                throw new BadRequestException("ORCA report payload must be xml2");
            }
            OrcaTransportResult result = orcaTransport.invokeDetailed(endpoint, OrcaTransportRequest.post(payload));
            Response pdfResponse = tryPdfBlobResponse(request, result, payload, details, resourcePath, action);
            if (pdfResponse != null) {
                return pdfResponse;
            }
            markSuccess(details);
            recordAudit(request, resourcePath, action, details,
                    AuditEventEnvelope.Outcome.SUCCESS, null, null);
            return OrcaApiProxySupport.buildProxyResponse(result);
        } catch (RuntimeException ex) {
            String errorCode = "orca.report.error";
            String errorMessage = ex.getMessage();
            int status = (ex instanceof BadRequestException)
                    ? Response.Status.BAD_REQUEST.getStatusCode()
                    : Response.Status.BAD_GATEWAY.getStatusCode();
            markFailure(details, status, errorCode, errorMessage);
            recordAudit(request, resourcePath, action, details,
                    AuditEventEnvelope.Outcome.FAILURE, errorCode, errorMessage);
            throw ex;
        }
    }

    private Response tryPdfBlobResponse(HttpServletRequest request, OrcaTransportResult result, String payload,
            Map<String, Object> details, String resourcePath, String action) {
        if (result == null || result.getBody() == null || result.getBody().isBlank()) {
            return null;
        }
        if (!isPdfRequest(payload)) {
            return null;
        }
        String dataId = extractDataId(result.getBody());
        if (dataId == null || dataId.isBlank()) {
            return null;
        }
        byte[] zipBytes = fetchBlobWithRetry(request, dataId, details, resourcePath, action);
        if (zipBytes == null || zipBytes.length == 0) {
            return null;
        }
        byte[] pdfBytes = extractPdfFromZip(zipBytes);
        if (pdfBytes == null || pdfBytes.length == 0) {
            return null;
        }
        markSuccess(details);
        details.put("dataId", dataId);
        recordAudit(request, resourcePath, action, details,
                AuditEventEnvelope.Outcome.SUCCESS, null, null);
        return Response.ok(pdfBytes, "application/pdf")
                .header("X-Run-Id", RUN_ID)
                .header("X-Orca-Data-Id", dataId)
                .build();
    }

    private byte[] fetchBlobWithRetry(HttpServletRequest request, String dataId, Map<String, Object> details,
            String resourcePath, String action) {
        String authHeader = RestOrcaTransport.resolveBasicAuthHeader();
        if (authHeader == null || authHeader.isBlank()) {
            throw new OrcaGatewayException("ORCA basic auth is not configured");
        }
        String primaryUrl = RestOrcaTransport.buildOrcaUrl("/blobapi/" + dataId);
        String secondaryUrl = resolveAlternateBlobUrl(primaryUrl);
        BlobResult lastResult = null;
        RuntimeException lastFailure = null;
        for (String candidate : buildBlobCandidates(primaryUrl, secondaryUrl)) {
            for (int attempt = 0; attempt <= BLOB_RETRY_MAX; attempt++) {
                try {
                    BlobResult attemptResult = fetchBlob(candidate, authHeader);
                    lastResult = attemptResult;
                    if (attemptResult.status >= 200 && attemptResult.status < 300 && attemptResult.body != null) {
                        details.put("resolvedUrl", attemptResult.url);
                        return attemptResult.body;
                    }
                    if (!shouldRetryBlob(attemptResult.status)) {
                        break;
                    }
                } catch (RuntimeException ex) {
                    lastFailure = ex;
                }
                sleepQuietly(BLOB_RETRY_BACKOFF_MS);
            }
        }
        if (lastFailure != null) {
            throw lastFailure;
        }
        if (lastResult != null) {
            throw new OrcaGatewayException("ORCA blobapi response status " + lastResult.status);
        }
        throw new OrcaGatewayException("ORCA blobapi response missing");
    }

    private Response proxyBlob(HttpServletRequest request, String dataId, String resourcePath) {
        Map<String, Object> details = buildAuditDetails(request, resourcePath);
        try {
            if (dataId == null || dataId.isBlank()) {
                throw new IllegalArgumentException("dataId is required");
            }
            byte[] body = fetchBlobWithRetry(request, dataId, details, resourcePath, "ORCA_REPORT_BLOB");
            markSuccess(details);
            recordAudit(request, resourcePath, "ORCA_REPORT_BLOB", details,
                    AuditEventEnvelope.Outcome.SUCCESS, null, null);
            Response.ResponseBuilder builder = Response.ok(body)
                    .header("X-Run-Id", RUN_ID)
                    .header("X-Orca-Blob-Url", details.get("resolvedUrl"));
            return builder.type(MediaType.APPLICATION_OCTET_STREAM).build();
        } catch (RuntimeException ex) {
            String errorCode = "orca.report.blob.error";
            String errorMessage = ex.getMessage();
            markFailure(details, Response.Status.BAD_GATEWAY.getStatusCode(), errorCode, errorMessage);
            recordAudit(request, resourcePath, "ORCA_REPORT_BLOB", details,
                    AuditEventEnvelope.Outcome.FAILURE, errorCode, errorMessage);
            throw ex;
        }
    }

    private BlobResult fetchBlob(String url, String authHeader) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(DEFAULT_READ_TIMEOUT)
                    .header("Authorization", authHeader)
                    .GET()
                    .build();
            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
            String contentType = response.headers().firstValue("Content-Type").orElse(null);
            long contentLength = response.headers().firstValueAsLong("Content-Length").orElse(-1L);
            return new BlobResult(url, response.statusCode(), response.body(), contentType, contentLength);
        } catch (IOException ex) {
            LOGGER.log(Level.WARNING, "Failed to call ORCA blobapi: " + url, ex);
            throw new OrcaGatewayException("Failed to call ORCA blobapi", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new OrcaGatewayException("ORCA blobapi request interrupted", ex);
        } catch (IllegalArgumentException ex) {
            throw new OrcaGatewayException("Invalid ORCA blobapi URL: " + url, ex);
        }
    }

    private boolean shouldRetryBlob(int status) {
        return status == 404 || status == 202 || status == 204 || status == 503;
    }

    private void sleepQuietly(long backoffMs) {
        if (backoffMs <= 0) {
            return;
        }
        try {
            Thread.sleep(backoffMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private String resolveAlternateBlobUrl(String primaryUrl) {
        if (primaryUrl == null || primaryUrl.isBlank()) {
            return null;
        }
        if (primaryUrl.contains("/api/blobapi/")) {
            return primaryUrl.replace("/api/blobapi/", "/blobapi/");
        }
        if (primaryUrl.contains("/blobapi/")) {
            return primaryUrl.replace("/blobapi/", "/api/blobapi/");
        }
        return null;
    }

    private java.util.List<String> buildBlobCandidates(String primaryUrl, String secondaryUrl) {
        java.util.List<String> candidates = new java.util.ArrayList<>();
        if (primaryUrl != null && !primaryUrl.isBlank()) {
            candidates.add(primaryUrl);
        }
        if (secondaryUrl != null && !secondaryUrl.isBlank() && !secondaryUrl.equals(primaryUrl)) {
            candidates.add(secondaryUrl);
        }
        return candidates;
    }

    private String extractDataId(String json) {
        try {
            JsonNode root = JSON.readTree(json);
            Optional<JsonNode> node = findJsonValue(root, "Data_Id");
            return node.map(JsonNode::asText).orElse(null);
        } catch (IOException ex) {
            return null;
        }
    }

    private Optional<JsonNode> findJsonValue(JsonNode node, String key) {
        if (node == null || key == null) {
            return Optional.empty();
        }
        if (node.has(key)) {
            return Optional.ofNullable(node.get(key));
        }
        for (JsonNode child : node) {
            Optional<JsonNode> found = findJsonValue(child, key);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private boolean isPdfRequest(String payload) {
        if (payload == null) {
            return false;
        }
        String normalized = payload.replace("\r", "").replace("\n", "").toLowerCase();
        return normalized.contains("<print_mode>pdf</print_mode>")
                || normalized.contains("<print_mode>pdf </print_mode>")
                || normalized.contains("<output_format>pdf</output_format>")
                || normalized.contains("<output_format>1</output_format>")
                || normalized.contains("<output_format>2</output_format>");
    }

    private byte[] extractPdfFromZip(byte[] zipBytes) {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName() != null && entry.getName().toLowerCase().endsWith(".pdf")) {
                    out.reset();
                    zis.transferTo(out);
                    return out.toByteArray();
                }
            }
        } catch (IOException ex) {
            LOGGER.log(Level.WARNING, "Failed to extract PDF from ORCA blob zip", ex);
        }
        return null;
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

    private boolean isJsonPayload(String payload) {
        if (payload == null) {
            return false;
        }
        String trimmed = payload.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private static final class BlobResult {
        private final String url;
        private final int status;
        private final byte[] body;
        private final String contentType;
        private final long contentLength;

        private BlobResult(String url, int status, byte[] body, String contentType, long contentLength) {
            this.url = url;
            this.status = status;
            this.body = body;
            this.contentType = contentType;
            this.contentLength = contentLength;
        }
    }
}
