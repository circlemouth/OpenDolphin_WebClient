package open.dolphin.touch.patient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.touch.support.TouchAuditHelper;
import jakarta.ws.rs.WebApplicationException;
import open.dolphin.touch.support.TouchErrorResponse;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TouchPatientServiceTest extends RuntimeDelegateTestSupport {

    private static final TouchRequestContext CONTEXT = new TouchRequestContext(
            "1.3.6.1.4.1.9414.2.10:user",
            "1.3.6.1.4.1.9414.2.10",
            "user",
            "trace-123",
            "treatment",
            "consent-token",
            "127.0.0.1",
            "JUnit"
    );

    private static final TouchRequestContext CONTEXT_NO_CONSENT = new TouchRequestContext(
            "1.3.6.1.4.1.9414.2.10:user",
            "1.3.6.1.4.1.9414.2.10",
            "user",
            "trace-123",
            "treatment",
            null,
            "127.0.0.1",
            "JUnit"
    );

    @Mock
    IPhoneServiceBean iPhoneServiceBean;

    @Mock
    TouchAuditHelper auditHelper;

    TouchPatientService service;

    @BeforeEach
    void setUp() {
        service = new TouchPatientService();
        service.iPhoneServiceBean = iPhoneServiceBean;
        service.auditHelper = auditHelper;
    }

    @Test
    void getPatientByPk_requiresConsentToken() {
        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> service.getPatientByPk(CONTEXT_NO_CONSENT, 10L));
        assertThat(ex.getResponse().getStatus()).isEqualTo(403);
        assertThat(ex.getResponse().getEntity()).isInstanceOf(TouchErrorResponse.class);
        TouchErrorResponse payload = (TouchErrorResponse) ex.getResponse().getEntity();
        assertThat(payload.type()).isEqualTo("consent_required");
        verify(iPhoneServiceBean, never()).getPatient(anyLong());
    }

    @Test
    void getPatientByPk_returnsPatientAndLogsAudit() {
        PatientModel model = new PatientModel();
        model.setId(10L);
        model.setFacilityId(CONTEXT.facilityId());
        when(iPhoneServiceBean.getPatient(10L)).thenReturn(model);
        when(iPhoneServiceBean.getKartePKByPatientPK(10L)).thenReturn(20L);
        when(auditHelper.record(any(), anyString(), anyString(), any())).thenReturn(Optional.empty());

        var result = service.getPatientByPk(CONTEXT, 10L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getKartePK()).isEqualTo(20L);

        ArgumentCaptor<Map<String, Object>> detailsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditHelper).record(
                eq(CONTEXT),
                eq("TOUCH_PATIENT_PROFILE_VIEW"),
                eq("/touch/patient/10"),
                detailsCaptor.capture()
        );
        assertThat(detailsCaptor.getValue()).containsEntry("patientPk", 10L);
    }

    @Test
    void searchPatientsByName_convertsHiraganaToKatakana() {
        PatientModel model = new PatientModel();
        model.setFacilityId(CONTEXT.facilityId());
        when(iPhoneServiceBean.getPatientsByKana(CONTEXT.facilityId(), "タナカ", 0, 10)).thenReturn(List.of(model));
        when(auditHelper.record(any(), any(), any(), any())).thenReturn(Optional.empty());

        var result = service.searchPatientsByName(CONTEXT, CONTEXT.facilityId(), "たなか", 0, 10);

        assertThat(result.getList()).hasSize(1);
        verify(iPhoneServiceBean).getPatientsByKana(CONTEXT.facilityId(), "タナカ", 0, 10);
    }
}
