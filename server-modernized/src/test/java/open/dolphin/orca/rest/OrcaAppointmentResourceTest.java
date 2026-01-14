package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import java.lang.reflect.Proxy;
import java.time.LocalDate;
import open.dolphin.orca.converter.OrcaXmlMapper;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.orca.transport.StubOrcaTransport;
import open.dolphin.rest.dto.orca.AppointmentMutationRequest;
import open.dolphin.rest.dto.orca.AppointmentMutationResponse;
import open.dolphin.rest.dto.orca.BillingSimulationRequest;
import open.dolphin.rest.dto.orca.BillingSimulationRequest.BillingItem;
import open.dolphin.rest.dto.orca.BillingSimulationResponse;
import open.dolphin.rest.dto.orca.OrcaAppointmentListRequest;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientAppointmentListRequest;
import open.dolphin.rest.dto.orca.PatientAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientSummary;
import org.junit.jupiter.api.Test;

class OrcaAppointmentResourceTest {

    private OrcaWrapperService createService() {
        return new OrcaWrapperService(new StubOrcaTransport(), new OrcaXmlMapper());
    }

    @Test
    void listAppointmentsReturnsStubPayload() {
        OrcaAppointmentResource resource = new OrcaAppointmentResource();
        resource.setWrapperService(createService());

        OrcaAppointmentListRequest request = new OrcaAppointmentListRequest();
        request.setAppointmentDate(LocalDate.of(2025, 11, 13));

        OrcaAppointmentListResponse response = resource.listAppointments(null, request);
        assertEquals("2025-11-13", response.getAppointmentDate());
        assertEquals(1, response.getSlots().size());
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
        assertEquals(OrcaWrapperService.RUN_ID, response.getRunId());
        assertEquals(OrcaWrapperService.BLOCKER_TAG, response.getBlockerTag());
    }

    @Test
    void listAppointmentsAcceptsRange() {
        OrcaAppointmentResource resource = new OrcaAppointmentResource();
        resource.setWrapperService(createService());

        OrcaAppointmentListRequest request = new OrcaAppointmentListRequest();
        request.setFromDate(LocalDate.of(2025, 11, 13));
        request.setToDate(LocalDate.of(2025, 11, 14));

        OrcaAppointmentListResponse response = resource.listAppointments(null, request);
        assertEquals("2025-11-13/2025-11-14", response.getAppointmentDate());
        assertEquals(2, response.getSlots().size());
        assertEquals("0000", response.getApiResult());
    }

    @Test
    void patientAppointmentsReturnsStubPayload() {
        OrcaAppointmentResource resource = new OrcaAppointmentResource();
        resource.setWrapperService(createService());

        PatientAppointmentListRequest request = new PatientAppointmentListRequest();
        request.setPatientId("000001");
        request.setBaseDate(LocalDate.of(2025, 11, 12));

        PatientAppointmentListResponse response = resource.patientAppointments(null, request);
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
        assertEquals(1, response.getReservations().size());
        assertEquals("000001", response.getPatient().getPatientId());
    }

    @Test
    void estimateBillingRequiresPatientId() {
        OrcaAppointmentResource resource = new OrcaAppointmentResource();
        resource.setWrapperService(createService());

        BillingSimulationRequest request = new BillingSimulationRequest();
        request.setPerformDate(LocalDate.of(2025, 11, 12));
        BillingItem item = new BillingItem();
        item.setMedicalCode("D000");
        item.setQuantity(1);
        request.getItems().add(item);

        assertThrows(WebApplicationException.class, () -> resource.estimateBilling(null, request));
    }

    @Test
    void estimateBillingReturnsBreakdown() {
        OrcaAppointmentResource resource = new OrcaAppointmentResource();
        resource.setWrapperService(createService());

        BillingSimulationRequest request = new BillingSimulationRequest();
        request.setPatientId("000001");
        request.setDepartmentCode("01");
        request.setPerformDate(LocalDate.of(2025, 11, 12));
        BillingItem item = new BillingItem();
        item.setMedicalCode("D000");
        item.setQuantity(1);
        request.getItems().add(item);

        BillingSimulationResponse response = resource.estimateBilling(null, request);
        assertEquals(450, response.getTotalPoint());
        assertEquals(2, response.getBreakdown().size());
        assertNotNull(response.getPatient());
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
    }

    @Test
    void mutateAppointmentReturnsStubPayload() {
        OrcaAppointmentResource resource = new OrcaAppointmentResource();
        resource.setWrapperService(createService());

        AppointmentMutationRequest request = new AppointmentMutationRequest();
        request.setRequestNumber("01");
        request.setAppointmentDate("2025-11-20");
        request.setAppointmentTime("10:30:00");
        PatientSummary patient = new PatientSummary();
        patient.setPatientId("000001");
        patient.setWholeName("山田太郎");
        request.setPatient(patient);

        AppointmentMutationResponse response = resource.mutateAppointment(createRequest("F001:doctor01"), request);
        assertEquals("0000", response.getApiResult());
        assertEquals("正常終了", response.getApiResultMessage());
        assertEquals("AP-20251120-001", response.getAppointmentId());
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
                            return "/orca/appointments/mutation";
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
