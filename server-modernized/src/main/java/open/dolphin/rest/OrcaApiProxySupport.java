package open.dolphin.rest;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransportResult;
import open.dolphin.rest.orca.AbstractOrcaRestResource;

/**
 * Shared helpers for ORCA API proxy resources.
 */
public final class OrcaApiProxySupport {

    private OrcaApiProxySupport() {
    }

    public static Response buildProxyResponse(OrcaTransportResult result, String runIdHeader) {
        if (result == null) {
            return Response.serverError().build();
        }
        String runId = AbstractOrcaRestResource.resolveRunIdValue(runIdHeader);
        MediaType mediaType = resolveMediaType(result.getContentType());
        Response.ResponseBuilder builder = Response.ok(result.getBody(), mediaType)
                .header("X-Run-Id", runId);
        if (result.getHeaders() != null) {
            result.getHeaders().forEach((name, values) -> {
                if (name == null || values == null || values.isEmpty()) {
                    return;
                }
                String trimmed = name.trim();
                if (trimmed.startsWith("X-Orca-")) {
                    for (String value : values) {
                        if (value != null) {
                            builder.header(trimmed, value);
                        }
                    }
                }
            });
        }
        return builder.build();
    }

    public static MediaType resolveMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_XML_TYPE;
        }
        String normalized = contentType.toLowerCase();
        if (normalized.contains("json")) {
            return MediaType.APPLICATION_JSON_TYPE;
        }
        if (normalized.contains("xml")) {
            return MediaType.APPLICATION_XML_TYPE;
        }
        return MediaType.TEXT_PLAIN_TYPE;
    }

    public static boolean isJsonPayload(String payload) {
        if (payload == null) {
            return false;
        }
        String trimmed = payload.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    public static boolean isApiResultSuccess(String apiResult) {
        if (apiResult == null || apiResult.isBlank()) {
            return false;
        }
        for (int i = 0; i < apiResult.length(); i++) {
            if (apiResult.charAt(i) != '0') {
                return false;
            }
        }
        return true;
    }

    public static String applyQueryMeta(String payload, OrcaEndpoint endpoint, String classCode) {
        if (payload == null || payload.isBlank()) {
            return payload;
        }
        if (endpoint == null || classCode == null || classCode.isBlank()) {
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
}
