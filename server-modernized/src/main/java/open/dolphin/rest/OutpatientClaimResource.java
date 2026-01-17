package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.rest.dto.outpatient.ClaimOutpatientResponse;
import open.dolphin.rest.dto.outpatient.OutpatientFlagResponse;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PVTServiceBean;
import open.dolphin.touch.converter.IOSHelper;

/**
 * `/api01rv2/claim/outpatient/*` を実データへ切替し、telemetry/audit を整合させる。
 */
@Path("/api01rv2/claim/outpatient")
public class OutpatientClaimResource extends AbstractResource {

    private static final String DATA_SOURCE = "server";
    private static final DateTimeFormatter RUN_ID_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    private PVTServiceBean pvtServiceBean;

    @Inject
    private KarteServiceBean karteServiceBean;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public ClaimOutpatientResponse postOutpatientClaim(@Context HttpServletRequest request, Map<String, Object> payload) {
        return buildResponse(request, payload, resolveResourcePath(request, getDefaultResourcePath()));
    }

    @POST
    @Path("/{subPath: .+}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public ClaimOutpatientResponse postOutpatientClaimSubPath(@Context HttpServletRequest request,
            @PathParam("subPath") String subPath, Map<String, Object> payload) {
        if ("mock".equals(subPath)) {
            throw restError(request, Response.Status.NOT_FOUND, "not_found", "mock endpoint is deprecated");
        }
        String fallback = getDefaultResourcePath() + "/" + subPath;
        return buildResponse(request, payload, resolveResourcePath(request, fallback));
    }

    protected ClaimOutpatientResponse buildResponse(HttpServletRequest request, Map<String, Object> payload, String resourcePath) {
        String runId = resolveRunId(request);
        String traceId = resolveTraceId(request);
        String requestId = resolveRequestId(request, traceId);
        String facilityId = resolveFacilityId(request);

        List<PatientVisitModel> visits = fetchVisits(facilityId, payload);
        List<ClaimOutpatientResponse.ClaimBundleEntry> bundles = new ArrayList<>();
        Set<String> patientIds = new LinkedHashSet<>();
        Set<String> appointmentIds = new LinkedHashSet<>();
        boolean allPaid = true;
        for (PatientVisitModel visit : visits) {
            if (visit == null || visit.getPatientModel() == null) {
                continue;
            }
            PatientModel patient = visit.getPatientModel();
            String patientId = patient.getPatientId();
            String appointmentId = resolveAppointmentId(visit);
            if (patientId != null && !patientId.isBlank()) {
                patientIds.add(patientId);
            }
            if (appointmentId != null && !appointmentId.isBlank()) {
                appointmentIds.add(appointmentId);
            }
            String claimStatus = resolveClaimStatus(visit);
            if (!"会計済み".equals(claimStatus)) {
                allPaid = false;
            }
            bundles.addAll(resolveClaimBundles(facilityId, patientId, appointmentId, claimStatus));
        }

        ClaimOutpatientResponse response = new ClaimOutpatientResponse();
        response.setRunId(runId);
        response.setTraceId(traceId);
        response.setRequestId(requestId);
        response.setDataSource(DATA_SOURCE);
        response.setDataSourceTransition(DATA_SOURCE);
        response.setCacheHit(false);
        response.setMissingMaster(false);
        response.setFallbackUsed(false);
        response.setFetchedAt(Instant.now().toString());
        response.setClaimBundles(bundles);
        response.setRecordsReturned(bundles.size());
        String claimStatus = bundles.isEmpty() ? null : (allPaid ? "会計済み" : "会計待ち");
        response.setClaimStatus(claimStatus);
        response.setClaimStatusText(claimStatus);

        String outcome = bundles.isEmpty() ? "MISSING" : "SUCCESS";
        Map<String, Object> details = buildAuditDetails(facilityId, runId, bundles, claimStatus, resourcePath,
                patientIds, appointmentIds, outcome);
        OutpatientFlagResponse.AuditEvent auditEvent = new OutpatientFlagResponse.AuditEvent();
        auditEvent.setAction(getAuditAction());
        auditEvent.setResource(resourcePath);
        auditEvent.setOutcome("SUCCESS");
        auditEvent.setDetails(details);
        auditEvent.setTraceId(traceId);
        auditEvent.setRequestId(requestId);
        response.setAuditEvent(auditEvent);

        dispatchAuditEvent(request, auditEvent);
        return response;
    }

