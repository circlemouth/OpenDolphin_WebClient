package open.dolphin.session;

import java.text.DateFormat;
import java.util.Date;
import open.dolphin.msg.dto.AccountSummaryMessage;

/**
 * AccountSummary
 *
 */
public final class AccountSummary implements AccountSummaryMessage {
    
    private String facilityId;
    
    private String facilityName;
    
    private String facilityZipCode;
    
    private String facilityAddress;
    
    private String FacilityTelephone;
    
    private String userName;
    
    private String userId;
    
    private String userEmail;
    
    private String memberType;
    
    private Date registeredDate;
    
    
    @Override
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    @Override
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String adminEmail) {
        this.userEmail = adminEmail;
    }
    
    @Override
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String adminName) {
        this.userName = adminName;
    }
    
    @Override
    public String getFacilityAddress() {
        return facilityAddress;
    }
    
    public void setFacilityAddress(String facilityAddrees) {
        this.facilityAddress = facilityAddrees;
    }
    
    @Override
    public String getFacilityId() {
        return facilityId;
    }
    
    public void setFacilityId(String facilityId) {
        this.facilityId = facilityId;
    }
    
    @Override
    public String getFacilityName() {
        return facilityName;
    }
    
    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }
    
    @Override
    public String getFacilityTelephone() {
        return FacilityTelephone;
    }
    
    public void setFacilityTelephone(String facilityTelephone) {
        FacilityTelephone = facilityTelephone;
    }
    
    @Override
    public String getFacilityZipCode() {
        return facilityZipCode;
    }
    
    public void setFacilityZipCode(String facilityZipCode) {
        this.facilityZipCode = facilityZipCode;
    }

    @Override
    public String getMemberType() {
        return memberType;
    }

    public void setMemberType(String memberType) {
        this.memberType = memberType;
    }

    @Override
    public Date getRegisteredDate() {
        return registeredDate == null ? null : new Date(registeredDate.getTime());
    }

    public void setRegisteredDate(Date registeredDate) {
        this.registeredDate = registeredDate == null ? null : new Date(registeredDate.getTime());
    }
    
    @Override
    public String getRdDate() {
        return DateFormat.getDateInstance().format(registeredDate);
        
    }
}
