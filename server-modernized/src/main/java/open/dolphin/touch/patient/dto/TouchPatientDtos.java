package open.dolphin.touch.patient.dto;

import java.util.List;
import open.dolphin.touch.converter.IPatientModel;

/**
 * Touch 患者系 API で利用する DTO 群。
 */
public final class TouchPatientDtos {

    private TouchPatientDtos() {
    }

    public record PatientPackageResponse(IPatientModel patient,
                                         List<HealthInsuranceDto> healthInsurances,
                                         List<AllergyDto> allergies) {
    }

    public record HealthInsuranceDto(String insuranceClass,
                                     String insuranceClassCode,
                                     String insuranceClassCodeSys,
                                     String insuranceNumber,
                                     String clientGroup,
                                     String clientNumber,
                                     String familyClass,
                                     String startDate,
                                     String expiredDate,
                                     String payInRatio,
                                     String payOutRatio,
                                     List<PublicInsuranceDto> publicInsurances) {
    }

    public record PublicInsuranceDto(String priority,
                                     String providerName,
                                     String provider,
                                     String recipient,
                                     String startDate,
                                     String expiredDate,
                                     String paymentRatio,
                                     String paymentRatioType) {
    }

    public record AllergyDto(String factor, String severity, String identifiedDate) {
    }
}

