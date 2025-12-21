package open.dolphin.touch.transform;

/**
 * Error payload for Touch JSON conversion failures.
 */
public record TouchJsonError(String type,
                             String message,
                             String traceId,
                             String target) {
}
