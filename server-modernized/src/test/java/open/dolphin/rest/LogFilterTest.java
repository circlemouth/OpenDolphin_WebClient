package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.security.enterprise.SecurityContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import open.dolphin.mbean.UserCache;
import open.dolphin.session.UserServiceBean;
import org.jboss.logmanager.MDC;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class LogFilterTest {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";

    private LogFilter filter;
    private UserServiceBean userService;
    private UserCache userCache;

    @BeforeEach
    void setUp() throws Exception {
        filter = new LogFilter();
        userService = mock(UserServiceBean.class);
        userCache = new UserCache();
        setField("userService", userService);
        setField("userCache", userCache);
        setField("securityContext", (SecurityContext) null);
    }

    @AfterEach
    void cleanUpMdc() {
        MDC.remove("traceId");
    }

    @Test
    void identityTokenRequestEchoesClientTraceId() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        Map<String, Object> attributes = new HashMap<>();
        doAnswer(invocation -> {
            attributes.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(request).setAttribute(anyString(), any());
        when(request.getAttribute(anyString())).thenAnswer(invocation -> attributes.get(invocation.getArgument(0, String.class)));

        Map<String, String> headers = new HashMap<>();
        headers.put(TRACE_ID_HEADER, "client-trace-id");
        when(request.getHeader(anyString())).thenAnswer(invocation -> headers.get(invocation.getArgument(0, String.class)));
        when(request.getRequestURI()).thenReturn("/openDolphin/resources/20/adm/phr/identityToken");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.0.2.10");

        filter.doFilter(request, response, chain);

        verify(response).setHeader(TRACE_ID_HEADER, "client-trace-id");
        verify(chain).doFilter(any(ServletRequest.class), eq(response));
        assertEquals("client-trace-id", attributes.get(LogFilter.class.getName() + ".TRACE_ID"));
    }

    @Test
    void unauthorizedRequestGeneratesTraceIdAndLogs() throws Exception {
        when(userService.authenticate(anyString(), anyString())).thenReturn(false);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        Map<String, Object> attributes = new HashMap<>();
        doAnswer(invocation -> {
            attributes.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(request).setAttribute(anyString(), any());
        when(request.getAttribute(anyString())).thenAnswer(invocation -> attributes.get(invocation.getArgument(0, String.class)));

        Map<String, String> headers = new HashMap<>();
        when(request.getHeader(anyString())).thenAnswer(invocation -> headers.get(invocation.getArgument(0, String.class)));
        when(request.getRequestURI()).thenReturn("/openDolphin/resources/protected");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.0.2.11");

        doNothing().when(response).sendError(HttpServletResponse.SC_FORBIDDEN);

        TestLogHandler handler = new TestLogHandler();
        Logger appLogger = Logger.getLogger("open.dolphin");
        Level originalLevel = appLogger.getLevel();
        boolean originalUseParent = appLogger.getUseParentHandlers();
        appLogger.setLevel(Level.ALL);
        appLogger.setUseParentHandlers(false);
        appLogger.addHandler(handler);

        try {
            filter.doFilter(request, response, chain);
        } finally {
            appLogger.removeHandler(handler);
            appLogger.setUseParentHandlers(originalUseParent);
            appLogger.setLevel(originalLevel);
        }

        ArgumentCaptor<String> traceCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).setHeader(eq(TRACE_ID_HEADER), traceCaptor.capture());
        String traceId = traceCaptor.getValue();
        assertNotNull(traceId);

        verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(any(ServletRequest.class), any(ServletResponse.class));

        List<LogRecord> records = handler.records();
        LogRecord record = records.stream()
                .filter(r -> r.getMessage() != null && r.getMessage().contains("Unauthorized user"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Missing unauthorized log record"));
        System.out.println("Captured unauthorized log: " + record.getLevel() + " " + record.getMessage());
        assertTrue(record.getMessage().contains("traceId=" + traceId));
        assertTrue(record.getLevel().intValue() >= Level.WARNING.intValue());

        String storedTrace = (String) attributes.get(LogFilter.class.getName() + ".TRACE_ID");
        assertEquals(traceId, storedTrace);
        UUID.fromString(traceId); // validate UUID format in message
    }

    private void setField(String fieldName, Object value) throws Exception {
        Field field = LogFilter.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(filter, value);
    }

    private static final class TestLogHandler extends Handler {

        private final List<LogRecord> records = new CopyOnWriteArrayList<>();

        @Override
        public void publish(LogRecord record) {
            records.add(record);
        }

        @Override
        public void flush() {
            // no-op
        }

        @Override
        public void close() {
            records.clear();
        }

        List<LogRecord> records() {
            return records;
        }
    }
}
