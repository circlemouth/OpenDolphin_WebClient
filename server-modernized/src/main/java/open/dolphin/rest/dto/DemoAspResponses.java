package open.dolphin.rest.dto;

import java.util.List;
import open.dolphin.touch.converter.ISchemaModel;
import open.dolphin.touch.converter.IPatientModel;

/**
 * DTO set for DemoResourceASP JSON responses.
 */
public final class DemoAspResponses {

    private DemoAspResponses() {
    }

    public static final class PageInfo {
        private final int numRecords;

        public PageInfo(int numRecords) {
            this.numRecords = numRecords;
        }

        public int getNumRecords() {
            return numRecords;
        }
    }

    public static final class ClaimItemDto {
        private final String name;
        private final String quantity;
        private final String unit;
        private final String numDays;
        private final String administration;

        public ClaimItemDto(String name, String quantity, String unit, String numDays, String administration) {
            this.name = name;
            this.quantity = quantity;
            this.unit = unit;
            this.numDays = numDays;
            this.administration = administration;
        }

        public String getName() {
            return name;
        }

        public String getQuantity() {
            return quantity;
        }

        public String getUnit() {
            return unit;
        }

        public String getNumDays() {
            return numDays;
        }

        public String getAdministration() {
            return administration;
        }
    }

    public static final class ClaimBundleDto {
        private final String entity;
        private final String entityName;
        private final String started;
        private final String bundleNumber;
        private final String administration;
        private final List<ClaimItemDto> items;

        public ClaimBundleDto(String entity, String entityName, String started, String bundleNumber,
                              String administration, List<ClaimItemDto> items) {
            this.entity = entity;
            this.entityName = entityName;
            this.started = started;
            this.bundleNumber = bundleNumber;
            this.administration = administration;
            this.items = items;
        }

        public String getEntity() {
            return entity;
        }

        public String getEntityName() {
            return entityName;
        }

        public String getStarted() {
            return started;
        }

        public String getBundleNumber() {
            return bundleNumber;
        }

        public String getAdministration() {
            return administration;
        }

        public List<ClaimItemDto> getItems() {
            return items;
        }
    }

    public static final class ModuleResponse {
        private final PageInfo pageInfo;
        private final List<ClaimBundleDto> modules;

        public ModuleResponse(PageInfo pageInfo, List<ClaimBundleDto> modules) {
            this.pageInfo = pageInfo;
            this.modules = modules;
        }

        public PageInfo getPageInfo() {
            return pageInfo;
        }

        public List<ClaimBundleDto> getModules() {
            return modules;
        }
    }

    public static final class ProgressCourseDocument {
        private final String started;
        private final String responsibility;
        private final List<String> soaTexts;
        private final List<ClaimBundleDto> orders;
        private final List<ISchemaModel> schemas;

        public ProgressCourseDocument(String started, String responsibility, List<String> soaTexts,
                                      List<ClaimBundleDto> orders, List<ISchemaModel> schemas) {
            this.started = started;
            this.responsibility = responsibility;
            this.soaTexts = soaTexts;
            this.orders = orders;
            this.schemas = schemas;
        }

        public String getStarted() {
            return started;
        }

        public String getResponsibility() {
            return responsibility;
        }

        public List<String> getSoaTexts() {
            return soaTexts;
        }

        public List<ClaimBundleDto> getOrders() {
            return orders;
        }

        public List<ISchemaModel> getSchemas() {
            return schemas;
        }
    }

    public static final class ProgressCourseResponse {
        private final PageInfo pageInfo;
        private final List<ProgressCourseDocument> documents;

        public ProgressCourseResponse(PageInfo pageInfo, List<ProgressCourseDocument> documents) {
            this.pageInfo = pageInfo;
            this.documents = documents;
        }

        public PageInfo getPageInfo() {
            return pageInfo;
        }

        public List<ProgressCourseDocument> getDocuments() {
            return documents;
        }
    }

    public static final class LaboItemDto {
        private final String groupCode;
        private final String groupName;
        private final String parentCode;
        private final String itemCode;
        private final String medisCode;
        private final String itemName;
        private final String normalValue;
        private final String unit;
        private final String value;
        private final String outFlag;
        private final String comment1;
        private final String comment2;

