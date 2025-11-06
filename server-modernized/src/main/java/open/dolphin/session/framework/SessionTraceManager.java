package open.dolphin.session.framework;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Maintains the trace context for session layer invocations on a per-thread
 * basis so that other infrastructure components can access correlation
 * information.
 */
@ApplicationScoped
public class SessionTraceManager {

    private static final Logger LOGGER = LoggerFactory.getLogger(SessionTraceManager.class);

    private final ThreadLocal<SessionTraceContext> current = new ThreadLocal<>();

    public SessionTraceContext start(String operationName, Map<String, String> attributes) {
        SessionTraceContext context = new SessionTraceContext(generateTraceId(), Instant.now(), operationName, attributes);
        current.set(context);
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("Session trace started: {} op={}", context.getTraceId(), context.getOperation());
        }
        return context;
    }

    public SessionTraceContext current() {
        return current.get();
    }

    public void setActorRole(String actorRole) {
        SessionTraceContext context = current();
        if (context == null) {
            return;
        }
        SessionTraceContext updated = context.withActorRole(actorRole);
        current.set(updated);
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("Session trace actor role set: {} traceId={}", actorRole, updated.getTraceId());
        }
    }

    public void clear() {
        current.remove();
    }

    private String generateTraceId() {
        long random = ThreadLocalRandom.current().nextLong();
        return UUID.randomUUID().toString() + '-' + Long.toUnsignedString(random, 16);
    }
}
