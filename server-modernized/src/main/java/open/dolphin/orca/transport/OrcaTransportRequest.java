package open.dolphin.orca.transport;

import java.util.Objects;

/**
 * Request metadata for ORCA transport calls.
 */
public final class OrcaTransportRequest {

    private final String method;
    private final String body;
    private final String query;
    private final String accept;

    private OrcaTransportRequest(String method, String body, String query, String accept) {
        this.method = method;
        this.body = body;
        this.query = query;
        this.accept = accept;
    }

    public static OrcaTransportRequest post(String body) {
        return new OrcaTransportRequest("POST", body, null, null);
    }

    public static OrcaTransportRequest get(String query) {
        return new OrcaTransportRequest("GET", null, query, null);
    }

    public OrcaTransportRequest withMethod(String value) {
        return new OrcaTransportRequest(value, body, query, accept);
    }

    public OrcaTransportRequest withBody(String value) {
        return new OrcaTransportRequest(method, value, query, accept);
    }

    public OrcaTransportRequest withQuery(String value) {
        return new OrcaTransportRequest(method, body, value, accept);
    }

    public OrcaTransportRequest withAccept(String value) {
        return new OrcaTransportRequest(method, body, query, value);
    }

    public String getMethod() {
        return method;
    }

    public String getBody() {
        return body;
    }

    public String getQuery() {
        return query;
    }

    public String getAccept() {
        return accept;
    }

    public boolean isMethod(String expected) {
        if (expected == null) {
            return false;
        }
        return Objects.equals(expected.toUpperCase(), method != null ? method.toUpperCase() : null);
    }
}
