package open.dolphin.touch;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.rest.AbstractResource;

/**
 * Utility class responsible for producing structured audit log entries for JsonTouch endpoints
 * and translating unexpected failures into REST friendly exceptions.
 */
public final class JsonTouchAuditLogger {

    private static final Logger AUDIT_LOGGER = Logger.getLogger("open.dolphin.audit.JsonTouch");

    private JsonTouchAuditLogger() {
    }

    public static String begin(String endpoint, Supplier<String> details) {
        return begin(endpoint, (String) null, details);
    }

    public static String begin(HttpServletRequest request, String endpoint, Supplier<String> details) {
        String traceId = AbstractResource.resolveTraceIdValue(request);
        return begin(endpoint, traceId, details);
    }

    public static String begin(String endpoint, String traceId, Supplier<String> details) {
        String resolvedTraceId = traceId;
        if (resolvedTraceId == null || resolvedTraceId.isBlank()) {
            resolvedTraceId = UUID.randomUUID().toString();
        }
        final String finalTraceId = resolvedTraceId;
        AUDIT_LOGGER.info(() -> format("start", endpoint, finalTraceId, safe(details)));
        return finalTraceId;
    }

    public static void success(String endpoint, String traceId, Supplier<String> details) {
        AUDIT_LOGGER.info(() -> format("success", endpoint, traceId, safe(details)));
    }

    public static WebApplicationException failure(Logger logger, String endpoint, String traceId, Throwable error) {
        String message = format("failure", endpoint, traceId, error != null ? error.getMessage() : null);
        if (logger != null) {
            logger.log(Level.SEVERE, message, error);
        }
        AUDIT_LOGGER.log(Level.SEVERE, message, error);
        Response response = Response.serverError()
                .type(MediaType.TEXT_PLAIN_TYPE)
                .entity(message)
                .build();
        return new WebApplicationException(error, response);
    }

    private static String safe(Supplier<String> supplier) {
        if (supplier == null) {
            return null;
        }
        String value = supplier.get();
        return value == null || value.isEmpty() ? null : value;
    }

    private static String format(String event, String endpoint, String traceId, String details) {
        StringBuilder builder = new StringBuilder();
        builder.append("event=").append(event);
        if (traceId != null) {
            builder.append(' ').append("traceId=").append(traceId);
        }
        if (endpoint != null) {
            builder.append(' ').append("endpoint=").append(endpoint);
        }
        if (details != null && !details.isEmpty()) {
            builder.append(' ').append(details);
        }
        return builder.toString();
    }
}
