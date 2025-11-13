package open.dolphin.touch.support;

import jakarta.enterprise.inject.spi.CDI;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.Response;
import java.util.Map;

final class TouchAuditEvents {

    private TouchAuditEvents() {
    }

    static void recordIdentityFailure(HttpServletRequest request,
                                      Response.Status status,
                                      String errorCode,
                                      String message,
                                      Map<String, Object> details) {
        TouchFailureAuditLogger logger = resolveLogger();
        if (logger != null) {
            logger.recordIdentityFailure(request, status, errorCode, message, details);
        }
    }

    private static TouchFailureAuditLogger resolveLogger() {
        try {
            return CDI.current().select(TouchFailureAuditLogger.class).get();
        } catch (IllegalStateException ex) {
            return null;
        }
    }
}
