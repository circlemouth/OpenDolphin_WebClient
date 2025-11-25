package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import jakarta.ws.rs.WebApplicationException;
import java.time.LocalDate;
import open.dolphin.orca.converter.OrcaXmlMapper;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.orca.transport.StubOrcaTransport;
import open.dolphin.rest.dto.orca.BillingSimulationRequest;
import open.dolphin.rest.dto.orca.BillingSimulationRequest.BillingItem;
import open.dolphin.rest.dto.orca.BillingSimulationResponse;
import open.dolphin.rest.dto.orca.OrcaAppointmentListRequest;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
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
        assertEquals(OrcaWrapperService.RUN_ID, response.getRunId());
        assertEquals(OrcaWrapperService.BLOCKER_TAG, response.getBlockerTag());
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
    }
}
