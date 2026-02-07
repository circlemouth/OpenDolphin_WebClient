package open.dolphin.rest;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@ApplicationScoped
public class OrcaQueueStore {

    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_DELIVERED = "delivered";

    private final ConcurrentMap<String, QueueEntry> entries = new ConcurrentHashMap<>();

    public OrcaQueueStore() {
        seedDefaults();
    }

    public List<QueueEntry> snapshot() {
        List<QueueEntry> list = new ArrayList<>(entries.values());
        list.sort(Comparator.comparing(QueueEntry::patientId));
        return list;
    }

    public RetryOutcome retry(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return RetryOutcome.rejected("patientId_required");
        }
        QueueEntry existing = entries.get(patientId);
        if (existing == null) {
            return RetryOutcome.rejected("not_found");
        }
        if (!existing.retryable()) {
            return RetryOutcome.rejected("not_retryable");
        }
        QueueEntry updated = existing.withStatus(STATUS_PENDING, Instant.now().toString(), null);
        entries.put(patientId, updated);
        return RetryOutcome.applied("mock_retry");
    }

    public boolean discard(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return false;
        }
        return entries.remove(patientId) != null;
    }

    private void seedDefaults() {
        Instant now = Instant.now();
        QueueEntry pending = new QueueEntry(
                "MOCK-001",
                STATUS_PENDING,
                true,
                now.toString(),
                null
        );
        QueueEntry delivered = new QueueEntry(
                "MOCK-002",
                STATUS_DELIVERED,
                false,
                now.minusSeconds(90).toString(),
                null
        );
        entries.put(pending.patientId(), pending);
        entries.put(delivered.patientId(), delivered);
    }

    public record QueueEntry(
            String patientId,
            String status,
            boolean retryable,
            String lastDispatchAt,
            String error
    ) {
        QueueEntry withStatus(String nextStatus, String dispatchedAt, String nextError) {
            return new QueueEntry(patientId, nextStatus, retryable, dispatchedAt, nextError);
        }
    }

    public record RetryOutcome(boolean applied, String reason) {
        static RetryOutcome applied(String reason) {
            return new RetryOutcome(true, reason);
        }

        static RetryOutcome rejected(String reason) {
            return new RetryOutcome(false, reason);
        }
    }
}
