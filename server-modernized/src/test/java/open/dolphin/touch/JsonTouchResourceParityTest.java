package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.Collections;
import java.util.List;
import open.dolphin.converter.StringListConverter;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Ensures the JsonTouch endpoints served from different base paths share the same behaviour.
 */
class JsonTouchResourceParityTest {

    private static final String REMOTE_USER = "F001:doctor01";

    private StubJsonTouchSharedService sharedService;
    private JsonTouchResource touchResource;
    private open.dolphin.adm10.rest.JsonTouchResource adm10Resource;
    private open.dolphin.adm20.rest.JsonTouchResource adm20Resource;
    private HttpServletRequest servletRequest;

    @BeforeEach
    void setUp() throws Exception {
        sharedService = new StubJsonTouchSharedService();
        PatientModel patient = new PatientModel();
        patient.setId(10L);
        patient.setPatientId("000010");
        patient.setFacilityId("F001");
        patient.setFullName("田中 太郎");
        patient.setKanaName("タナカ タロウ");

        VisitPackage visit = new VisitPackage();
        visit.setNumber("F001JPN000000000000");
        visit.setKartePk(12345L);
        visit.setPatientModel(patient);

        UserModel user = new UserModel();
        user.setUserId("doctor01");
        UserModelConverter converter = new UserModelConverter();
        converter.setModel(user);

        sharedService.snapshot = JsonTouchSharedService.snapshot(patient, 12345L);
        sharedService.patientList = Collections.singletonList(patient);
        sharedService.patientCount = 42;
        sharedService.kanaList = Collections.singletonList("タナカ タロウ");
        sharedService.visitPackage = visit;
        sharedService.setUserConverter(converter);

        touchResource = new JsonTouchResource();
        adm10Resource = new open.dolphin.adm10.rest.JsonTouchResource();
        adm20Resource = new open.dolphin.adm20.rest.JsonTouchResource();

        injectField(touchResource, "sharedService", sharedService);
        injectField(adm10Resource, "sharedService", sharedService);
        injectField(adm20Resource, "sharedService", sharedService);

        servletRequest = (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> "getRemoteUser".equals(method.getName()) ? REMOTE_USER : null);
    }

    @Test
    void userParity() {
        UserModelConverter touch = touchResource.getUserById("doctor01");
        UserModelConverter adm10 = adm10Resource.getUserById("doctor01");
        UserModelConverter adm20 = adm20Resource.getUserById("doctor01");

        assertEquals(touch.getModel().getUserId(), adm10.getModel().getUserId());
        assertEquals(touch.getModel().getUserId(), adm20.getModel().getUserId());
    }

    @Test
    void patientDetailParity() {
        IPatientModel touch = touchResource.getPatientById(servletRequest, "000010");
        open.dolphin.adm10.converter.IPatientModel adm10 = adm10Resource.getPatientById(servletRequest, "000010");
        open.dolphin.adm20.converter.IPatientModel adm20 = adm20Resource.getPatientById(servletRequest, "000010");

        assertEquals(touch.getPatientId(), adm10.getPatientId());
        assertEquals(touch.getPatientId(), adm20.getPatientId());
        assertEquals(touch.getKartePK(), adm10.getKartePK());
        assertEquals(touch.getKartePK(), adm20.getKartePK());
    }

    @Test
    void patientSearchParity() {
        IPatientList touchList = touchResource.getPatientsByNameOrId(servletRequest, "tanaka,0,10");
        open.dolphin.adm10.converter.IPatientList adm10List = adm10Resource.getPatientsByNameOrId(servletRequest, "tanaka,0,10");
        open.dolphin.adm20.converter.IPatientList adm20List = adm20Resource.getPatientsByNameOrId(servletRequest, "tanaka,0,10");

        assertNotNull(touchList.getList());
        assertEquals(touchList.getList().get(0).getPatientId(), adm10List.getList().get(0).getPatientId());
        assertEquals(touchList.getList().get(0).getPatientId(), adm20List.getList().get(0).getPatientId());
    }

