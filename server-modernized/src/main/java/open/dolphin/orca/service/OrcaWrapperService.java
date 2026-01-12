package open.dolphin.orca.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.spi.CDI;
import java.time.LocalDate;
import java.util.Locale;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.orca.converter.OrcaXmlMapper;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
import open.dolphin.orca.transport.RestOrcaTransport;
import open.dolphin.rest.dto.orca.AppointmentMutationRequest;
import open.dolphin.rest.dto.orca.AppointmentMutationResponse;
import open.dolphin.rest.dto.orca.BillingSimulationRequest;
import open.dolphin.rest.dto.orca.BillingSimulationResponse;
import open.dolphin.rest.dto.orca.FormerNameHistoryRequest;
import open.dolphin.rest.dto.orca.FormerNameHistoryResponse;
import open.dolphin.rest.dto.orca.InsuranceCombinationRequest;
import open.dolphin.rest.dto.orca.InsuranceCombinationResponse;
import open.dolphin.rest.dto.orca.OrcaApiResponse;
import open.dolphin.rest.dto.orca.OrcaAppointmentListRequest;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientAppointmentListRequest;
import open.dolphin.rest.dto.orca.PatientAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientBatchRequest;
import open.dolphin.rest.dto.orca.PatientBatchResponse;
import open.dolphin.rest.dto.orca.PatientIdListRequest;
import open.dolphin.rest.dto.orca.PatientIdListResponse;
import open.dolphin.rest.dto.orca.PatientNameSearchRequest;
import open.dolphin.rest.dto.orca.PatientSearchResponse;
import open.dolphin.rest.dto.orca.VisitMutationRequest;
import open.dolphin.rest.dto.orca.VisitMutationResponse;
import open.dolphin.rest.dto.orca.VisitPatientListRequest;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;

/**
 * Coordinates transport + XML conversion for ORCA wrapper endpoints.
 */
@ApplicationScoped
public class OrcaWrapperService {

    public static final String RUN_ID = "20251116T170500Z";
    public static final String BLOCKER_TAG = "TrialLocalOnly";

    private OrcaTransport transport;

    private OrcaXmlMapper mapper;

    public OrcaWrapperService() {
        // CDI proxy requires a public no-arg constructor.
    }

    /**
     * Constructor for manual instantiation (e.g., tests).
     */
    public OrcaWrapperService(OrcaTransport transport, OrcaXmlMapper mapper) {
        this.transport = transport;
        this.mapper = mapper;
    }

    @PostConstruct
    private void initializeDependencies() {
        if (transport == null) {
            transport = CDI.current().select(RestOrcaTransport.class).get();
        }
        if (mapper == null) {
            mapper = CDI.current().select(OrcaXmlMapper.class).get();
        }
        ensureNotNull(transport, "OrcaTransport");
        ensureNotNull(mapper, "OrcaXmlMapper");
    }

    public OrcaAppointmentListResponse getAppointmentList(OrcaAppointmentListRequest request) {
        ensureNotNull(request, "appointment request");
        if (request.getAppointmentDate() == null && request.getFromDate() == null && request.getToDate() == null) {
            throw new OrcaGatewayException("appointmentDate or fromDate is required");
        }
        LocalDate from = coalesce(request.getFromDate(), request.getAppointmentDate(), LocalDate.now());
        LocalDate to = coalesce(request.getToDate(), request.getAppointmentDate(), from);
        if (to.isBefore(from)) {
            to = from;
        }
        OrcaAppointmentListResponse aggregate = null;
        for (LocalDate cursor = from; !cursor.isAfter(to); cursor = cursor.plusDays(1)) {
            String payload = buildAppointmentListPayload(cursor, request);
            String xml = transport.invoke(OrcaEndpoint.APPOINTMENT_LIST, payload);
            OrcaAppointmentListResponse daily = mapper.toAppointmentList(xml);
            if (aggregate == null) {
                aggregate = daily;
            } else if (daily != null) {
                aggregate.getSlots().addAll(daily.getSlots());
            }
        }
        if (aggregate == null) {
            aggregate = new OrcaAppointmentListResponse();
            aggregate.setApiResult("00");
            aggregate.setApiResultMessage("No data");
        }
        if (from.equals(to)) {
            aggregate.setAppointmentDate(from.toString());
        } else {
            aggregate.setAppointmentDate(from + "/" + to);
        }
        enrich(aggregate);
        return aggregate;
    }