    private Map<String, Object> buildAuditDetails(String facilityId, String runId,
            List<ClaimOutpatientResponse.ClaimBundleEntry> bundles, String claimStatus, String resource,
            Set<String> patientIds, Set<String> appointmentIds, String outcome) {
        Map<String, Object> details = new LinkedHashMap<>();
        if (facilityId != null && !facilityId.isBlank()) {
            details.put("facilityId", facilityId);
        }
        details.put("resource", resource);
        if (patientIds != null && !patientIds.isEmpty()) {
            if (patientIds.size() == 1) {
                details.put("patientId", patientIds.iterator().next());
            }
            details.put("patientIds", new ArrayList<>(patientIds));
        }
        if (appointmentIds != null && !appointmentIds.isEmpty()) {
            if (appointmentIds.size() == 1) {
                details.put("appointmentId", appointmentIds.iterator().next());
            }
            details.put("appointmentIds", new ArrayList<>(appointmentIds));
        }
        details.put("runId", runId);
        details.put("dataSource", DATA_SOURCE);
        details.put("dataSourceTransition", DATA_SOURCE);
        details.put("cacheHit", false);
        details.put("missingMaster", false);
        details.put("fallbackUsed", false);
        details.put("fetchedAt", Instant.now().toString());
        details.put("recordsReturned", bundles != null ? bundles.size() : 0);
        details.put("claimBundles", bundles != null ? bundles.size() : 0);
        if (outcome != null) {
            details.put("outcome", outcome);
        }
        if (claimStatus != null) {
            details.put("claimStatus", claimStatus);
        }
        String operation = getOperationName();
        if (operation != null && !operation.isBlank()) {
            details.put("operation", operation);
        }
        details.put("telemetryFunnelStage", "resolve_master");
        return details;
    }

    private void dispatchAuditEvent(HttpServletRequest request, OutpatientFlagResponse.AuditEvent auditEvent) {
        if (sessionAuditDispatcher == null || auditEvent == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction(auditEvent.getAction());
        payload.setResource(auditEvent.getResource());
        payload.setDetails(auditEvent.getDetails());
        payload.setTraceId(auditEvent.getTraceId());
        payload.setRequestId(auditEvent.getRequestId());
        if (request != null) {
            payload.setActorId(request.getRemoteUser());
            payload.setIpAddress(request.getRemoteAddr());
            payload.setUserAgent(request.getHeader("User-Agent"));
        }
        if (payload.getTraceId() == null || payload.getTraceId().isBlank()) {
            payload.setTraceId(resolveTraceId(request));
        }
        if (payload.getRequestId() == null || payload.getRequestId().isBlank()) {
            payload.setRequestId(payload.getTraceId());
        }
        sessionAuditDispatcher.record(payload, AuditEventEnvelope.Outcome.SUCCESS, null, null);
    }

    private String resolveRunId(HttpServletRequest request) {
        if (request != null) {
            String header = request.getHeader("X-Run-Id");
            if (header != null && !header.isBlank()) {
                return header.trim();
            }
        }
        return RUN_ID_FORMAT.format(Instant.now());
    }

    private String resolveRequestId(HttpServletRequest request, String traceId) {
        if (request != null) {
            String header = request.getHeader("X-Request-Id");
            if (header != null && !header.isBlank()) {
                return header.trim();
            }
        }
        return traceId;
    }

    protected String getDefaultResourcePath() {
        return "/api01rv2/claim/outpatient";
    }

    protected String getAuditAction() {
        return "ORCA_CLAIM_OUTPATIENT";
    }

    protected String getOperationName() {
        return "claim_outpatient";
    }

    protected String resolveResourcePath(HttpServletRequest request, String fallback) {
        if (request != null) {
            String uri = request.getRequestURI();
            if (uri != null && !uri.isBlank()) {
                return uri;
            }
        }
        return fallback;
    }

    private String resolveFacilityId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteUser = request.getRemoteUser();
        if (remoteUser != null && remoteUser.contains(IInfoModel.COMPOSITE_KEY_MAKER)) {
            return getRemoteFacility(remoteUser);
        }
        String header = request.getHeader("X-Facility-Id");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        String legacy = request.getHeader("facilityId");
        if (legacy != null && !legacy.isBlank()) {
            return legacy.trim();
        }
        return getRemoteFacility(remoteUser);
    }

    private List<PatientVisitModel> fetchVisits(String facilityId, Map<String, Object> payload) {
        if (pvtServiceBean == null || facilityId == null || facilityId.isBlank()) {
            return List.of();
        }
        LocalDate targetDate = resolveTargetDate(payload);
        return pvtServiceBean.getPvt(facilityId, targetDate.toString(), 0, null, null);
    }

