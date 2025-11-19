package open.dolphin.orca.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.orca.converter.OrcaXmlMapper;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransport;
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

    private final OrcaTransport transport;
    private final OrcaXmlMapper mapper;

    /**
     * No-args constructor for CDI proxying.
     */
    protected OrcaWrapperService() {
        this.transport = null;
        this.mapper = null;
    }

    @Inject
    public OrcaWrapperService(OrcaTransport transport, OrcaXmlMapper mapper) {
        this.transport = transport;
        this.mapper = mapper;
    }

    public OrcaAppointmentListResponse getAppointmentList(OrcaAppointmentListRequest request) {
        ensureNotNull(request, "appointment request");
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
        String xml = transport.invoke(OrcaEndpoint.PATIENT_APPOINTMENT_LIST, "");
        PatientAppointmentListResponse response = mapper.toPatientAppointments(xml);
        enrich(response);
        return response;
    }

    public BillingSimulationResponse simulateBilling(BillingSimulationRequest request) {
        ensureNotNull(request, "billing simulation request");
        String xml = transport.invoke(OrcaEndpoint.BILLING_SIMULATION, "");
        BillingSimulationResponse response = mapper.toBillingSimulation(xml);
        enrich(response);
        return response;
    }

    public VisitPatientListResponse getVisitList(VisitPatientListRequest request) {
        ensureNotNull(request, "visit list request");
        String xml = transport.invoke(OrcaEndpoint.VISIT_LIST, "");
        VisitPatientListResponse response = mapper.toVisitList(xml);
        enrich(response);
        return response;
    }

    public PatientIdListResponse getPatientIdList(PatientIdListRequest request) {
        ensureNotNull(request, "patient id list request");
        String xml = transport.invoke(OrcaEndpoint.PATIENT_ID_LIST, "");
        PatientIdListResponse response = mapper.toPatientIdList(xml);
        enrich(response);
        return response;
    }

    public PatientBatchResponse getPatientBatch(PatientBatchRequest request) {
        ensureNotNull(request, "patient batch request");
        String xml = transport.invoke(OrcaEndpoint.PATIENT_BATCH, "");
        PatientBatchResponse response = mapper.toPatientBatch(xml);
        enrich(response);
        return response;
    }

    public PatientSearchResponse searchPatients(PatientNameSearchRequest request) {
        ensureNotNull(request, "patient search request");
        String xml = transport.invoke(OrcaEndpoint.PATIENT_NAME_SEARCH, "");
        String searchTerm = request.getName() != null ? request.getName() : request.getKana();
        PatientSearchResponse response = mapper.toPatientSearch(xml, searchTerm);
        enrich(response);
        return response;
    }

    public InsuranceCombinationResponse getInsuranceCombinations(InsuranceCombinationRequest request) {
        ensureNotNull(request, "insurance combination request");
        String xml = transport.invoke(OrcaEndpoint.INSURANCE_COMBINATION, "");
        InsuranceCombinationResponse response = mapper.toInsuranceCombination(xml);
        enrich(response);
        return response;
    }

    public FormerNameHistoryResponse getFormerNames(FormerNameHistoryRequest request) {
        ensureNotNull(request, "former name request");
        String xml = transport.invoke(OrcaEndpoint.FORMER_NAME_HISTORY, "");
        FormerNameHistoryResponse response = mapper.toFormerNames(xml);
        enrich(response);
        return response;
    }

    public AppointmentMutationResponse mutateAppointment(AppointmentMutationRequest request) {
        ensureNotNull(request, "appointment mutation request");
        String xml = transport.invoke(OrcaEndpoint.APPOINTMENT_MUTATION, "");
        AppointmentMutationResponse response = mapper.toAppointmentMutation(xml);
        enrich(response);
        return response;
    }

    public VisitMutationResponse mutateVisit(VisitMutationRequest request) {
        ensureNotNull(request, "visit mutation request");
        String xml = transport.invoke(OrcaEndpoint.ACCEPTANCE_MUTATION, "");
        VisitMutationResponse response = mapper.toVisitMutation(xml);
        enrich(response);
        return response;
    }

    private void enrich(OrcaApiResponse response) {
        if (response != null) {
            response.setRunId(RUN_ID);
            response.setBlockerTag(BLOCKER_TAG);
        }
    }

    private void ensureNotNull(Object target, String label) {
        if (target == null) {
            throw new OrcaGatewayException(label + " must not be null");
        }
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
        builder.append("<!-- orca-meta: path=")
                .append(OrcaEndpoint.APPOINTMENT_LIST.getPath())
                .append(" method=POST query=class=01 -->");
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
}
