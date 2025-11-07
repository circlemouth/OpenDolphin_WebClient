package open.dolphin.rest;

import java.io.IOException;
import java.security.Principal;
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
import open.dolphin.mbean.UserCache;
import open.dolphin.session.UserServiceBean;
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
    private static final String TRACE_ID_ATTRIBUTE = LogFilter.class.getName() + ".TRACE_ID";
    private static final String MDC_TRACE_ID_KEY = "traceId";

    private static final String SYSAD_USER_ID = "1.3.6.1.4.1.9414.10.1:dolphin";
    private static final String SYSAD_PASSWORD = "36cdf8b887a5cffc78dcd5c08991b993";
    private static final String SYSAD_PATH = "dolphin";

    @Inject
    private UserServiceBean userService;

    @Inject
    private UserCache userCache;

    @Inject
    private SecurityContext securityContext;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest)request;
        HttpServletResponse res = (HttpServletResponse) response;

        String traceId = resolveTraceId(req);
        req.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
        res.setHeader(TRACE_ID_HEADER, traceId);
        Object previousTraceId = MDC.put(MDC_TRACE_ID_KEY, traceId);

        try {
            boolean identityTokenRequest = isIdentityTokenRequest(req);

            String headerUser = safeHeader(req, USER_NAME);
            String headerPassword = safeHeader(req, PASSWORD);
            Optional<String> principalUser = resolvePrincipalUser();

            String effectiveUser = principalUser.orElse(headerUser);
            boolean authentication = principalUser.isPresent() || identityTokenRequest;

            if (!authentication) {
                authentication = authenticateWithHeaders(req, headerUser, headerPassword);
            }

            if (!authentication) {
                String requestURI = req.getRequestURI();
                String msg = UNAUTHORIZED_USER + String.valueOf(effectiveUser) + ": " + requestURI + " traceId=" + traceId;
                Logger.getLogger("open.dolphin").warning(msg);
                res.sendError(HttpServletResponse.SC_FORBIDDEN);
                return;
            }

            BlockWrapper wrapper = new BlockWrapper(req);
            wrapper.setRemoteUser(effectiveUser);

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
            restorePreviousTraceId(previousTraceId);
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
            if (name == null || name.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(name);
        } catch (IllegalStateException ex) {
            SECURITY_LOGGER.log(Level.FINE, "SecurityContext is not available yet; falling back to header authentication.", ex);
            return Optional.empty();
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

    private void restorePreviousTraceId(Object previousTraceId) {
        if (previousTraceId == null) {
            MDC.remove(MDC_TRACE_ID_KEY);
        } else {
            MDC.put(MDC_TRACE_ID_KEY, previousTraceId.toString());
        }
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
}