    private LocalDate resolveTargetDate(Map<String, Object> payload) {
        if (payload == null) {
            return LocalDate.now();
        }
        Object value = payload.get("date");
        if (value == null) {
            value = payload.get("appointmentDate");
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return LocalDate.parse(text);
            } catch (Exception ignored) {
            }
        }
        return LocalDate.now();
    }

    private String resolveAppointmentId(PatientVisitModel visit) {
        if (visit == null) {
            return null;
        }
        if (visit.getAppointment() != null && !visit.getAppointment().isBlank()) {
            return visit.getAppointment();
        }
        long id = visit.getId();
        return id > 0 ? String.valueOf(id) : null;
    }

    private String resolveClaimStatus(PatientVisitModel visit) {
        if (visit == null) {
            return null;
        }
        boolean saved = visit.getStateBit(PatientVisitModel.BIT_SAVE_CLAIM);
        return saved ? "会計済み" : "会計待ち";
    }

    private List<ClaimOutpatientResponse.ClaimBundleEntry> resolveClaimBundles(String facilityId, String patientId,
            String appointmentId, String claimStatus) {
        if (karteServiceBean == null || patientId == null || patientId.isBlank()) {
            return List.of();
        }
        KarteBean karte = karteServiceBean.getKarte(facilityId, patientId, null);
        if (karte == null) {
            return List.of();
        }
        Date fromDate = java.util.Date.from(Instant.now().minusSeconds(60L * 60L * 24L));
        List<DocInfoModel> docInfos = karteServiceBean.getDocumentList(karte.getId(), fromDate, true);
        if (docInfos == null || docInfos.isEmpty()) {
            return List.of();
        }
        DocInfoModel latest = docInfos.stream()
                .max(Comparator.comparing(this::resolveDocDate))
                .orElse(null);
        if (latest == null || latest.getDocPk() <= 0) {
            return List.of();
        }
        List<DocumentModel> documents = karteServiceBean.getDocuments(List.of(latest.getDocPk()));
        if (documents == null || documents.isEmpty()) {
            return List.of();
        }
        DocumentModel document = documents.get(0);
        String performTime = formatDate(document.getStarted() != null ? document.getStarted() : document.getConfirmed());
        List<ClaimOutpatientResponse.ClaimBundleEntry> bundles = new ArrayList<>();
        if (document.getModules() == null) {
            return bundles;
        }
        for (ModuleModel module : document.getModules()) {
            Object decoded = decodeModule(module);
            if (decoded instanceof BundleDolphin bundle) {
                if (bundle.getOrderName() == null && module.getModuleInfoBean() != null) {
                    bundle.setOrderName(module.getModuleInfoBean().getEntity());
                }
                ClaimOutpatientResponse.ClaimBundleEntry entry = toClaimBundle(bundle, patientId, appointmentId, performTime, claimStatus);
                bundles.add(entry);
            }
        }
        return bundles;
    }

    private Date resolveDocDate(DocInfoModel info) {
        if (info == null) {
            return new Date(0);
        }
        if (info.getConfirmDate() != null) {
            return info.getConfirmDate();
        }
        if (info.getFirstConfirmDate() != null) {
            return info.getFirstConfirmDate();
        }
        return new Date(0);
    }

    private Object decodeModule(ModuleModel module) {
        if (module == null || module.getBeanBytes() == null || module.getBeanBytes().length == 0) {
            return null;
        }
        try {
            return IOSHelper.xmlDecode(module.getBeanBytes());
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private ClaimOutpatientResponse.ClaimBundleEntry toClaimBundle(BundleDolphin bundle, String patientId,
            String appointmentId, String performTime, String claimStatus) {
        ClaimOutpatientResponse.ClaimBundleEntry entry = new ClaimOutpatientResponse.ClaimBundleEntry();
        entry.setBundleNumber(bundle.getBundleNumber());
        entry.setClassCode(bundle.getClassCode());
        entry.setPatientId(patientId);
        entry.setAppointmentId(appointmentId);
        entry.setPerformTime(performTime);
        entry.setClaimStatus(claimStatus);
        entry.setClaimStatusText(claimStatus);
        List<ClaimOutpatientResponse.ClaimBundleItem> items = new ArrayList<>();
        ClaimItem[] claimItems = bundle.getClaimItem();
        if (claimItems != null) {
            for (ClaimItem item : claimItems) {
                ClaimOutpatientResponse.ClaimBundleItem dto = new ClaimOutpatientResponse.ClaimBundleItem();
                dto.setCode(item.getCode());
                dto.setName(item.getName());
                dto.setNumber(parseNumber(item.getNumber()));
                dto.setUnit(item.getUnit());
                items.add(dto);
            }
        }
        entry.setItems(items);
        return entry;
    }

    private Number parseNumber(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            if (value.contains(".")) {
                return Double.parseDouble(value);
            }
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String formatDate(Date date) {
        if (date == null) {
            return null;
        }
        return Instant.ofEpochMilli(date.getTime()).toString();
    }
}
