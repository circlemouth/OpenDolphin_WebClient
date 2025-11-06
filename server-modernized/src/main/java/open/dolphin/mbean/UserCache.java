package open.dolphin.mbean;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * ユーザーのキャッシュ
 * @author masuda, Masuda Naika
 */
@ApplicationScoped
public class UserCache {

    private final Map<String, String> map = new ConcurrentHashMap<>();

    public Map<String, String> getMap() {
        return map;
    }
}
