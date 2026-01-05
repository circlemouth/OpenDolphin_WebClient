package open.dolphin.msg.gateway;

import com.plivo.api.models.message.MessageCreateResponse;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * 外部サービス（ORCA・Plivo など）向けの監査ログを集約するユーティリティ。
 */
public final class ExternalServiceAuditLogger {

    private static final Logger AUDIT_LOGGER = Logger.getLogger("open.dolphin.audit.external");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_INSTANT;

    private ExternalServiceAuditLogger() {
    }

    public static void logSmsRequest(String traceId, List<String> destinations, SmsGatewayConfig.PlivoSettings settings) {
        log(Level.INFO, "SMS_REQUEST", traceId,
                () -> smsSummary(destinations, null),
                () -> smsSettingsSummary(settings),
                null);
    }

    public static void logSmsSuccess(String traceId, List<String> destinations, SmsGatewayConfig.PlivoSettings settings, MessageCreateResponse response) {
        log(Level.INFO, "SMS_SUCCESS", traceId,
                () -> smsSummary(destinations, response),
                () -> smsSettingsSummary(settings),
                null);
    }

    public static void logSmsFailure(String traceId, List<String> destinations, SmsGatewayConfig.PlivoSettings settings, Throwable error) {
        log(Level.WARNING, "SMS_FAILURE", traceId,
                () -> smsSummary(destinations, null),
                () -> smsSettingsSummary(settings),
                error);
    }

    public static void logOrcaRequest(String traceId, String action, String path, String targetSummary) {
        log(Level.INFO, "ORCA_REQUEST", traceId,
                () -> orcaPayloadSummary(action, path),
                () -> targetSummary,
                null);
    }

    public static void logOrcaResponse(String traceId, String action, String path, int status, String targetSummary) {
        log(Level.INFO, "ORCA_RESPONSE", traceId,
                () -> orcaPayloadSummary(action, path) + " http.status=" + status,
                () -> targetSummary,
                null);
    }

    public static void logOrcaFailure(String traceId, String action, String path, String targetSummary, Throwable error) {
        log(Level.WARNING, "ORCA_FAILURE", traceId,
                () -> orcaPayloadSummary(action, path),
                () -> targetSummary,
                error);
    }

    private static void log(Level level, String event, String traceId,
            Supplier<String> payloadSummarySupplier,
            Supplier<String> settingsSummarySupplier,
            Throwable error) {
        if (!AUDIT_LOGGER.isLoggable(level)) {
            return;
        }
        String payloadSummary = payloadSummarySupplier != null ? payloadSummarySupplier.get() : null;
        String settingsSummary = settingsSummarySupplier != null ? settingsSummarySupplier.get() : null;
        StringBuilder builder = new StringBuilder();
        builder.append("event=").append(event);
        builder.append(" timestamp=").append(FORMATTER.format(Instant.now()));
        if (traceId != null) {
            builder.append(" traceId=").append(traceId);
        }
        if (payloadSummary != null) {
            builder.append(' ').append(payloadSummary);
        }
        if (settingsSummary != null) {
            builder.append(' ').append(settingsSummary);
        }
        if (error == null) {
            AUDIT_LOGGER.log(level, builder.toString());
        } else {
            AUDIT_LOGGER.log(level, builder.toString(), error);
        }
    }

    private static String smsSummary(List<String> destinations, MessageCreateResponse response) {
        int count = destinations != null ? destinations.size() : 0;
        StringBuilder builder = new StringBuilder();
        builder.append("sms.recipients=").append(count);
        if (destinations != null && !destinations.isEmpty()) {
            builder.append(" sms.destinations=").append(destinations);
        }
        if (response != null && response.getMessageUuid() != null) {
            builder.append(" sms.messageUuid=").append(response.getMessageUuid());
        }
        return builder.toString();
    }

    private static String smsSettingsSummary(SmsGatewayConfig.PlivoSettings settings) {
        if (settings == null) {
            return "plivo.environment=unknown";
        }
        return String.format("plivo.environment=%s plivo.source=%s", safe(settings.environment()), safe(settings.sourceNumber()));
    }

    private static String orcaPayloadSummary(String action, String path) {
        String resolvedAction = action != null ? action : "ORCA_HTTP";
        String resolvedPath = path != null ? path : "unknown";
        return "orca.action=" + resolvedAction + " orca.path=" + resolvedPath;
    }

    private static String safe(String value) {
        return value != null ? value : "";
    }

}
