package open.dolphin.rest;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Guards stub/unverified endpoints from being exposed in production-like environments.
 */
public class StubEndpointExposureFilter implements Filter {

    static final String PROP_ALLOW = "opendolphin.stub.endpoints.allow";
    static final String ENV_ALLOW = "OPENDOLPHIN_STUB_ENDPOINTS_ALLOW";
    static final String PROP_MODE = "opendolphin.stub.endpoints.mode";
    static final String ENV_MODE = "OPENDOLPHIN_STUB_ENDPOINTS_MODE";
    static final String PROP_ENVIRONMENT = "opendolphin.environment";
    static final String ENV_ENVIRONMENT = "OPENDOLPHIN_ENVIRONMENT";

    private static final Set<String> BLOCKED_ENV_PREFIXES = Set.of(
            "prod", "prd", "production", "stage", "stg", "staging", "it", "uat");

    private static final Set<String> STUB_PATH_PREFIXES = Set.of(
            "/orca/medical-sets",
            "/orca/tensu/sync",
            "/orca/birth-delivery",
            "/orca/patient/mutation",
            "/orca12/patientmodv2/outpatient"
    );

    private boolean allowStubEndpoints;
    private String resolvedEnvironment;

    @Override
    public void init(FilterConfig filterConfig) {
        resolvedEnvironment = resolveEnvironment();
        allowStubEndpoints = resolveAllowStub();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = normalisePath(req);
        if (!allowStubEndpoints && isStubPath(path)) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("stubEndpoint", path);
            details.put("stubExposure", "blocked");
            details.put("allowStubEndpoints", allowStubEndpoints);
            if (resolvedEnvironment != null && !resolvedEnvironment.isBlank()) {
                details.put("environment", resolvedEnvironment);
            }
            AbstractResource.writeRestError(req, res, HttpServletResponse.SC_NOT_FOUND,
                    "stub_endpoint_disabled",
                    "Stub endpoint is disabled in this environment",
                    details);
            return;
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }

    boolean isStubExposureAllowed() {
        return allowStubEndpoints;
    }

    String getResolvedEnvironment() {
        return resolvedEnvironment;
    }

    boolean isStubPath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            return false;
        }
        String path = rawPath.toLowerCase(Locale.ROOT);
        if (path.startsWith("/resources")) {
            path = path.substring("/resources".length());
            if (path.isEmpty()) {
                path = "/";
            }
        }
        for (String prefix : STUB_PATH_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    String normalisePath(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String uri = request.getRequestURI();
        if (uri == null) {
            return "";
        }
        String context = request.getContextPath();
        if (context != null && !context.isBlank() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        return uri.isBlank() ? "/" : uri;
    }

    boolean resolveAllowStub() {
        String mode = firstNonBlank(System.getProperty(PROP_MODE), System.getenv(ENV_MODE));
        if (mode != null) {
            String normalized = mode.trim().toLowerCase(Locale.ROOT);
            if ("allow".equals(normalized) || "on".equals(normalized)) {
                return true;
            }
            if ("block".equals(normalized) || "deny".equals(normalized) || "off".equals(normalized)) {
                return false;
            }
            Boolean parsed = parseBooleanFlag(normalized);
            if (parsed != null) {
                return parsed;
            }
        }

        Boolean explicit = parseBooleanFlag(firstNonBlank(
                System.getProperty(PROP_ALLOW),
                System.getenv(ENV_ALLOW)));
        if (explicit != null) {
            return explicit;
        }

        String environment = resolvedEnvironment != null ? resolvedEnvironment : resolveEnvironment();
        if (environment != null && isProductionLike(environment)) {
            return false;
        }

        return true;
    }

    String resolveEnvironment() {
        return firstNonBlank(
                System.getProperty(PROP_ENVIRONMENT),
                System.getenv(ENV_ENVIRONMENT),
                System.getenv("ENVIRONMENT"),
                System.getenv("DEPLOY_ENV"),
                System.getenv("STAGE"),
                System.getenv("VITE_ENVIRONMENT"),
                System.getenv("VITE_STAGE"),
                System.getenv("VITE_DEPLOY_ENV"),
                System.getenv("NODE_ENV")
        );
    }

    private boolean isProductionLike(String environment) {
        String normalized = environment == null ? "" : environment.trim().toLowerCase(Locale.ROOT);
        for (String prefix : BLOCKED_ENV_PREFIXES) {
            if (normalized.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private Boolean parseBooleanFlag(String value) {
        if (value == null) {
            return null;
        }
        switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "1":
            case "true":
            case "yes":
            case "y":
            case "on":
                return Boolean.TRUE;
            case "0":
            case "false":
            case "no":
            case "n":
            case "off":
                return Boolean.FALSE;
            default:
                return null;
        }
    }

    private String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate.trim();
            }
        }
        return null;
    }
}
