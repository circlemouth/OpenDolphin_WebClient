package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Proxy;
import java.util.Map;
import open.dolphin.rest.dto.outpatient.PatientOutpatientResponse;
import org.junit.jupiter.api.Test;

class OrcaPatientLocalSearchResourceTest {

    @Test
    void localSearchProvidesRequestMetadata() {
        OrcaPatientLocalSearchResource resource = new OrcaPatientLocalSearchResource();

        HttpServletRequest request = createRequest(
                "F001:doctor01",
                "/orca/patients/local-search",
                Map.of("X-Trace-Id", "trace-local", "X-Request-Id", "req-local"));

        PatientOutpatientResponse response = resource.postPatients(request, Map.of("keyword", "test"));

        assertEquals("trace-local", response.getTraceId());
        assertEquals("req-local", response.getRequestId());
        assertEquals("server", response.getDataSource());
        assertEquals("server", response.getDataSourceTransition());
        assertNotNull(response.getFetchedAt());
    }

    private HttpServletRequest createRequest(String remoteUser, String uri, Map<String, String> headers) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> {
                    switch (method.getName()) {
                        case "getRemoteUser":
                            return remoteUser;
                        case "getRequestURI":
                            return uri;
                        case "getRemoteAddr":
                            return "127.0.0.1";
                        case "getHeader":
                            if (args != null && args.length == 1) {
                                String key = String.valueOf(args[0]);
                                return headers.get(key);
                            }
                            return null;
                        default:
                            return null;
                    }
                });
    }
}
