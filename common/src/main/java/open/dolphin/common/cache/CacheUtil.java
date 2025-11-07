package open.dolphin.common.cache;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Lightweight TTL based cache utilities shared across server modules.
 */
public final class CacheUtil {

    private CacheUtil() {
    }

    /**
     * Internal cache entry that keeps track of the expiration timestamp.
     *
     * @param <T> value type
     */
    public static final class CacheEntry<T> {
        private final T value;
        private final Instant expiresAt;

        public CacheEntry(T value, Instant expiresAt) {
            this.value = value;
            this.expiresAt = expiresAt;
        }

        public T getValue() {
            return value;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public boolean isExpired(Instant now) {
            return expiresAt != null && now.isAfter(expiresAt);
        }
    }

    /**
     * Fetches a cached value or computes and stores it using the supplied loader.
     *
     * @param store cache store
     * @param key cache key
     * @param ttl entry time-to-live
     * @param loader value supplier
     * @return cached or freshly computed value
     * @param <K> cache key type
     * @param <V> cache value type
     */
    public static <K, V> V getOrCompute(ConcurrentHashMap<K, CacheEntry<V>> store,
                                        K key,
                                        Duration ttl,
                                        Supplier<V> loader) {
        Objects.requireNonNull(store, "store must not be null");
        Objects.requireNonNull(loader, "loader must not be null");

        CacheEntry<V> entry = store.get(key);
        Instant now = Instant.now();
        if (entry != null && !entry.isExpired(now)) {
            return entry.getValue();
        }

        V value = loader.get();
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            store.remove(key);
            return value;
        }

        Instant expiresAt = now.plus(ttl);
        store.put(key, new CacheEntry<>(value, expiresAt));
        return value;
    }

    public static <K> void invalidate(ConcurrentHashMap<K, ?> store, K key) {
        Objects.requireNonNull(store, "store must not be null");
        store.remove(key);
    }

    public static void clear(ConcurrentHashMap<?, ?> store) {
        Objects.requireNonNull(store, "store must not be null");
        store.clear();
    }
}
