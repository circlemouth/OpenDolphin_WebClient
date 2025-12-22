package open.dolphin.adm20.mbean;

import java.io.File;

/**
 *
 * @author Kazushi Minagawa
 */
public class LayerConfig {
    
    private static final String DEFAULT_APP_ID = "layer:///apps/staging/3a031e94-5c3b-11e5-b0e1-e9979f007fc5";
    private static final String DEFAULT_KEY_ID = "layer:///keys/0a992148-7334-11e5-b1e8-74ba16004993";
    private static final String DEFAULT_PROVIDER_ID = "layer:///providers/3a025bb2-5c3b-11e5-ab16-e9979f007fc5";

    private static final String APP_ID_KEY = "phr.layer.app.id";
    private static final String APP_ID_ENV = "PHR_LAYER_APP_ID";
    private static final String KEY_ID_KEY = "phr.layer.key.id";
    private static final String KEY_ID_ENV = "PHR_LAYER_KEY_ID";
    private static final String PROVIDER_ID_KEY = "phr.layer.provider.id";
    private static final String PROVIDER_ID_ENV = "PHR_LAYER_PROVIDER_ID";
    private static final String PRIVATE_KEY_PATH_KEY = "phr.layer.private.key.path";
    private static final String PRIVATE_KEY_PATH_ENV = "PHR_LAYER_PRIVATE_KEY_PATH";
    private static final String PRIVATE_KEY_BASE64_KEY = "phr.layer.private.key.base64";
    private static final String PRIVATE_KEY_BASE64_ENV = "PHR_LAYER_PRIVATE_KEY_BASE64";

    public String getAppId() {
        return resolveProperty(APP_ID_KEY, APP_ID_ENV, DEFAULT_APP_ID);
    }
    
    public String getProviderId() {
        return resolveProperty(PROVIDER_ID_KEY, PROVIDER_ID_ENV, DEFAULT_PROVIDER_ID);
    }

    public String getLayerKeyId() {
        return resolveProperty(KEY_ID_KEY, KEY_ID_ENV, DEFAULT_KEY_ID);
    }

    public String getRsaKeyPath() {
        String configured = resolveProperty(PRIVATE_KEY_PATH_KEY, PRIVATE_KEY_PATH_ENV, null);
        if (configured != null && !configured.isBlank()) {
            return configured.trim();
        }
        String jbossHome = System.getProperty("jboss.home.dir");
        if (jbossHome == null || jbossHome.isBlank()) {
            return "phrchat.pk8";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(jbossHome);
        sb.append(File.separator);
        sb.append("phrchat.pk8");
        return sb.toString();
    }

    public String getRsaKeyBase64() {
        return resolveProperty(PRIVATE_KEY_BASE64_KEY, PRIVATE_KEY_BASE64_ENV, null);
    }

    private String resolveProperty(String propertyKey, String envKey, String fallback) {
        String value = System.getProperty(propertyKey);
        if (value != null && !value.isBlank()) {
            return value;
        }
        value = System.getenv(envKey);
        if (value != null && !value.isBlank()) {
            return value;
        }
        return fallback;
    }
}
