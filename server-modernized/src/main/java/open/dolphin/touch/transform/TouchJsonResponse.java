package open.dolphin.touch.transform;

import java.util.List;

/**
 * Standard response envelope for Touch JSON conversion.
 */
public record TouchJsonResponse<T>(TouchJsonMetadata metadata,
                                   List<T> items,
                                   List<TouchJsonError> errors) {
}
