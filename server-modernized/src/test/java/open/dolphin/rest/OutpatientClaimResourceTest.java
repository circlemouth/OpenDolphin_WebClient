package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import java.util.Date;
import java.util.List;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.rest.dto.outpatient.ClaimOutpatientResponse;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PVTServiceBean;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import open.dolphin.touch.converter.IOSHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Contract tests for {@link OutpatientClaimResource}.
 */
class OutpatientClaimResourceTest extends RuntimeDelegateTestSupport {

    private OutpatientClaimResource resource;
    private RecordingSessionAuditDispatcher auditDispatcher;
    private HttpServletRequest servletRequest;

    @BeforeEach
    void setUp() throws Exception {
        resource = new OutpatientClaimResource();
        auditDispatcher = new RecordingSessionAuditDispatcher();
        injectField(resource, "sessionAuditDispatcher", auditDispatcher);
        injectField(resource, "pvtServiceBean", new FakePVTServiceBean());
        injectField(resource, "karteServiceBean", new FakeKarteServiceBean());

        servletRequest = (HttpServletRequest)
                Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{HttpServletRequest.class}, (proxy, method, args) -> {
                    String name = method.getName();
                    if ("getRemoteUser".equals(name)) {
                        return "F001:doctor01";
                    }
                    if ("getRemoteAddr".equals(name)) {
                        return "127.0.0.1";
                    }
                    if ("getHeader".equals(name) && args != null && args.length == 1) {
                        String header = String.valueOf(args[0]);
                        return switch (header) {
                            case "X-Request-Id" -> "req-outpatient-claim";
                            case "X-Trace-Id" -> "trace-outpatient-claim";
                            case "X-Run-Id" -> "20251225T040041Z";
                            case "User-Agent" -> "JUnit";
                            default -> null;
                        };
                    }
                    return null;
                });
    }

    @Test
    void postOutpatientClaim_returnsTelemetryAndAudit() {
        ClaimOutpatientResponse response = resource.postOutpatientClaim(servletRequest, null);

        assertNotNull(response);
        assertEquals("20251225T040041Z", response.getRunId());
        assertFalse(response.isCacheHit());
        assertFalse(response.isMissingMaster());
        assertEquals(1, response.getRecordsReturned());
        assertEquals("server", response.getDataSourceTransition());
        assertEquals("会計済み", response.getClaimStatus());
        assertEquals(1, response.getClaimBundles().size());

        OutpatientFlagResponse.AuditEvent auditEvent = response.getAuditEvent();
        assertNotNull(auditEvent, "Audit event should be present");
        assertEquals("ORCA_CLAIM_OUTPATIENT", auditEvent.getAction());
        assertEquals("/api01rv2/claim/outpatient", auditEvent.getResource());
        assertEquals("SUCCESS", auditEvent.getOutcome());
        assertEquals("trace-outpatient-claim", auditEvent.getTraceId());
        assertEquals("req-outpatient-claim", auditEvent.getRequestId());

        Map<String, Object> details = auditEvent.getDetails();
        assertEquals("F001", details.get("facilityId"));
        assertEquals("resolve_master", details.get("telemetryFunnelStage"));
        assertEquals(1, details.get("recordsReturned"));

        assertNotNull(auditDispatcher.payload, "Audit dispatcher should receive payload");
        assertEquals("ORCA_CLAIM_OUTPATIENT", auditDispatcher.payload.getAction());
        assertEquals("/api01rv2/claim/outpatient", auditDispatcher.payload.getResource());
        assertEquals("F001:doctor01", auditDispatcher.payload.getActorId());
        assertEquals("trace-outpatient-claim", auditDispatcher.payload.getTraceId());
        assertEquals("req-outpatient-claim", auditDispatcher.payload.getRequestId());
        assertEquals(AuditEventEnvelope.Outcome.SUCCESS, auditDispatcher.outcome);
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static final class RecordingSessionAuditDispatcher extends SessionAuditDispatcher {
        private AuditEventPayload payload;
        private AuditEventEnvelope.Outcome outcome;

        @Override
        public AuditEventEnvelope record(AuditEventPayload payload, AuditEventEnvelope.Outcome overrideOutcome,
                String errorCode, String errorMessage) {
            this.payload = payload;
            this.outcome = overrideOutcome;
            return null;
        }
    }

    private static final class FakePVTServiceBean extends PVTServiceBean {
        @Override
        public List<PatientVisitModel> getPvt(String fid, String date, int firstResult, String appoDateFrom, String appoDateTo) {
            PatientModel patient = new PatientModel();
            patient.setPatientId("00001");
            patient.setFullName("テスト患者");
            patient.setKanaName("テスト");
            patient.setBirthday("1990-01-01");
            patient.setGender("M");

            PatientVisitModel visit = new PatientVisitModel();
            visit.setId(101L);
            visit.setFacilityId(fid);
            visit.setPatientModel(patient);
            visit.setPvtDate(date + " 10:00:00");
            visit.setStateBit(PatientVisitModel.BIT_SAVE_CLAIM, true);
            return List.of(visit);
        }
    }

    private static final class FakeKarteServiceBean extends KarteServiceBean {
        @Override
        public KarteBean getKarte(String facilityId, String patientId, Date fromDate) {
            KarteBean karte = new KarteBean();
            karte.setId(10L);
            return karte;
        }

        @Override
        public List<DocInfoModel> getDocumentList(long karteId, Date fromDate, boolean includeModifid) {
            DocInfoModel info = new DocInfoModel();
            info.setDocPk(1L);
            info.setConfirmDate(new Date());
            return List.of(info);
        }

        @Override
        public List<DocumentModel> getDocuments(List<Long> ids) {
            BundleDolphin bundle = new BundleDolphin();
            bundle.setBundleNumber("1");
            bundle.setClassCode("110");
            ClaimItem item = new ClaimItem();
            item.setName("再診料");
            item.setCode("110001");
            item.setNumber("1");
            item.setUnit("回");
            bundle.setClaimItem(new ClaimItem[]{item});

            ModuleInfoBean info = new ModuleInfoBean();
            info.setEntity(IInfoModel.ENTITY_MED_ORDER);
            ModuleModel module = new ModuleModel();
            module.setModuleInfoBean(info);
            module.setBeanBytes(IOSHelper.toXMLBytes(bundle));

            DocumentModel document = new DocumentModel();
            document.setStarted(new Date());
            document.setModules(List.of(module));
            return List.of(document);
        }
    }
}
