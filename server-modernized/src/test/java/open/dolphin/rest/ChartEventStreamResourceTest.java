package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

class ChartEventStreamResourceTest {

    @Test
    void subscribeReturnsServiceUnavailableWhenRegisterFails() throws Exception {
        ChartEventStreamResource resource = new ChartEventStreamResource();
        ChartEventSseSupport support = mock(ChartEventSseSupport.class);
        doThrow(new IllegalStateException("boom"))
                .when(support)
                .register(anyString(), anyString(), any(Sse.class), any(SseEventSink.class), any());

        setField(resource, "sseSupport", support);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteUser()).thenReturn("facility:user");
        setField(resource, "servletRequest", request);

        SseEventSink sink = mock(SseEventSink.class);
        when(sink.isClosed()).thenReturn(false);
        Sse sse = mock(Sse.class);

        WebApplicationException exception = assertThrows(
                WebApplicationException.class,
                () -> resource.subscribe(sink, sse, "client-uuid", null)
        );
        assertEquals(503, exception.getResponse().getStatus());
        verify(sink).close();
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field field = ChartEventStreamResource.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
