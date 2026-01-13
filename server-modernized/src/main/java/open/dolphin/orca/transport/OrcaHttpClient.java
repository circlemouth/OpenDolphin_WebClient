package open.dolphin.orca.transport;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.rest.OrcaApiProxySupport;

/**
 * Shared HTTP client for ORCA API calls.
 */
public class OrcaHttpClient {

    private static final Logger LOGGER = Logger.getLogger(OrcaHttpClient.class.getName());

    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(15);
    private static final String ORCA_CONTENT_TYPE = "application/xml; charset=UTF-8";
    private static final String ORCA_ACCEPT_XML = "application/xml";
    private static final String ENV_NETWORK_RETRY_MAX = "ORCA_API_RETRY_NETWORK_MAX";
    private static final String ENV_TRANSIENT_RETRY_MAX = "ORCA_API_RETRY_TRANSIENT_MAX";
    private static final String ENV_NETWORK_RETRY_BACKOFF_MS = "ORCA_API_RETRY_NETWORK_BACKOFF_MS";
    private static final String ENV_TRANSIENT_RETRY_BACKOFF_MS = "ORCA_API_RETRY_TRANSIENT_BACKOFF_MS";
    private static final int DEFAULT_NETWORK_RETRY_MAX = 3;
    private static final int DEFAULT_TRANSIENT_RETRY_MAX = 2;
    private static final long DEFAULT_NETWORK_BACKOFF_MS = 250L;
    private static final long DEFAULT_TRANSIENT_BACKOFF_MS = 150L;

    private static final ObjectMapper JSON = new ObjectMapper();

    private final HttpClient client;

