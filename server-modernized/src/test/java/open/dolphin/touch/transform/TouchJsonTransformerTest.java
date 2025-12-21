package open.dolphin.touch.transform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import open.dolphin.touch.support.TouchJsonConverter;
import open.dolphin.touch.support.TouchRequestContext;
import org.junit.jupiter.api.Test;

class TouchJsonTransformerTest {

    @Test
    void buildsEnvelopeFromLegacyPayload() throws Exception {
        TouchJsonTransformer transformer = new TouchJsonTransformer(fixedClock());
        setField(transformer, "converter", new StubConverter(new Payload("ok")));

        TouchRequestContext context = new TouchRequestContext(
                "facilityA:userA",
                "facilityA",
                "userA",
                "trace-1",
                "request-1",
                null,
                null,
                "127.0.0.1",
                "agent");

        TouchJsonTransformResult<Payload> result = transformer.readLegacy(
                context,
                "POST /touch/legacy",
                "{\"value\":\"ok\"}",
                Payload.class);

        assertNotNull(result);
        assertEquals("trace-1", result.traceId());
        assertEquals("request-1", result.requestId());
        assertNotNull(result.response());
        assertEquals("trace-1", result.response().metadata().traceId());
        assertEquals("request-1", result.response().metadata().requestId());
        assertEquals("facilityA", result.response().metadata().facilityId());
        assertEquals(1, result.response().items().size());
        assertEquals("ok", result.response().items().get(0).value());
    }

    @Test
    void throwsWhenLegacyConversionFails() throws Exception {
        TouchJsonTransformer transformer = new TouchJsonTransformer(fixedClock());
        setField(transformer, "converter", new ThrowingConverter());

        TouchRequestContext context = new TouchRequestContext(
                "facilityB:userB",
                "facilityB",
                "userB",
                "trace-2",
                "request-2",
                null,
                null,
                "127.0.0.1",
                "agent");

        assertThrows(TouchJsonTransformationException.class, () -> transformer.readLegacy(
                context,
                "POST /touch/legacy",
                "{\"value\":\"bad\"}",
                Payload.class));
    }

    private static Clock fixedClock() {
        return Clock.fixed(Instant.parse("2025-12-21T10:15:30Z"), ZoneId.of("UTC"));
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static class Payload {
        private final String value;

        Payload(String value) {
            this.value = value;
        }

        String value() {
            return value;
        }
    }

    private static class StubConverter extends TouchJsonConverter {
        private final Object payload;

        StubConverter(Object payload) {
            this.payload = payload;
        }

        @Override
        public <T> T readLegacy(String json, Class<T> payloadType) {
            return payloadType.cast(payload);
        }
    }

    private static class ThrowingConverter extends TouchJsonConverter {
        @Override
        public <T> T readLegacy(String json, Class<T> payloadType) throws IOException {
            throw new IOException("boom");
        }
    }
}
