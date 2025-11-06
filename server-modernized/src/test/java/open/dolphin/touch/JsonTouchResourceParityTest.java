package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.StreamingOutput;
import java.beans.XMLEncoder;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.logging.Handler;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import open.dolphin.converter.StringListConverter;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.adm10.session.ADM10_EHTServiceBean;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.DrugInteractionModel;
import open.dolphin.infomodel.IStampTreeModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.infomodel.StampTreeModel;
import open.dolphin.infomodel.TextStampModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;

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
    private TestLogHandler auditHandler;
    private StubAdm10EhtService ehtService;

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

        ehtService = new StubAdm10EhtService();
        injectField(adm10Resource, "ehtService", ehtService);

        servletRequest = (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> "getRemoteUser".equals(method.getName()) ? REMOTE_USER : null);

        auditHandler = new TestLogHandler();
        Logger auditLogger = Logger.getLogger("open.dolphin.audit.JsonTouch");
        auditLogger.addHandler(auditHandler);
    }

    @AfterEach
    void tearDown() {
        Logger auditLogger = Logger.getLogger("open.dolphin.audit.JsonTouch");
        auditLogger.removeHandler(auditHandler);
    }

    @Test
    void userParity() {
        UserModelConverter touch = touchResource.getUserById("doctor01");
        UserModelConverter adm10 = adm10Resource.getUserById("doctor01");
        UserModelConverter adm20 = adm20Resource.getUserById("doctor01");

        assertEquals(touch.getUserId(), adm10.getUserId());
        assertEquals(touch.getUserId(), adm20.getUserId());
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

    @Test
    void documentSubmissionParity() throws Exception {
        auditHandler.clear();
        String payload = createDocumentPayload();
        String touchResponse = touchResource.postDocument(payload);
        String adm10Response = adm10Resource.postDocument(payload);

        assertEquals(touchResponse, adm10Response);
        assertTrue(auditHandler.containsSuccess("POST /jtouch/document"));
        assertTrue(auditHandler.containsSuccess("POST /10/adm/jtouch/document"));
    }

    @Test
    void documentSubmissionFailureParity() throws Exception {
        sharedService.setFailOnSaveDocument(true);
        auditHandler.clear();
        String payload = createDocumentPayload();

        assertThrows(WebApplicationException.class, () -> touchResource.postDocument(payload));
        assertThrows(WebApplicationException.class, () -> adm10Resource.postDocument(payload));
        assertTrue(auditHandler.containsFailure("POST /jtouch/document"));
        assertTrue(auditHandler.containsFailure("POST /10/adm/jtouch/document"));
        sharedService.setFailOnSaveDocument(false);
    }

    @Test
    void mkDocumentParity() throws Exception {
        auditHandler.clear();
        String payload = createMkDocumentPayload();
        String touchResponse = touchResource.postMkDocument(payload);
        String adm10Response = adm10Resource.postMkDocument(payload);

        assertEquals(touchResponse, adm10Response);
        assertTrue(auditHandler.containsSuccess("POST /jtouch/mkdocument"));
        assertTrue(auditHandler.containsSuccess("POST /10/adm/jtouch/mkdocument"));
    }

    @Test
    void interactionStreamSuccess() throws Exception {
        auditHandler.clear();
        setInteractionExecutor(sql -> List.of(new DrugInteractionModel("111", "222", "SYM", "desc")));
        String payload = "{\"codes1\":[\"111\"],\"codes2\":[\"222\"]}";

        String body = readOutput(adm10Resource.checkInteraction(payload));

        assertTrue(body.contains("drugcd"));
        assertTrue(auditHandler.containsSuccess("PUT /10/adm/jtouch/interaction"));
    }

    @Test
    void interactionStreamFailure() throws Exception {
        setInteractionExecutor(sql -> {
            throw new java.sql.SQLException("simulated");
        });
        auditHandler.clear();
        String payload = "{\"codes1\":[\"111\"],\"codes2\":[\"222\"]}";

        assertThrows(WebApplicationException.class, () -> readOutput(adm10Resource.checkInteraction(payload)));
        assertTrue(auditHandler.containsFailure("PUT /10/adm/jtouch/interaction"));
    }

    @Test
    void stampTreeStreamSuccess() throws Exception {
        auditHandler.clear();
        ehtService.setTreeModel(createStampTreeModel());

        String body = readOutput(adm10Resource.getStampTree("1"));

        assertTrue(body.contains("stampTreeList"));
        assertTrue(auditHandler.containsSuccess("GET /10/adm/jtouch/stampTree"));
    }

    @Test
    void stampTreeStreamFailure() {
        ehtService.setFailTree(true);
        auditHandler.clear();

        assertThrows(WebApplicationException.class, () -> readOutput(adm10Resource.getStampTree("1")));
        assertTrue(auditHandler.containsFailure("GET /10/adm/jtouch/stampTree"));
    }

    @Test
    void stampRetrievalSuccess() throws Exception {
        ehtService.setStampModel(createStampModel());
        auditHandler.clear();

        String body = readOutput(adm10Resource.getStamp("stamp-1"));

        assertFalse(body.isEmpty());
        assertTrue(auditHandler.containsSuccess("GET /10/adm/jtouch/stamp"));
    }

    @Test
    void stampRetrievalFailure() {
        ehtService.setFailStamp(true);
        auditHandler.clear();

        assertThrows(WebApplicationException.class, () -> readOutput(adm10Resource.getStamp("stamp-1")));
        assertTrue(auditHandler.containsFailure("GET /10/adm/jtouch/stamp"));
    }

    private static void injectField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private void setInteractionExecutor(SqlExecutor executor) throws Exception {
        Field field = adm10Resource.getClass().getDeclaredField("interactionExecutor");
        field.setAccessible(true);
        Class<?> executorType = field.getType();
        Object proxy = Proxy.newProxyInstance(
                executorType.getClassLoader(),
                new Class[]{executorType},
                (proxyInstance, method, args) -> {
                    if ("execute".equals(method.getName())) {
                        return executor.execute((String) args[0]);
                    }
                    throw new UnsupportedOperationException(method.getName());
                });
        field.set(adm10Resource, proxy);
    }

    @FunctionalInterface
    private interface SqlExecutor {
        List<DrugInteractionModel> execute(String sql) throws Exception;
    }

    private String createDocumentPayload() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        open.dolphin.touch.converter.IDocument document = new open.dolphin.touch.converter.IDocument();
        document.setId(1L);
        return mapper.writeValueAsString(document);
    }

    private String createMkDocumentPayload() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        open.dolphin.touch.converter.IMKDocument document = new open.dolphin.touch.converter.IMKDocument();
        document.getDocument().setId(2L);
        return mapper.writeValueAsString(document);
    }

    private String readOutput(StreamingOutput output) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        output.write(baos);
        return baos.toString(StandardCharsets.UTF_8);
    }

    private IStampTreeModel createStampTreeModel() {
        StampTreeModel model = new StampTreeModel();
        String xml = "<stampBox><stampTree name=\"diagnosis\" entity=\"diagnosis\"><root name=\"Root\" entity=\"diagnosis\"><stampInfo name=\"Test\" role=\"role\" entity=\"entity\" editable=\"true\" memo=\"memo\" stampId=\"stamp-1\"/></root></stampTree></stampBox>";
        model.setTreeBytes(xml.getBytes(StandardCharsets.UTF_8));
        return model;
    }

    private StampModel createStampModel() {
        TextStampModel text = new TextStampModel();
        text.setText("sample");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (XMLEncoder encoder = new XMLEncoder(baos)) {
            encoder.writeObject(text);
        }
        StampModel stamp = new StampModel();
        stamp.setStampBytes(baos.toByteArray());
        return stamp;
    }

    private static class TestLogHandler extends Handler {
        private final List<LogRecord> records = new ArrayList<>();

        @Override
        public void publish(LogRecord record) {
            records.add(record);
        }

        @Override
        public void flush() {
        }

        @Override
        public void close() throws SecurityException {
            records.clear();
        }

        void clear() {
            records.clear();
        }

        boolean containsSuccess(String endpoint) {
            return contains(endpoint, "event=success");
        }

        boolean containsFailure(String endpoint) {
            return contains(endpoint, "event=failure");
        }

        private boolean contains(String endpoint, String token) {
            return records.stream().anyMatch(r -> r.getMessage().contains(endpoint) && r.getMessage().contains(token));
        }
    }

    private static class StubJsonTouchSharedService extends JsonTouchSharedService {
        private PatientModelSnapshot snapshot;
        private List<PatientModel> patientList = Collections.emptyList();
        private int patientCount;
        private List<String> kanaList = Collections.emptyList();
        private VisitPackage visitPackage = new VisitPackage();
        private UserModelConverter userConverter = new UserModelConverter();
        private long nextDocumentPk = 99L;
        private boolean failOnSaveDocument;

        void setUserConverter(UserModelConverter converter) {
            this.userConverter = converter;
        }

        void setNextDocumentPk(long nextDocumentPk) {
            this.nextDocumentPk = nextDocumentPk;
        }

        void setFailOnSaveDocument(boolean failOnSaveDocument) {
            this.failOnSaveDocument = failOnSaveDocument;
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
        public long saveDocument(DocumentModel model) {
            if (failOnSaveDocument) {
                throw new IllegalStateException("save failed");
            }
            return nextDocumentPk;
        }

        @Override
        public long processSendPackage(open.dolphin.touch.converter.ISendPackage pkg) {
            return processSendPackageElements(
                    pkg != null ? pkg.documentModel() : null,
                    pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                    pkg != null ? pkg.deletedDiagnsis() : null,
                    pkg != null ? pkg.chartEventModel() : null);
        }

        @Override
        public long processSendPackage2(open.dolphin.touch.converter.ISendPackage2 pkg) {
            return processSendPackageElements(
                    pkg != null ? pkg.documentModel() : null,
                    pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                    pkg != null ? pkg.deletedDiagnsis() : null,
                    pkg != null ? pkg.chartEventModel() : null);
        }

        @Override
        public long processSendPackageElements(DocumentModel model, DiagnosisSendWrapper wrapper, List<String> deletedDiagnosis, ChartEventModel chartEvent) {
            return 99L;
        }
    }

    private static class StubAdm10EhtService extends ADM10_EHTServiceBean {
        private IStampTreeModel treeModel;
        private StampModel stampModel;
        private boolean failTree;
        private boolean failStamp;

        void setTreeModel(IStampTreeModel treeModel) {
            this.treeModel = treeModel;
        }

        void setStampModel(StampModel stampModel) {
            this.stampModel = stampModel;
        }

        void setFailTree(boolean failTree) {
            this.failTree = failTree;
        }

        void setFailStamp(boolean failStamp) {
            this.failStamp = failStamp;
        }

        @Override
        public IStampTreeModel getTrees(long userPK) {
            if (failTree) {
                throw new IllegalStateException("tree failure");
            }
            return treeModel;
        }

        @Override
        public StampModel getStamp(String stampId) {
            if (failStamp) {
                throw new IllegalStateException("stamp failure");
            }
            return stampModel;
        }
    }
}
