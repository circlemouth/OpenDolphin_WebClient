package open.dolphin.session.framework;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;

/**
 * Immutable representation of the trace information associated with a single
 * session-layer invocation.
 */
public final class SessionTraceContext {

    private final String traceId;
    private final Instant startedAt;
    private final String operation;
    private final Map<String, String> attributes;

    public SessionTraceContext(String traceId, Instant startedAt, String operation, Map<String, String> attributes) {
        this.traceId = Objects.requireNonNull(traceId, "traceId must not be null");
        this.startedAt = Objects.requireNonNull(startedAt, "startedAt must not be null");
        this.operation = Objects.requireNonNull(operation, "operation must not be null");
        this.attributes = attributes == null ? Collections.emptyMap() : Map.copyOf(attributes);
    }

    public String getTraceId() {
        return traceId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public String getOperation() {
        return operation;
    }

    public Map<String, String> getAttributes() {
        return attributes;
    }
}
