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
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModelUtils;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.rest.dto.orca.MedicalGetRequest;
import open.dolphin.rest.dto.orca.MedicalGetResponse;
import open.dolphin.rest.dto.orca.MedicalGetResponse.MedicalRecordEntry;
import open.dolphin.rest.dto.orca.MedicalGetResponse.PatientSummary;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PatientServiceBean;

/**
 * ORCA medical record wrapper (`/orca/medical`).
 */
@Path("/orca/medical")
public class OrcaMedicalResource extends AbstractOrcaRestResource {

    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd", Locale.JAPAN);

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private KarteServiceBean karteServiceBean;

    @POST
    @Path("/records")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public MedicalGetResponse postMedicalRecords(@Context HttpServletRequest request, MedicalGetRequest payload) {

        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);

        if (payload == null || payload.getPatientId() == null || payload.getPatientId().isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "patientId");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "Patient_ID is required");
            recordAudit(request, "ORCA_MEDICAL_GET", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "patientId", "Patient_ID is required");
        }

        if (!OrcaPostFeatureFlags.useRealMedicalRecords()) {
            MedicalGetResponse response = buildStubResponse();
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("status", "blocked");
            recordAudit(request, "ORCA_MEDICAL_GET", audit, AuditEventEnvelope.Outcome.FAILURE);
            return response;
        }

        Date fromDate = parseDate(payload.getFromDate(), ModelUtils.AD1800);
        Date toDate = parseDate(payload.getToDate(), new Date());
        if (fromDate.after(toDate)) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "fromDate");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(),
                    "invalid_request", "fromDate must be before toDate");
            recordAudit(request, "ORCA_MEDICAL_GET", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "fromDate", "fromDate must be before toDate");
        }

        PatientModel patient = patientServiceBean.getPatientById(facilityId, payload.getPatientId());
        if (patient == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(),
                    "patient_not_found", "Patient not found");
            recordAudit(request, "ORCA_MEDICAL_GET", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "patient_not_found",
                    "Patient not found");
        }

        KarteBean karte = karteServiceBean.getKarte(facilityId, payload.getPatientId(), fromDate);
        List<DocInfoModel> docInfos = karteServiceBean.getDocumentList(karte.getId(), fromDate, true);

        List<MedicalRecordEntry> entries = docInfos.stream()
                .filter(doc -> doc.getConfirmDate() == null || !doc.getConfirmDate().before(fromDate))
                .filter(doc -> doc.getConfirmDate() == null || !doc.getConfirmDate().after(toDate))
                .map(this::toRecordEntry)
                .collect(Collectors.toList());

        MedicalGetResponse response = MedicalGetResponse.success(RUN_ID);
        response.setPatient(toPatientSummary(patient));
        response.setRecords(entries);

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", payload.getPatientId());
        audit.put("recordsReturned", entries.size());
        recordAudit(request, "ORCA_MEDICAL_GET", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    private MedicalGetResponse buildStubResponse() {
        MedicalGetResponse response = new MedicalGetResponse();
        response.setApiResult("79");
        response.setApiResultMessage("Spec-based implementation / Trial未検証");
        response.setRunId(RUN_ID);
        response.setGeneratedAt(java.time.Instant.now().toString());
        response.addWarning("ORCA POST is disabled; stub response returned.");
        return response;
    }

    private PatientSummary toPatientSummary(PatientModel patient) {
        PatientSummary summary = new PatientSummary();
        summary.setPatientId(patient.getPatientId());
        summary.setWholeName(patient.getFullName());
        summary.setWholeNameKana(patient.getKanaName());
        summary.setBirthDate(patient.getBirthday());
        summary.setSex(patient.getGender());
        return summary;
    }

    private MedicalRecordEntry toRecordEntry(DocInfoModel doc) {
        MedicalRecordEntry entry = new MedicalRecordEntry();
        if (doc.getConfirmDate() != null) {
            entry.setPerformDate(DATE_FORMAT.format(doc.getConfirmDate()));
        }
        entry.setDepartmentCode(doc.getDepartment());
        if (doc.getDepartmentDesc() != null) {
            String[] parts = doc.getDepartmentDesc().split(",");
            if (parts.length > 0) {
                entry.setDepartmentName(parts[0]);
            }
        }
        entry.setSequentialNumber(doc.getVersionNumber());
        entry.setInsuranceCombinationNumber(doc.getHealthInsuranceGUID());
        entry.setDocumentId(doc.getDocId());
        entry.setDocumentStatus(doc.getStatus());
        if (doc.getClaimDate() != null) {
            entry.setLastUpdated(DATE_FORMAT.format(doc.getClaimDate()));
        }
        return entry;
    }

    private Date parseDate(String input, Date defaultValue) {
        if (input == null || input.isBlank()) {
            return defaultValue;
        }
        Date parsed = ModelUtils.getDateAsObject(input);
        return parsed != null ? parsed : defaultValue;
    }
}
