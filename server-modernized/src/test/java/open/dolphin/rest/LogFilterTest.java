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
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
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
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.mbean.UserCache;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
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
        stubResponseOutput(response);

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

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
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

    @Test
    void headerFallbackDisabledRejectsRequestsWithoutPrincipal() throws Exception {
        setField("headerAuthEnabled", false);
        when(userService.authenticate(anyString(), anyString())).thenReturn(true);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        stubResponseOutput(response);

        Map<String, Object> attributes = new HashMap<>();
        doAnswer(invocation -> {
            attributes.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(request).setAttribute(anyString(), any());
        when(request.getAttribute(anyString())).thenAnswer(invocation -> attributes.get(invocation.getArgument(0, String.class)));
        when(request.getRequestURI()).thenReturn("/openDolphin/resources/protected");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.0.2.30");

        filter.doFilter(request, response, chain);

        verify(userService, never()).authenticate(anyString(), anyString());
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(chain, never()).doFilter(any(ServletRequest.class), any(ServletResponse.class));
    }

    @Test
    void errorResponseAuditUsesUnifiedFailureMetadata() throws Exception {
        when(userService.authenticate(anyString(), anyString())).thenReturn(true);
        SessionAuditDispatcher dispatcher = mock(SessionAuditDispatcher.class);
        setField("sessionAuditDispatcher", dispatcher);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = (req, res) -> {
            HttpServletRequest httpReq = (HttpServletRequest) req;
            httpReq.setAttribute(AbstractResource.ERROR_CODE_ATTRIBUTE, "mock_error");
            httpReq.setAttribute(AbstractResource.ERROR_MESSAGE_ATTRIBUTE, "mock failure");
            HttpServletResponse httpRes = (HttpServletResponse) res;
            httpRes.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        };
        stubResponseOutput(response);

        Map<String, Object> attributes = new HashMap<>();
        doAnswer(invocation -> {
            attributes.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(request).setAttribute(anyString(), any());
        when(request.getAttribute(anyString())).thenAnswer(invocation -> attributes.get(invocation.getArgument(0, String.class)));

        Map<String, String> headers = new HashMap<>();
        headers.put("userName", "F001:doctor01");
        headers.put("password", "pass");
        when(request.getHeader(anyString())).thenAnswer(invocation -> headers.get(invocation.getArgument(0, String.class)));
        when(request.getRequestURI()).thenReturn("/openDolphin/resources/error");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("192.0.2.50");
        when(response.getStatus()).thenReturn(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<AuditEventPayload> payloadCaptor = ArgumentCaptor.forClass(AuditEventPayload.class);
        ArgumentCaptor<String> errorCodeCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> errorMessageCaptor = ArgumentCaptor.forClass(String.class);
        verify(dispatcher).record(payloadCaptor.capture(), eq(AuditEventEnvelope.Outcome.FAILURE),
                errorCodeCaptor.capture(), errorMessageCaptor.capture());

        assertEquals("mock_error", errorCodeCaptor.getValue());
        assertEquals("mock failure", errorMessageCaptor.getValue());
        Map<String, Object> details = payloadCaptor.getValue().getDetails();
        assertEquals("failed", details.get("status"));
        assertEquals(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, details.get("httpStatus"));
        assertEquals("mock_error", details.get("errorCode"));
        assertEquals("mock_error", details.get("reason"));
        assertEquals("mock failure", details.get("errorMessage"));
    }

    private void stubResponseOutput(HttpServletResponse response) throws Exception {
        when(response.isCommitted()).thenReturn(false);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(response.getOutputStream()).thenReturn(new ServletOutputStream() {
            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setWriteListener(WriteListener listener) {
                // no-op
            }

            @Override
            public void write(int b) {
                out.write(b);
            }
        });
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
