package open.dolphin.rest.orca;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.Date;
import java.util.List;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.orca.DiseaseMutationRequest;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PatientServiceBean;
import open.dolphin.session.UserServiceBean;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OrcaDiseaseResourceTest extends RuntimeDelegateTestSupport {

    private OrcaDiseaseResource resource;
    private RecordingSessionAuditDispatcher auditDispatcher;
    private HttpServletRequest servletRequest;

    @BeforeEach
    void setUp() throws Exception {
        resource = new OrcaDiseaseResource();
        auditDispatcher = new RecordingSessionAuditDispatcher();
        injectField(resource, "sessionAuditDispatcher", auditDispatcher);
        injectField(resource, "patientServiceBean", new FakePatientServiceBean());
        injectField(resource, "karteServiceBean", new FakeKarteServiceBean());
        injectField(resource, "userServiceBean", new FakeUserServiceBean());

        servletRequest = (HttpServletRequest)
                Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{HttpServletRequest.class}, (proxy, method, args) -> {
                    String name = method.getName();
                    if ("getRemoteUser".equals(name)) {
                        return "F001:doctor01";
                    }
                    if ("getRemoteAddr".equals(name)) {
                        return "127.0.0.1";
                    }
                    if ("getRequestURI".equals(name)) {
                        return "/orca/disease";
                    }
                    if ("getHeader".equals(name) && args != null && args.length == 1) {
                        String header = String.valueOf(args[0]);
                        return switch (header) {
                            case "X-Request-Id" -> "req-disease-mutation";
                            case "X-Trace-Id" -> "trace-disease-mutation";
                            case "User-Agent" -> "JUnit";
                            default -> null;
                        };
                    }
                    return null;
                });
    }

    @Test
    void postDiseaseRejectsBlankDiagnosisName() {
        DiseaseMutationRequest payload = new DiseaseMutationRequest();
        payload.setPatientId("00001");
        DiseaseMutationRequest.MutationEntry entry = new DiseaseMutationRequest.MutationEntry();
        entry.setOperation("create");
        entry.setDiagnosisName("   ");
        payload.setOperations(List.of(entry));

        assertThatThrownBy(() -> resource.postDisease(servletRequest, payload))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));

        assertNotNull(auditDispatcher.payload);
        assertEquals("ORCA_DISEASE_MUTATION", auditDispatcher.payload.getAction());
        Map<String, Object> details = auditDispatcher.payload.getDetails();
        assertEquals("F001", details.get("facilityId"));
        assertEquals("00001", details.get("patientId"));
        assertEquals(Boolean.TRUE, details.get("validationError"));
        assertEquals("diagnosisName", details.get("field"));
        assertEquals("invalid_request", details.get("errorCode"));
        assertEquals("diagnosisName is required", details.get("errorMessage"));
        assertEquals(400, details.get("httpStatus"));
        assertEquals("failed", details.get("status"));
        assertEquals(AuditEventEnvelope.Outcome.FAILURE, auditDispatcher.outcome);
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Class<?> type = target.getClass();
        Field field = null;
        while (type != null && field == null) {
            try {
                field = type.getDeclaredField(fieldName);
            } catch (NoSuchFieldException ignored) {
                type = type.getSuperclass();
            }
        }
        if (field == null) {
            throw new NoSuchFieldException(fieldName);
        }
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

    private static final class FakePatientServiceBean extends PatientServiceBean {
        @Override
        public PatientModel getPatientById(String fid, String pid) {
            PatientModel patient = new PatientModel();
            patient.setPatientId(pid);
            patient.setFullName("テスト患者");
            patient.setKanaName("テスト");
            patient.setBirthday("1990-01-01");
            patient.setGender("F");
            return patient;
        }
    }

    private static final class FakeKarteServiceBean extends KarteServiceBean {
        @Override
        public KarteBean getKarte(String facilityId, String patientId, Date fromDate) {
            KarteBean karte = new KarteBean();
            karte.setId(20L);
            return karte;
        }
    }

    private static final class FakeUserServiceBean extends UserServiceBean {
        @Override
        public UserModel getUser(String userId) {
            UserModel user = new UserModel();
            user.setUserId(userId);
            user.setCommonName("テスト医師");
            return user;
        }
    }
}
