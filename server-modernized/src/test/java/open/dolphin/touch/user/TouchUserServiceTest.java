package open.dolphin.touch.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.ws.rs.WebApplicationException;
import java.util.Map;
import java.util.Optional;
import open.dolphin.infomodel.DepartmentModel;
import open.dolphin.infomodel.FacilityModel;
import open.dolphin.infomodel.LicenseModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.touch.AbstractResource;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TouchUserServiceTest extends RuntimeDelegateTestSupport {

    private static final TouchRequestContext CONTEXT = new TouchRequestContext(
            "1.3.6.1.4.1.9414.2.10:user",
            "1.3.6.1.4.1.9414.2.10",
            "user",
            "trace-abc",
            "request-abc",
            "user-lookup",
            null,
            "127.0.0.1",
            "JUnit"
    );

    private static final TouchRequestContext CONTEXT_NO_REASON = new TouchRequestContext(
            "1.3.6.1.4.1.9414.2.10:user",
            "1.3.6.1.4.1.9414.2.10",
            "user",
            "trace-abc",
            "request-abc",
            null,
            null,
            "127.0.0.1",
            "JUnit"
    );

    private static final String DEVICE_ID = "device-001";

    @Mock
    IPhoneServiceBean iPhoneServiceBean;

    @Mock
    TouchAuditHelper auditHelper;

    TouchUserService service;

    @BeforeEach
    void setUp() {
        service = new TouchUserService();
        service.iPhoneServiceBean = iPhoneServiceBean;
        service.auditHelper = auditHelper;
        lenient().when(auditHelper.record(any(), any(), any(), any())).thenReturn(Optional.empty());
    }

    @Test
    void getUserSummary_requiresAccessReason() {
        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> service.getUserSummary(CONTEXT_NO_REASON, "user", CONTEXT.facilityId(), "pass",
                        DEVICE_ID));
        assertThat(ex.getResponse().getStatus()).isEqualTo(403);
        verify(iPhoneServiceBean, never()).getUser(any(), any());
    }

    @Test
    void getUserSummary_validatesHeaderUser() {
        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> service.getUserSummary(CONTEXT, "other-user", CONTEXT.facilityId(), "pass",
                        DEVICE_ID));
        assertThat(ex.getResponse().getStatus()).isEqualTo(401);
        verify(iPhoneServiceBean, never()).getUser(any(), any());
    }

    @Test
    void getUserSummary_returnsSanitizedResponse() {
        UserModel user = new UserModel();
        user.setId(42L);
        user.setUserId(CONTEXT.remoteUser());
        user.setCommonName("田中 太郎");
        user.setMemberType("ASP_MEMBER");
        user.setFacilityModel(buildFacility());
        user.setLicenseModel(buildLicense());
        user.setDepartmentModel(buildDepartment());
        when(iPhoneServiceBean.getUser(AbstractResource.DOLPHIN_ASP_OID + "2.10" + ":user", "pass"))
                .thenReturn(user);

        TouchUserDtos.TouchUserResponse response = service.getUserSummary(CONTEXT, "user", CONTEXT.facilityId(), "pass",
                DEVICE_ID);

        assertThat(response.userPk()).isEqualTo(42L);
        assertThat(response.userId()).isEqualTo("user");
        assertThat(response.facility().facilityId()).isEqualTo(CONTEXT.facilityId());
        ArgumentCaptor<Map<String, Object>> detailCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditHelper).record(eq(CONTEXT), eq("TOUCH_USER_LOOKUP"), eq("/touch/user"), detailCaptor.capture());
        assertThat(detailCaptor.getValue()).containsEntry("userId", CONTEXT.remoteUser());
    }

    private FacilityModel buildFacility() {
        FacilityModel facility = new FacilityModel();
        facility.setFacilityId(CONTEXT.facilityId());
        facility.setFacilityName("テストクリニック");
        facility.setZipCode("100-0001");
        facility.setAddress("東京都千代田区1-1-1");
        facility.setTelephone("03-1234-5678");
        facility.setFacsimile("03-1234-5679");
        return facility;
    }

    private LicenseModel buildLicense() {
        LicenseModel license = new LicenseModel();
        license.setLicense("doctor");
        license.setLicenseDesc("医師");
        return license;
    }

    private DepartmentModel buildDepartment() {
        DepartmentModel department = new DepartmentModel();
        department.setDepartment("01");
        department.setDepartmentDesc("内科");
        return department;
    }
}