    @Test
    void patientCountParity() {
        String touchCount = touchResource.getPatientCount(servletRequest);
        String adm10Count = adm10Resource.getPatientCount(servletRequest);
        String adm20Count = adm20Resource.getPatientCount(servletRequest);

        assertEquals("42", touchCount);
        assertEquals(touchCount, adm10Count);
        assertEquals(touchCount, adm20Count);
    }

    @Test
    void patientKanaParity() {
        StringListConverter touchKana = touchResource.getPatientsWithKana(servletRequest, "0,10");
        StringListConverter adm10Kana = adm10Resource.getPatientsWithKana(servletRequest, "0,10");
        StringListConverter adm20Kana = adm20Resource.getPatientsWithKana(servletRequest, "0,10");

        assertEquals(touchKana.getList(), adm10Kana.getList());
        assertEquals(touchKana.getList(), adm20Kana.getList());
    }

    @Test
    void visitPackageParity() {
        open.dolphin.touch.converter.IVisitPackage touchVisit = touchResource.getVisitPackage("1,2,3,1");
        open.dolphin.adm10.converter.IVisitPackage adm10Visit = adm10Resource.getVisitPackage("1,2,3,1");
        open.dolphin.adm20.converter.IVisitPackage adm20Visit = adm20Resource.getVisitPackage("1,2,3,1");

        assertEquals(touchVisit.getNumber(), adm10Visit.getNumber());
        assertEquals(touchVisit.getNumber(), adm20Visit.getNumber());
    }

    @Test
    void sendPackageParity() throws IOException {
        String payload = "{}";
        String touchResponse = touchResource.postSendPackage(payload);
        String adm10Response = adm10Resource.postSendPackage(payload);
        String adm20Response = adm20Resource.postSendPackage(payload);

        assertEquals("99", touchResponse);
        assertEquals(touchResponse, adm10Response);
        assertEquals(touchResponse, adm20Response);
    }

    @Test
    void sendPackage2Parity() throws IOException {
        String payload = "{}";
        String touchResponse = touchResource.postSendPackage2(payload);
        String adm10Response = adm10Resource.postSendPackage2(payload);
        String adm20Response = adm20Resource.postSendPackage2(payload);

        assertEquals("99", touchResponse);
        assertEquals(touchResponse, adm10Response);
        assertEquals(touchResponse, adm20Response);
    }

    private static void injectField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static class StubJsonTouchSharedService extends JsonTouchSharedService {
        private PatientModelSnapshot snapshot;
        private List<PatientModel> patientList = Collections.emptyList();
        private int patientCount;
        private List<String> kanaList = Collections.emptyList();
        private VisitPackage visitPackage = new VisitPackage();
        private UserModelConverter userConverter = new UserModelConverter();

        void setUserConverter(UserModelConverter converter) {
            this.userConverter = converter;
        }

        @Override
        public UserModelConverter getUserById(String uid) {
            return userConverter;
        }

        @Override
        public PatientModelSnapshot getPatientSnapshot(String facilityId, String pid) {
            return snapshot;
        }

        @Override
        public List<PatientModel> getPatientsByNameOrId(String facilityId, String name, int firstResult, int maxResult) {
            return patientList;
        }

        @Override
        public int countPatients(String facilityId) {
            return patientCount;
        }

        @Override
        public List<String> getPatientsWithKana(String facilityId, int first, int max) {
            return kanaList;
        }

        @Override
        public VisitPackage getVisitPackage(long pvtPK, long patientPK, long docPK, int mode) {
            return visitPackage;
        }

        @Override
        public long processSendPackageElements(DocumentModel model, DiagnosisSendWrapper wrapper, List<String> deletedDiagnosis, ChartEventModel chartEvent) {
            return 99L;
        }
    }
}
