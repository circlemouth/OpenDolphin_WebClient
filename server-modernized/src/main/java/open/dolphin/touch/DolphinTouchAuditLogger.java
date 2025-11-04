package open.dolphin.touch;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Audit and error helper that mirrors JsonTouchAuditLogger but tailored for DolphinResource endpoints.
 */
public final class DolphinTouchAuditLogger {

    private static final Logger AUDIT_LOGGER = Logger.getLogger("open.dolphin.audit.DolphinTouch");

    private DolphinTouchAuditLogger() {
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
        String message = error != null ? error.getMessage() : "Unexpected error";
        return build(logger, endpoint, traceId, error, Response.Status.INTERNAL_SERVER_ERROR,
                "error.touch.internal", message, Level.SEVERE);
    }

    public static WebApplicationException validationFailure(Logger logger, String endpoint, String traceId,
                                                            String message) {
        return build(logger, endpoint, traceId, null, Response.Status.BAD_REQUEST,
                "error.touch.validation", message, Level.WARNING);
    }

    public static WebApplicationException validationFailure(Logger logger, String endpoint, String traceId,
                                                            String message, Throwable cause) {
        return build(logger, endpoint, traceId, cause, Response.Status.BAD_REQUEST,
                "error.touch.validation", message, Level.WARNING);
    }

    public static WebApplicationException facilityMismatch(Logger logger, String endpoint, String traceId,
                                                           String expected, String actual) {
        String message = "Facility mismatch: expected=" + expected + ", actual=" + actual;
        return build(logger, endpoint, traceId, null, Response.Status.FORBIDDEN,
                "error.touch.facilityMismatch", message, Level.WARNING);
    }

    public static WebApplicationException unauthorized(String endpoint, String traceId, String message) {
        return build(null, endpoint, traceId, null, Response.Status.UNAUTHORIZED,
                "error.touch.unauthorized", message, Level.WARNING);
    }

    public static WebApplicationException notFound(Logger logger, String endpoint, String traceId, String message) {
        return build(logger, endpoint, traceId, null, Response.Status.NOT_FOUND,
                "error.touch.notFound", message, Level.INFO);
    }

    private static WebApplicationException build(Logger logger,
                                                 String endpoint,
                                                 String traceId,
                                                 Throwable error,
                                                 Response.Status status,
                                                 String type,
                                                 String message,
                                                 Level level) {
        String logMessage = format("failure", endpoint, traceId, message);
        if (logger != null) {
            logger.log(level, logMessage, error);
        }
        AUDIT_LOGGER.log(level, logMessage, error);
        TouchErrorResponse body = new TouchErrorResponse(type, message, traceId, status.getStatusCode());
        Response response = Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
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