    public PatientAppointmentListResponse getPatientAppointments(PatientAppointmentListRequest request) {
        ensureNotNull(request, "patient appointment request");
        String payload = buildPatientAppointmentListPayload(request);
        String xml = transport.invoke(OrcaEndpoint.PATIENT_APPOINTMENT_LIST, payload);
        PatientAppointmentListResponse response = mapper.toPatientAppointments(xml);
        enrich(response);
        return response;
    }

    public BillingSimulationResponse simulateBilling(BillingSimulationRequest request) {
        ensureNotNull(request, "billing simulation request");
        String payload = buildBillingSimulationPayload(request);
        String xml = transport.invoke(OrcaEndpoint.BILLING_SIMULATION, payload);
        BillingSimulationResponse response = mapper.toBillingSimulation(xml);
        enrich(response);
        return response;
    }

    public VisitPatientListResponse getVisitList(VisitPatientListRequest request) {
        ensureNotNull(request, "visit list request");
        String payload = buildVisitListPayload(request);
        String xml = transport.invoke(OrcaEndpoint.VISIT_LIST, payload);
        VisitPatientListResponse response = mapper.toVisitList(xml);
        enrich(response);
        return response;
    }

    public PatientIdListResponse getPatientIdList(PatientIdListRequest request) {
        ensureNotNull(request, "patient id list request");
        String payload = buildPatientIdListPayload(request);
        String xml = transport.invoke(OrcaEndpoint.PATIENT_ID_LIST, payload);
        PatientIdListResponse response = mapper.toPatientIdList(xml);
        enrich(response);
        return response;
    }

    public PatientBatchResponse getPatientBatch(PatientBatchRequest request) {
        ensureNotNull(request, "patient batch request");
        String payload = buildPatientBatchPayload(request);
        String xml = transport.invoke(OrcaEndpoint.PATIENT_BATCH, payload);
        PatientBatchResponse response = mapper.toPatientBatch(xml);
        enrich(response);
        return response;
    }

    public PatientSearchResponse searchPatients(PatientNameSearchRequest request) {
        ensureNotNull(request, "patient search request");
        String payload = buildPatientSearchPayload(request);
        String xml = transport.invoke(OrcaEndpoint.PATIENT_NAME_SEARCH, payload);
        String searchTerm = request.getName() != null ? request.getName() : request.getKana();
        PatientSearchResponse response = mapper.toPatientSearch(xml, searchTerm);
        enrich(response);
        return response;
    }

    public InsuranceCombinationResponse getInsuranceCombinations(InsuranceCombinationRequest request) {
        ensureNotNull(request, "insurance combination request");
        String payload = buildInsuranceCombinationPayload(request);
        String xml = transport.invoke(OrcaEndpoint.INSURANCE_COMBINATION, payload);
        InsuranceCombinationResponse response = mapper.toInsuranceCombination(xml);
        enrich(response);
        return response;
    }

    public FormerNameHistoryResponse getFormerNames(FormerNameHistoryRequest request) {
        ensureNotNull(request, "former name request");
        String payload = buildFormerNameHistoryPayload(request);
        String xml = transport.invoke(OrcaEndpoint.FORMER_NAME_HISTORY, payload);
        FormerNameHistoryResponse response = mapper.toFormerNames(xml);
        enrich(response);
        return response;
    }

    public AppointmentMutationResponse mutateAppointment(AppointmentMutationRequest request) {
        ensureNotNull(request, "appointment mutation request");
        String payload = buildAppointmentMutationPayload(request);
        String xml = transport.invoke(OrcaEndpoint.APPOINTMENT_MUTATION, payload);
        AppointmentMutationResponse response = mapper.toAppointmentMutation(xml);
        enrich(response);
        return response;
    }

