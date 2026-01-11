package open.dolphin.rest;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * Forwards /orca/* calls to the RESTEasy /resources/* mapping to avoid 404.
 */
public class OrcaResourceForwardFilter implements Filter {

    private static final String ORCA_PREFIX = "/orca";
    private static final String REST_PREFIX = "/resources";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest)) {
            chain.doFilter(request, response);
            return;
        }
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String contextPath = httpRequest.getContextPath();
        String requestUri = httpRequest.getRequestURI();
        String path = requestUri.substring(contextPath.length());
        if (path.equals(ORCA_PREFIX) || path.startsWith(ORCA_PREFIX + "/")) {
            RequestDispatcher dispatcher = request.getRequestDispatcher(REST_PREFIX + path);
            dispatcher.forward(request, response);
            return;
        }
        chain.doFilter(request, response);
    }
}
