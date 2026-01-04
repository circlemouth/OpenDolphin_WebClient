package open.dolphin.rest.dto.outpatient;

import java.util.ArrayList;
import java.util.List;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientSummary;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;

/**
 * Outpatient appointment response with audit/telemetry metadata.
 */
public class AppointmentOutpatientResponse {

    private String runId;
    private String traceId;
    private String requestId;
    private String dataSource;
    private String dataSourceTransition;
    private boolean cacheHit;
    private boolean missingMaster;
    private boolean fallbackUsed;
    private String fetchedAt;
    private Integer recordsReturned;
    private String apiResult;
    private String apiResultMessage;
    private String blockerTag;
    private String appointmentDate;
    private String baseDate;
    private String visitDate;
    private PatientSummary patient;
    private List<OrcaAppointmentListResponse.AppointmentSlot> slots = new ArrayList<>();
    private List<PatientAppointmentListResponse.PatientAppointment> reservations = new ArrayList<>();
    private List<VisitPatientListResponse.VisitEntry> visits = new ArrayList<>();
    private OutpatientFlagResponse.AuditEvent auditEvent;

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public String getDataSourceTransition() {
        return dataSourceTransition;
    }

    public void setDataSourceTransition(String dataSourceTransition) {
        this.dataSourceTransition = dataSourceTransition;
    }

    public boolean isCacheHit() {
        return cacheHit;
    }

    public void setCacheHit(boolean cacheHit) {
        this.cacheHit = cacheHit;
    }

    public boolean isMissingMaster() {
        return missingMaster;
    }

    public void setMissingMaster(boolean missingMaster) {
        this.missingMaster = missingMaster;
    }

    public boolean isFallbackUsed() {
        return fallbackUsed;
    }

    public void setFallbackUsed(boolean fallbackUsed) {
        this.fallbackUsed = fallbackUsed;
    }

    public String getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(String fetchedAt) {
        this.fetchedAt = fetchedAt;
    }

    public Integer getRecordsReturned() {
        return recordsReturned;
    }

    public void setRecordsReturned(Integer recordsReturned) {
        this.recordsReturned = recordsReturned;
    }

    public String getApiResult() {
        return apiResult;
    }

    public void setApiResult(String apiResult) {
        this.apiResult = apiResult;
    }

    public String getApiResultMessage() {
        return apiResultMessage;
    }

    public void setApiResultMessage(String apiResultMessage) {
        this.apiResultMessage = apiResultMessage;
    }

    public String getBlockerTag() {
        return blockerTag;
    }

    public void setBlockerTag(String blockerTag) {
        this.blockerTag = blockerTag;
    }

    public String getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(String appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getBaseDate() {
        return baseDate;
    }

    public void setBaseDate(String baseDate) {
        this.baseDate = baseDate;
    }

    public String getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(String visitDate) {
        this.visitDate = visitDate;
    }

    public PatientSummary getPatient() {
        return patient;
    }

    public void setPatient(PatientSummary patient) {
        this.patient = patient;
    }

    public List<OrcaAppointmentListResponse.AppointmentSlot> getSlots() {
        return slots;
    }

    public void setSlots(List<OrcaAppointmentListResponse.AppointmentSlot> slots) {
        this.slots = slots != null ? slots : new ArrayList<>();
    }

    public List<PatientAppointmentListResponse.PatientAppointment> getReservations() {
        return reservations;
    }

    public void setReservations(List<PatientAppointmentListResponse.PatientAppointment> reservations) {
        this.reservations = reservations != null ? reservations : new ArrayList<>();
    }

    public List<VisitPatientListResponse.VisitEntry> getVisits() {
        return visits;
    }

    public void setVisits(List<VisitPatientListResponse.VisitEntry> visits) {
        this.visits = visits != null ? visits : new ArrayList<>();
    }

    public OutpatientFlagResponse.AuditEvent getAuditEvent() {
        return auditEvent;
    }

    public void setAuditEvent(OutpatientFlagResponse.AuditEvent auditEvent) {
        this.auditEvent = auditEvent;
    }
}
