package open.dolphin.rest;

import java.io.IOException;
import java.security.Principal;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.inject.Inject;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.security.enterprise.SecurityContext;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.mbean.UserCache;
import open.dolphin.session.UserServiceBean;
import open.dolphin.session.framework.SessionTraceAttributes;
import org.jboss.logmanager.MDC;

/**
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@WebFilter(urlPatterns = {"/resources/*"}, asyncSupported = true)
public class LogFilter implements Filter {

    private static final Logger SECURITY_LOGGER = Logger.getLogger(LogFilter.class.getName());
    private static final String USER_NAME = "userName";
    private static final String PASSWORD = "password";
    private static final String UNAUTHORIZED_USER = "Unauthorized user: ";
    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String TRACE_ID_ATTRIBUTE = LogFilter.class.getName() + ".TRACE_ID";
    private static final String MDC_TRACE_ID_KEY = "traceId";
    private static final String ANONYMOUS_PRINCIPAL = "anonymous";
    private static final String FACILITY_HEADER = "X-Facility-Id";
    private static final String LEGACY_FACILITY_HEADER = "facilityId";
    private static final String AUTH_CHALLENGE = "Basic realm=\"OpenDolphin\"";

    private static final String SYSAD_USER_ID = "1.3.6.1.4.1.9414.10.1:dolphin";
    private static final String SYSAD_PASSWORD = "36cdf8b887a5cffc78dcd5c08991b993";
    private static final String SYSAD_PATH = "dolphin";
    private static final String HEADER_AUTH_ENV = "LOGFILTER_HEADER_AUTH_ENABLED";
    private static final String HEADER_AUTH_PROPERTY = "opendolphin.logfilter.header-auth.enabled";

    @Inject
    private UserServiceBean userService;

    @Inject
    private UserCache userCache;

    @Inject
    private SecurityContext securityContext;

    private volatile boolean headerAuthEnabled = true;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        headerAuthEnabled = resolveHeaderAuthEnabled(filterConfig);
        SECURITY_LOGGER.log(Level.INFO, "LogFilter header fallback is {0}", headerAuthEnabled ? "enabled" : "disabled");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest)request;
        HttpServletResponse res = (HttpServletResponse) response;

        String traceId = resolveTraceId(req);
        req.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
        res.setHeader(TRACE_ID_HEADER, traceId);
        MdcSnapshot traceIdSnapshot = applyMdcValue(MDC_TRACE_ID_KEY, traceId);
        MdcSnapshot remoteUserSnapshot = null;

        try {
            if (isIdentityTokenRequest(req)) {
                chain.doFilter(request, response);
                return;
            }

            String headerUser = headerAuthEnabled ? safeHeader(req, USER_NAME) : null;
            String headerPassword = headerAuthEnabled ? safeHeader(req, PASSWORD) : null;
            Optional<String> principalUser = resolvePrincipalUser();

            String effectiveUser = principalUser.orElse(headerUser);
            boolean authenticated = principalUser.isPresent();

            if (!authenticated && headerAuthEnabled) {
                authenticated = authenticateWithHeaders(req, headerUser, headerPassword);
                if (authenticated) {
                    effectiveUser = headerUser;
                }
            } else if (!authenticated) {
                SECURITY_LOGGER.warning(() -> "Header-based authentication is disabled; rejecting " + req.getRequestURI());
            }

            String candidateUser = principalUser.orElse(headerUser);

            if (!authenticated) {
                logUnauthorized(req, candidateUser, traceId);
                sendUnauthorized(res);
                return;
            }

            String resolvedUser = resolveEffectiveUser(effectiveUser, headerUser, req);
            if (resolvedUser == null) {
                logUnauthorized(req, candidateUser, traceId);
                sendUnauthorized(res);
                return;
            }

            BlockWrapper wrapper = new BlockWrapper(req);
            wrapper.setRemoteUser(resolvedUser);
            remoteUserSnapshot = applyMdcValue(SessionTraceAttributes.ACTOR_ID_MDC_KEY, resolvedUser);

            StringBuilder sb = new StringBuilder();
            sb.append(wrapper.getRemoteAddr()).append(" ");
            sb.append(wrapper.getShortUser()).append(" ");
            sb.append(wrapper.getMethod()).append(" ");
//minagawa^ VisitTouch logを分ける        
            String uri = wrapper.getRequestURIForLog();
            sb.append(uri);
            sb.append(" traceId=").append(traceId);
            if (uri.startsWith("/jtouch")) {
                Logger.getLogger("visit.touch").info(sb.toString());
            } else {
                Logger.getLogger("open.dolphin").info(sb.toString());
            }
//minagawa 

            chain.doFilter(wrapper, response);
        } finally {
            restoreMdcValue(traceIdSnapshot);
            restoreMdcValue(remoteUserSnapshot);
        }
    }

    @Override
    public void destroy() {
    }

    private Optional<String> resolvePrincipalUser() {
        if (securityContext == null) {
            return Optional.empty();
        }
        try {
            Principal principal = securityContext.getCallerPrincipal();
            if (principal == null) {
                return Optional.empty();
            }
            String name = principal.getName();
            if (name == null || name.isBlank() || isAnonymousPrincipal(name)) {
                return Optional.empty();
            }
            return Optional.of(name);
        } catch (IllegalStateException ex) {
            SECURITY_LOGGER.log(Level.FINE, "SecurityContext is not available yet; falling back to header authentication.", ex);
            return Optional.empty();
        }
    }

    private boolean resolveHeaderAuthEnabled(FilterConfig filterConfig) {
        String initValue = filterConfig == null ? null : filterConfig.getInitParameter("header-auth-enabled");
        String candidate = firstNonBlank(initValue, System.getProperty(HEADER_AUTH_PROPERTY), System.getenv(HEADER_AUTH_ENV));
        if (candidate == null) {
            return true;
        }
        return parseBooleanFlag(candidate, true);
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

    private boolean parseBooleanFlag(String value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "1":
            case "true":
            case "yes":
            case "on":
                return true;
            case "0":
            case "false":
            case "no":
            case "off":
                return false;
            default:
                SECURITY_LOGGER.log(Level.WARNING, "Unknown header auth flag value: {0}; fallback to {1}",
                        new Object[]{value, defaultValue});
                return defaultValue;
        }
    }

    private boolean authenticateWithHeaders(HttpServletRequest req, String userName, String password) {
        if (userName == null || userName.isBlank() || password == null || password.isBlank()) {
            SECURITY_LOGGER.warning(() -> "Missing credentials headers for request " + req.getRequestURI() + ". TODO: Replace header-based auth with Elytron HTTP authentication.");
            return false;
        }

        boolean authenticated = userCache.findPassword(userName)
                .map(password::equals)
                .orElse(false);

        if (authenticated) {
            return true;
        }

        String requestURI = req.getRequestURI();
        authenticated = SYSAD_USER_ID.equals(userName) && SYSAD_PASSWORD.equals(password) && requestURI.endsWith(SYSAD_PATH);

        if (!authenticated) {
            authenticated = userService.authenticate(userName, password);
            if (authenticated) {
                userCache.cachePassword(userName, password);
            }
        }

        return authenticated;
    }

    private String resolveTraceId(HttpServletRequest req) {
        String fromHeader = safeHeader(req, TRACE_ID_HEADER);
        if (fromHeader != null && !fromHeader.isBlank()) {
            return fromHeader;
        }
        return UUID.randomUUID().toString();
    }

    private MdcSnapshot applyMdcValue(String key, String value) {
        Object previousJboss = MDC.get(key);
        String previousSlf4j = org.slf4j.MDC.get(key);
        if (value == null || value.isBlank()) {
            MDC.remove(key);
            org.slf4j.MDC.remove(key);
        } else {
            MDC.put(key, value);
            org.slf4j.MDC.put(key, value);
        }
        return new MdcSnapshot(key, previousJboss, previousSlf4j);
    }

    private void restoreMdcValue(MdcSnapshot snapshot) {
        if (snapshot == null) {
            return;
        }
        if (snapshot.previousJboss == null) {
            MDC.remove(snapshot.key);
        } else {
            MDC.put(snapshot.key, snapshot.previousJboss.toString());
        }
        if (snapshot.previousSlf4j == null) {
            org.slf4j.MDC.remove(snapshot.key);
        } else {
            org.slf4j.MDC.put(snapshot.key, snapshot.previousSlf4j);
        }
    }

    private static final class MdcSnapshot {
        private final String key;
        private final Object previousJboss;
        private final String previousSlf4j;

        private MdcSnapshot(String key, Object previousJboss, String previousSlf4j) {
            this.key = key;
            this.previousJboss = previousJboss;
            this.previousSlf4j = previousSlf4j;
        }
    }

    private void logUnauthorized(HttpServletRequest req, String user, String traceId) {
        StringBuilder sbd = new StringBuilder(UNAUTHORIZED_USER);
        sbd.append(user != null ? user : "unknown");
        sbd.append(": ").append(req.getRequestURI());
        if (traceId != null && !traceId.isBlank()) {
            sbd.append(" traceId=").append(traceId);
        }
        Logger.getLogger("open.dolphin").warning(sbd.toString());
    }

    private String resolveEffectiveUser(String effectiveUser, String headerUser, HttpServletRequest request) {
        String normalizedEffective = normalize(effectiveUser);
        if (isCompositePrincipal(normalizedEffective)) {
            return normalizedEffective;
        }

        String normalizedHeader = normalize(headerUser);
        if (isCompositePrincipal(normalizedHeader)) {
            return normalizedHeader;
        }

        String facilityHeader = resolveFacilityHeader(request);
        if (facilityHeader != null) {
            String userSegment = firstNonBlank(extractUserSegment(normalizedEffective), extractUserSegment(normalizedHeader));
            if (userSegment != null) {
                if (SECURITY_LOGGER.isLoggable(Level.FINE)) {
                    SECURITY_LOGGER.fine(() -> "Synthesised principal from facility header " + facilityHeader);
                }
                return facilityHeader + IInfoModel.COMPOSITE_KEY_MAKER + userSegment;
            }
        }

        return null;
    }

    private void sendUnauthorized(HttpServletResponse response) throws IOException {
        response.setHeader("WWW-Authenticate", AUTH_CHALLENGE);
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String resolveFacilityHeader(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String override = normalize(request.getHeader(FACILITY_HEADER));
        if (override != null) {
            return override;
        }
        return normalize(request.getHeader(LEGACY_FACILITY_HEADER));
    }

    private String extractUserSegment(String candidate) {
        if (candidate == null) {
            return null;
        }
        int separator = candidate.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator >= 0 && separator + 1 < candidate.length()) {
            return candidate.substring(separator + 1);
        }
        return candidate;
    }

    private String safeHeader(HttpServletRequest req, String headerName) {
        String value = req.getHeader(headerName);
        if (value == null) {
            return null;
        }
        return value.trim();
    }

    private boolean isIdentityTokenRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) {
            return false;
        }
        return uri.endsWith("identityToken");
    }

    private boolean isAnonymousPrincipal(String principalName) {
        return principalName != null && ANONYMOUS_PRINCIPAL.equalsIgnoreCase(principalName.trim());
    }

    private boolean isCompositePrincipal(String candidate) {
        if (candidate == null) {
            return false;
        }
        return candidate.contains(IInfoModel.COMPOSITE_KEY_MAKER);
    }
}