    public VisitMutationResponse mutateVisit(VisitMutationRequest request) {
        ensureNotNull(request, "visit mutation request");
        String payload = buildVisitMutationPayload(request);
        String xml = transport.invoke(OrcaEndpoint.ACCEPTANCE_MUTATION, payload);
        VisitMutationResponse response = mapper.toVisitMutation(xml);
        enrich(response);
        return response;
    }

    private void enrich(OrcaApiResponse response) {
        if (response != null) {
            response.setRunId(RUN_ID);
            if (transport != null && transport.isStub()) {
                response.setBlockerTag(BLOCKER_TAG);
            } else {
                response.setBlockerTag(null);
            }
        }
    }

    private void ensureNotNull(Object target, String label) {
        if (target == null) {
            throw new OrcaGatewayException(label + " must not be null");
        }
    }

    private String requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new OrcaGatewayException(label + " is required");
        }
        return value.trim();
    }

    private String requireNumericId(String value, String label) {
        String trimmed = requireText(value, label);
        if (!trimmed.matches("\\d+")) {
            throw new OrcaGatewayException(label + " must be numeric");
        }
        return trimmed;
    }

    private String buildOrcaMeta(OrcaEndpoint endpoint, String classCode) {
        String path = endpoint != null ? endpoint.getPath() : "";
        StringBuilder builder = new StringBuilder();
        builder.append("<!-- orca-meta: path=").append(path).append(" method=POST");
        if (classCode != null && !classCode.isBlank()) {
            builder.append(" query=class=").append(classCode.trim());
        }
        builder.append(" -->");
        return builder.toString();
    }

    private String normalizeAppointmentClass(String value) {
        String normalized = normalizeToken(value, "requestNumber");
        if (normalized.matches("\\d{1,2}")) {
            String code = padTwoDigits(normalized);
            if (!"01".equals(code) && !"02".equals(code)) {
                throw new OrcaGatewayException(
                        "requestNumber must be 01/02 (appointmodv2 class) or supported operation keyword");
            }
            return code;
        }
        return switch (normalized) {
            case "create", "register", "add", "update" -> "01";
            case "cancel", "delete", "remove" -> "02";
            default -> throw new OrcaGatewayException(
                    "requestNumber must be 01/02 (appointmodv2 class) or supported operation keyword");
        };
    }

    private String normalizeAcceptRequestNumber(String value) {
        String normalized = normalizeToken(value, "requestNumber");
        if (normalized.matches("\\d{1,2}")) {
            String code = padTwoDigits(normalized);
            if (!"00".equals(code) && !"01".equals(code) && !"02".equals(code) && !"03".equals(code)) {
                throw new OrcaGatewayException(
                        "requestNumber must be 00/01/02/03 (acceptmodv2 Request_Number) or supported operation keyword");
            }
            return code;
        }
        return switch (normalized) {
            case "create", "register", "add" -> "01";
            case "delete", "cancel", "remove" -> "02";
            case "update", "modify" -> "03";
            case "query", "read", "get", "list", "inquiry" -> "00";
            default -> throw new OrcaGatewayException(
                    "requestNumber must be 00/01/02/03 (acceptmodv2 Request_Number) or supported operation keyword");
        };
    }

    private String normalizeToken(String value, String label) {
        String trimmed = requireText(value, label).trim().toLowerCase(Locale.ROOT);
        if (trimmed.startsWith("class=")) {
            trimmed = trimmed.substring("class=".length());
        }
        if (trimmed.startsWith("?class=")) {
            trimmed = trimmed.substring("?class=".length());
        }
        return trimmed;
    }

    private String padTwoDigits(String value) {
        if (value.length() == 1) {
            return "0" + value;
        }
        return value;
    }

    private LocalDate coalesce(LocalDate... values) {
        if (values == null) {
            return LocalDate.now();
        }
        for (LocalDate value : values) {
            if (value != null) {
                return value;
            }
        }
        return LocalDate.now();
    }

    private String buildAppointmentListPayload(LocalDate date, OrcaAppointmentListRequest request) {
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.APPOINTMENT_LIST, null));
        builder.append("<data><appointlstreq>");
        builder.append("<Appointment_Date>").append(date).append("</Appointment_Date>");
        if (request.getMedicalInformation() != null) {
            builder.append("<Medical_Information>").append(request.getMedicalInformation()).append("</Medical_Information>");
        }
        if (request.getPhysicianCode() != null) {
            builder.append("<Physician_Code>").append(request.getPhysicianCode()).append("</Physician_Code>");
        }
        builder.append("</appointlstreq></data>");
        return builder.toString();
    }

    private String buildVisitListPayload(VisitPatientListRequest request) {
        if (request.getVisitDate() == null) {
            throw new OrcaGatewayException("visitDate is required");
        }
        String requestNumber = requireText(request.getRequestNumber(), "requestNumber");
        LocalDate visitDate = request.getVisitDate();
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.VISIT_LIST, null));
        builder.append("<data>");
        builder.append("<visitptlstreq type=\"record\">");
        builder.append("<Request_Number type=\"string\">").append(requestNumber).append("</Request_Number>");
        builder.append("<Visit_Date type=\"string\">").append(visitDate).append("</Visit_Date>");
        builder.append("</visitptlstreq>");
        builder.append("</data>");
        return builder.toString();
    }

    private String buildPatientAppointmentListPayload(PatientAppointmentListRequest request) {
        String patientId = requireText(request.getPatientId(), "patientId");
        LocalDate baseDate = request.getBaseDate() != null ? request.getBaseDate() : LocalDate.now();
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.PATIENT_APPOINTMENT_LIST, null));
        builder.append("<data><appointlst2req>");
        builder.append("<Patient_ID>").append(patientId).append("</Patient_ID>");
        builder.append("<Base_Date>").append(baseDate).append("</Base_Date>");
        if (request.getDepartmentCode() != null && !request.getDepartmentCode().isBlank()) {
            builder.append("<Department_Code>").append(request.getDepartmentCode()).append("</Department_Code>");
        }
        builder.append("</appointlst2req></data>");
        return builder.toString();
    }

    private String buildBillingSimulationPayload(BillingSimulationRequest request) {
        String patientId = requireNumericId(request.getPatientId(), "patientId");
        String departmentCode = requireText(request.getDepartmentCode(), "departmentCode");
        LocalDate performDate = request.getPerformDate() != null ? request.getPerformDate() : LocalDate.now();
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new OrcaGatewayException("items is required");
        }
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.BILLING_SIMULATION, "01"));
        builder.append("<data>");
        builder.append("<acsimulatereq type=\"record\">");
        builder.append("<Patient_ID type=\"string\">").append(patientId).append("</Patient_ID>");
        builder.append("<Perform_Date type=\"string\">").append(performDate).append("</Perform_Date>");
        builder.append("<Perform_Time type=\"string\"></Perform_Time>");
        builder.append("<Time_Class type=\"string\">0</Time_Class>");
        builder.append("<Diagnosis_Information type=\"record\">");
        builder.append("<Department_Code type=\"string\">").append(departmentCode).append("</Department_Code>");
        builder.append("<Medical_Information type=\"array\">");
        builder.append("<Medical_Information_child type=\"record\">");
        builder.append("<Medical_Class type=\"string\">11</Medical_Class>");
        builder.append("<Medical_Class_Name type=\"string\">Medical</Medical_Class_Name>");
        builder.append("<Medical_Class_Number type=\"string\">1</Medical_Class_Number>");
        builder.append("<Medication_info type=\"array\">");
        int itemCount = 0;
        for (BillingSimulationRequest.BillingItem item : request.getItems()) {
            if (item == null || item.getMedicalCode() == null || item.getMedicalCode().isBlank()) {
                continue;
            }
            int quantity = item.getQuantity();
            if (quantity <= 0) {
                quantity = 1;
            }
            builder.append("<Medication_info_child type=\"record\">");
            builder.append("<Medication_Code type=\"string\">").append(item.getMedicalCode()).append("</Medication_Code>");
            builder.append("<Medication_Number type=\"string\">").append(quantity).append("</Medication_Number>");
            builder.append("</Medication_info_child>");
            itemCount++;
        }
        if (itemCount == 0) {
            throw new OrcaGatewayException("items.medicalCode is required");
        }
        builder.append("</Medication_info>");
        builder.append("</Medical_Information_child>");
        builder.append("</Medical_Information>");
        builder.append("</Diagnosis_Information>");
        builder.append("</acsimulatereq>");
        builder.append("</data>");
        return builder.toString();
    }

    private String buildPatientIdListPayload(PatientIdListRequest request) {
        if (request.getStartDate() == null) {
            throw new OrcaGatewayException("startDate is required");
        }
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : startDate;
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.PATIENT_ID_LIST, null));
        builder.append("<data><patientlst1req>");
        builder.append("<Base_StartDate>").append(startDate).append("</Base_StartDate>");
        builder.append("<Base_StartTime>00:00:00</Base_StartTime>");
        builder.append("<Base_EndDate>").append(endDate).append("</Base_EndDate>");
        builder.append("<Contain_TestPatient_Flag>0</Contain_TestPatient_Flag>");
        builder.append("</patientlst1req></data>");
        return builder.toString();
    }

    private String buildPatientBatchPayload(PatientBatchRequest request) {
        if (request.getPatientIds() == null || request.getPatientIds().isEmpty()) {
            throw new OrcaGatewayException("patientIds is required");
        }
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.PATIENT_BATCH, "01"));
        builder.append("<data>");
        builder.append("<patientlst2req type=\"record\">");
        builder.append("<Patient_ID_Information type=\"array\">");
        int count = 0;
        for (String patientId : request.getPatientIds()) {
            if (patientId == null || patientId.isBlank()) {
                continue;
            }
            String normalized = requireNumericId(patientId, "patientId");
            builder.append("<Patient_ID_Information_child type=\"record\">");
            builder.append("<Patient_ID type=\"string\">").append(normalized).append("</Patient_ID>");
            builder.append("</Patient_ID_Information_child>");
            count++;
        }
        builder.append("</Patient_ID_Information>");
        builder.append("</patientlst2req>");
        builder.append("</data>");
        if (count == 0) {
            throw new OrcaGatewayException("patientIds is required");
        }
        return builder.toString();
    }

    private String buildPatientSearchPayload(PatientNameSearchRequest request) {
        String searchName = request.getName();
        String searchKana = request.getKana();
        if ((searchName == null || searchName.isBlank()) && (searchKana == null || searchKana.isBlank())) {
            throw new OrcaGatewayException("name or kana is required");
        }
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.PATIENT_NAME_SEARCH, null));
        builder.append("<data><patientlst3req>");
        if (searchName != null && !searchName.isBlank()) {
            builder.append("<WholeName>").append(searchName).append("</WholeName>");
        } else {
            builder.append("<WholeName_inKana>").append(searchKana).append("</WholeName_inKana>");
        }
        if (request.getFuzzyMode() != null && !request.getFuzzyMode().isBlank()) {
            builder.append("<Fuzzy_Mode>").append(request.getFuzzyMode()).append("</Fuzzy_Mode>");
        }
        builder.append("</patientlst3req></data>");
        return builder.toString();
    }

    private String buildInsuranceCombinationPayload(InsuranceCombinationRequest request) {
        String patientId = requireText(request.getPatientId(), "patientId");
        String baseDate = request.getRangeStart() != null ? request.getRangeStart() : LocalDate.now().toString();
        String startDate = request.getRangeStart() != null ? request.getRangeStart() : baseDate;
        String endDate = request.getRangeEnd() != null ? request.getRangeEnd() : baseDate;
        String requestNumber = "P6-" + LocalDate.now();
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.INSURANCE_COMBINATION, null));
        builder.append("<data><patientlst6req>");
        builder.append("<Reqest_Number>").append(requestNumber).append("</Reqest_Number>");
        builder.append("<Patient_ID>").append(patientId).append("</Patient_ID>");
        builder.append("<Base_Date>").append(baseDate).append("</Base_Date>");
        builder.append("<Start_Date>").append(startDate).append("</Start_Date>");
        builder.append("<End_Date>").append(endDate).append("</End_Date>");
        builder.append("</patientlst6req></data>");
        return builder.toString();
    }

    private String buildFormerNameHistoryPayload(FormerNameHistoryRequest request) {
        String patientId = requireText(request.getPatientId(), "patientId");
        String requestNumber = "FORMER-NAME-" + LocalDate.now();
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.FORMER_NAME_HISTORY, null));
        builder.append("<data><patientlst8req>");
        builder.append("<Request_Number>").append(requestNumber).append("</Request_Number>");
        builder.append("<Patient_ID>").append(patientId).append("</Patient_ID>");
        builder.append("</patientlst8req></data>");
        return builder.toString();
    }

    private String buildAppointmentMutationPayload(AppointmentMutationRequest request) {
        String requestNumber = normalizeAppointmentClass(request.getRequestNumber());
        String patientId = request.getPatient() != null ? request.getPatient().getPatientId() : null;
        patientId = requireText(patientId, "patientId");
        String appointmentDate = requireText(request.getAppointmentDate(), "appointmentDate");
        String appointmentTime = requireText(request.getAppointmentTime(), "appointmentTime");
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.APPOINTMENT_MUTATION, requestNumber));
        builder.append("<data><appointreq>");
        builder.append("<Patient_ID>").append(patientId).append("</Patient_ID>");
        if (request.getPatient() != null) {
            if (request.getPatient().getWholeName() != null && !request.getPatient().getWholeName().isBlank()) {
                builder.append("<WholeName>").append(request.getPatient().getWholeName()).append("</WholeName>");
            }
            if (request.getPatient().getWholeNameKana() != null && !request.getPatient().getWholeNameKana().isBlank()) {
                builder.append("<WholeName_inKana>").append(request.getPatient().getWholeNameKana())
                        .append("</WholeName_inKana>");
            }
        }
        builder.append("<Appointment_Date>").append(appointmentDate).append("</Appointment_Date>");
        builder.append("<Appointment_Time>").append(appointmentTime).append("</Appointment_Time>");
        if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
            builder.append("<Appointment_Id>").append(request.getAppointmentId()).append("</Appointment_Id>");
        }
        if (request.getDepartmentCode() != null && !request.getDepartmentCode().isBlank()) {
            builder.append("<Department_Code>").append(request.getDepartmentCode()).append("</Department_Code>");
        }
        if (request.getPhysicianCode() != null && !request.getPhysicianCode().isBlank()) {
            builder.append("<Physician_Code>").append(request.getPhysicianCode()).append("</Physician_Code>");
        }
        if (request.getMedicalInformation() != null && !request.getMedicalInformation().isBlank()) {
            builder.append("<Medical_Information>").append(request.getMedicalInformation()).append("</Medical_Information>");
        }
        if (request.getAppointmentInformation() != null && !request.getAppointmentInformation().isBlank()) {
            builder.append("<Appointment_Information>").append(request.getAppointmentInformation())
                    .append("</Appointment_Information>");
        }
        if (request.getAppointmentNote() != null && !request.getAppointmentNote().isBlank()) {
            builder.append("<Appointment_Note>").append(request.getAppointmentNote()).append("</Appointment_Note>");
        }
        if (request.getDuplicateMode() != null && !request.getDuplicateMode().isBlank()) {
            builder.append("<Duplicate_Mode>").append(request.getDuplicateMode()).append("</Duplicate_Mode>");
        }
        if (request.getVisitInformation() != null && !request.getVisitInformation().isBlank()) {
            builder.append("<Visit_Information>").append(request.getVisitInformation()).append("</Visit_Information>");
        }
        builder.append("</appointreq></data>");
        return builder.toString();
    }

    private String buildVisitMutationPayload(VisitMutationRequest request) {
        String requestNumber = normalizeAcceptRequestNumber(request.getRequestNumber());
        String patientId = requireText(request.getPatientId(), "patientId");
        StringBuilder builder = new StringBuilder();
        builder.append(buildOrcaMeta(OrcaEndpoint.ACCEPTANCE_MUTATION, null));
        builder.append("<data><acceptreq>");
        builder.append("<Request_Number>").append(requestNumber).append("</Request_Number>");
        builder.append("<Patient_ID>").append(patientId).append("</Patient_ID>");
        if (request.getWholeName() != null && !request.getWholeName().isBlank()) {
            builder.append("<WholeName>").append(request.getWholeName()).append("</WholeName>");
        }
        if (request.getAcceptancePush() != null && !request.getAcceptancePush().isBlank()) {
            builder.append("<Acceptance_Push>").append(request.getAcceptancePush()).append("</Acceptance_Push>");
        }
        if (request.getAcceptanceDate() != null && !request.getAcceptanceDate().isBlank()) {
            builder.append("<Acceptance_Date>").append(request.getAcceptanceDate()).append("</Acceptance_Date>");
        }
        if (request.getAcceptanceTime() != null && !request.getAcceptanceTime().isBlank()) {
            builder.append("<Acceptance_Time>").append(request.getAcceptanceTime()).append("</Acceptance_Time>");
        }
        if (request.getAcceptanceId() != null && !request.getAcceptanceId().isBlank()) {
            builder.append("<Acceptance_Id>").append(request.getAcceptanceId()).append("</Acceptance_Id>");
        }
        if (request.getDepartmentCode() != null && !request.getDepartmentCode().isBlank()) {
            builder.append("<Department_Code>").append(request.getDepartmentCode()).append("</Department_Code>");
        }
        if (request.getPhysicianCode() != null && !request.getPhysicianCode().isBlank()) {
            builder.append("<Physician_Code>").append(request.getPhysicianCode()).append("</Physician_Code>");
        }
        if (request.getMedicalInformation() != null && !request.getMedicalInformation().isBlank()) {
            builder.append("<Medical_Information>").append(request.getMedicalInformation()).append("</Medical_Information>");
        }
        if (request.getInsurances() != null && !request.getInsurances().isEmpty()) {
            for (VisitMutationRequest.InsuranceInformation insurance : request.getInsurances()) {
                if (insurance == null) {
                    continue;
                }
                builder.append("<HealthInsurance_Information>");
                appendTag(builder, "Insurance_Combination_Number", insurance.getInsuranceCombinationNumber());
                appendTag(builder, "InsuranceProvider_Class", insurance.getInsuranceProviderClass());
                appendTag(builder, "InsuranceProvider_Number", insurance.getInsuranceProviderNumber());
                appendTag(builder, "InsuranceProvider_WholeName", insurance.getInsuranceProviderWholeName());
                appendTag(builder, "HealthInsuredPerson_Symbol", insurance.getHealthInsuredPersonSymbol());
                appendTag(builder, "HealthInsuredPerson_Number", insurance.getHealthInsuredPersonNumber());
                appendTag(builder, "HealthInsuredPerson_Branch_Number", insurance.getHealthInsuredPersonBranchNumber());
                appendTag(builder, "HealthInsuredPerson_Continuation", insurance.getHealthInsuredPersonContinuation());
                appendTag(builder, "RelationToInsuredPerson", insurance.getRelationToInsuredPerson());
                appendTag(builder, "Certificate_StartDate", insurance.getCertificateStartDate());
                appendTag(builder, "Certificate_ExpiredDate", insurance.getCertificateExpiredDate());
                if (insurance.getPublicInsurances() != null && !insurance.getPublicInsurances().isEmpty()) {
                    for (VisitMutationRequest.PublicInsuranceInformation publicInsurance : insurance.getPublicInsurances()) {
                        if (publicInsurance == null) {
                            continue;
                        }
                        builder.append("<PublicInsurance_Information>");
                        appendTag(builder, "PublicInsurance_Class", publicInsurance.getPublicInsuranceClass());
                        appendTag(builder, "PublicInsurance_Name", publicInsurance.getPublicInsuranceName());
                        appendTag(builder, "PublicInsuredPerson_Number", publicInsurance.getPublicInsuredPersonNumber());
                        appendTag(builder, "Rate_Admission", publicInsurance.getRateAdmission());
                        appendTag(builder, "Rate_Outpatient", publicInsurance.getRateOutpatient());
                        builder.append("</PublicInsurance_Information>");
                    }
                }
                builder.append("</HealthInsurance_Information>");
            }
        }
        builder.append("</acceptreq></data>");
        return builder.toString();
    }

    private void appendTag(StringBuilder builder, String tag, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        builder.append('<').append(tag).append('>').append(value).append("</").append(tag).append('>');
    }
}
