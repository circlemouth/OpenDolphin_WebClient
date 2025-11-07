package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.touch.converter.IDocument;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class DolphinResourceDocumentTest extends RuntimeDelegateTestSupport {

    private static final String REMOTE_USER = "F001:doctor01";

    private DolphinResource resource;
    private StubIPhoneServiceBean phoneService;
    private StubKarteService karteService;

    @BeforeEach
    void setUp() throws Exception {
        resource = new DolphinResource();
        phoneService = new StubIPhoneServiceBean();
        karteService = new StubKarteService();

        injectField(resource, "iPhoneServiceBean", phoneService);
        injectField(resource, "karteService", karteService);
        injectField(resource, "servletRequest", createServletRequest(REMOTE_USER));
    }

    @Test
    void getProgressCourseSuccess() {
        long patientPk = 10L;
        phoneService.patient = patient(patientPk, "F001");
        phoneService.documentCount = 1L;
        phoneService.documents = List.of(document(200L));

        var response = resource.getProgressCource(patientPk + ",0,5");
        assertNotNull(response);
        assertNotNull(response.getPageInfo());
        assertEquals(1, response.getPageInfo().getNumRecords());
        assertEquals(1, response.getDocuments().size());
        assertEquals(200L, response.getDocuments().get(0).getDocumentPk());
        assertTrue(response.getDocuments().get(0).getOrders().isEmpty());
        assertTrue(response.getDocuments().get(0).getSchemas().isEmpty());
    }

    @Test
    void postDocumentSuccess() throws Exception {
        DocumentModel model = document(300L);
        model.setKarte(karte(patient(11L, "F001")));
        StubObjectMapper mapper = new StubObjectMapper(newPayload(model));
        injectField(resource, "objectMapper", mapper);

        String result = resource.postDocument("{}");

        assertEquals("99", result);
        assertSame(model, karteService.lastSaved);
    }

    @Test
    void postDocumentFacilityMismatch() throws Exception {
        DocumentModel model = document(400L);
        PatientModel patient = patient(12L, "F002");
        model.setKarte(karte(patient));
        StubObjectMapper mapper = new StubObjectMapper(newPayload(model));
        injectField(resource, "objectMapper", mapper);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> resource.postDocument("{}"));

        assertEquals(403, ex.getResponse().getStatus());
        assertNull(karteService.lastSaved);
    }

    @Test
    void postDocumentValidationFailure() throws Exception {
        StubObjectMapper mapper = new StubObjectMapper(null);
        injectField(resource, "objectMapper", mapper);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> resource.postDocument("{}"));
        assertEquals(400, ex.getResponse().getStatus());
    }

    private static IDocument newPayload(DocumentModel model) {
        IDocument payload = new IDocument();
        payload.setKarteBean(model.getKarte());
        payload.setUserModel(model.getUserModel());
        return new IDocumentWrapper(payload, model);
    }

    private static DocumentModel document(long id) {
        DocumentModel model = new DocumentModel();
        model.setId(id);
        model.setStarted(Date.from(Instant.parse("2024-01-10T10:15:30Z")));
        return model;
    }

    private static KarteBean karte(PatientModel patient) {
        KarteBean karte = new KarteBean();
        karte.setPatientModel(patient);
        return karte;
    }

    private static PatientModel patient(long pk, String facility) {
        PatientModel model = new PatientModel();
        model.setId(pk);
        model.setFacilityId(facility);
        return model;
    }

    private static HttpServletRequest createServletRequest(String remoteUser) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                DolphinResourceDocumentTest.class.getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> "getRemoteUser".equals(method.getName()) ? remoteUser : null);
    }

    private static void injectField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static final class StubIPhoneServiceBean extends IPhoneServiceBean {
        private PatientModel patient;
        private List<DocumentModel> documents = Collections.emptyList();
        private Long documentCount = 0L;

        @Override
        public List<DocumentModel> getDocuments(long patientPk, int firstResult, int maxResult) {
            return documents;
        }

        @Override
        public Long getDocumentCount(long patientPk) {
            return documentCount;
        }

        @Override
        public PatientModel getPatient(long pk) {
            if (patient != null && patient.getId() == pk) {
                return patient;
            }
            throw new RuntimeException("patient not found");
        }
    }

    private static final class StubKarteService extends KarteServiceBean {
        private DocumentModel lastSaved;
        private long nextPk = 99L;

        @Override
        public long addDocument(DocumentModel document) {
            this.lastSaved = document;
            return nextPk;
        }
    }

    private static final class StubObjectMapper extends com.fasterxml.jackson.databind.ObjectMapper {
        private final Object payload;

        private StubObjectMapper(Object payload) {
            this.payload = payload;
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> T readValue(String content, Class<T> valueType) {
            return (T) payload;
        }
    }

    private static final class IDocumentWrapper extends IDocument {
        private final DocumentModel model;

        private IDocumentWrapper(IDocument delegate, DocumentModel model) {
            this.setKarteBean(delegate.getKarteBean());
            this.setDocInfo(delegate.getDocInfo());
            this.setUserModel(delegate.getUserModel());
            this.model = model;
        }

        @Override
        public DocumentModel toModel() {
            return model;
        }
    }
}
