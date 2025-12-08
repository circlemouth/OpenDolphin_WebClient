package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
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
                            case "User-Agent" -> "JUnit";
                            default -> null;
                        };
                    }
                    return null;
                });
    }

    @Test
    void postOutpatientClaimMock_returnsTelemetryAndAudit() {
        OutpatientFlagResponse response = resource.postOutpatientClaimMock(servletRequest);

        assertNotNull(response);
        assertEquals("20251208T124645Z", response.getRunId());
        assertFalse(response.isCacheHit());
        assertFalse(response.isMissingMaster());
        assertEquals(1, response.getRecordsReturned());
        assertEquals("server", response.getDataSourceTransition());

        OutpatientFlagResponse.AuditEvent auditEvent = response.getAuditEvent();
        assertNotNull(auditEvent, "Audit event should be present");
        assertEquals("ORCA_CLAIM_OUTPATIENT", auditEvent.getAction());
        assertEquals("/api01rv2/claim/outpatient/mock", auditEvent.getResource());
        assertEquals("SUCCESS", auditEvent.getOutcome());
        assertEquals("trace-outpatient-claim", auditEvent.getTraceId());
        assertEquals("req-outpatient-claim", auditEvent.getRequestId());

        Map<String, Object> details = auditEvent.getDetails();
        assertEquals("F001", details.get("facilityId"));
        assertEquals("resolve_master", details.get("telemetryFunnelStage"));
        assertEquals(1, details.get("recordsReturned"));

        assertNotNull(auditDispatcher.payload, "Audit dispatcher should receive payload");
        assertEquals("ORCA_CLAIM_OUTPATIENT", auditDispatcher.payload.getAction());
        assertEquals("/api01rv2/claim/outpatient/mock", auditDispatcher.payload.getResource());
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
}
