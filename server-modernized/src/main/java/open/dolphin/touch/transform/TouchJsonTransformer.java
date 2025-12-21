package open.dolphin.touch.transform;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchJsonConverter;
import open.dolphin.touch.support.TouchRequestContext;

/**
 * Common JSON conversion layer for Touch/Demo legacy DTOs.
 */
@ApplicationScoped
public class TouchJsonTransformer {

    @Inject
    private TouchJsonConverter converter;

    @Inject
    private TouchAuditHelper auditHelper;

    @Inject
    private SessionTraceManager sessionTraceManager;

    private final Clock clock;

    @SuppressWarnings("unused")
    public TouchJsonTransformer() {
        this(Clock.systemDefaultZone());
    }

    TouchJsonTransformer(Clock clock) {
        this.clock = clock;
    }

    public <T> TouchJsonTransformResult<T> readLegacy(TouchRequestContext context,
                                                       String endpoint,
                                                       String json,
                                                       Class<T> targetType) {
        return readLegacy(context, endpoint, json, targetType, Function.identity(), TouchJsonListPolicy.EMPTY_IF_NULL);
    }

    public <T, R> TouchJsonTransformResult<R> readLegacy(TouchRequestContext context,
                                                         String endpoint,
                                                         String json,
                                                         Class<T> targetType,
                                                         Function<T, R> mapper,
                                                         TouchJsonListPolicy listPolicy) {
        String traceId = resolveTraceId(context);
        String requestId = resolveRequestId(context, traceId);
        OffsetDateTime now = OffsetDateTime.now(clock);

        try {
            T payload = converter.readLegacy(json, targetType);
            R mapped = mapper.apply(payload);
            List<TouchJsonError> errors = null;
            TouchJsonResponse<R> response = buildResponse(context, endpoint, traceId, requestId, now, mapped, errors, listPolicy);
            return new TouchJsonTransformResult<>(mapped, response, errors, traceId, requestId);
        } catch (IOException | RuntimeException ex) {
            TouchJsonError error = new TouchJsonError("conversion_failed",
                    "Legacy payload conversion failed.",
                    traceId,
                    targetType != null ? targetType.getSimpleName() : null);
            TouchJsonResponse<R> response = buildResponse(context, endpoint, traceId, requestId, now,
                    null, List.of(error), listPolicy);
            recordFailureAudit(context, endpoint, error, targetType, ex);
            throw new TouchJsonTransformationException(error.message(), targetTypeName(targetType), ex);
        }
    }

    public <R> TouchJsonTransformResult<R> wrap(TouchRequestContext context,
                                                String endpoint,
                                                R payload,
                                                TouchJsonListPolicy listPolicy) {
        String traceId = resolveTraceId(context);
        String requestId = resolveRequestId(context, traceId);
        OffsetDateTime now = OffsetDateTime.now(clock);
        TouchJsonResponse<R> response = buildResponse(context, endpoint, traceId, requestId, now, payload, null, listPolicy);
        return new TouchJsonTransformResult<>(payload, response, null, traceId, requestId);
    }

    private <R> TouchJsonResponse<R> buildResponse(TouchRequestContext context,
                                                   String endpoint,
                                                   String traceId,
                                                   String requestId,
                                                   OffsetDateTime now,
                                                   R payload,
                                                   List<TouchJsonError> errors,
                                                   TouchJsonListPolicy listPolicy) {
        TouchJsonMetadata metadata = new TouchJsonMetadata(traceId,
                requestId,
                context != null ? context.facilityId() : null,
                now,
                endpoint);

        List<R> items = null;
        if (payload != null) {
            items = listPolicy.normalize(List.of(payload));
        } else if (errors == null || errors.isEmpty()) {
            items = listPolicy.normalize(null);
        }
        List<TouchJsonError> normalizedErrors = listPolicy.normalize(errors);
        return new TouchJsonResponse<>(metadata, items, normalizedErrors);
    }

    private String resolveTraceId(TouchRequestContext context) {
        String traceId = context != null ? context.traceId() : null;
        if (traceId != null && !traceId.isBlank()) {
            return traceId;
        }
        if (sessionTraceManager != null) {
            SessionTraceContext traceContext = sessionTraceManager.current();
            if (traceContext != null && traceContext.getTraceId() != null && !traceContext.getTraceId().isBlank()) {
                return traceContext.getTraceId();
            }
            String attribute = sessionTraceManager.getAttribute(SessionTraceAttributes.TRACE_ID);
            if (attribute != null && !attribute.isBlank()) {
                return attribute;
            }
        }
        return UUID.randomUUID().toString();
    }

    private String resolveRequestId(TouchRequestContext context, String traceId) {
        String requestId = context != null ? context.requestId() : null;
        if (requestId != null && !requestId.isBlank()) {
            return requestId;
        }
        if (traceId != null && !traceId.isBlank()) {
            return traceId;
        }
        return UUID.randomUUID().toString();
    }

    private void recordFailureAudit(TouchRequestContext context,
                                    String endpoint,
                                    TouchJsonError error,
                                    Class<?> targetType,
                                    Throwable cause) {
        if (auditHelper == null || context == null) {
            return;
        }
        Map<String, Object> details = new java.util.HashMap<>();
        details.put("status", "failed");
        if (error != null && error.type() != null) {
            details.put("reason", error.type());
        }
        String targetName = targetTypeName(targetType);
        if (targetName != null) {
            details.put("targetType", targetName);
        }
        if (endpoint != null) {
            details.put("endpoint", endpoint);
        }
        auditHelper.record(context, "TOUCH_JSON_CONVERSION_FAILURE", endpoint, details);
    }

    private String targetTypeName(Class<?> targetType) {
        return Optional.ofNullable(targetType).map(Class::getName).orElse("unknown");
    }
}
