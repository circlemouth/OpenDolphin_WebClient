package open.dolphin.session.framework;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Maintains the trace context for session layer invocations on a per-thread
 * basis so that other infrastructure components can access correlation
 * information.
 */
@ApplicationScoped
public class SessionTraceManager {

    private static final Logger LOGGER = Logger.getLogger(SessionTraceManager.class.getName());

    private final ThreadLocal<SessionTraceContext> current = new ThreadLocal<>();

    public SessionTraceContext start(String operationName, Map<String, String> attributes) {
        SessionTraceContext context = new SessionTraceContext(generateTraceId(), Instant.now(), operationName, attributes);
        current.set(context);
        if (LOGGER.isLoggable(Level.FINE)) {
            LOGGER.fine(() -> "Session trace started: " + context.getTraceId() + " op=" + context.getOperation());
        }
        return context;
    }

    public SessionTraceContext current() {
        return current.get();
    }

    public void clear() {
        current.remove();
    }

    private String generateTraceId() {
        long random = ThreadLocalRandom.current().nextLong();
        return UUID.randomUUID().toString() + '-' + Long.toUnsignedString(random, 16);
    }
}
