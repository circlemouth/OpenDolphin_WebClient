package open.dolphin.touch.stamp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.ws.rs.WebApplicationException;
import java.util.Optional;
import open.dolphin.converter.StampModelConverter;
import open.dolphin.infomodel.StampModel;
import open.dolphin.session.StampServiceBean;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.support.TouchResponseCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TouchStampServiceTest {

    private static final TouchRequestContext CONTEXT = new TouchRequestContext(
            "1.3.6.1.4.1.9414.2.10:user",
            "1.3.6.1.4.1.9414.2.10",
            "user",
            "trace-1",
            "chart-view",
            null,
            "127.0.0.1",
            "JUnit"
    );

    private static final TouchRequestContext CONTEXT_NO_REASON = new TouchRequestContext(
            "1.3.6.1.4.1.9414.2.10:user",
            "1.3.6.1.4.1.9414.2.10",
            "user",
            "trace-1",
            null,
            null,
            "127.0.0.1",
            "JUnit"
    );

    @Mock
    StampServiceBean stampServiceBean;

    @Mock
    TouchAuditHelper auditHelper;

    TouchStampService service;

    @BeforeEach
    void setUp() {
        service = new TouchStampService();
        service.stampServiceBean = stampServiceBean;
        service.auditHelper = auditHelper;
        service.responseCache = new TouchResponseCache();
        when(auditHelper.record(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void getStamp_requiresAccessReason() {
        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> service.getStamp(CONTEXT_NO_REASON, "stamp-1"));
        assertThat(ex.getResponse().getStatus()).isEqualTo(403);
        verify(stampServiceBean, times(0)).getStamp("stamp-1");
    }

    @Test
    void getStamp_usesCache() {
        StampModel model = new StampModel();
        model.setId("stamp-1");
        when(stampServiceBean.getStamp("stamp-1")).thenReturn(model);

        StampModelConverter first = service.getStamp(CONTEXT, "stamp-1");
        StampModelConverter second = service.getStamp(CONTEXT, "stamp-1");

        assertThat(first.getId()).isEqualTo("stamp-1");
        assertThat(second.getId()).isEqualTo("stamp-1");
        verify(stampServiceBean, times(1)).getStamp("stamp-1");
    }
}
