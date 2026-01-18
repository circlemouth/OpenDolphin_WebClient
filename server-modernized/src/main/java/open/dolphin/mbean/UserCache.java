package open.dolphin.mbean;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * ヘッダーベースのバックアップ認証で使用する資格情報キャッシュ。
 * 直接 {@link Map} を外部へ公開せず、必ず専用 API を介して操作する。
 */
@ApplicationScoped
public class UserCache {

    private static final Logger LOGGER = Logger.getLogger(UserCache.class.getName());
    private static final String TTL_PROPERTY = "open.dolphin.security.headerCredentialCache.ttlMinutes";
    private static final String TTL_ENV = "OPEN_DOLPHIN_HEADER_CREDENTIAL_CACHE_TTL_MINUTES";
    private static final long DEFAULT_TTL_MINUTES = 10L;

    private final ConcurrentMap<String, CacheEntry> credentials = new ConcurrentHashMap<>();
    private final Duration ttl;
    private final Clock clock;

    public UserCache() {
        this(resolveTtl(), Clock.systemUTC());
    }

    UserCache(Duration ttl, Clock clock) {
        this.ttl = Objects.requireNonNull(ttl, "ttl must not be null");
        this.clock = Objects.requireNonNull(clock, "clock must not be null");
    }

    /**
     * ユーザー ID に対応する資格情報を返す。結果は Optional でラップし、
     * 呼び出し側が null 参照に依存しないようにする。
     */
    public Optional<String> findPassword(String userName) {
        if (userName == null || userName.isBlank()) {
            return Optional.empty();
        }
        CacheEntry entry = credentials.get(userName);
        if (entry == null) {
            return Optional.empty();
        }
        Instant now = clock.instant();
        if (entry.isExpired(now)) {
            credentials.remove(userName, entry);
            LOGGER.log(Level.FINER, "Evicted expired credential for user={0}", mask(userName));
            return Optional.empty();
        }
        return Optional.ofNullable(entry.password());
    }

    /**
     * 認証済みユーザーのヘッダーパスワードをキャッシュする。
     * 不正な入力はログに記録し無視する。
     */
    public void cachePassword(String userName, String password) {
        if (userName == null || userName.isBlank() || password == null || password.isBlank()) {
            LOGGER.log(Level.FINE, "Skip caching credential due to blank input user={0}", userName);
            return;
        }
        credentials.put(userName, new CacheEntry(password, clock.instant().plus(ttl)));
        LOGGER.log(Level.FINER, "Cached credential for user={0} (ttlMinutes={1})", new Object[]{mask(userName), ttl.toMinutes()});
    }

    /**
     * 現在のキャッシュ内容を読み取り専用の Map として返す（主に運用監査用）。
     */
    public Map<String, String> snapshot() {
        Instant now = clock.instant();
        Map<String, String> copy = new HashMap<>();
        credentials.forEach((user, entry) -> {
            if (entry == null) {
                return;
            }
            if (entry.isExpired(now)) {
                credentials.remove(user, entry);
                return;
            }
            copy.put(user, entry.password());
        });
        return Map.copyOf(copy);
    }

    /**
     * 明示的にキャッシュから削除するためのヘルパー。将来の Elytron 化や
     * パスワードローテーション時に利用する。
     */
    public boolean evict(String userName) {
        if (userName == null || userName.isBlank()) {
            return false;
        }
        return credentials.remove(userName) != null;
    }

    /**
     * キャッシュを完全にクリアする。監査やパスワードローテーション後の強制再認証で使用する。
     */
    public void clearAll() {
        credentials.clear();
    }

    /**
     * TTL（分）を返す。運用 API のレスポンスに含めるため公開。
     */
    public long ttlMinutes() {
        return ttl.toMinutes();
    }

    private String mask(String userName) {
        if (userName == null || userName.length() < 3) {
            return "***";
        }
        return userName.charAt(0) + "***" + userName.charAt(userName.length() - 1);
    }

    private static Duration resolveTtl() {
        Long fromProperty = parseLong(System.getProperty(TTL_PROPERTY));
        if (fromProperty != null && fromProperty > 0) {
            return Duration.ofMinutes(fromProperty);
        }
        Long fromEnv = parseLong(System.getenv(TTL_ENV));
        if (fromEnv != null && fromEnv > 0) {
            return Duration.ofMinutes(fromEnv);
        }
        return Duration.ofMinutes(DEFAULT_TTL_MINUTES);
    }

    private static Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            LOGGER.log(Level.WARNING, "Failed to parse TTL minutes: {0}", value);
            return null;
        }
    }

    private record CacheEntry(String password, Instant expiresAt) {
        boolean isExpired(Instant now) {
            return expiresAt.isBefore(now) || expiresAt.equals(now);
        }
    }
}
