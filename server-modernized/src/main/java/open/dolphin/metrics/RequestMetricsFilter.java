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
import java.util.regex.Pattern;
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
    private static final String AUTH_FAILURE_COUNTER = "opendolphin_auth_reject_total";
    private static final Pattern NUMERIC_SEGMENT = Pattern.compile("^[0-9]+$");
    private static final Pattern UUID_SEGMENT = Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final Pattern HEX_SEGMENT = Pattern.compile("^[0-9a-fA-F]{32,}$");

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
            template = normalisePath(requestContext.getUriInfo().getPath());
        }

        int status = responseContext.getStatus();
        String statusValue = Integer.toString(status);

        Tags baseTags = Tags.of("method", method, "path", template, "status", statusValue);

        meterRegistry.counter(REQUEST_COUNTER, baseTags).increment();
        meterRegistry.timer(DURATION_TIMER, baseTags).record(elapsed, TimeUnit.NANOSECONDS);

        if (status >= 400) {
            meterRegistry.counter(ERROR_COUNTER, baseTags).increment();
        }
        if (status == 401 || status == 403) {
            meterRegistry.counter(AUTH_FAILURE_COUNTER, baseTags).increment();
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

    private String normalisePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            return "/";
        }
        String[] segments = rawPath.split("/");
        StringBuilder builder = new StringBuilder();
        int index = 0;
        for (String segment : segments) {
            if (segment == null || segment.isBlank()) {
                continue;
            }
            builder.append('/');
            builder.append(normaliseSegment(segment, index == 0));
            index++;
        }
        String normalised = builder.toString();
        if (normalised.isEmpty()) {
            return "/";
        }
        return normalised.replaceAll("//+", "/");
    }

    private String normaliseSegment(String segment, boolean firstSegment) {
        String value = segment.trim();
        if (value.isEmpty()) {
            return "";
        }
        if (!firstSegment && NUMERIC_SEGMENT.matcher(value).matches()) {
            return "{id}";
        }
        if (UUID_SEGMENT.matcher(value).matches()) {
            return "{uuid}";
        }
        if (HEX_SEGMENT.matcher(value).matches()) {
            return "{hex}";
        }
        if (value.length() > 40 && value.matches("^[0-9a-zA-Z\\-_.~]+$")) {
            return "{token}";
        }
        return value;
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
