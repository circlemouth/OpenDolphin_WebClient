package open.dolphin.rest;

import java.io.IOException;
import java.security.Principal;
import java.util.UUID;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.mbean.UserCache;
import open.dolphin.session.UserServiceBean;

/**
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@WebFilter(urlPatterns = {"/resources/*"}, asyncSupported = true)
public class LogFilter implements Filter {

    private static final Logger SECURITY_LOGGER = Logger.getLogger(LogFilter.class.getName());
    private static final String USER_NAME = "userName";
    private static final String PASSWORD = "password";
    private static final String FACILITY_HEADER = "X-Facility-Id";
    private static final String LEGACY_FACILITY_HEADER = "facilityId";
    private static final String UNAUTHORIZED_USER = "Unauthorized user: ";
    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String TRACE_ID_ATTRIBUTE = LogFilter.class.getName() + ".TRACE_ID";
    private static final String ANONYMOUS_PRINCIPAL = "anonymous";
    private static final String AUTH_CHALLENGE = "Basic realm=\"OpenDolphin\"";

    private static final String SYSAD_USER_ID = "1.3.6.1.4.1.9414.10.1:dolphin";
    private static final String SYSAD_PASSWORD = "36cdf8b887a5cffc78dcd5c08991b993";
    private static final String SYSAD_PATH = "dolphin";

    @Inject
    private UserServiceBean userService;

    @Inject
    private UserCache userCache;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String traceId = resolveTraceId(req);
        req.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
        res.setHeader(TRACE_ID_HEADER, traceId);
        try {
            if (isIdentityTokenRequest(req)) {
                chain.doFilter(request, response);
                return;
            }

            String principalUser = resolvePrincipalUser(req);
            String headerUser = normalize(req.getHeader(USER_NAME));
            String headerPassword = normalize(req.getHeader(PASSWORD));

            String effectiveUser = null;
            boolean authenticated = false;

            if (principalUser != null) {
                effectiveUser = principalUser;
                authenticated = true;
            } else if (authenticateWithHeaders(req, headerUser, headerPassword)) {
                effectiveUser = headerUser;
                authenticated = true;
            }

            String candidate = headerUser != null ? headerUser : principalUser;

            if (!authenticated) {
                logUnauthorized(req, candidate, traceId);
                sendUnauthorized(res);
                return;
            }

            effectiveUser = resolveEffectiveUser(effectiveUser, headerUser, req);
            if (effectiveUser == null) {
                logUnauthorized(req, candidate, traceId);
                sendUnauthorized(res);
                return;
            }

            BlockWrapper wrapper = new BlockWrapper(req);
            wrapper.setRemoteUser(effectiveUser);

            logAccess(wrapper, traceId);

            chain.doFilter(wrapper, response);
        } finally {
            // no-op
        }
    }

    @Override
    public void destroy() {
    }

    private boolean authenticateWithHeaders(HttpServletRequest req, String userName, String password) {
        if (isBlank(userName) || isBlank(password)) {
            SECURITY_LOGGER.fine(() -> "Missing credentials headers for request " + req.getRequestURI());
            return false;
        }

        boolean authenticated = password.equals(userCache.getMap().get(userName));
        if (authenticated) {
            return true;
        }

        String requestURI = req.getRequestURI();
        if (requestURI != null && SYSAD_USER_ID.equals(userName) && SYSAD_PASSWORD.equals(password) && requestURI.endsWith(SYSAD_PATH)) {
            return true;
        }

        authenticated = userService.authenticate(userName, password);
        if (authenticated) {
            userCache.getMap().put(userName, password);
        }
        return authenticated;
    }

    private void logAccess(BlockWrapper wrapper, String traceId) {
        StringBuilder sb = new StringBuilder();
        sb.append(wrapper.getRemoteAddr()).append(" ");
        sb.append(wrapper.getShortUser()).append(" ");
        sb.append(wrapper.getMethod()).append(" ");
//minagawa^ VisitTouch logを分ける
        String uri = wrapper.getRequestURIForLog();
        sb.append(uri);
        if (traceId != null && !traceId.isEmpty()) {
            sb.append(" traceId=").append(traceId);
        }
        if (uri.startsWith("/jtouch")) {
            Logger.getLogger("visit.touch").info(sb.toString());
        } else {
            Logger.getLogger("open.dolphin").info(sb.toString());
        }
//minagawa
    }

    private void logUnauthorized(HttpServletRequest req, String userName, String traceId) {
        StringBuilder sbd = new StringBuilder();
        sbd.append(UNAUTHORIZED_USER);
        sbd.append(userName != null ? userName : "unknown");
        sbd.append(": ").append(req.getRequestURI());
        if (traceId != null && !traceId.isEmpty()) {
            sbd.append(" traceId=").append(traceId);
        }
        Logger.getLogger("open.dolphin").warning(sbd.toString());
    }

    private String resolveTraceId(HttpServletRequest req) {
        String fromHeader = normalize(req.getHeader(TRACE_ID_HEADER));
        if (fromHeader != null) {
            return fromHeader;
        }
        return UUID.randomUUID().toString();
    }

    private String resolvePrincipalUser(HttpServletRequest req) {
        String remoteUser = normalize(req.getRemoteUser());
        if (isValidPrincipal(remoteUser)) {
            return remoteUser;
        }

        Principal principal = req.getUserPrincipal();
        if (principal == null) {
            return null;
        }
        String name = normalize(principal.getName());
        if (isValidPrincipal(name)) {
            return name;
        }

        return null;
    }

    private boolean isIdentityTokenRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri != null && uri.endsWith("identityToken");
    }

    private boolean isValidPrincipal(String principal) {
        return principal != null && !principal.isEmpty() && !ANONYMOUS_PRINCIPAL.equalsIgnoreCase(principal);
    }

    private boolean isCompositePrincipal(String principal) {
        if (!isValidPrincipal(principal)) {
            return false;
        }
        return principal.contains(IInfoModel.COMPOSITE_KEY_MAKER);
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
                SECURITY_LOGGER.fine(() -> "Composed remote user from facility header " + facilityHeader);
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
        if (candidate == null || candidate.isEmpty()) {
            return null;
        }
        int separator = candidate.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (separator >= 0 && separator + 1 < candidate.length()) {
            return candidate.substring(separator + 1);
        }
        return candidate;
    }

    private String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.trim().isEmpty()) {
                return candidate;
            }
        }
        return null;
    }
}
