package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Proxy;
import java.time.LocalDate;
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

        VisitMutationResponse response = resource.mutateVisit(createRequest("F001:doctor01"), request);
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
        assertEquals("A20251116001", response.getAcceptanceId());
        assertEquals("000001", response.getPatient().getPatientId());
    }

    private HttpServletRequest createRequest(String remoteUser) {
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
                            return null;
                        default:
                            return null;
                    }
                });
    }
}
