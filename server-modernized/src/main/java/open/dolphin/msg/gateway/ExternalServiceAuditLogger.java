package open.dolphin.msg.gateway;

import com.plivo.api.models.message.MessageCreateResponse;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;

/**
 * 外部サービス（ORCA・Plivo など）向けの監査ログを集約するユーティリティ。
 */
public final class ExternalServiceAuditLogger {

    private static final Logger AUDIT_LOGGER = Logger.getLogger("open.dolphin.audit.external");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_INSTANT;

    private ExternalServiceAuditLogger() {
    }

    public static void logClaimRequest(String traceId, DocumentModel document, MessagingConfig.ClaimSettings settings) {
        log(Level.INFO, "CLAIM_REQUEST", traceId,
                () -> documentSummary(document),
                () -> settingsSummary(settings),
                null);
    }

    public static void logClaimSuccess(String traceId, DocumentModel document, MessagingConfig.ClaimSettings settings) {
        log(Level.INFO, "CLAIM_SUCCESS", traceId,
                () -> documentSummary(document),
                () -> settingsSummary(settings),
                null);
    }

    public static void logClaimFailure(String traceId, DocumentModel document, MessagingConfig.ClaimSettings settings, Throwable error) {
        log(Level.WARNING, "CLAIM_FAILURE", traceId,
                () -> documentSummary(document),
                () -> settingsSummary(settings),
                error);
    }

    public static void logDiagnosisRequest(String traceId, DiagnosisSendWrapper wrapper, MessagingConfig.ClaimSettings settings) {
        log(Level.INFO, "DIAGNOSIS_REQUEST", traceId,
                () -> diagnosisSummary(wrapper),
                () -> settingsSummary(settings),
                null);
    }

    public static void logDiagnosisSuccess(String traceId, DiagnosisSendWrapper wrapper, MessagingConfig.ClaimSettings settings) {
        log(Level.INFO, "DIAGNOSIS_SUCCESS", traceId,
                () -> diagnosisSummary(wrapper),
                () -> settingsSummary(settings),
                null);
    }

    public static void logDiagnosisFailure(String traceId, DiagnosisSendWrapper wrapper, MessagingConfig.ClaimSettings settings, Throwable error) {
        log(Level.WARNING, "DIAGNOSIS_FAILURE", traceId,
                () -> diagnosisSummary(wrapper),
                () -> settingsSummary(settings),
                error);
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

    private static String documentSummary(DocumentModel document) {
        if (document == null || document.getDocInfoModel() == null) {
            return "document=unknown";
        }
        DocInfoModel info = document.getDocInfoModel();
        return String.format("document.docId=%s document.patientId=%s", safe(info.getDocId()), safe(info.getPatientId()));
    }

    private static String diagnosisSummary(DiagnosisSendWrapper wrapper) {
        if (wrapper == null) {
            return "diagnosis=unknown";
        }
        return String.format("diagnosis.patientId=%s diagnosis.confirmDate=%s diagnosis.addedCount=%d diagnosis.updatedCount=%d diagnosis.deletedCount=%d",
                safe(wrapper.getPatientId()),
                safe(wrapper.getConfirmDate()),
                size(wrapper.getAddedDiagnosis()),
                size(wrapper.getUpdatedDiagnosis()),
                size(wrapper.getDeletedDiagnosis()));
    }

    private static String settingsSummary(MessagingConfig.ClaimSettings settings) {
        if (settings == null) {
            return "orca.host=unknown";
        }
        return String.format("orca.host=%s orca.port=%d", safe(settings.host()), settings.port());
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

    private static String safe(String value) {
        return value != null ? value : "";
    }

    private static int size(List<?> list) {
        return list != null ? list.size() : 0;
    }
}
