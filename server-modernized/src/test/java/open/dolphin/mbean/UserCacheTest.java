package open.dolphin.mbean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.Test;

class UserCacheTest {

    @Test
    void returnsCachedValueBeforeExpiry() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-18T00:00:00Z"));
        UserCache cache = new UserCache(Duration.ofSeconds(5), clock);

        cache.cachePassword("doctor01", "secret");

        assertTrue(cache.findPassword("doctor01").isPresent());
        assertEquals("secret", cache.findPassword("doctor01").orElseThrow());
    }

    @Test
    void expiresAfterTtl() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-18T00:00:00Z"));
        UserCache cache = new UserCache(Duration.ofSeconds(1), clock);
        cache.cachePassword("doctor02", "old");

        clock.plusSeconds(2);

        assertTrue(cache.findPassword("doctor02").isEmpty());
        assertFalse(cache.snapshot().containsKey("doctor02"));
    }

    @Test
    void clearAndEvictWork() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-18T00:00:00Z"));
        UserCache cache = new UserCache(Duration.ofSeconds(60), clock);
        cache.cachePassword("u1", "p1");
        cache.cachePassword("u2", "p2");

        assertTrue(cache.evict("u1"));
        assertFalse(cache.findPassword("u1").isPresent());

        cache.clearAll();
        assertEquals(Map.of(), cache.snapshot());
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant initial) {
            this.now = initial;
        }

        void plusSeconds(long seconds) {
            this.now = now.plusSeconds(seconds);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return Clock.fixed(now, zone);
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