    public OrcaHttpClient() {
        this(HttpClient.newBuilder()
                .connectTimeout(DEFAULT_CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build());
    }

    public OrcaHttpClient(HttpClient client) {
        this.client = client;
    }

    public OrcaHttpResponse postXml2(OrcaTransportSettings settings, String path, String body,
            String accept, String requestId, String traceId) {
        return execute(settings, "POST", path, body, null, accept, requestId, traceId);
    }

    public OrcaHttpResponse get(OrcaTransportSettings settings, String path, String query,
            String accept, String requestId, String traceId) {
        return execute(settings, "GET", path, null, query, accept, requestId, traceId);
    }

    private OrcaHttpResponse execute(OrcaTransportSettings settings, String method, String path, String body,
            String query, String accept, String requestId, String traceId) {
        if (settings == null || !settings.isReady()) {
            throw new OrcaGatewayException("ORCA transport settings are incomplete");
        }
        String resolvedAccept = (accept == null || accept.isBlank()) ? ORCA_ACCEPT_XML : accept.trim();
        String url = settings.buildOrcaUrl(path);
        if (query != null && !query.isBlank()) {
            url = url + "?" + query;
        }
        URI uri = toUri(url);
        int networkRetryMax = resolveIntEnv(ENV_NETWORK_RETRY_MAX, DEFAULT_NETWORK_RETRY_MAX);
        int transientRetryMax = resolveIntEnv(ENV_TRANSIENT_RETRY_MAX, DEFAULT_TRANSIENT_RETRY_MAX);
        long networkBackoff = resolveLongEnv(ENV_NETWORK_RETRY_BACKOFF_MS, DEFAULT_NETWORK_BACKOFF_MS);
        long transientBackoff = resolveLongEnv(ENV_TRANSIENT_RETRY_BACKOFF_MS, DEFAULT_TRANSIENT_BACKOFF_MS);
        int networkAttempts = 0;
        int transientAttempts = 0;
        while (true) {
            Instant started = Instant.now();
            try {
                HttpRequest.Builder builder = HttpRequest.newBuilder()
                        .uri(uri)
                        .timeout(DEFAULT_READ_TIMEOUT)
                        .header("Content-Type", ORCA_CONTENT_TYPE)
                        .header("Accept", resolvedAccept)
                        .header("Authorization", settings.basicAuthHeader());
                if (requestId != null && !requestId.isBlank()) {
                    builder.header("X-Request-Id", requestId);
                }
                if (traceId != null && !traceId.isBlank()) {
                    builder.header("X-Trace-Id", traceId);
                }
                if ("GET".equalsIgnoreCase(method)) {
                    builder.GET();
                } else {
                    builder.POST(HttpRequest.BodyPublishers.ofString(body != null ? body : "", StandardCharsets.UTF_8));
                }
                HttpRequest httpRequest = builder.build();
                HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                long elapsedMs = Duration.between(started, Instant.now()).toMillis();
                int status = response.statusCode();
                String responseBody = response.body() != null ? response.body() : "";
                String responseContentType = response.headers().firstValue("Content-Type").orElse(null);
                OrcaApiResult apiResult = extractApiResult(responseBody, responseContentType);
                logOrcaSummary(requestId, method, path, status, apiResult, elapsedMs);
                if (status < 200 || status >= 300) {
                    if (shouldRetryHttp(status, networkAttempts, networkRetryMax)) {
                        networkAttempts++;
                        sleepQuietly(networkBackoff * (1L << Math.min(networkAttempts, 6)));
                        continue;
                    }
                    throw new OrcaGatewayException("ORCA HTTP response status " + status);
                }
                if (responseBody.isBlank()) {
                    if (shouldRetryHttp(status, networkAttempts, networkRetryMax)) {
                        networkAttempts++;
                        sleepQuietly(networkBackoff * (1L << Math.min(networkAttempts, 6)));
                        continue;
                    }
                    throw new OrcaGatewayException("ORCA HTTP response body is empty");
                }
                if (isTransientOrcaError(apiResult) && transientAttempts < transientRetryMax) {
                    transientAttempts++;
                    sleepQuietly(transientBackoff);
                    continue;
                }
                return new OrcaHttpResponse(url, method, status, responseBody, responseContentType,
                        response.headers().map(), elapsedMs, apiResult);
            } catch (IOException ex) {
                if (networkAttempts < networkRetryMax) {
                    networkAttempts++;
                    sleepQuietly(networkBackoff * (1L << Math.min(networkAttempts, 6)));
                    continue;
                }
                throw new OrcaGatewayException("Failed to call ORCA API", ex);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new OrcaGatewayException("ORCA API request interrupted", ex);
            }
        }
    }

    private static URI toUri(String url) {
        try {
            return new URI(url);
        } catch (Exception ex) {
            throw new OrcaGatewayException("Invalid ORCA API URL: " + url, ex);
        }
    }

    private static void logOrcaSummary(String requestId, String method, String path, int status,
            OrcaApiResult apiResult, long elapsedMs) {
        String resolvedId = requestId != null ? requestId : "-";
        String resolvedMethod = method != null ? method : "POST";
        String resolvedPath = path != null ? path : "-";
        String result = apiResult != null && apiResult.apiResult != null ? apiResult.apiResult : "-";
        String message = apiResult != null ? apiResult.message : null;
        String maskedMessage = maskSensitiveText(message);
        String warningSummary = null;
        if (apiResult != null && apiResult.warnings != null && !apiResult.warnings.isEmpty()) {
            warningSummary = maskSensitiveText(String.join(" | ", apiResult.warnings));
        }
        LOGGER.log(Level.INFO,
                "orca.http requestId={0} method={1} path={2} status={3} apiResult={4} apiMessage={5} warnings={6} durationMs={7}",
                new Object[]{resolvedId, resolvedMethod, resolvedPath, status, result, maskedMessage, warningSummary, elapsedMs});
    }

    private static boolean shouldRetryHttp(int status, int attempt, int maxRetries) {
        if (attempt >= maxRetries) {
            return false;
        }
        if (status >= 400 && status < 500) {
            return false;
        }
        return status >= 500 || status == -1;
    }

    private static OrcaApiResult extractApiResult(String body, String contentType) {
        if (body == null || body.isBlank()) {
            return null;
        }
        String normalized = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";
        if (normalized.contains("json") || body.trim().startsWith("{")) {
            return extractApiResultFromJson(body);
        }
        return extractApiResultFromXml(body);
    }

    private static OrcaApiResult extractApiResultFromXml(String body) {
        String apiResult = extractTagValue(body, "Api_Result");
        String apiMessage = extractTagValue(body, "Api_Result_Message");
        List<String> warnings = extractWarningsFromXml(body);
        return new OrcaApiResult(apiResult, apiMessage, warnings);
    }

    private static OrcaApiResult extractApiResultFromJson(String body) {
        try {
            JsonNode root = JSON.readTree(body);
            Optional<JsonNode> resultNode = findJsonValue(root, "Api_Result");
            Optional<JsonNode> messageNode = findJsonValue(root, "Api_Result_Message");
            String apiResult = resultNode.map(JsonNode::asText).orElse(null);
            String apiMessage = messageNode.map(JsonNode::asText).orElse(null);
            List<String> warnings = extractWarningsFromJson(root);
            return new OrcaApiResult(apiResult, apiMessage, warnings);
        } catch (Exception ex) {
            return null;
        }
    }

    private static Optional<JsonNode> findJsonValue(JsonNode node, String key) {
        if (node == null || key == null) {
            return Optional.empty();
        }
        if (node.has(key)) {
            return Optional.ofNullable(node.get(key));
        }
        for (JsonNode child : node) {
            Optional<JsonNode> found = findJsonValue(child, key);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private static List<String> extractWarningsFromXml(String body) {
        List<String> warnings = new ArrayList<>();
        if (body == null || body.isBlank()) {
            return warnings;
        }
        Pattern pattern = Pattern.compile("<Api_Warning_Message\\b[^>]*>(.*?)</Api_Warning_Message>",
                Pattern.DOTALL);
        Matcher matcher = pattern.matcher(body);
        while (matcher.find()) {
            String value = matcher.group(1);
            if (value != null && !value.trim().isEmpty()) {
                warnings.add(value.trim());
            }
        }
        return warnings;
    }

    private static List<String> extractWarningsFromJson(JsonNode node) {
        List<String> warnings = new ArrayList<>();
        if (node == null) {
            return warnings;
        }
        if (node.has("Api_Warning_Message")) {
            JsonNode value = node.get("Api_Warning_Message");
            if (value != null && !value.isNull()) {
                String text = value.asText(null);
                if (text != null && !text.isBlank()) {
                    warnings.add(text);
                }
            }
        }
        for (JsonNode child : node) {
            warnings.addAll(extractWarningsFromJson(child));
        }
        return warnings;
    }

    private static String extractTagValue(String payload, String tag) {
        if (payload == null || tag == null) {
            return null;
        }
        Pattern pattern = Pattern.compile("<" + tag + "\\b[^>]*>(.*?)</" + tag + ">", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(payload);
        if (matcher.find()) {
            String value = matcher.group(1);
            return value != null ? value.trim() : null;
        }
        return null;
    }

    private static boolean isTransientOrcaError(OrcaApiResult result) {
        if (result == null || result.apiResult == null) {
            return false;
        }
        if (OrcaApiProxySupport.isApiResultSuccess(result.apiResult)) {
            return false;
        }
        String message = result.message != null ? result.message : "";
        String normalized = message.toLowerCase(Locale.ROOT);
        return normalized.contains("排他")
                || normalized.contains("他端末")
                || normalized.contains("使用中")
                || normalized.contains("ロック")
                || normalized.contains("処理中")
                || normalized.contains("一時")
                || normalized.contains("timeout")
                || normalized.contains("タイムアウト")
                || normalized.contains("busy");
    }

    private static void sleepQuietly(long backoffMs) {
        if (backoffMs <= 0) {
            return;
        }
        try {
            Thread.sleep(backoffMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private static int resolveIntEnv(String key, int fallback) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static long resolveLongEnv(String key, long fallback) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static String maskSensitiveText(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String masked = value;
        masked = masked.replaceAll("\\d{6,}", "***");
        return masked;
    }

    public static final class OrcaApiResult {
        private final String apiResult;
        private final String message;
        private final List<String> warnings;

        private OrcaApiResult(String apiResult, String message, List<String> warnings) {
            this.apiResult = apiResult;
            this.message = message;
            this.warnings = warnings != null ? warnings : List.of();
        }

        public String apiResult() {
            return apiResult;
        }

        public String message() {
            return message;
        }

        public List<String> warnings() {
            return warnings;
        }
    }

    public static final class OrcaHttpResponse {
        private final String url;
        private final String method;
        private final int status;
        private final String body;
        private final String contentType;
        private final Map<String, List<String>> headers;
        private final long elapsedMs;
        private final OrcaApiResult apiResult;

        private OrcaHttpResponse(String url, String method, int status, String body, String contentType,
                Map<String, List<String>> headers, long elapsedMs, OrcaApiResult apiResult) {
            this.url = url;
            this.method = method;
            this.status = status;
            this.body = body;
            this.contentType = contentType;
            this.headers = headers != null ? headers : Map.of();
            this.elapsedMs = elapsedMs;
            this.apiResult = apiResult;
        }

        public String url() {
            return url;
        }

        public String method() {
            return method;
        }

        public int status() {
            return status;
        }

        public String body() {
            return body;
        }

        public String contentType() {
            return contentType;
        }

        public Map<String, List<String>> headers() {
            return headers;
        }

        public long elapsedMs() {
            return elapsedMs;
        }

        public OrcaApiResult apiResult() {
            return apiResult;
        }
    }
}
