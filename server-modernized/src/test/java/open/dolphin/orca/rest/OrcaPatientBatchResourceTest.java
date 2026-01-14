package open.dolphin.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import jakarta.ws.rs.WebApplicationException;
import java.time.LocalDate;
import open.dolphin.orca.converter.OrcaXmlMapper;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.orca.transport.StubOrcaTransport;
import open.dolphin.rest.dto.orca.FormerNameHistoryRequest;
import open.dolphin.rest.dto.orca.FormerNameHistoryResponse;
import open.dolphin.rest.dto.orca.PatientBatchRequest;
import open.dolphin.rest.dto.orca.PatientBatchResponse;
import open.dolphin.rest.dto.orca.PatientIdListRequest;
import open.dolphin.rest.dto.orca.PatientIdListResponse;
import open.dolphin.rest.dto.orca.PatientNameSearchRequest;
import org.junit.jupiter.api.Test;

class OrcaPatientBatchResourceTest {

    private OrcaWrapperService createService() {
        return new OrcaWrapperService(new StubOrcaTransport(), new OrcaXmlMapper());
    }

    @Test
    void patientIdListRequiresDates() {
        OrcaPatientBatchResource resource = new OrcaPatientBatchResource();
        resource.setWrapperService(createService());
        assertThrows(WebApplicationException.class, () -> resource.patientIdList(null, new PatientIdListRequest()));
    }

    @Test
    void patientBatchReturnsTwoPatients() {
        OrcaPatientBatchResource resource = new OrcaPatientBatchResource();
        resource.setWrapperService(createService());

        PatientBatchRequest request = new PatientBatchRequest();
        request.getPatientIds().add("000001");
        request.getPatientIds().add("000002");

        PatientBatchResponse response = resource.patientBatch(null, request);
        assertEquals(2, response.getPatients().size());
        assertEquals(OrcaWrapperService.RUN_ID, response.getRunId());
    }

    @Test
    void patientSearchRequiresNameOrKana() {
        OrcaPatientBatchResource resource = new OrcaPatientBatchResource();
        resource.setWrapperService(createService());
        PatientNameSearchRequest request = new PatientNameSearchRequest();
        assertThrows(WebApplicationException.class, () -> resource.patientSearch(null, request));
    }

    @Test
    void formerNamesReturnsHistory() {
        OrcaPatientBatchResource resource = new OrcaPatientBatchResource();
        resource.setWrapperService(createService());
        FormerNameHistoryRequest request = new FormerNameHistoryRequest();
        request.setPatientId("000020");

        FormerNameHistoryResponse response = resource.formerNames(null, request);
        assertEquals(2, response.getFormerNames().size());
    }

    @Test
    void patientIdListReturnsTargetCount() {
        OrcaPatientBatchResource resource = new OrcaPatientBatchResource();
        resource.setWrapperService(createService());
        PatientIdListRequest request = new PatientIdListRequest();
        request.setStartDate(LocalDate.of(2025, 11, 1));
        request.setEndDate(LocalDate.of(2025, 11, 15));

        PatientIdListResponse response = resource.patientIdList(null, request);
        assertEquals(2, response.getTargetPatientCount());
    }
}
