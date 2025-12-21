package open.dolphin.touch.transform;

import java.time.OffsetDateTime;

/**
 * Metadata envelope for Touch JSON responses.
 */
public record TouchJsonMetadata(String traceId,
                                String requestId,
                                String facilityId,
                                OffsetDateTime timestamp,
                                String endpoint) {
}
