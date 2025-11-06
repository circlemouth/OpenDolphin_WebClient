package open.dolphin.metrics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.core.UriInfo;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class RequestMetricsFilterTest {

    private final SimpleMeterRegistry registry = new SimpleMeterRegistry();

    @AfterEach
    void tearDown() {
        registry.clear();
    }

    @Test
    void fallbackNormalisesPathAndRecordsMetrics() throws Exception {
        RequestMetricsFilter filter = new RequestMetricsFilter();
        setField(filter, "meterRegistry", registry);

        ContainerRequestContext request = mock(ContainerRequestContext.class);
        Map<String, Object> properties = new HashMap<>();
        doAnswer(invocation -> {
            properties.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(request).setProperty(anyString(), any());
        when(request.getProperty(anyString())).thenAnswer(invocation -> properties.get(invocation.getArgument(0, String.class)));
        when(request.getMethod()).thenReturn("GET");

        UriInfo uriInfo = mock(UriInfo.class);
        when(uriInfo.getPath()).thenReturn("20/adm/phr/patient/12345/abcdef1234567890abcdef1234567890abcdef12");
        when(request.getUriInfo()).thenReturn(uriInfo);

        ContainerResponseContext response = mock(ContainerResponseContext.class);
        when(response.getStatus()).thenReturn(403);

        filter.filter(request);
        filter.filter(request, response);

        String normalisedPath = "/20/adm/phr/patient/{id}/{hex}";

        Counter requestCounter = registry.find("opendolphin_api_request_total").counter();
        assertNotNull(requestCounter);
        assertEquals("GET", requestCounter.getId().getTag("method"));
        assertEquals(normalisedPath, requestCounter.getId().getTag("path"));
        assertEquals("403", requestCounter.getId().getTag("status"));
        assertEquals(1.0, requestCounter.count(), 1e-6);
        System.out.printf("METRIC %s tags=%s count=%.0f%n",
                requestCounter.getId().getName(), requestCounter.getId().getTags(), requestCounter.count());

        Counter errorCounter = registry.find("opendolphin_api_error_total").counter();
        assertNotNull(errorCounter);
        assertEquals(normalisedPath, errorCounter.getId().getTag("path"));
        assertEquals("403", errorCounter.getId().getTag("status"));
        assertEquals(1.0, errorCounter.count(), 1e-6);
        assertEquals("GET", errorCounter.getId().getTag("method"));
        System.out.printf("METRIC %s tags=%s count=%.0f%n",
                errorCounter.getId().getName(), errorCounter.getId().getTags(), errorCounter.count());

        Counter authCounter = registry.find("opendolphin_auth_reject_total").counter();
        assertNotNull(authCounter);
        assertEquals(normalisedPath, authCounter.getId().getTag("path"));
        assertEquals("403", authCounter.getId().getTag("status"));
        assertEquals("GET", authCounter.getId().getTag("method"));
        assertEquals(1.0, authCounter.count(), 1e-6);
        System.out.printf("METRIC %s tags=%s count=%.0f%n",
                authCounter.getId().getName(), authCounter.getId().getTags(), authCounter.count());

        Timer timer = registry.find("opendolphin_api_request_duration").timer();
        assertNotNull(timer);
        assertEquals(normalisedPath, timer.getId().getTag("path"));
        assertEquals("403", timer.getId().getTag("status"));
        assertEquals("GET", timer.getId().getTag("method"));
        assertEquals(1, timer.count());
        System.out.printf("METRIC %s tags=%s count=%d%n",
                timer.getId().getName(), timer.getId().getTags(), timer.count());
    }

    private void setField(RequestMetricsFilter target, String fieldName, Object value) throws Exception {
        Field field = RequestMetricsFilter.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
