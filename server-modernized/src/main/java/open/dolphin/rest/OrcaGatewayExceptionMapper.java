package open.dolphin.rest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.rest.orca.AbstractOrcaRestResource;

@Provider
public class OrcaGatewayExceptionMapper implements ExceptionMapper<OrcaGatewayException> {

    @Context
    private HttpServletRequest request;

    @Override
    public Response toResponse(OrcaGatewayException exception) {
        int status = resolveStatus(exception);
        String runId = AbstractOrcaRestResource.resolveRunIdValue(request);
        String traceId = request != null ? request.getHeader("X-Trace-Id") : null;
        String path = request != null ? request.getRequestURI() : null;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("error", "orca_gateway_error");
        body.put("message", exception != null ? exception.getMessage() : "Orca gateway error");
        body.put("runId", runId);
        if (traceId != null && !traceId.isBlank()) {
            body.put("traceId", traceId);
        }
        if (path != null && !path.isBlank()) {
            body.put("path", path);
        }
        body.put("timestamp", Instant.now().toString());

        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .header("X-Run-Id", runId)
                .build();
    }

    private int resolveStatus(OrcaGatewayException exception) {
        if (exception == null) {
            return Response.Status.BAD_GATEWAY.getStatusCode();
        }
        String message = exception.getMessage();
        if (message != null) {
            String normalized = message.trim().toLowerCase();
            if (normalized.contains("settings") || normalized.contains("not available")
                    || normalized.contains("incomplete")) {
                return Response.Status.SERVICE_UNAVAILABLE.getStatusCode();
            }
        }
        return Response.Status.BAD_GATEWAY.getStatusCode();
    }
}
