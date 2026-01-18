package open.dolphin.rest.config;

import java.util.Objects;

/**
 * Demo API の設定値。
 */
public final class DemoApiSettings {

    private final boolean enabled;
    private final String facilityId;
    private final String facilityName;
    private final String padFacilityId;
    private final String padFacilityName;
    private final String userId;
    private final String userName;
    private final String passwordMd5;
    private final String memberType;
    private final String demoFacilityId;
    private final String demoPatientId;

    public DemoApiSettings(boolean enabled,
                           String facilityId,
                           String facilityName,
                           String padFacilityId,
                           String padFacilityName,
                           String userId,
                           String userName,
                           String passwordMd5,
                           String memberType,
                           String demoFacilityId,
                           String demoPatientId) {
        this.enabled = enabled;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.padFacilityId = padFacilityId;
        this.padFacilityName = padFacilityName;
        this.userId = userId;
        this.userName = userName;
        this.passwordMd5 = passwordMd5;
        this.memberType = memberType;
        this.demoFacilityId = demoFacilityId;
        this.demoPatientId = demoPatientId;
    }

    public boolean enabled() {
        return enabled;
    }

    public String facilityId() {
        return facilityId;
    }

    public String facilityName() {
        return facilityName;
    }

    public String padFacilityId() {
        return padFacilityId;
    }

    public String padFacilityName() {
        return padFacilityName;
    }

    public String userId() {
        return userId;
    }

    public String userName() {
        return userName;
    }

    public String passwordMd5() {
        return passwordMd5;
    }

    public String memberType() {
        return memberType;
    }

    public String demoFacilityId() {
        return demoFacilityId;
    }

    public String demoPatientId() {
        return demoPatientId;
    }

    public DemoApiSettings withEnabled(boolean enabledFlag) {
        return new DemoApiSettings(enabledFlag, facilityId, facilityName, padFacilityId, padFacilityName,
                userId, userName, passwordMd5, memberType, demoFacilityId, demoPatientId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DemoApiSettings that)) {
            return false;
        }
        return enabled == that.enabled
                && Objects.equals(facilityId, that.facilityId)
                && Objects.equals(facilityName, that.facilityName)
                && Objects.equals(padFacilityId, that.padFacilityId)
                && Objects.equals(padFacilityName, that.padFacilityName)
                && Objects.equals(userId, that.userId)
                && Objects.equals(userName, that.userName)
                && Objects.equals(passwordMd5, that.passwordMd5)
                && Objects.equals(memberType, that.memberType)
                && Objects.equals(demoFacilityId, that.demoFacilityId)
                && Objects.equals(demoPatientId, that.demoPatientId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(enabled, facilityId, facilityName, padFacilityId, padFacilityName, userId, userName,
                passwordMd5, memberType, demoFacilityId, demoPatientId);
    }

    @Override
    public String toString() {
        return "DemoApiSettings{" +
                "enabled=" + enabled +
                ", facilityId='" + facilityId + '\'' +
                ", facilityName='" + facilityName + '\'' +
                ", padFacilityId='" + padFacilityId + '\'' +
                ", padFacilityName='" + padFacilityName + '\'' +
                ", userId='" + userId + '\'' +
                ", userName='" + userName + '\'' +
                ", memberType='" + memberType + '\'' +
                ", demoFacilityId='" + demoFacilityId + '\'' +
                ", demoPatientId='" + demoPatientId + '\'' +
                '}';
    }
}
