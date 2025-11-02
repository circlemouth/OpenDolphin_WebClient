package open.dolphin.metrics;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.Provider;
import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;

/**
 * REST API のリクエスト／レスポンスメトリクスを収集するフィルター。
 */
@Provider
@Priority(Priorities.USER)
public class RequestMetricsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final String START_TIME_KEY = RequestMetricsFilter.class.getName() + ".startTime";
    private static final String TEMPLATE_KEY = RequestMetricsFilter.class.getName() + ".pathTemplate";

    private static final String REQUEST_COUNTER = "opendolphin_api_request_total";
    private static final String ERROR_COUNTER = "opendolphin_api_error_total";
    private static final String DURATION_TIMER = "opendolphin_api_request_duration";

    @Context
    private ResourceInfo resourceInfo;

    @Inject
    private MeterRegistry meterRegistry;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        requestContext.setProperty(START_TIME_KEY, System.nanoTime());
        requestContext.setProperty(TEMPLATE_KEY, resolveTemplate());
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        Object startObject = requestContext.getProperty(START_TIME_KEY);
        if (!(startObject instanceof Long)) {
            return;
        }
        long elapsed = System.nanoTime() - (Long) startObject;
        if (meterRegistry == null) {
            return;
        }
        String method = requestContext.getMethod();
        String template = (String) requestContext.getProperty(TEMPLATE_KEY);
        if (template == null || template.isEmpty()) {
            String rawPath = requestContext.getUriInfo().getPath();
            template = rawPath.startsWith("/") ? rawPath : "/" + rawPath;
        }

        Tags baseTags = Tags.of("method", method, "path", template);

        meterRegistry.counter(REQUEST_COUNTER, baseTags).increment();
        meterRegistry.timer(DURATION_TIMER, baseTags).record(elapsed, TimeUnit.NANOSECONDS);

        int status = responseContext.getStatus();
        if (status >= 400) {
            Tags errorTags = baseTags.and("status", Integer.toString(status));
            meterRegistry.counter(ERROR_COUNTER, errorTags).increment();
        }
    }

    private String resolveTemplate() {
        if (resourceInfo == null) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        if (resourceInfo.getResourceClass() != null) {
            Path classPath = resourceInfo.getResourceClass().getAnnotation(Path.class);
            appendPath(builder, classPath);
        }
        if (resourceInfo.getResourceMethod() != null) {
            Path methodPath = resourceInfo.getResourceMethod().getAnnotation(Path.class);
            appendPath(builder, methodPath);
        }
        String template = builder.toString();
        if (template.isEmpty()) {
            return template;
        }
        if (!template.startsWith("/")) {
            template = "/" + template;
        }
        return template.replaceAll("//+", "/");
    }

    private void appendPath(StringBuilder builder, Path path) {
        if (path == null) {
            return;
        }
        String value = cleanPath(path.value());
        if (value.isEmpty()) {
            return;
        }
        if (builder.length() > 0 && builder.charAt(builder.length() - 1) != '/') {
            builder.append('/');
        }
        builder.append(value);
    }

    private String cleanPath(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.startsWith("/")) {
            trimmed = trimmed.substring(1);
        }
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
