package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.*;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.*;
import open.dolphin.infomodel.AuditEvent;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.touch.session.IPhoneServiceBean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Tests for visit-related Touch endpoints implemented in {@link DolphinResource}.
 */
class DolphinResourceVisitTest {

    private DolphinResource resource;
    private StubIPhoneServiceBean service;
    private CapturingAuditTrailService auditService;
    private SimpleMeterRegistry meterRegistry;
    private SessionTraceManager traceManager;

    @BeforeEach
    void setUp() throws Exception {
        resource = new DolphinResource();
        service = new StubIPhoneServiceBean();
        auditService = new CapturingAuditTrailService();
        meterRegistry = new SimpleMeterRegistry();
        traceManager = new SessionTraceManager();

        injectField(resource, "iPhoneServiceBean", service);
        injectField(resource, "auditTrailService", auditService);
        injectField(resource, "sessionTraceManager", traceManager);
        injectField(resource, "meterRegistry", meterRegistry);
    }

    @Test
    void facilityMismatchThrowsForbidden() throws Exception {
        HttpServletRequest request = request("F001:doctor01", Set.of("TOUCH_PATIENT_VISIT"), Map.of("X-Request-Id", "RID-1"), "127.0.0.1");
        injectField(resource, "servletRequest", request);

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> resource.getPatientVisit(request, "F999", 0, 10, "pvtDate", "desc"));
        assertTrue(ex.getMessage().contains("施設"));
        assertFalse(service.patientVisitCalled, "Service should not be invoked on facility mismatch");
        assertEquals(1, auditService.payloads.size());
        assertEquals("施設突合失敗", auditService.payloads.get(0).getAction());
    }

    @Test
    void insufficientRoleThrowsForbidden() throws Exception {
        HttpServletRequest request = request("F001:staff01", Collections.emptySet(), Map.of("X-Request-Id", "RID-2"), "127.0.0.1");
        injectField(resource, "servletRequest", request);

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> resource.getFirstVisitors(request, "F001", 0, 10, "firstVisit", "desc"));
        assertTrue(ex.getMessage().contains("権限"));
        assertEquals(1, auditService.payloads.size());
        AuditEventPayload payload = auditService.payloads.get(0);
        assertEquals("来院履歴照会", payload.getAction());
        assertEquals("forbiddenRole", payload.getDetails().get("reason"));
    }

    @Test
    void limitOverThrowsBadRequest() throws Exception {
        HttpServletRequest request = request("F001:doctor01", Set.of("TOUCH_PATIENT_VISIT"), Map.of(), "127.0.0.1");
        injectField(resource, "servletRequest", request);

        assertThrows(BadRequestException.class, () ->
                resource.getPatientVisitRange(request, "F001", "2025-11-03T00:00:00", "2025-11-03T23:59:59", 0, 5001, "pvtDate", "desc"));
    }

    @Test
    void fallbackUsesPreviousDayData() throws Exception {
        PatientModel patient = patient("000010", "田中 太郎", "タナカ タロウ");
        PatientVisitModel fallbackVisit = visit(201L, "F001", "2025-11-02T09:00:00", patient, 0, "国保");
        service.fallbackVisits = List.of(fallbackVisit);

        HttpServletRequest request = request("F001:doctor01", Set.of("TOUCH_PATIENT_VISIT"), Map.of("X-Request-Id", "RID-3"), "127.0.0.1");
        injectField(resource, "servletRequest", request);

        String xml = resource.getPatientVisitLast(request, null, "2025-11-03T00:00:00", "2025-11-03T23:59:59", 10, "pvtDate", "desc", 6);

        assertTrue(xml.contains("2025-11-02T09:00:00"), "Fallback XML should include previous day visit");
        assertTrue(service.fallbackCalled, "Fallback search should be invoked");
        AuditEventPayload payload = auditService.payloads.get(auditService.payloads.size() - 1);
        assertEquals(Boolean.TRUE, payload.getDetails().get("fallbackApplied"));
    }

    @Test
    void firstVisitorsReturnsXml() throws Exception {
        KarteBean karte = karte("000001", "山田 花子", "ヤマダ ハナコ", new Date(1730688000000L));
        service.firstVisitors = List.of(karte);

        HttpServletRequest request = request("F001:doctor01", Set.of("TOUCH_PATIENT_VISIT"), Map.of("X-Request-Id", "RID-4"), "127.0.0.1");
        injectField(resource, "servletRequest", request);

        String xml = resource.getFirstVisitors(request, null, 0, 5, "firstVisit", "desc");

        assertTrue(xml.contains("000001"));
        assertTrue(xml.contains("山田 花子"));
        assertTrue(service.firstVisitorsCalled);
    }

    private HttpServletRequest request(String remoteUser, Set<String> roles, Map<String, String> headers, String remoteAddr) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "getRemoteUser" -> remoteUser;
                    case "isUserInRole" -> roles.contains(args[0]);
                    case "getHeader" -> headers.get(args[0]);
                    case "getRemoteAddr" -> remoteAddr;
                    default -> null;
                });
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static PatientModel patient(String patientId, String name, String kana) {
        PatientModel patient = new PatientModel();
        patient.setId(10L);
        patient.setPatientId(patientId);
        patient.setFullName(name);
        patient.setKanaName(kana);
        patient.setGender("M");
        patient.setBirthday("1980-01-01");
        return patient;
    }

    private static KarteBean karte(String patientId, String name, String kana, Date created) {
        KarteBean karte = new KarteBean();
        PatientModel patient = patient(patientId, name, kana);
        karte.setPatientModel(patient);
        karte.setCreated(created);
        return karte;
    }

    private static PatientVisitModel visit(long id, String facilityId, String pvtDate, PatientModel patient, int state, String insurance) {
        PatientVisitModel visit = new PatientVisitModel();
        visit.setId(id);
        visit.setFacilityId(facilityId);
        visit.setPvtDate(pvtDate);
        visit.setPatientModel(patient);
        visit.setState(state);
        visit.setFirstInsurance(insurance);
        return visit;
    }

    private static class StubIPhoneServiceBean extends IPhoneServiceBean {
        List<KarteBean> firstVisitors = new ArrayList<>();
        List<PatientVisitModel> patientVisits = new ArrayList<>();
        List<PatientVisitModel> rangeVisits = new ArrayList<>();
        List<PatientVisitModel> fallbackVisits = new ArrayList<>();
        boolean firstVisitorsCalled;
        boolean patientVisitCalled;
        boolean fallbackCalled;

        @Override
        public List<KarteBean> getFirstVisitors(String facilityId, int firstResult, int maxResult, FirstVisitorOrder order, boolean descending) {
            firstVisitorsCalled = true;
            return firstVisitors;
        }

        @Override
        public List<PatientVisitModel> getPatientVisit(String facilityId, int firstResult, int maxResult, VisitOrder order, boolean descending) {
            patientVisitCalled = true;
            return patientVisits;
        }

        @Override
        public List<PatientVisitModel> getPatientVisitRange(String facilityId, String start, String end, int firstResult, int maxResult, VisitOrder order, boolean descending) {
            return rangeVisits;
        }

        @Override
        public List<PatientVisitModel> getPatientVisitWithFallback(String facilityId, String start, String end, int maxResult, int fallbackDays, VisitOrder order, boolean descending) {
            fallbackCalled = true;
            return fallbackVisits;
        }
    }

    private static class CapturingAuditTrailService extends AuditTrailService {
        final List<AuditEventPayload> payloads = new ArrayList<>();

        @Override
        public AuditEvent record(AuditEventPayload payload) {
            payloads.add(payload);
            return null;
        }
    }
}
