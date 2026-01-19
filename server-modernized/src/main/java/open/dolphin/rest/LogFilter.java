package open.dolphin.rest;

import java.io.IOException;
import java.security.Principal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
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
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.UserServiceBean;
import open.dolphin.session.framework.SessionTraceAttributes;
import org.jboss.logmanager.MDC;

/**
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@WebFilter(urlPatterns = {"/resources/*", "/orca/*"}, asyncSupported = true)
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
    private static final String HEADER_FACILITY_DETAILS_KEY = "facilityIdHeader";
    private static final String PRINCIPAL_FACILITY_DETAILS_KEY = "facilityId";

    @Inject
    private SecurityContext securityContext;

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    private UserServiceBean userService;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        SECURITY_LOGGER.log(Level.INFO, "LogFilter header fallback is disabled");
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

            Optional<String> principalUser = resolvePrincipalUser();
            if (principalUser.isEmpty()) {
                principalUser = authenticateWithBasicHeader(req);
            }
            String headerUser = safeHeader(req, USER_NAME);
            String headerPassword = safeHeader(req, PASSWORD);

            boolean hasDeprecatedHeader = (headerUser != null && !headerUser.isBlank())
                    || (headerPassword != null && !headerPassword.isBlank());

            if (principalUser.isEmpty()) {
                String candidateUser = normalize(headerUser);
                if (hasDeprecatedHeader) {
                    logUnauthorized(req, candidateUser, traceId);
                    recordUnauthorizedAudit(req, traceId, candidateUser, "header_auth_disabled",
                            "Header-based authentication is not allowed", "header_authentication_disabled",
                            HttpServletResponse.SC_UNAUTHORIZED);
                    sendUnauthorized(req, res, "header_auth_disabled", "Header-based authentication is not allowed",
                            unauthorizedDetails(candidateUser, "header_authentication_disabled"));
                    return;
                }
                logUnauthorized(req, candidateUser, traceId);
                recordUnauthorizedAudit(req, traceId, candidateUser, "unauthorized",
                        "Authentication required", "authentication_failed", HttpServletResponse.SC_UNAUTHORIZED);
                sendUnauthorized(req, res, "unauthorized", "Authentication required",
                        unauthorizedDetails(candidateUser, "authentication_failed"));
                return;
            }

            String resolvedUser = resolveEffectiveUser(principalUser.orElse(null), req);
            if (resolvedUser == null) {
                String candidateUser = principalUser.orElse(null);
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
            SECURITY_LOGGER.log(Level.FINE, "SecurityContext unavailable; request will be rejected (header auth disabled).", ex);
            return Optional.empty();
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

    private String resolveEffectiveUser(String effectiveUser, HttpServletRequest request) {
        String normalizedEffective = normalize(effectiveUser);
        if (isCompositePrincipal(normalizedEffective)) {
            return normalizedEffective;
        }

        String facility = firstNonBlank(resolveFacilityHeader(request), resolveFacilityFromPath(request));
        if (facility != null && normalizedEffective != null) {
            return facility + IInfoModel.COMPOSITE_KEY_MAKER + normalizedEffective;
        }

        if (!isBlank(normalizedEffective)) {
            SECURITY_LOGGER.warning(() -> "Authenticated principal is missing facility component and will be rejected");
        }

        return null;
    }

    private Optional<String> authenticateWithBasicHeader(HttpServletRequest request) {
        String auth = safeHeader(request, "Authorization");
        if (auth == null || auth.isBlank()) {
            return Optional.empty();
        }
        String trimmed = auth.trim();
        if (!trimmed.regionMatches(true, 0, "Basic ", 0, 6)) {
            return Optional.empty();
        }
        String encoded = trimmed.substring(6).trim();
        String decoded;
        try {
            decoded = new String(Base64.getDecoder().decode(encoded), java.nio.charset.StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            SECURITY_LOGGER.log(Level.FINE, "Invalid Basic auth header", ex);
            return Optional.empty();
        }
        int sep = decoded.indexOf(':');
        if (sep < 0) {
            SECURITY_LOGGER.fine("Basic auth header missing separator");
            return Optional.empty();
        }
        String rawUser = decoded.substring(0, sep).trim();
        String rawPass = decoded.substring(sep + 1);

        String facility = firstNonBlank(resolveFacilityHeader(request), resolveFacilityFromPath(request));
        String compositeUser = isCompositePrincipal(rawUser)
                ? rawUser
                : (facility != null ? facility + IInfoModel.COMPOSITE_KEY_MAKER + rawUser : rawUser);

        if (isBlank(compositeUser)) {
            return Optional.empty();
        }

        // Accept both plain and MD5-hashed passwords for compatibility.
        if (userService.authenticate(compositeUser, rawPass)) {
            return Optional.of(compositeUser);
        }
        String hashed = md5(rawPass);
        if (hashed != null && userService.authenticate(compositeUser, hashed)) {
            return Optional.of(compositeUser);
        }
        SECURITY_LOGGER.log(Level.FINE, "Basic authentication failed for user {0}", compositeUser);
        return Optional.empty();
    }

    private String resolveFacilityFromPath(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String uri = request.getRequestURI();
        if (uri == null) {
            return null;
        }
        String marker = "/user/";
        int idx = uri.indexOf(marker);
        if (idx < 0) {
            return null;
        }
        String remainder = uri.substring(idx + marker.length());
        int sep = remainder.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (sep > 0) {
            return remainder.substring(0, sep);
        }
        return null;
    }

    private String md5(String value) {
        if (value == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            SECURITY_LOGGER.log(Level.FINE, "MD5 not available", e);
            return null;
        }
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

    private String extractFacilitySegment(String candidate) {
        if (candidate == null) {
            return null;
        }
        int separator = candidate.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator > 0) {
            return candidate.substring(0, separator);
        }
        return null;
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
            details.put(HEADER_FACILITY_DETAILS_KEY, facilityHeader);
        }
        String facilityFromPrincipal = extractFacilitySegment(principal);
        if (facilityFromPrincipal != null) {
            details.put(PRINCIPAL_FACILITY_DETAILS_KEY, facilityFromPrincipal);
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
            details.put(HEADER_FACILITY_DETAILS_KEY, facilityHeader);
        }
        String facilityFromPrincipal = extractFacilitySegment(request != null ? request.getRemoteUser() : null);
        if (facilityFromPrincipal != null) {
            details.put(PRINCIPAL_FACILITY_DETAILS_KEY, facilityFromPrincipal);
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
