package open.dolphin.touch.patient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientPackage;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PVTPublicInsuranceItemModel;
import open.dolphin.touch.KanjiHelper;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.patient.dto.TouchPatientDtos.AllergyDto;
import open.dolphin.touch.patient.dto.TouchPatientDtos.HealthInsuranceDto;
import open.dolphin.touch.patient.dto.TouchPatientDtos.PatientPackageResponse;
import open.dolphin.touch.patient.dto.TouchPatientDtos.PublicInsuranceDto;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchErrorMapper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.session.IPhoneServiceBean;

/**
 * Touch 患者系 API の業務ロジック。
 */
@ApplicationScoped
public class TouchPatientService {

    private static final String ACTION_PATIENT_PROFILE = "TOUCH_PATIENT_PROFILE_VIEW";
    private static final String ACTION_PATIENT_PACKAGE = "TOUCH_PATIENT_PACKAGE_VIEW";
    private static final String ACTION_PATIENT_SEARCH = "TOUCH_PATIENT_SEARCH";

    @Inject
    IPhoneServiceBean iPhoneServiceBean;

    @Inject
    TouchAuditHelper auditHelper;

    public IPatientModel getPatientByPk(TouchRequestContext context, long patientPk) {
        requireConsent(context);
        PatientModel patient = iPhoneServiceBean.getPatient(patientPk);
        if (patient == null) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.NOT_FOUND,
                    "patient_not_found", "患者情報が見つかりません。", context.traceId());
        }
        ensureFacilityOwnership(context, patient.getFacilityId());
        IPatientModel converter = new IPatientModel();
        converter.setModel(patient);
        long kartePk = iPhoneServiceBean.getKartePKByPatientPK(patientPk);
        converter.setKartePK(kartePk);
        auditHelper.record(context, ACTION_PATIENT_PROFILE,
                "/touch/patient/" + patientPk,
                Map.of("patientPk", patientPk, "kartePk", kartePk));
        return converter;
    }

    public PatientPackageResponse getPatientPackage(TouchRequestContext context, long patientPk) {
        requireConsent(context);
        PatientPackage pack = iPhoneServiceBean.getPatientPackage(patientPk);
        if (pack == null || pack.getPatient() == null) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.NOT_FOUND,
                    "patient_package_not_found", "患者パッケージが見つかりません。", context.traceId());
        }
        ensureFacilityOwnership(context, pack.getPatient().getFacilityId());
        IPatientModel patientConverter = new IPatientModel();
        patientConverter.setModel(pack.getPatient());
        long kartePk = iPhoneServiceBean.getKartePKByPatientPK(patientPk);
        patientConverter.setKartePK(kartePk);

        List<HealthInsuranceDto> insurances = convertInsurances(pack.getInsurances());
        List<AllergyDto> allergies = convertAllergies(pack.getAllergies());

        auditHelper.record(context, ACTION_PATIENT_PACKAGE,
                "/touch/patientPackage/" + patientPk,
                Map.of("patientPk", patientPk, "kartePk", kartePk,
                        "insuranceCount", insurances.size(),
                        "allergyCount", allergies.size()));

        return new PatientPackageResponse(patientConverter, insurances, allergies);
    }

    public IPatientList searchPatientsByName(TouchRequestContext context,
                                             String facilityId,
                                             String keyword,
                                             int firstResult,
                                             int maxResult) {
        requireConsent(context);
        ensureFacilityOwnership(context, facilityId);

        String normalizedKeyword = normalizeKeyword(keyword);

        List<PatientModel> patients;
        if (isKana(normalizedKeyword)) {
            patients = iPhoneServiceBean.getPatientsByKana(facilityId, normalizedKeyword, firstResult, maxResult);
        } else {
            patients = iPhoneServiceBean.getPatientsByName(facilityId, normalizedKeyword, firstResult, maxResult);
        }
        PatientList patientList = new PatientList();
        patientList.setList(patients);
        IPatientList converter = new IPatientList();
        converter.setModel(patientList);

        auditHelper.record(context, ACTION_PATIENT_SEARCH,
                "/touch/patients/name",
                Map.of("facilityId", facilityId, "keyword", keyword,
                        "resultCount", patients != null ? patients.size() : 0));
        return converter;
    }

    private void ensureFacilityOwnership(TouchRequestContext context, String resourceFacilityId) {
        if (resourceFacilityId == null || !resourceFacilityId.equals(context.facilityId())) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.FORBIDDEN,
                    "facility_mismatch", "施設 ID が一致しません。", context.traceId());
        }
    }

    private void requireConsent(TouchRequestContext context) {
        if (context.accessReason() == null || !context.hasConsentToken()) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.FORBIDDEN,
                    "consent_required", "アクセス理由と同意トークンが必要です。", context.traceId());
        }
    }

    private List<HealthInsuranceDto> convertInsurances(List<HealthInsuranceModel> insurances) {
        if (insurances == null || insurances.isEmpty()) {
            return List.of();
        }
        List<HealthInsuranceDto> results = new ArrayList<>(insurances.size());
        for (HealthInsuranceModel model : insurances) {
            Object decoded = IOSHelper.xmlDecode(model.getBeanBytes());
            if (decoded instanceof PVTHealthInsuranceModel health) {
                List<PublicInsuranceDto> publics = convertPublicItems(health.getPVTPublicInsuranceItem());
                results.add(new HealthInsuranceDto(
                        health.getInsuranceClass(),
                        health.getInsuranceClassCode(),
                        health.getInsuranceClassCodeSys(),
                        health.getInsuranceNumber(),
                        health.getClientGroup(),
                        health.getClientNumber(),
                        health.getFamilyClass(),
                        health.getStartDate(),
                        health.getExpiredDate(),
                        health.getPayInRatio(),
                        health.getPayOutRatio(),
                        publics));
            }
        }
        return results;
    }

    private List<PublicInsuranceDto> convertPublicItems(PVTPublicInsuranceItemModel[] items) {
        if (items == null || items.length == 0) {
            return List.of();
        }
        List<PublicInsuranceDto> list = new ArrayList<>(items.length);
        for (PVTPublicInsuranceItemModel item : items) {
            list.add(new PublicInsuranceDto(
                    item.getPriority(),
                    item.getProviderName(),
                    item.getProvider(),
                    item.getRecipient(),
                    item.getStartDate(),
                    item.getExpiredDate(),
                    item.getPaymentRatio(),
                    item.getPaymentRatioType()
            ));
        }
        return list;
    }

    private List<AllergyDto> convertAllergies(List<AllergyModel> allergies) {
        if (allergies == null || allergies.isEmpty()) {
            return List.of();
        }
        List<AllergyDto> list = new ArrayList<>(allergies.size());
        for (AllergyModel allergy : allergies) {
            list.add(new AllergyDto(allergy.getFactor(), allergy.getSeverity(), allergy.getIdentifiedDate()));
        }
        return list;
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return keyword;
        }
        String trimmed = keyword.trim();
        if (!trimmed.isEmpty() && KanjiHelper.isHiragana(trimmed.charAt(0))) {
            return KanjiHelper.hiraganaToKatakana(trimmed);
        }
        return trimmed;
    }

    private boolean isKana(String keyword) {
        if (keyword == null || keyword.isEmpty()) {
            return false;
        }
        char first = keyword.charAt(0);
        return KanjiHelper.isKatakana(first) || isHalfWidthKatakana(first);
    }

    private boolean isHalfWidthKatakana(char ch) {
        Character.UnicodeBlock block = Character.UnicodeBlock.of(ch);
        return Character.UnicodeBlock.HALFWIDTH_AND_FULLWIDTH_FORMS.equals(block) &&
                Character.toString(ch).matches("[\\uFF66-\\uFF9D]");
    }
}
