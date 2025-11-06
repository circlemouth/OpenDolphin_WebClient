package open.dolphin.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.OutboundSseEvent;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.function.Consumer;
import open.dolphin.converter.ChartEventModelConverter;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.session.support.ChartEventSessionKeys;
import open.dolphin.session.support.ChartEventStreamPublisher;

/**
 * Support component that bridges {@link ChartEventResource} SSE subscriptions
 * with {@link ChartEventServiceBean} notifications.
 *
 * <p>The implementation keeps the legacy long-poll based dispatcher intact
 * while providing a dedicated Server-Sent Events channel. Facilities receive
 * an independent event history buffer so that reconnecting clients can request
 * missed events through the {@code Last-Event-ID} header.</p>
 */
@ApplicationScoped
public class ChartEventSseSupport implements ChartEventStreamPublisher {

    private static final Logger LOGGER = Logger.getLogger(ChartEventSseSupport.class.getName());

    private static final int HISTORY_LIMIT = 100;

    private final Map<String, FacilityContext> facilityContexts = new ConcurrentHashMap<>();

    private final AtomicLong sequence = new AtomicLong();

    private final ObjectMapper mapper = AbstractResource.getSerializeMapper();

    /**
     * Registers a new SSE subscription for the specified facility.
     *
     * @param facilityId  facility identifier resolved from the authenticated user
     * @param clientUuid  UUID representing the subscribing client
     * @param sse         SSE factory provided by Jakarta REST runtime
     * @param sink        active event sink to stream events to
     * @param lastEventId optional "Last-Event-ID" header for replay
     */
    public void register(String facilityId, String clientUuid, Sse sse, SseEventSink sink, String lastEventId) {
        Objects.requireNonNull(facilityId, "facilityId");
        Objects.requireNonNull(clientUuid, "clientUuid");
        Objects.requireNonNull(sink, "sink");
        if (sink.isClosed()) {
            return;
        }

        FacilityContext context = facilityContexts.computeIfAbsent(facilityId, id -> new FacilityContext());
        SseClient client = new SseClient(clientUuid, sink, sse);
        context.addClient(client);

        long replayAfter = parseEventId(lastEventId);
        if (replayAfter >= 0) {
            context.replayHistory(replayAfter, client, payload -> sendEvent(context, payload, client));
        }
    }

    /**
     * Removes the specified sink from the facility context.
     */
    public void unregister(String facilityId, SseEventSink sink) {
        FacilityContext context = facilityContexts.get(facilityId);
        if (context != null) {
            context.removeClient(sink);
        }
    }

    /**
     * Broadcasts the chart event to SSE subscribers that belong to the same
     * facility but are not the issuer of the event.
     */
    @Override
    public void broadcast(ChartEventModel event) {
        String facilityId = event.getFacilityId();
        if (facilityId == null) {
            return;
        }
        FacilityContext context = facilityContexts.get(facilityId);
        if (context == null) {
            return;
        }

        String json = toJson(event);
        if (json == null) {
            return;
        }

        long id = sequence.incrementAndGet();
        SsePayload payload = new SsePayload(id, event.getIssuerUUID(), json);
        context.appendHistory(payload);

        for (SseClient client : context.clients) {
            if (client.sink.isClosed()) {
                context.removeClient(client.sink);
                continue;
            }
            if (payload.issuerUuid != null && payload.issuerUuid.equals(client.clientUuid)) {
                continue;
            }
            sendEvent(context, payload, client);
        }
    }

    private void sendEvent(FacilityContext context, SsePayload payload, SseClient client) {
        if (client == null || client.sink.isClosed()) {
            return;
        }

        OutboundSseEvent event = client.sse.newEventBuilder()
                .name(ChartEventSessionKeys.SSE_EVENT_NAME)
                .id(Long.toString(payload.id))
                .mediaType(MediaType.APPLICATION_JSON_TYPE)
                .data(String.class, payload.data)
                .build();

        CompletionStage<?> stage = client.sink.send(event);
        stage.whenComplete((ignored, throwable) -> {
            if (throwable != null) {
                LOGGER.log(Level.FINE, "SSE sink send failed, removing client", throwable);
                context.removeClient(client.sink);
            }
        });
    }

    private String toJson(ChartEventModel event) {
        ChartEventModelConverter converter = new ChartEventModelConverter();
        converter.setModel(event);
        try {
            return mapper.writeValueAsString(converter);
        } catch (JsonProcessingException e) {
            LOGGER.log(Level.WARNING, "Failed to serialize chart event", e);
            return null;
        }
    }

    private long parseEventId(String lastEventId) {
        if (lastEventId == null || lastEventId.isBlank()) {
            return -1L;
        }
        try {
            return Long.parseLong(lastEventId.trim());
        } catch (NumberFormatException e) {
            LOGGER.log(Level.FINE, "Invalid Last-Event-ID header: {0}", lastEventId);
            return -1L;
        }
    }

    private static final class FacilityContext {

        private final CopyOnWriteArrayList<SseClient> clients = new CopyOnWriteArrayList<>();
        private final ConcurrentLinkedDeque<SsePayload> history = new ConcurrentLinkedDeque<>();

        void addClient(SseClient client) {
            clients.add(client);
        }

        void removeClient(SseEventSink sink) {
            clients.removeIf(client -> client.sink.equals(sink));
            closeQuietly(sink);
        }

        void appendHistory(SsePayload payload) {
            history.addLast(payload);
            while (history.size() > HISTORY_LIMIT) {
                history.pollFirst();
            }
        }

        void replayHistory(long afterId, SseClient client, Consumer<SsePayload> sender) {
            for (SsePayload payload : history) {
                if (payload.id > afterId && !client.clientUuid.equals(payload.issuerUuid)) {
                    sender.accept(payload);
                }
            }
        }

        private void closeQuietly(SseEventSink sink) {
            try {
                sink.close();
            } catch (Exception ignore) {
                // ignore
            }
        }
    }

    private static final class SseClient {
        private final String clientUuid;
        private final SseEventSink sink;
        private final Sse sse;

        private SseClient(String clientUuid, SseEventSink sink, Sse sse) {
            this.clientUuid = clientUuid;
            this.sink = sink;
            this.sse = sse;
        }
    }

    private static final class SsePayload {
        private final long id;
        private final String issuerUuid;
        private final String data;

        private SsePayload(long id, String issuerUuid, String data) {
            this.id = id;
            this.issuerUuid = issuerUuid;
            this.data = data;
        }
    }
}
