package open.dolphin.touch.patient.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import open.dolphin.touch.JsonTouchSharedService;
import open.dolphin.touch.JsonTouchSharedService.PatientModelSnapshot;
import open.dolphin.touch.converter.IPatientModel;

/**
 * Touch 患者系 API で利用する DTO 群。
 */
public final class TouchPatientDtos {

    private TouchPatientDtos() {
    }

    public static final class PatientPackageResponse {
        private final PatientModelSnapshot patientSnapshot;
        private final List<HealthInsuranceDto> healthInsurances;
        private final List<AllergyDto> allergies;

        public PatientPackageResponse(PatientModelSnapshot patientSnapshot,
                                      List<HealthInsuranceDto> healthInsurances,
                                      List<AllergyDto> allergies) {
            this.patientSnapshot = patientSnapshot == null
                    ? null
                    : JsonTouchSharedService.snapshot(patientSnapshot.getPatient(), patientSnapshot.getKartePk());
            this.healthInsurances = immutableList(healthInsurances);
            this.allergies = immutableList(allergies);
        }

        public IPatientModel getPatient() {
            if (patientSnapshot == null) {
                return null;
            }
            IPatientModel converter = new IPatientModel();
            converter.setModel(patientSnapshot.getPatient());
            converter.setKartePK(patientSnapshot.getKartePk());
            return converter;
        }

        public List<HealthInsuranceDto> getHealthInsurances() {
            return defensiveList(healthInsurances);
        }

        public List<AllergyDto> getAllergies() {
            return defensiveList(allergies);
        }
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
        public HealthInsuranceDto {
            publicInsurances = immutableList(publicInsurances);
        }

        @Override
        public List<PublicInsuranceDto> publicInsurances() {
            return defensiveList(this.publicInsurances);
        }
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

    private static <T> List<T> immutableList(List<T> source) {
        return source == null ? null : Collections.unmodifiableList(new ArrayList<>(source));
    }

    private static <T> List<T> defensiveList(List<T> source) {
        return immutableList(source);
    }
}
