package open.dolphin.adm20.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import open.dolphin.adm20.converter.IChartEvent;
import open.dolphin.adm20.converter.IPhysicalModel;
import open.dolphin.adm20.converter.ISendPackage;
import open.dolphin.adm20.converter.IVitalModel;
import open.dolphin.adm20.session.ADM20_EHTServiceBean;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.VitalModel;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.ChartEventServiceBean;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.framework.SessionTraceManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class EHTResourceTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private EHTResource resource;
    private ADM20_EHTServiceBean ehtService;
    private KarteServiceBean karteService;
    private ChartEventServiceBean eventService;
    private AuditTrailService auditTrailService;
    private SessionTraceManager sessionTraceManager;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() throws Exception {
        resource = new EHTResource();
        ehtService = mock(ADM20_EHTServiceBean.class);
        karteService = mock(KarteServiceBean.class);
        eventService = mock(ChartEventServiceBean.class);
        auditTrailService = mock(AuditTrailService.class);
        sessionTraceManager = new SessionTraceManager();
        sessionTraceManager.start("test", Map.of());
        request = mock(HttpServletRequest.class);

        when(request.getRemoteUser()).thenReturn("facility01:doctor01");
        when(request.getHeader("X-Request-Id")).thenReturn("req-123");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(request.getHeader("User-Agent")).thenReturn("JUnit");

        setField(resource, "ehtService", ehtService);
        setField(resource, "karteService", karteService);
        setField(resource, "eventServiceBean", eventService);
        setField(resource, "auditTrailService", auditTrailService);
        setField(resource, "sessionTraceManager", sessionTraceManager);
        setField(resource, "servletReq", request);
    }

    @AfterEach
    void tearDown() {
        sessionTraceManager.clear();
        clearInvocations(auditTrailService);
    }

    @Test
    void postVitalRecordsAudit() throws Exception {
        doAnswer(invocation -> {
            VitalModel model = invocation.getArgument(0);
            model.setId(99L);
            return 1;
        }).when(ehtService).addVital(any(VitalModel.class));

        IVitalModel vital = new IVitalModel();
        vital.setFacilityPatId("facility01:patient99");
        vital.setKarteID("555");
        vital.setBodyTemperature("36.5");
        vital.setDate("2025-10-30");
        vital.setTime("08:15:00");
        String json = mapper.writeValueAsString(vital);

        StreamingOutput output = resource.postVital(json);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        output.write(baos);

        assertThat(baos.toString(StandardCharsets.UTF_8)).isEqualTo("\"1\"");
        verify(ehtService, times(1)).addVital(any(VitalModel.class));

        ArgumentCaptor<AuditEventPayload> payloadCaptor = ArgumentCaptor.forClass(AuditEventPayload.class);
        verify(auditTrailService, times(1)).record(payloadCaptor.capture());
        AuditEventPayload payload = payloadCaptor.getValue();
        assertThat(payload.getAction()).isEqualTo("EHT_VITAL_CREATE");
        assertThat(payload.getPatientId()).isEqualTo("patient99");
        assertThat(payload.getResource()).isEqualTo("/20/adm/eht/vital");
        assertThat(payload.getDetails()).containsEntry("vitalId", 99L);
    }

    @Test
    void postPhysicalCreatesObservationsAndLogsAudit() throws Exception {
        when(ehtService.addObservations(anyList())).thenReturn(Arrays.asList(10L, 11L));

        IPhysicalModel physical = new IPhysicalModel();
        physical.setKartePK(321L);
        physical.setUserPK(42L);
        physical.setHeight("170");
        physical.setWeight("60");
        physical.setIdentifiedDate("2025-10-29");
        physical.setMemo("2025-10-29");
        String json = mapper.writeValueAsString(physical);

        StreamingOutput output = resource.postPhysical(json);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        output.write(baos);

        assertThat(baos.toString(StandardCharsets.UTF_8)).isEqualTo("\"2\"");
        verify(ehtService, times(1)).addObservations(anyList());

        ArgumentCaptor<AuditEventPayload> payloadCaptor = ArgumentCaptor.forClass(AuditEventPayload.class);
        verify(auditTrailService, times(1)).record(payloadCaptor.capture());
        AuditEventPayload payload = payloadCaptor.getValue();
        assertThat(payload.getAction()).isEqualTo("EHT_PHYSICAL_CREATE");
        assertThat(payload.getPatientId()).isEqualTo("321");
        assertThat(payload.getDetails()).containsKey("observationIds");
    }

    @Test
    void sendClaimWithoutDocumentLogsChartEvent() throws Exception {
        ISendPackage pkg = new ISendPackage();
        IChartEvent chartEvent = new IChartEvent();
        chartEvent.setEventType(1);
        chartEvent.setFacilityId("facility01");
        chartEvent.setPtPk(777L);
        pkg.setChartEvent(chartEvent);
        String json = mapper.writeValueAsString(pkg);

        StreamingOutput output = resource.sendPackage(json);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        output.write(baos);

        assertThat(baos.toByteArray()).hasSize(1);
        verify(eventService, times(1)).processChartEvent(any(ChartEventModel.class));
        verifyNoInteractions(karteService);

        ArgumentCaptor<AuditEventPayload> payloadCaptor = ArgumentCaptor.forClass(AuditEventPayload.class);
        verify(auditTrailService, times(1)).record(payloadCaptor.capture());
        AuditEventPayload payload = payloadCaptor.getValue();
        assertThat(payload.getAction()).isEqualTo("EHT_CLAIM_SEND");
        assertThat(payload.getPatientId()).isEqualTo("777");
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
