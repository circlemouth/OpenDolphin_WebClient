package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.OutboundSseEvent;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import open.dolphin.infomodel.ChartEventModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ChartEventSseSupportTest {

    private static final String FACILITY_ID = "facility-001";

    private ChartEventSseSupport support;
    private SimpleMeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        support = new ChartEventSseSupport();
        meterRegistry = new SimpleMeterRegistry();
        support.setMeterRegistry(meterRegistry);
    }

    @Test
    void gapDetectionEmitsWarnAndMetrics() {
        Sse bootstrapSse = mock(Sse.class);
        OutboundSseEvent.Builder bootstrapBuilder = mock(OutboundSseEvent.Builder.class, RETURNS_SELF);
        when(bootstrapSse.newEventBuilder()).thenReturn(bootstrapBuilder);
        when(bootstrapBuilder.build()).thenReturn(mock(OutboundSseEvent.class));
        when(bootstrapBuilder.mediaType(MediaType.APPLICATION_JSON_TYPE)).thenReturn(bootstrapBuilder);

        SseEventSink bootstrapSink = mock(SseEventSink.class);
        when(bootstrapSink.isClosed()).thenReturn(false);

        support.register(FACILITY_ID, "bootstrap-client", bootstrapSse, bootstrapSink, null);
        support.unregister(FACILITY_ID, bootstrapSink);

        for (int i = 0; i < 105; i++) {
            ChartEventModel event = new ChartEventModel();
            event.setFacilityId(FACILITY_ID);
            event.setIssuerUUID("issuer-" + i);
            event.setEventType(ChartEventModel.PVT_STATE);
            support.broadcast(event);
        }

        Sse gapSse = mock(Sse.class);
        OutboundSseEvent.Builder gapBuilder = mock(OutboundSseEvent.Builder.class, RETURNS_SELF);
        when(gapSse.newEventBuilder()).thenReturn(gapBuilder);
        OutboundSseEvent replayEvent = mock(OutboundSseEvent.class);
        when(gapBuilder.build()).thenReturn(replayEvent);
        when(gapBuilder.mediaType(MediaType.APPLICATION_JSON_TYPE)).thenReturn(gapBuilder);

        SseEventSink gapSink = mock(SseEventSink.class);
        when(gapSink.isClosed()).thenReturn(false);
        when(gapSink.send(any(OutboundSseEvent.class))).thenReturn(CompletableFuture.completedFuture(null));

        TestLogHandler handler = new TestLogHandler();
        Logger logger = Logger.getLogger(ChartEventSseSupport.class.getName());
        Level originalLevel = logger.getLevel();
        boolean originalUseParentHandlers = logger.getUseParentHandlers();
        logger.setLevel(Level.ALL);
        logger.setUseParentHandlers(false);
        logger.addHandler(handler);

        try {
            support.register(FACILITY_ID, "gap-client", gapSse, gapSink, "1");
        } finally {
            logger.removeHandler(handler);
            logger.setLevel(originalLevel);
            logger.setUseParentHandlers(originalUseParentHandlers);
        }

        assertTrue(handler.records().stream().anyMatch(record ->
                record.getLevel().intValue() >= Level.WARNING.intValue()
                        && record.getMessage().contains("SSE history gap detected")));

        double retained = meterRegistry.get("chartEvent.history.retained")
                .tag("facility", FACILITY_ID)
                .gauge()
                .value();
        assertEquals(99D, retained, 0.001);

        double gapCount = meterRegistry.get("chartEvent.history.gapDetected")
                .tag("facility", FACILITY_ID)
                .counter()
                .count();
        assertEquals(1D, gapCount, 0.001);
    }

    @Test
    void gapDetectionSendsReloadEvent() {
        Sse bootstrapSse = mock(Sse.class);
        OutboundSseEvent.Builder bootstrapBuilder = mock(OutboundSseEvent.Builder.class, RETURNS_SELF);
        when(bootstrapSse.newEventBuilder()).thenReturn(bootstrapBuilder);
        when(bootstrapBuilder.build()).thenReturn(mock(OutboundSseEvent.class));
        when(bootstrapBuilder.mediaType(MediaType.APPLICATION_JSON_TYPE)).thenReturn(bootstrapBuilder);

        SseEventSink bootstrapSink = mock(SseEventSink.class);
        when(bootstrapSink.isClosed()).thenReturn(false);

        support.register(FACILITY_ID, "bootstrap-client", bootstrapSse, bootstrapSink, null);
        support.unregister(FACILITY_ID, bootstrapSink);

        for (int i = 0; i < 105; i++) {
            ChartEventModel event = new ChartEventModel();
            event.setFacilityId(FACILITY_ID);
            event.setIssuerUUID("issuer-" + i);
            event.setEventType(ChartEventModel.PVT_STATE);
            support.broadcast(event);
        }

        Sse gapSse = mock(Sse.class);
        OutboundSseEvent.Builder reloadBuilder = mock(OutboundSseEvent.Builder.class, RETURNS_SELF);
        OutboundSseEvent reloadEvent = mock(OutboundSseEvent.class);
        when(reloadBuilder.build()).thenReturn(reloadEvent);
        when(reloadBuilder.mediaType(MediaType.APPLICATION_JSON_TYPE)).thenReturn(reloadBuilder);
        OutboundSseEvent.Builder replayBuilder = mock(OutboundSseEvent.Builder.class, RETURNS_SELF);
        when(replayBuilder.build()).thenReturn(mock(OutboundSseEvent.class));
        when(replayBuilder.mediaType(MediaType.APPLICATION_JSON_TYPE)).thenReturn(replayBuilder);

        AtomicInteger builderInvocation = new AtomicInteger();
        when(gapSse.newEventBuilder()).thenAnswer(invocation ->
                builderInvocation.getAndIncrement() == 0 ? reloadBuilder : replayBuilder);

        CopyOnWriteArrayList<OutboundSseEvent> sentEvents = new CopyOnWriteArrayList<>();
        SseEventSink gapSink = mock(SseEventSink.class);
        when(gapSink.isClosed()).thenReturn(false);
        when(gapSink.send(any(OutboundSseEvent.class))).thenAnswer(invocation -> {
            sentEvents.add(invocation.getArgument(0));
            return CompletableFuture.completedFuture(null);
        });

        TestLogHandler handler = new TestLogHandler();
        Logger logger = Logger.getLogger(ChartEventSseSupport.class.getName());
        Level originalLevel = logger.getLevel();
        boolean originalUseParentHandlers = logger.getUseParentHandlers();
        logger.setLevel(Level.ALL);
        logger.setUseParentHandlers(false);
        logger.addHandler(handler);

        try {
            support.register(FACILITY_ID, "gap-client", gapSse, gapSink, "1");
        } finally {
            logger.removeHandler(handler);
            logger.setLevel(originalLevel);
            logger.setUseParentHandlers(originalUseParentHandlers);
        }

        assertEquals(reloadEvent, sentEvents.get(0));
        assertTrue(handler.records().stream().anyMatch(record ->
                record.getLevel().intValue() >= Level.WARNING.intValue()
                        && record.getMessage().contains("SSE history gap detected")));

        verify(reloadBuilder).name("chart-events.replay-gap");
        verify(reloadBuilder).data(String.class, "{\"requiredAction\":\"reload\"}");

        double gapCount = meterRegistry.get("chartEvent.history.gapDetected")
                .tag("facility", FACILITY_ID)
                .counter()
                .count();
        assertEquals(1D, gapCount, 0.001);
    }

    private static final class TestLogHandler extends Handler {

        private final List<LogRecord> records = new CopyOnWriteArrayList<>();

        @Override
        public void publish(LogRecord record) {
            records.add(record);
        }

        @Override
        public void flush() {
            // no-op
        }

        @Override
        public void close() {
            records.clear();
        }

        List<LogRecord> records() {
            return records;
        }
    }
}
