package open.dolphin.rest;

import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
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
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.mbean.UserCache;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
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
    private static final String ERROR_AUDIT_RECORDED_ATTR = LogFilter.class.getName() + ".ERROR_AUDIT_RECORDED";

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

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

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
        BlockWrapper wrapper = null;

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
                recordUnauthorizedAudit(req, traceId, candidateUser, "unauthorized",
                        "Authentication required", "authentication_failed", HttpServletResponse.SC_UNAUTHORIZED);
                sendUnauthorized(req, res, "unauthorized", "Authentication required",
                        unauthorizedDetails(candidateUser, "authentication_failed"));
                return;
            }

            String resolvedUser = resolveEffectiveUser(effectiveUser, headerUser, req);
            if (resolvedUser == null) {
                logUnauthorized(req, candidateUser, traceId);
                recordUnauthorizedAudit(req, traceId, candidateUser, "unauthorized",
                        "Authenticated user is not associated with a facility",
                        "principal_unresolved", HttpServletResponse.SC_UNAUTHORIZED);
                sendUnauthorized(req, res, "unauthorized", "Authenticated user is not associated with a facility",
                        unauthorizedDetails(candidateUser, "principal_unresolved"));
                return;
            }

            wrapper = new BlockWrapper(req);
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
            maybeRecordErrorAudit(wrapper, res, null);
        } catch (IOException | ServletException ex) {
            maybeRecordErrorAudit(wrapper != null ? wrapper : req, res, ex);
            throw ex;
        } catch (RuntimeException ex) {
            maybeRecordErrorAudit(wrapper != null ? wrapper : req, res, ex);
            throw ex;
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

    private void sendUnauthorized(HttpServletRequest request, HttpServletResponse response, String errorCode,
            String message, Map<String, Object> details) throws IOException {
        response.setHeader("WWW-Authenticate", AUTH_CHALLENGE);
        AbstractResource.writeRestError(request, response, HttpServletResponse.SC_UNAUTHORIZED, errorCode, message, details);
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

    private Map<String, Object> unauthorizedDetails(String principal, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("reason", reason);
        if (principal != null && !principal.isBlank()) {
            details.put("principal", principal);
        }
        return details;
    }

    private void recordUnauthorizedAudit(HttpServletRequest request,
            String traceId,
            String principal,
            String errorCode,
            String errorMessage,
            String reason,
            int statusCode) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction("REST_UNAUTHORIZED_GUARD");
        payload.setResource(request != null ? request.getRequestURI() : "/resources");
        String actorId = principal == null || principal.isBlank() ? "anonymous" : principal;
        payload.setActorId(actorId);
        payload.setActorDisplayName(principal);
        payload.setActorRole("SYSTEM");
        payload.setIpAddress(request != null ? request.getRemoteAddr() : null);
        payload.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
        String effectiveTrace = (traceId == null || traceId.isBlank()) ? UUID.randomUUID().toString() : traceId;
        payload.setRequestId(effectiveTrace);
        payload.setTraceId(effectiveTrace);
        Map<String, Object> details = new HashMap<>();
        details.put("status", "failed");
        details.put("reason", reason);
        if (errorCode != null && !errorCode.isBlank()) {
            details.put("errorCode", errorCode);
            details.putIfAbsent("reason", errorCode);
        }
        if (errorMessage != null && !errorMessage.isBlank()) {
            details.put("errorMessage", errorMessage);
        }
        details.put("httpStatus", statusCode);
        String facilityHeader = resolveFacilityHeader(request);
        if (facilityHeader != null) {
            details.put("facilityId", facilityHeader);
        }
        if (principal != null && !principal.isBlank()) {
            details.put("principal", principal);
        }
        payload.setDetails(details);
        sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.FAILURE,
                errorCode != null && !errorCode.isBlank() ? errorCode : reason, errorMessage);
        if (request != null) {
            request.setAttribute(ERROR_AUDIT_RECORDED_ATTR, Boolean.TRUE);
        }
    }

    private void maybeRecordErrorAudit(HttpServletRequest request, HttpServletResponse response, Throwable failure) {
        if (sessionAuditDispatcher == null || request == null) {
            return;
        }
        if (Boolean.TRUE.equals(request.getAttribute(ERROR_AUDIT_RECORDED_ATTR))) {
            return;
        }
        int status = resolveErrorStatus(response);
        // If an exception occurred but the response status is still success (e.g. 200),
        // treat it as an Internal Server Error (500) to ensure it gets audited.
        if (failure != null && status < HttpServletResponse.SC_BAD_REQUEST) {
            status = HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
        }

        if (status < HttpServletResponse.SC_BAD_REQUEST) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        String resource = request.getRequestURI();
        payload.setAction("REST_ERROR_RESPONSE");
        payload.setResource(resource != null ? resource : "/resources");
        String actorId = request.getRemoteUser();
        if (actorId == null || actorId.isBlank()) {
            actorId = ANONYMOUS_PRINCIPAL;
        }
        payload.setActorId(actorId);
        payload.setActorDisplayName(actorId);
        payload.setActorRole("SYSTEM");
        payload.setIpAddress(request.getRemoteAddr());
        payload.setUserAgent(request.getHeader("User-Agent"));
        String traceId = resolveTraceId(request);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }
        payload.setRequestId(traceId);
        payload.setTraceId(traceId);
        Map<String, Object> details = new HashMap<>();
        details.put("status", "failed");
        details.put("httpStatus", status);
        String errorCode = resolveErrorCode(request, status);
        String errorMessage = resolveErrorMessage(request, failure);
        mergeErrorDetails(details, request);
        if (errorCode != null && !errorCode.isBlank()) {
            details.put("errorCode", errorCode);
            details.putIfAbsent("reason", errorCode);
        }
        if (errorMessage != null && !errorMessage.isBlank()) {
            details.put("errorMessage", errorMessage);
        }
        if (!details.containsKey("validationError") && (status == 400 || status == 422)) {
            details.put("validationError", Boolean.TRUE);
        }
        String facilityHeader = resolveFacilityHeader(request);
        if (facilityHeader != null) {
            details.put("facilityId", facilityHeader);
        }
        if (failure != null) {
            details.put("exception", failure.getClass().getName());
            if (failure.getMessage() != null && !failure.getMessage().isBlank()) {
                details.put("exceptionMessage", failure.getMessage());
            }
        }
        payload.setDetails(details);
        sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.FAILURE, errorCode, errorMessage);
        request.setAttribute(ERROR_AUDIT_RECORDED_ATTR, Boolean.TRUE);
    }

    private int resolveErrorStatus(HttpServletResponse response) {
        if (response != null && response.getStatus() > 0) {
            return response.getStatus();
        }
        return HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
    }

    private String resolveErrorCode(HttpServletRequest request, int status) {
        if (request != null) {
            Object attribute = request.getAttribute(AbstractResource.ERROR_CODE_ATTRIBUTE);
            if (attribute instanceof String code && !code.isBlank()) {
                return code;
            }
        }
        return "http_" + status;
    }

    private String resolveErrorMessage(HttpServletRequest request, Throwable failure) {
        if (request != null) {
            Object attribute = request.getAttribute(AbstractResource.ERROR_MESSAGE_ATTRIBUTE);
            if (attribute instanceof String message && !message.isBlank()) {
                return message;
            }
        }
        if (failure != null && failure.getMessage() != null && !failure.getMessage().isBlank()) {
            return failure.getMessage();
        }
        return null;
    }

    private void mergeErrorDetails(Map<String, Object> target, HttpServletRequest request) {
        if (target == null || request == null) {
            return;
        }
        Object attribute = request.getAttribute(AbstractResource.ERROR_DETAILS_ATTRIBUTE);
        if (!(attribute instanceof Map<?, ?> details)) {
            return;
        }
        details.forEach((key, value) -> {
            if (key == null || value == null) {
                return;
            }
            String normalizedKey = key.toString();
            if (normalizedKey.isBlank()) {
                return;
            }
            target.putIfAbsent(normalizedKey, value);
        });
    }
}
