package open.dolphin.orca.transport;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Transport response details for ORCA API calls.
 */
public final class OrcaTransportResult {

    private final String url;
    private final String method;
    private final int status;
    private final String body;
    private final String contentType;
    private final Map<String, List<String>> headers;

    public OrcaTransportResult(String url, String method, int status, String body,
            String contentType, Map<String, List<String>> headers) {
        this.url = url;
        this.method = method;
        this.status = status;
        this.body = body;
        this.contentType = contentType;
        this.headers = headers != null ? headers : Collections.emptyMap();
    }

    public static OrcaTransportResult fallback(String body, String contentType) {
        return new OrcaTransportResult(null, "POST", 200, body, contentType, Collections.emptyMap());
    }

    public String getUrl() {
        return url;
    }

    public String getMethod() {
        return method;
    }

    public int getStatus() {
        return status;
    }

    public String getBody() {
        return body;
    }

    public String getContentType() {
        return contentType;
    }

    public Map<String, List<String>> getHeaders() {
        return headers;
    }
}
