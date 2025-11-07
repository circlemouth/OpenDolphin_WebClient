package open.dolphin.touch;

/**
 * Standardized error payload for Touch endpoints.
 */
public final class TouchErrorResponse {

    private final String type;
    private final String message;
    private final String traceId;
    private final int status;

    public TouchErrorResponse(String type, String message, String traceId, int status) {
        this.type = type;
        this.message = message;
        this.traceId = traceId;
        this.status = status;
    }

    public String getType() {
        return type;
    }

    public String getMessage() {
        return message;
    }

    public String getTraceId() {
        return traceId;
    }

    public int getStatus() {
        return status;
    }
}
