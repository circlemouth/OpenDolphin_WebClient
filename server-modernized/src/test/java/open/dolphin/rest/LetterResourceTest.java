package open.dolphin.rest;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.persistence.NoResultException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.NotFoundException;
import java.time.Instant;
import java.util.Map;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.LetterModule;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.LetterServiceBean;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LetterResourceTest {

    @Mock
    LetterServiceBean letterServiceBean;

    @Mock
    AuditTrailService auditTrailService;

    @Mock
    SessionTraceManager sessionTraceManager;

    @Mock
    HttpServletRequest httpServletRequest;

    @InjectMocks
    LetterResource resource;

    @Captor
    ArgumentCaptor<AuditEventPayload> auditCaptor;

    @BeforeEach
    void setUp() {
        when(httpServletRequest.getRemoteUser()).thenReturn("FAC001:user01");
        when(httpServletRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpServletRequest.getHeader("User-Agent")).thenReturn("JUnit");
        when(httpServletRequest.getHeader("X-Request-Id")).thenReturn("req-2");
        when(httpServletRequest.isUserInRole("ADMIN")).thenReturn(false);
        when(sessionTraceManager.current()).thenReturn(null);
    }

    @Test
    void deleteRecordsAuditOnSuccess() {
        when(httpServletRequest.getRequestURI()).thenReturn("/odletter/letter/10");
        LetterModule module = createLetterModule(10L, "PAT001", 20L);
        when(letterServiceBean.getLetter(10L)).thenReturn(module);
        SessionTraceContext trace = new SessionTraceContext("trace-letter", Instant.now(), "DELETE_LETTER", Map.of());
        when(sessionTraceManager.current()).thenReturn(trace);

        resource.delete("10");

        verify(letterServiceBean).delete(10L);
        verify(auditTrailService).record(auditCaptor.capture());
        AuditEventPayload payload = auditCaptor.getValue();
        assertThat(payload.getAction()).isEqualTo("LETTER_DELETE");
        assertThat(payload.getResource()).isEqualTo("/odletter/letter/10");
        Map<String, Object> details = payload.getDetails();
        assertThat(details.get("status")).isEqualTo("success");
        assertThat(details.get("letterId")).isEqualTo(10L);
        assertThat(details.get("patientId")).isEqualTo("PAT001");
        assertThat(details.get("karteId")).isEqualTo(20L);
        assertThat(details.get("traceId")).isEqualTo("trace-letter");
    }

    @Test
    void deleteThrowsNotFoundAndAuditsWhenMissing() {
        when(httpServletRequest.getRequestURI()).thenReturn("/odletter/letter/99");
        when(letterServiceBean.getLetter(99L)).thenThrow(new NoResultException("missing"));

        assertThatThrownBy(() -> resource.delete("99")).isInstanceOf(NotFoundException.class);

        verify(auditTrailService).record(auditCaptor.capture());
        Map<String, Object> details = auditCaptor.getValue().getDetails();
        assertThat(details.get("status")).isEqualTo("failed");
        assertThat(details.get("reason")).isEqualTo("letter_not_found");
        assertThat(details.get("letterId")).isEqualTo(99L);
    }

    @Test
    void deleteRecordsFailureAuditWhenDeleteThrows() {
        when(httpServletRequest.getRequestURI()).thenReturn("/odletter/letter/11");
        LetterModule module = createLetterModule(11L, "PAT002", 21L);
        when(letterServiceBean.getLetter(11L)).thenReturn(module);
        doThrow(new RuntimeException("db"))
                .when(letterServiceBean).delete(11L);

        assertThatThrownBy(() -> resource.delete("11")).isInstanceOf(RuntimeException.class);

        verify(auditTrailService).record(auditCaptor.capture());
        Map<String, Object> details = auditCaptor.getValue().getDetails();
        assertThat(details.get("status")).isEqualTo("failed");
        assertThat(details.get("reason")).isEqualTo("RuntimeException");
        assertThat(details.get("letterId")).isEqualTo(11L);
    }

    @Test
    void getLetterReturnsConverter() {
        LetterModule module = createLetterModule(12L, "PAT003", 22L);
        module.setTitle("紹介状");
        when(letterServiceBean.getLetter(12L)).thenReturn(module);

        var converter = resource.getLetter("12");

        assertThat(converter).isNotNull();
        assertThat(converter.getPatientId()).isEqualTo("PAT003");
    }

    @Test
    void getLetterThrowsNotFoundWhenMissing() {
        when(letterServiceBean.getLetter(13L)).thenThrow(new NoResultException("missing"));

        assertThatThrownBy(() -> resource.getLetter("13")).isInstanceOf(NotFoundException.class);
    }

    private LetterModule createLetterModule(long id, String patientId, long karteId) {
        LetterModule module = new LetterModule();
        module.setId(id);
        module.setPatientId(patientId);
        KarteBean karte = new KarteBean();
        karte.setId(karteId);
        module.setKarte(karte);
        return module;
    }
}
