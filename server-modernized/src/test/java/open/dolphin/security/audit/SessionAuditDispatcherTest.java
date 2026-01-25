package open.dolphin.security.audit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import org.junit.jupiter.api.Test;

class SessionAuditDispatcherTest {

    @Test
    void recordPropagatesOperationToEnvelope() {
        RecordingDispatcher dispatcher = new RecordingDispatcher();

        AuditEventPayload payload = new AuditEventPayload();
        payload.setActorId("F001:doctor01");
        payload.setAction("ORCA_APPOINTMENT_OUTPATIENT");
        payload.setResource("/orca/appointments/list");
        payload.setTraceId("trace-op");
        payload.setRequestId("req-op");
        payload.setDetails(Map.of("operation", "appointment_list"));

        AuditEventEnvelope envelope = dispatcher.record(payload, AuditEventEnvelope.Outcome.SUCCESS, null, null);

        assertNotNull(envelope);
        assertEquals("appointment_list", envelope.getOperation());
    }

    @Test
    void recordNormalizesMissingOutcome() {
        RecordingDispatcher dispatcher = new RecordingDispatcher();

        AuditEventPayload payload = new AuditEventPayload();
        payload.setActorId("F001:doctor01");
        payload.setAction("ORCA_CLAIM_OUTPATIENT");
        payload.setResource("/orca/claim/outpatient");
        payload.setTraceId("trace-missing");
        payload.setRequestId("req-missing");
        payload.setDetails(Map.of("outcome", "MISSING"));

        AuditEventEnvelope envelope = dispatcher.record(payload, AuditEventEnvelope.Outcome.SUCCESS, null, null);

        assertNotNull(envelope);
        assertEquals(AuditEventEnvelope.Outcome.MISSING, envelope.getOutcome());
    }

    private static final class RecordingDispatcher extends SessionAuditDispatcher {
        @Override
        public AuditEventEnvelope dispatch(AuditEventEnvelope envelope) {
            return envelope;
        }
    }
}
