package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Proxy;
import java.util.Map;
import open.dolphin.rest.dto.outpatient.ClaimOutpatientResponse;
import org.junit.jupiter.api.Test;

class OrcaClaimOutpatientResourceTest {

    @Test
    void claimOutpatientProvidesRequestMetadata() {
        OrcaClaimOutpatientResource resource = new OrcaClaimOutpatientResource();

        HttpServletRequest request = createRequest(
                "F001:doctor01",
                "/orca/claim/outpatient",
                Map.of("X-Trace-Id", "trace-claim", "X-Request-Id", "req-claim"));

        ClaimOutpatientResponse response = resource.postOutpatientClaim(request, Map.of("date", "2025-11-12"));

        assertEquals("trace-claim", response.getTraceId());
        assertEquals("req-claim", response.getRequestId());
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
