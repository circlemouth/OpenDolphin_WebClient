package open.dolphin.rest.orca;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Contract tests for {@link OrcaMedicalModV2Resource}.
 */
class OrcaMedicalModV2ResourceTest extends RuntimeDelegateTestSupport {

    private OrcaMedicalModV2Resource resource;
    private RecordingSessionAuditDispatcher auditDispatcher;
    private HttpServletRequest servletRequest;

    @BeforeEach
    void setUp() throws Exception {
        resource = new OrcaMedicalModV2Resource();
        auditDispatcher = new RecordingSessionAuditDispatcher();
        injectField(resource, "sessionAuditDispatcher", auditDispatcher);

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
                        return "/orca21/medicalmodv2/outpatient";
                    }
                    if ("getHeader".equals(name) && args != null && args.length == 1) {
                        String header = String.valueOf(args[0]);
                        return switch (header) {
                            case "X-Request-Id" -> "req-outpatient-medical";
                            case "X-Trace-Id" -> "trace-outpatient-medical";
                            case "User-Agent" -> "JUnit";
                            default -> null;
                        };
                    }
                    return null;
                });
    }

    @Test
    void postOutpatientMedical_returnsTelemetryAndAudit() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("Patient_ID", "00001");

        OutpatientFlagResponse response = resource.postOutpatientMedical(servletRequest, payload);

        assertNotNull(response);
        assertEquals("20251208T124645Z", response.getRunId());
        assertTrue(response.isCacheHit());
        assertFalse(response.isMissingMaster());
        assertEquals(1, response.getRecordsReturned());
        assertEquals("server", response.getDataSourceTransition());

        OutpatientFlagResponse.AuditEvent auditEvent = response.getAuditEvent();
        assertNotNull(auditEvent, "Audit event should be present");
        assertEquals("ORCA_MEDICAL_GET", auditEvent.getAction());
        assertEquals("/orca21/medicalmodv2/outpatient", auditEvent.getResource());
        assertEquals("SUCCESS", auditEvent.getOutcome());
        assertEquals("trace-outpatient-medical", auditEvent.getTraceId());
        assertEquals("req-outpatient-medical", auditEvent.getRequestId());

        Map<String, Object> details = auditEvent.getDetails();
        assertEquals("F001", details.get("facilityId"));
        assertEquals("00001", details.get("patientId"));
        assertEquals(1, details.get("recordsReturned"));
        assertEquals("charts_orchestration", details.get("telemetryFunnelStage"));

        assertNotNull(auditDispatcher.payload, "Audit dispatcher should receive payload");
        assertEquals("ORCA_MEDICAL_GET", auditDispatcher.payload.getAction());
        assertEquals("/orca21/medicalmodv2/outpatient", auditDispatcher.payload.getResource());
        assertEquals("F001:doctor01", auditDispatcher.payload.getActorId());
        assertEquals("trace-outpatient-medical", auditDispatcher.payload.getTraceId());
        assertEquals("req-outpatient-medical", auditDispatcher.payload.getRequestId());
        assertEquals(AuditEventEnvelope.Outcome.SUCCESS, auditDispatcher.outcome);
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
}