        public LaboItemDto(String groupCode, String groupName, String parentCode, String itemCode, String medisCode,
                           String itemName, String normalValue, String unit, String value, String outFlag,
                           String comment1, String comment2) {
            this.groupCode = groupCode;
            this.groupName = groupName;
            this.parentCode = parentCode;
            this.itemCode = itemCode;
            this.medisCode = medisCode;
            this.itemName = itemName;
            this.normalValue = normalValue;
            this.unit = unit;
            this.value = value;
            this.outFlag = outFlag;
            this.comment1 = comment1;
            this.comment2 = comment2;
        }

        public String getGroupCode() {
            return groupCode;
        }

        public String getGroupName() {
            return groupName;
        }

        public String getParentCode() {
            return parentCode;
        }

        public String getItemCode() {
            return itemCode;
        }

        public String getMedisCode() {
            return medisCode;
        }

        public String getItemName() {
            return itemName;
        }

        public String getNormalValue() {
            return normalValue;
        }

        public String getUnit() {
            return unit;
        }

        public String getValue() {
            return value;
        }

        public String getOutFlag() {
            return outFlag;
        }

        public String getComment1() {
            return comment1;
        }

        public String getComment2() {
            return comment2;
        }
    }

    public static final class LaboTestModule {
        private final String laboCenterCode;
        private final String sampleDate;
        private final String patientId;
        private final List<LaboItemDto> items;

        public LaboTestModule(String laboCenterCode, String sampleDate, String patientId, List<LaboItemDto> items) {
            this.laboCenterCode = laboCenterCode;
            this.sampleDate = sampleDate;
            this.patientId = patientId;
            this.items = items;
        }

        public String getLaboCenterCode() {
            return laboCenterCode;
        }

        public String getSampleDate() {
            return sampleDate;
        }

        public String getPatientId() {
            return patientId;
        }

        public List<LaboItemDto> getItems() {
            return items;
        }
    }

    public static final class LaboTestResponse {
        private final PageInfo pageInfo;
        private final List<LaboTestModule> modules;

        public LaboTestResponse(PageInfo pageInfo, List<LaboTestModule> modules) {
            this.pageInfo = pageInfo;
            this.modules = modules;
        }

        public PageInfo getPageInfo() {
            return pageInfo;
        }

        public List<LaboTestModule> getModules() {
            return modules;
        }
    }

    public static final class LaboTrendResult {
        private final String sampleDate;
        private final String value;
        private final String comment1;
        private final String comment2;

        public LaboTrendResult(String sampleDate, String value, String comment1, String comment2) {
            this.sampleDate = sampleDate;
            this.value = value;
            this.comment1 = comment1;
            this.comment2 = comment2;
        }

        public String getSampleDate() {
            return sampleDate;
        }

        public String getValue() {
            return value;
        }

        public String getComment1() {
            return comment1;
        }

        public String getComment2() {
            return comment2;
        }
    }

    public static final class LaboTrendResponse {
        private final String itemCode;
        private final String itemName;
        private final String normalValue;
        private final String unit;
        private final List<LaboTrendResult> results;

        public LaboTrendResponse(String itemCode, String itemName, String normalValue, String unit,
                                 List<LaboTrendResult> results) {
            this.itemCode = itemCode;
            this.itemName = itemName;
            this.normalValue = normalValue;
            this.unit = unit;
            this.results = results;
        }

        public String getItemCode() {
            return itemCode;
        }

        public String getItemName() {
            return itemName;
        }

        public String getNormalValue() {
            return normalValue;
        }

        public String getUnit() {
            return unit;
        }

        public List<LaboTrendResult> getResults() {
            return results;
        }
    }

    public static final class PublicInsuranceDto {
        private final String priority;
        private final String providerName;
        private final String provider;
        private final String recipient;
        private final String startDate;
        private final String expiredDate;
        private final String paymentRatio;
        private final String paymentRatioType;

