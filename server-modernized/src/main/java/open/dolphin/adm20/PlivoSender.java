package open.dolphin.adm20;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.plivo.api.PlivoClient;
import com.plivo.api.exceptions.PlivoRestException;
import com.plivo.api.models.base.LogLevel;
import com.plivo.api.models.message.Message;
import com.plivo.api.models.message.MessageCreateResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;
import okhttp3.ConnectionSpec;
import okhttp3.OkHttpClient;
import okhttp3.TlsVersion;
import open.dolphin.msg.gateway.ExternalServiceAuditLogger;
import open.dolphin.msg.gateway.SmsGatewayConfig;
import open.dolphin.msg.gateway.SmsGatewayConfig.PlivoSettings;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;

/**
 * Plivo SMS 送信ラッパー。最新 SDK と TLS 設定での送信を行い、
 * 環境変数／custom.properties に基づいて認証情報を取得する。
 */
@ApplicationScoped
public class PlivoSender {

    private static final Logger LOGGER = Logger.getLogger(PlivoSender.class.getName());
    private static final Pattern NON_DIGIT_PATTERN = Pattern.compile("[^0-9]");
    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration DEFAULT_READ_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration DEFAULT_WRITE_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration DEFAULT_CALL_TIMEOUT = Duration.ofSeconds(45);

    private final SmsGatewayConfig smsGatewayConfig;
    private final SessionTraceManager traceManager;

    private volatile CachedClient cachedClient;

    @Inject
    public PlivoSender(SmsGatewayConfig smsGatewayConfig, SessionTraceManager traceManager) {
        this.smsGatewayConfig = smsGatewayConfig;
        this.traceManager = traceManager;
    }

    @SuppressWarnings("unused")
    protected PlivoSender() {
        this.smsGatewayConfig = null;
        this.traceManager = null;
    }

    public void send(List<String> destinations, String message) throws SMSException {
        if (destinations == null || destinations.isEmpty()) {
            throw new SMSException("SMS の送信先が設定されていません");
        }
        PlivoSettings settings = smsGatewayConfig.plivoSettings();
        if (!settings.isConfigured()) {
            throw new SMSException("Plivo SMS の認証情報が未設定です");
        }
        if (message == null || message.isBlank()) {
            throw new SMSException("SMS メッセージ本文が空です");
        }

        List<String> normalizedRecipients = normalizeRecipients(destinations, settings.defaultCountryCode());
        if (normalizedRecipients.isEmpty()) {
            throw new SMSException("有効な送信先電話番号が存在しません");
        }

        SessionTraceContext traceContext = traceManager.current();
        String traceId = traceContext != null ? traceContext.getTraceId() : null;

        ExternalServiceAuditLogger.logSmsRequest(traceId, normalizedRecipients, settings);

        try {
            MessageCreateResponse response = Message.creator(settings.sourceNumber(), normalizedRecipients, message)
                    .log(settings.logMessageContent())
                    .client(resolveClient(settings))
                    .create();

            ExternalServiceAuditLogger.logSmsSuccess(traceId, normalizedRecipients, settings, response);
            LOGGER.info(() -> String.format(Locale.ROOT,
                    "Plivo SMS sent. recipients=%s messageUuid=%s", normalizedRecipients,
                    response != null ? response.getMessageUuid() : "n/a"));
        } catch (PlivoRestException | IOException ex) {
            ExternalServiceAuditLogger.logSmsFailure(traceId, normalizedRecipients, settings, ex);
            throw new SMSException("SMS 送信に失敗しました", ex);
        }
    }

    private List<String> normalizeRecipients(List<String> rawRecipients, String defaultCountryCode) {
        Set<String> normalized = new LinkedHashSet<>();
        for (String number : rawRecipients) {
            String formatted = normalizeNumber(number, defaultCountryCode);
            if (formatted != null) {
                normalized.add(formatted);
            }
        }
        return new ArrayList<>(normalized);
    }

    private String normalizeNumber(String number, String defaultCountryCode) {
        if (number == null) {
            return null;
        }
        String trimmed = number.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        boolean startsWithPlus = trimmed.startsWith("+");
        String normalizedDigits = NON_DIGIT_PATTERN.matcher(trimmed).replaceAll("");
        if (normalizedDigits.isEmpty()) {
            return null;
        }
        if (startsWithPlus) {
            return "+" + normalizedDigits;
        }
        if (normalizedDigits.startsWith("0")) {
            normalizedDigits = normalizedDigits.substring(1);
        }
        String country = Objects.requireNonNullElse(defaultCountryCode, "+81");
        if (!country.startsWith("+")) {
            country = "+" + country;
        }
        return country + normalizedDigits;
    }

    private PlivoClient resolveClient(PlivoSettings settings) {
        CachedClient current = cachedClient;
        if (current != null && current.settings().equals(settings)) {
            return current.client();
        }

        synchronized (this) {
            current = cachedClient;
            if (current != null && current.settings().equals(settings)) {
                return current.client();
            }
            Duration connectTimeout = sanitizeDuration(settings.connectTimeout(), DEFAULT_CONNECT_TIMEOUT);
            Duration readTimeout = sanitizeDuration(settings.readTimeout(), DEFAULT_READ_TIMEOUT);
            Duration writeTimeout = sanitizeDuration(settings.writeTimeout(), DEFAULT_WRITE_TIMEOUT);
            Duration callTimeout = sanitizeDuration(settings.callTimeout(), DEFAULT_CALL_TIMEOUT);

            OkHttpClient.Builder builder = new OkHttpClient.Builder()
                    .retryOnConnectionFailure(settings.retryOnConnectionFailure())
                    .connectTimeout(connectTimeout)
                    .readTimeout(readTimeout)
                    .writeTimeout(writeTimeout)
                    .callTimeout(callTimeout)
                    .connectionSpecs(List.of(createTlsSpec()));

            LogLevel logLevel = settings.logLevel();
            if (logLevel == null) {
                logLevel = LogLevel.NONE;
            }

            PlivoClient client = new PlivoClient(
                    settings.authId(),
                    settings.authToken(),
                    builder,
                    settings.baseUrl(),
                    new SimpleModule(),
                    logLevel
            );
            cachedClient = new CachedClient(settings, client);
            return client;
        }
    }

    private ConnectionSpec createTlsSpec() {
        return new ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                .tlsVersions(TlsVersion.TLS_1_2, TlsVersion.TLS_1_3)
                .allEnabledCipherSuites()
                .build();
    }

    private Duration sanitizeDuration(Duration candidate, Duration fallback) {
        if (candidate == null) {
            return fallback;
        }
        if (candidate.isNegative() || candidate.isZero()) {
            LOGGER.log(Level.FINE, "Invalid timeout value detected for Plivo HTTP client: {0}. Using fallback {1}.", new Object[]{candidate, fallback});
            return fallback;
        }
        return candidate;
    }

    private record CachedClient(PlivoSettings settings, PlivoClient client) { }
}
