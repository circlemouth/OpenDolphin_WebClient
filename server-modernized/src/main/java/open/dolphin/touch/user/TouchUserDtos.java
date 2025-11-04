package open.dolphin.touch.user;

/**
 * Touch ユーザー系レスポンス。
 */
public final class TouchUserDtos {

    private TouchUserDtos() {
    }

    public record TouchUserResponse(long userPk,
                                    String userId,
                                    String displayName,
                                    String memberType,
                                    LicenseDto license,
                                    DepartmentDto department,
                                    FacilityDto facility) {
    }

    public record LicenseDto(String code, String description) {
    }

    public record DepartmentDto(String code, String description) {
    }

    public record FacilityDto(String facilityId,
                              String facilityName,
                              String zipCode,
                              String address,
                              String telephone,
                              String facsimile) {
    }
}

