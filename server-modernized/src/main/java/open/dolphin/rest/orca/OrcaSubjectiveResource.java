package open.dolphin.rest.orca;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModelUtils;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.ProgressCourse;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.orca.SubjectiveEntryRequest;
import open.dolphin.rest.dto.orca.SubjectiveEntryResponse;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PatientServiceBean;
import open.dolphin.session.UserServiceBean;
import open.dolphin.touch.converter.IOSHelper;

/**
 * Spec-based stub for `/orca25/subjectivesv2`.
 */
@Path("/orca/chart")
public class OrcaSubjectiveResource extends AbstractOrcaRestResource {

    private static final int MAX_BODY_LENGTH = 1000;

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private KarteServiceBean karteServiceBean;

    @Inject
    private UserServiceBean userServiceBean;

    @POST
    @Path("/subjectives")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public SubjectiveEntryResponse postSubjective(@Context HttpServletRequest request,
            SubjectiveEntryRequest payload) {

        String runId = resolveRunId(request);
        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        if (payload == null || payload.getPatientId() == null || payload.getPatientId().isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("runId", runId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "patientId");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "patientId is required");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "patientId", "patientId is required");
        }

        if (!OrcaPostFeatureFlags.useRealSubjectives()) {
            SubjectiveEntryResponse response = buildStubResponse(runId);
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            audit.put("status", "blocked");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            return response;
        }

        String soapCategory = normalizeSoapCategory(payload.getSoapCategory());
        if (soapCategory == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "soapCategory");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "soapCategory is required");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "soapCategory", "soapCategory is required");
        }
        if (!isValidSoapCategory(soapCategory)) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "soapCategory");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "soapCategory must be S/O/A/P");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "soapCategory", "soapCategory must be S/O/A/P");
        }

        String body = payload.getBody();
        if (body == null || body.isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "body");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "body is required");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "body", "body is required");
        }
        if (body.length() > MAX_BODY_LENGTH) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "body");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "body must be <= 1000 characters");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.BAD_REQUEST, "invalid_request",
                    "body must be <= 1000 characters");
        }

        PatientModel patient = patientServiceBean.getPatientById(facilityId, payload.getPatientId());
        if (patient == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(),
                    "patient_not_found", "Patient not found");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "patient_not_found", "Patient not found");
        }

        String remoteUser = request.getRemoteUser();
        UserModel user = userServiceBean.getUser(remoteUser);
        if (user == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            markFailureDetails(audit, Response.Status.UNAUTHORIZED.getStatusCode(),
                    "user_not_found", "User not found");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.UNAUTHORIZED, "user_not_found", "User not found");
        }

        Date performDate = parseDate(payload.getPerformDate(), new Date());
        KarteBean karte = karteServiceBean.getKarte(facilityId, payload.getPatientId(), ModelUtils.AD1800);
        if (karte == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(),
                    "karte_not_found", "Karte not found");
            recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "karte_not_found", "Karte not found");
        }

        DocumentModel document = buildSubjectiveDocument(karte, user, payload, performDate, body, soapCategory);
        long documentId = karteServiceBean.addDocument(document);

        SubjectiveEntryResponse response = new SubjectiveEntryResponse();
        response.setApiResult("00");
        response.setApiResultMessage("処理終了");
        response.setRunId(runId);
        response.setRecordedAt(Instant.now().toString());
        response.setMessageDetail("主訴を登録しました。");

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", payload.getPatientId());
        audit.put("runId", runId);
        audit.put("soapCategory", soapCategory);
        audit.put("documentId", documentId);
        markSuccessDetails(audit);
        recordAudit(request, "ORCA_SUBJECTIVES_MUTATION", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    private SubjectiveEntryResponse buildStubResponse(String runId) {
        SubjectiveEntryResponse response = new SubjectiveEntryResponse();
        response.setApiResult("79");
        response.setApiResultMessage("Spec-based implementation / Trial未検証");
        response.setRunId(runId);
        response.setRecordedAt(Instant.now().toString());
        response.setMessageDetail("WebORCA Trial では subjectivesv2 が未開放のためローカル記録は行っていません。");
        return response;
    }

    private DocumentModel buildSubjectiveDocument(KarteBean karte, UserModel user, SubjectiveEntryRequest payload,
            Date performDate, String body, String soapCategory) {
        Date now = new Date();
        DocumentModel document = new DocumentModel();
        document.setKarteBean(karte);
        document.setUserModel(user);
        document.setStarted(performDate);
        document.setConfirmed(performDate);
        document.setRecorded(now);
        document.setStatus(IInfoModel.STATUS_FINAL);

        String docId = UUID.randomUUID().toString().replace("-", "");
        document.getDocInfoModel().setDocId(docId);
        document.getDocInfoModel().setDocType(IInfoModel.DOCTYPE_KARTE);
        document.getDocInfoModel().setTitle("主訴");
        document.getDocInfoModel().setPurpose(IInfoModel.PURPOSE_RECORD);
        document.getDocInfoModel().setVersionNumber("1.0");

        ProgressCourse progress = new ProgressCourse();
        progress.setFreeText(body);

        ModuleModel module = new ModuleModel();
        module.setModel(progress);
        module.setBeanBytes(IOSHelper.toXMLBytes(progress));
        module.setBeanJson(ModelUtils.jsonEncode(progress));
        module.setConfirmed(performDate);
        module.setStarted(performDate);
        module.setRecorded(now);
        module.setStatus(IInfoModel.STATUS_FINAL);
        module.setUserModel(user);
        module.setKarteBean(karte);
        module.getModuleInfoBean().setStampName(IInfoModel.MODULE_PROGRESS_COURSE);
        module.getModuleInfoBean().setStampRole(resolveStampRole(soapCategory));
        module.getModuleInfoBean().setEntity(IInfoModel.MODULE_PROGRESS_COURSE);
        module.getModuleInfoBean().setStampNumber(0);
        module.setDocumentModel(document);
        document.addModule(module);

        return document;
    }

    private String normalizeSoapCategory(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private boolean isValidSoapCategory(String value) {
        return "S".equals(value) || "O".equals(value) || "A".equals(value) || "P".equals(value);
    }

    private String resolveStampRole(String soapCategory) {
        if ("P".equals(soapCategory)) {
            return IInfoModel.ROLE_P_SPEC;
        }
        return IInfoModel.ROLE_SOA_SPEC;
    }

    private Date parseDate(String input, Date defaultValue) {
        if (input == null || input.isBlank()) {
            return defaultValue;
        }
        Date parsed = ModelUtils.getDateAsObject(input);
        return parsed != null ? parsed : defaultValue;
    }
}
