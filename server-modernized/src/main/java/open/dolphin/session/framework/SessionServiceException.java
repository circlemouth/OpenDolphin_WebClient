package open.dolphin.session.framework;

/**
 * Runtime exception that enriches the original cause with session level trace
 * metadata so that upstream layers can surface consistent error responses
 * while keeping the original stack trace available for diagnostics.
 */
public class SessionServiceException extends RuntimeException {

    private final String traceId;
    private final String operation;

    public SessionServiceException(String message, Throwable cause, SessionTraceContext context) {
        super(message, cause);
        this.traceId = context != null ? context.getTraceId() : null;
        this.operation = context != null ? context.getOperation() : null;
    }

    public String getTraceId() {
        return traceId;
    }

    public String getOperation() {
        return operation;
    }
}
