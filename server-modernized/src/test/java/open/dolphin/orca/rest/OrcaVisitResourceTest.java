package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.util.Map;
import open.dolphin.orca.converter.OrcaXmlMapper;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.orca.transport.StubOrcaTransport;
import open.dolphin.rest.dto.orca.VisitMutationRequest;
import open.dolphin.rest.dto.orca.VisitMutationResponse;
import open.dolphin.rest.dto.orca.VisitPatientListRequest;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;
import org.junit.jupiter.api.Test;

class OrcaVisitResourceTest {

    private OrcaWrapperService createService() {
        return new OrcaWrapperService(new StubOrcaTransport(), new OrcaXmlMapper());
    }

    @Test
    void visitListReturnsStubPayload() {
        OrcaVisitResource resource = new OrcaVisitResource();
        resource.setWrapperService(createService());

        VisitPatientListRequest request = new VisitPatientListRequest();
        request.setRequestNumber("01");
        request.setVisitDate(LocalDate.of(2025, 11, 12));

        VisitPatientListResponse response = resource.visitList(null, request);
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
        assertEquals(1, response.getVisits().size());
        assertEquals("2025-11-12", response.getVisitDate());
        assertNotNull(response.getVisits().get(0).getPatient());
        assertGeneratedRunId(response.getRunId());
        assertEquals(1, response.getRecordsReturned());
        assertEquals("server", response.getDataSourceTransition());
    }

    @Test
    void visitListRejectsWideRange() {
        OrcaVisitResource resource = new OrcaVisitResource();
        resource.setWrapperService(createService());

        VisitPatientListRequest request = new VisitPatientListRequest();
        request.setRequestNumber("01");
        request.setFromDate(LocalDate.of(2025, 1, 1));
        request.setToDate(LocalDate.of(2025, 2, 2));

        assertThrows(WebApplicationException.class, () -> resource.visitList(null, request));
    }

    @Test
    void visitMutationReturnsStubPayload() {
        OrcaVisitResource resource = new OrcaVisitResource();
        resource.setWrapperService(createService());

        VisitMutationRequest request = new VisitMutationRequest();
        request.setRequestNumber("01");
        request.setPatientId("000001");
        request.setAcceptanceDate("2025-11-16");
        request.setAcceptanceTime("09:00:00");

        VisitMutationResponse response = resource.mutateVisit(
                createRequest("F001:doctor01", Map.of("X-Run-Id", "RUN-VISIT-001")), request);
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
        assertEquals("A20251116001", response.getAcceptanceId());
        assertEquals("000001", response.getPatient().getPatientId());
        assertEquals("RUN-VISIT-001", response.getRunId());
    }

    private HttpServletRequest createRequest(String remoteUser, Map<String, String> headers) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> {
                    switch (method.getName()) {
                        case "getRemoteUser":
                            return remoteUser;
                        case "getRequestURI":
                            return "/orca/visits/mutation";
                        case "getRemoteAddr":
                            return "127.0.0.1";
                        case "getHeader":
                            if (args != null && args.length == 1) {
                                return headers.get(String.valueOf(args[0]));
                            }
                            return null;
                        default:
                            return null;
                    }
                });
    }

    private void assertGeneratedRunId(String runId) {
        assertNotNull(runId);
        assertTrue(runId.matches("\\d{8}T\\d{6}Z"));
    }
}
