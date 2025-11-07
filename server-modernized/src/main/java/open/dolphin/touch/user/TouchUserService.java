package open.dolphin.touch.user;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.Map;
import open.dolphin.infomodel.UserModel;
import open.dolphin.touch.AbstractResource;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchErrorMapper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.session.IPhoneServiceBean;

/**
 * Touch ユーザー情報サービス。
 */
@ApplicationScoped
public class TouchUserService {

    private static final String ASP_TEST_USER = "ASP_TESTER";
    private static final int TEST_USER_MONTH_LIMIT = 5;
    private static final String ACTION_USER_LOOKUP = "TOUCH_USER_LOOKUP";

    @Inject
    IPhoneServiceBean iPhoneServiceBean;

    @Inject
    TouchAuditHelper auditHelper;

    public TouchUserDtos.TouchUserResponse getUserSummary(TouchRequestContext context,
                                                          String pathUserId,
                                                          String facilityId,
                                                          String password,
                                                          String headerUserName,
                                                          String headerPassword) {
        requireAccessReason(context);
        verifyCredentialHeaders(context, headerUserName, headerPassword);
        ensureFacilityMatch(context, facilityId);
        ensureHeaderMatchesUser(context, headerUserName);

        String compositeUserId = composeCompositeUserId(facilityId, pathUserId);
        UserModel user = iPhoneServiceBean.getUser(compositeUserId, password);
        if (user == null || !isActiveMember(user)) {
            throw TouchErrorMapper.toException(Response.Status.UNAUTHORIZED,
                    "authentication_failed", "ユーザー認証に失敗しました。", context.traceId());
        }

        ensureHeaderMatchesUser(context, user.getUserId());

        TouchUserDtos.TouchUserResponse response = convert(user);
        auditHelper.record(context, ACTION_USER_LOOKUP,
                "/touch/user",
                Map.of("userId", user.getUserId(), "memberType", user.getMemberType()));
        return response;
    }

    private void requireAccessReason(TouchRequestContext context) {
        if (context.accessReason() == null) {
            throw TouchErrorMapper.toException(Response.Status.FORBIDDEN,
                    "access_reason_required", "アクセス理由ヘッダーが必要です。", context.traceId());
        }
    }

    private void verifyCredentialHeaders(TouchRequestContext context, String headerUserName, String headerPassword) {
        if (headerUserName == null || headerUserName.isBlank() ||
                headerPassword == null || headerPassword.isBlank()) {
            throw TouchErrorMapper.toException(Response.Status.UNAUTHORIZED,
                    "credential_headers_missing", "資格情報ヘッダーが不足しています。", context.traceId());
        }
    }

    private void ensureFacilityMatch(TouchRequestContext context, String facilityId) {
        if (facilityId == null) {
            throw TouchErrorMapper.toException(Response.Status.FORBIDDEN,
                    "facility_mismatch", "施設 ID が一致しません。", context.traceId());
        }
        if (context.facilityId().equals(facilityId)) {
            return;
        }
        String normalizedContext = normalizeFacilityId(context.facilityId());
        String normalizedParam = normalizeFacilityId(facilityId);
        if (!normalizedContext.equals(normalizedParam)) {
            throw TouchErrorMapper.toException(Response.Status.FORBIDDEN,
                    "facility_mismatch", "施設 ID が一致しません。", context.traceId());
        }
    }

    private void ensureHeaderMatchesUser(TouchRequestContext context, String headerUserName) {
        if (!context.remoteUser().equals(headerUserName)) {
            throw TouchErrorMapper.toException(Response.Status.UNAUTHORIZED,
                    "principal_mismatch", "資格情報とリモートユーザーが一致しません。", context.traceId());
        }
    }

    private String composeCompositeUserId(String facilityId, String userId) {
        String normalizedFacility = normalizeFacilityId(facilityId);
        return AbstractResource.DOLPHIN_ASP_OID + normalizedFacility + ":" + userId;
    }

    private boolean isActiveMember(UserModel user) {
        if (!ASP_TEST_USER.equals(user.getMemberType())) {
            return true;
        }
        Date registered = user.getRegisteredDate();
        if (registered == null) {
            return false;
        }
        GregorianCalendar gc = new GregorianCalendar();
        gc.setTime(registered);
        gc.add(Calendar.MONTH, TEST_USER_MONTH_LIMIT);
        return gc.after(new GregorianCalendar());
    }

    private TouchUserDtos.TouchUserResponse convert(UserModel user) {
        TouchUserDtos.LicenseDto licenseDto = new TouchUserDtos.LicenseDto(
                user.getLicenseModel() != null ? user.getLicenseModel().getLicense() : null,
                user.getLicenseModel() != null ? user.getLicenseModel().getLicenseDesc() : null
        );
        TouchUserDtos.DepartmentDto departmentDto = new TouchUserDtos.DepartmentDto(
                user.getDepartmentModel() != null ? user.getDepartmentModel().getDepartment() : null,
                user.getDepartmentModel() != null ? user.getDepartmentModel().getDepartmentDesc() : null
        );
        TouchUserDtos.FacilityDto facilityDto = new TouchUserDtos.FacilityDto(
                user.getFacilityModel() != null ? user.getFacilityModel().getFacilityId() : null,
                user.getFacilityModel() != null ? user.getFacilityModel().getFacilityName() : null,
                user.getFacilityModel() != null ? user.getFacilityModel().getZipCode() : null,
                user.getFacilityModel() != null ? user.getFacilityModel().getAddress() : null,
                user.getFacilityModel() != null ? user.getFacilityModel().getTelephone() : null,
                user.getFacilityModel() != null ? user.getFacilityModel().getFacsimile() : null
        );
        String localUserId = extractLocalUserId(user.getUserId());
        return new TouchUserDtos.TouchUserResponse(
                user.getId(),
                localUserId,
                user.getCommonName(),
                user.getMemberType(),
                licenseDto,
                departmentDto,
                facilityDto
        );
    }

    private String extractLocalUserId(String compositeUserId) {
        if (compositeUserId == null) {
            return null;
        }
        int index = compositeUserId.indexOf(':');
        return index >= 0 ? compositeUserId.substring(index + 1) : compositeUserId;
    }

    private String normalizeFacilityId(String facilityId) {
        if (facilityId == null) {
            return null;
        }
        if (facilityId.startsWith(AbstractResource.DOLPHIN_ASP_OID)) {
            return facilityId.substring(AbstractResource.DOLPHIN_ASP_OID.length());
        }
        return facilityId;
    }
}
