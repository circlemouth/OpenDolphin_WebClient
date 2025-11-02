package open.dolphin.session.framework;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@SessionOperation
@Interceptor
@Priority(Interceptor.Priority.APPLICATION)
public class SessionOperationInterceptor {

    private static final Logger LOGGER = Logger.getLogger(SessionOperationInterceptor.class.getName());

    @Inject
    SessionTraceManager traceManager;

    @AroundInvoke
    public Object aroundInvoke(InvocationContext ctx) throws Exception {
        SessionTraceContext existing = traceManager.current();
        boolean newContext = existing == null;
        SessionTraceContext context = existing;

        if (newContext) {
            Map<String, String> attributes = new HashMap<>();
            attributes.put("component", ctx.getTarget().getClass().getSimpleName());
            context = traceManager.start(operationName(ctx), attributes);
        }

        try {
            return ctx.proceed();
        } catch (Exception ex) {
            SessionServiceException wrapped = wrapException(ex, context);
            logException(wrapped);
            throw wrapped;
        } finally {
            if (newContext) {
                traceManager.clear();
            }
        }
    }

    private SessionServiceException wrapException(Exception ex, SessionTraceContext context) {
        if (ex instanceof SessionServiceException serviceException) {
            return serviceException;
        }
        String message = String.format("Session layer failure in %s", context != null ? context.getOperation() : "unknown operation");
        return new SessionServiceException(message, ex, context);
    }

    private void logException(SessionServiceException exception) {
        if (LOGGER.isLoggable(Level.SEVERE)) {
            LOGGER.log(Level.SEVERE, () -> String.format("Session operation failed [traceId=%s, operation=%s]",
                    exception.getTraceId(), exception.getOperation()), exception);
        }
    }

    private String operationName(InvocationContext ctx) {
        return ctx.getTarget().getClass().getName() + '#' + ctx.getMethod().getName();
    }
}
