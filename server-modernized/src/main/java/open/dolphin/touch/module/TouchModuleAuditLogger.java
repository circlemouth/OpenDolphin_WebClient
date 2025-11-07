package open.dolphin.touch.module;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Structured audit logger for Touch module endpoints.
 */
public final class TouchModuleAuditLogger {

    private static final Logger AUDIT_LOGGER = Logger.getLogger("open.dolphin.audit.TouchModule");

    private TouchModuleAuditLogger() {
    }

    public static String begin(String endpoint, Supplier<String> details) {
        String traceId = UUID.randomUUID().toString();
        AUDIT_LOGGER.info(() -> format("start", endpoint, traceId, safe(details)));
        return traceId;
    }

    public static void success(String endpoint, String traceId, Supplier<String> details) {
        AUDIT_LOGGER.info(() -> format("success", endpoint, traceId, safe(details)));
    }

    public static WebApplicationException failure(Logger logger, String endpoint, String traceId, Throwable error) {
        String message = format("failure", endpoint, traceId, error != null ? error.getMessage() : null);
        if (error instanceof WebApplicationException wae) {
            if (logger != null) {
                logger.log(Level.WARNING, message, wae);
            }
            AUDIT_LOGGER.log(Level.WARNING, message, wae);
            return wae;
        }
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
