package open.dolphin.rest;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransportResult;

/**
 * Shared helpers for ORCA API proxy resources.
 */
public final class OrcaApiProxySupport {

    public static final String RUN_ID = "20260112T113317Z";

    private OrcaApiProxySupport() {
    }

    public static Response buildProxyResponse(OrcaTransportResult result) {
        if (result == null) {
            return Response.serverError().build();
        }
        MediaType mediaType = resolveMediaType(result.getContentType());
        return Response.ok(result.getBody(), mediaType)
                .header("X-Run-Id", RUN_ID)
                .build();
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