        public PublicInsuranceDto(String priority, String providerName, String provider, String recipient,
                                  String startDate, String expiredDate, String paymentRatio, String paymentRatioType) {
            this.priority = priority;
            this.providerName = providerName;
            this.provider = provider;
            this.recipient = recipient;
            this.startDate = startDate;
            this.expiredDate = expiredDate;
            this.paymentRatio = paymentRatio;
            this.paymentRatioType = paymentRatioType;
        }

        public String getPriority() {
            return priority;
        }

        public String getProviderName() {
            return providerName;
        }

        public String getProvider() {
            return provider;
        }

        public String getRecipient() {
            return recipient;
        }

        public String getStartDate() {
            return startDate;
        }

        public String getExpiredDate() {
            return expiredDate;
        }

        public String getPaymentRatio() {
            return paymentRatio;
        }

        public String getPaymentRatioType() {
            return paymentRatioType;
        }
    }

    public static final class HealthInsuranceDto {
        private final String insuranceClass;
        private final String insuranceClassCode;
        private final String insuranceClassCodeSys;
        private final String insuranceNumber;
        private final String clientGroup;
        private final String clientNumber;
        private final String familyClass;
        private final String startDate;
        private final String expiredDate;
        private final String payInRatio;
        private final String payOutRatio;
        private final List<PublicInsuranceDto> publicInsurances;

        public HealthInsuranceDto(String insuranceClass, String insuranceClassCode, String insuranceClassCodeSys,
                                  String insuranceNumber, String clientGroup, String clientNumber, String familyClass,
                                  String startDate, String expiredDate, String payInRatio, String payOutRatio,
                                  List<PublicInsuranceDto> publicInsurances) {
            this.insuranceClass = insuranceClass;
            this.insuranceClassCode = insuranceClassCode;
            this.insuranceClassCodeSys = insuranceClassCodeSys;
            this.insuranceNumber = insuranceNumber;
            this.clientGroup = clientGroup;
            this.clientNumber = clientNumber;
            this.familyClass = familyClass;
            this.startDate = startDate;
            this.expiredDate = expiredDate;
            this.payInRatio = payInRatio;
            this.payOutRatio = payOutRatio;
            this.publicInsurances = publicInsurances;
        }

        public String getInsuranceClass() {
            return insuranceClass;
        }

        public String getInsuranceClassCode() {
            return insuranceClassCode;
        }

        public String getInsuranceClassCodeSys() {
            return insuranceClassCodeSys;
        }

        public String getInsuranceNumber() {
            return insuranceNumber;
        }

        public String getClientGroup() {
            return clientGroup;
        }

        public String getClientNumber() {
            return clientNumber;
        }

        public String getFamilyClass() {
            return familyClass;
        }

        public String getStartDate() {
            return startDate;
        }

        public String getExpiredDate() {
            return expiredDate;
        }

        public String getPayInRatio() {
            return payInRatio;
        }

        public String getPayOutRatio() {
            return payOutRatio;
        }

        public List<PublicInsuranceDto> getPublicInsurances() {
            return publicInsurances;
        }
    }

    public static final class AllergyDto {
        private final String factor;
        private final String severity;
        private final String identifiedDate;

        public AllergyDto(String factor, String severity, String identifiedDate) {
            this.factor = factor;
            this.severity = severity;
            this.identifiedDate = identifiedDate;
        }

        public String getFactor() {
            return factor;
        }

        public String getSeverity() {
            return severity;
        }

        public String getIdentifiedDate() {
            return identifiedDate;
        }
    }

    public static final class PatientPackageResponse {
        private final IPatientModel patient;
        private final List<HealthInsuranceDto> healthInsurances;
        private final List<AllergyDto> allergies;

        public PatientPackageResponse(IPatientModel patient, List<HealthInsuranceDto> healthInsurances,
                                      List<AllergyDto> allergies) {
            this.patient = patient;
            this.healthInsurances = healthInsurances;
            this.allergies = allergies;
        }

        public IPatientModel getPatient() {
            return patient;
        }

        public List<HealthInsuranceDto> getHealthInsurances() {
            return healthInsurances;
        }

        public List<AllergyDto> getAllergies() {
            return allergies;
        }
    }
}
