package open.dolphin.touch.support;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Touch API の軽量レスポンスキャッシュ。
 */
@ApplicationScoped
public class TouchResponseCache {

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Duration ttl;
    private final Clock clock;

    @SuppressWarnings("unused")
    public TouchResponseCache() {
        this(Duration.ofSeconds(10), Clock.systemUTC());
    }

    TouchResponseCache(Duration ttl, Clock clock) {
        this.ttl = Objects.requireNonNull(ttl, "ttl must not be null");
        this.clock = Objects.requireNonNull(clock, "clock must not be null");
    }

    public <T> T computeIfAbsent(String key, Supplier<T> supplier) {
        Objects.requireNonNull(key, "key must not be null");
        Objects.requireNonNull(supplier, "supplier must not be null");

        CacheEntry current = cache.get(key);
        Instant now = clock.instant();
        if (current != null && !current.isExpired(now)) {
            @SuppressWarnings("unchecked")
            T cached = (T) current.value();
            return cached;
        }

        T computed = supplier.get();
        cache.put(key, new CacheEntry(computed, now.plus(ttl)));
        return computed;
    }

    public void invalidate(String key) {
        if (key != null) {
            cache.remove(key);
        }
    }

    public void invalidateWithPrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return;
        }
        cache.keySet().removeIf(k -> k.startsWith(prefix));
    }

    private record CacheEntry(Object value, Instant expiresAt) {
        boolean isExpired(Instant now) {
            return expiresAt.isBefore(now);
        }
    }
}

