package open.dolphin.mbean;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
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
    private final ConcurrentMap<String, String> credentials = new ConcurrentHashMap<>();

    /**
     * ユーザー ID に対応する資格情報を返す。結果は Optional でラップし、
     * 呼び出し側が null 参照に依存しないようにする。
     */
    public Optional<String> findPassword(String userName) {
        if (userName == null || userName.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(credentials.get(userName));
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
        credentials.put(userName, password);
        LOGGER.log(Level.FINER, "Cached credential for user={0}", mask(userName));
    }

    /**
     * 現在のキャッシュ内容を読み取り専用の Map として返す（主に運用監査用）。
     */
    public Map<String, String> snapshot() {
        return Map.copyOf(credentials);
    }

    /**
     * 明示的にキャッシュから削除するためのヘルパー。将来の Elytron 化や
     * パスワードローテーション時に利用する。
     */
    public void evict(String userName) {
        if (userName == null || userName.isBlank()) {
            return;
        }
        credentials.remove(userName);
    }

    private String mask(String userName) {
        if (userName == null || userName.length() < 3) {
            return "***";
        }
        return userName.charAt(0) + "***" + userName.charAt(userName.length() - 1);
    }
}
