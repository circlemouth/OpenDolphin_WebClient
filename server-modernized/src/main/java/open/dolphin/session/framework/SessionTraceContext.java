package open.dolphin.session.framework;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Immutable representation of the trace information associated with a single
 * session-layer invocation.
 */
public final class SessionTraceContext {

    public static final String ATTRIBUTE_ACTOR_ROLE = "actorRole";

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

    public String getActorRole() {
        return attributes.get(ATTRIBUTE_ACTOR_ROLE);
    }

    public SessionTraceContext withActorRole(String actorRole) {
        Map<String, String> updated = new HashMap<>(attributes);
        if (actorRole == null || actorRole.isBlank()) {
            updated.remove(ATTRIBUTE_ACTOR_ROLE);
        } else {
            updated.put(ATTRIBUTE_ACTOR_ROLE, actorRole);
        }
        return new SessionTraceContext(traceId, startedAt, operation, updated);
    }
}
