package open.dolphin.touch.transform;

import java.util.List;

/**
 * Result wrapper for Touch JSON conversion with both data and envelope.
 */
public record TouchJsonTransformResult<T>(T data,
                                          TouchJsonResponse<T> response,
                                          List<TouchJsonError> errors,
                                          String traceId,
                                          String requestId) {
}
