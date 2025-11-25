package open.dolphin.rest.orca;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModelUtils;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.orca.DiseaseImportResponse;
import open.dolphin.rest.dto.orca.DiseaseImportResponse.DiseaseEntry;
import open.dolphin.rest.dto.orca.DiseaseMutationRequest;
import open.dolphin.rest.dto.orca.DiseaseMutationResponse;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PatientServiceBean;
import open.dolphin.session.UserServiceBean;

/**
 * Disease import/mutation wrappers (`/orca/disease`).
 */
@Path("/orca/disease")
public class OrcaDiseaseResource extends AbstractOrcaRestResource {

    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd", Locale.JAPAN);

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private KarteServiceBean karteServiceBean;

    @Inject
    private UserServiceBean userServiceBean;

    @GET
    @Path("/import/{patientId}")
    @Produces(MediaType.APPLICATION_JSON)
    public DiseaseImportResponse getDiseases(
            @Context HttpServletRequest request,
            @PathParam("patientId") String patientId,
            @QueryParam("from") String from,
            @QueryParam("to") String to,
            @QueryParam("activeOnly") @DefaultValue("false") boolean activeOnly) {

        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);

        if (patientId == null || patientId.isBlank()) {
            throw validationError(request, "patientId", "patientId is required");
        }
        Date fromDate = parseDate(from, ModelUtils.AD1800);
        Date toDate = parseDate(to, new Date());

        PatientModel patient = patientServiceBean.getPatientById(facilityId, patientId);
        if (patient == null) {
            throw restError(request, jakarta.ws.rs.core.Response.Status.NOT_FOUND, "patient_not_found",
                    "Patient not found");
        }
        KarteBean karte = karteServiceBean.getKarte(facilityId, patientId, fromDate);
        List<RegisteredDiagnosisModel> diagnoses = karteServiceBean.getDiagnosis(karte.getId(), fromDate, activeOnly);

        DiseaseImportResponse response = new DiseaseImportResponse();
        response.setApiResult("00");
        response.setApiResultMessage("処理終了");
        response.setPatientId(patientId);
        response.setBaseDate(DATE_FORMAT.format(fromDate));
        diagnoses.stream()
                .filter(model -> model.getStarted() == null || !model.getStarted().after(toDate))
                .map(this::toEntry)
                .forEach(response::addDisease);

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", patientId);
        audit.put("diseaseCount", diagnoses.size());
        recordAudit(request, "ORCA_DISEASE_IMPORT", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public DiseaseMutationResponse postDisease(@Context HttpServletRequest request, DiseaseMutationRequest payload) {
        return mutateDisease(request, payload);
    }

    @POST
    @Path("/v3")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public DiseaseMutationResponse postDiseaseV3(@Context HttpServletRequest request, DiseaseMutationRequest payload) {
        return mutateDisease(request, payload);
    }

    private DiseaseMutationResponse mutateDisease(HttpServletRequest request, DiseaseMutationRequest payload) {
        String remoteUser = requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        if (payload == null || payload.getPatientId() == null || payload.getPatientId().isBlank()) {
            throw validationError(request, "patientId", "patientId is required");
        }

        PatientModel patient = patientServiceBean.getPatientById(facilityId, payload.getPatientId());
        if (patient == null) {
            throw restError(request, jakarta.ws.rs.core.Response.Status.NOT_FOUND, "patient_not_found",
                    "Patient not found");
        }
        KarteBean karte = karteServiceBean.getKarte(facilityId, payload.getPatientId(), ModelUtils.AD1800);
        UserModel user = userServiceBean.getUser(remoteUser);

        List<RegisteredDiagnosisModel> adds = new ArrayList<>();
        List<RegisteredDiagnosisModel> updates = new ArrayList<>();
        List<Long> removes = new ArrayList<>();

        if (payload.getOperations() != null) {
            for (DiseaseMutationRequest.MutationEntry entry : payload.getOperations()) {
                if (entry.getOperation() == null) {
                    continue;
                }
                switch (entry.getOperation().toLowerCase(Locale.ROOT)) {
                    case "create" -> adds.add(buildDiagnosis(entry, karte, user));
                    case "update" -> updates.add(buildDiagnosis(entry, karte, user));
                    case "delete" -> {
                        if (entry.getDiagnosisId() != null) {
                            removes.add(entry.getDiagnosisId());
                        }
                    }
                    default -> {
                    }
                }
            }
        }

        List<Long> createdIds = adds.isEmpty() ? List.of() : karteServiceBean.addDiagnosis(adds);
        if (!updates.isEmpty()) {
            karteServiceBean.updateDiagnosis(updates);
        }
        if (!removes.isEmpty()) {
            karteServiceBean.removeDiagnosis(removes);
        }

        DiseaseMutationResponse response = new DiseaseMutationResponse();
        response.setApiResult("00");
        response.setApiResultMessage("処理終了");
        response.setRunId(RUN_ID);
        response.setCreatedDiagnosisIds(createdIds);
        response.setUpdatedDiagnosisIds(updates.stream().map(RegisteredDiagnosisModel::getId).toList());
        response.setRemovedDiagnosisIds(removes);

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", payload.getPatientId());
        audit.put("created", createdIds.size());
        audit.put("updated", updates.size());
        audit.put("removed", removes.size());
        recordAudit(request, "ORCA_DISEASE_MUTATION", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    private RegisteredDiagnosisModel buildDiagnosis(DiseaseMutationRequest.MutationEntry entry,
            KarteBean karte, UserModel user) {

        RegisteredDiagnosisModel model = new RegisteredDiagnosisModel();
        if (entry.getDiagnosisId() != null) {
            model.setId(entry.getDiagnosisId());
        }
        model.setKarteBean(karte);
        model.setUserModel(user);
        model.setDiagnosis(entry.getDiagnosisName());
        model.setDiagnosisCode(entry.getDiagnosisCode());
        model.setCategory(entry.getCategory());
        model.setCategoryDesc(entry.getCategory());
        model.setCategoryCodeSys("ORCA");
        model.setFirstEncounterDate(entry.getStartDate());
        model.setDepartment(entry.getDepartmentCode());
        model.setStatus(IInfoModel.STATUS_FINAL);
        Date now = new Date();
        model.setRecorded(now);
        model.setConfirmed(parseDate(entry.getStartDate(), now));
        model.setStarted(parseDate(entry.getStartDate(), now));
        if (entry.getEndDate() != null && !entry.getEndDate().isBlank()) {
            model.setEnded(parseDate(entry.getEndDate(), now));
        }
        return model;
    }

    private DiseaseEntry toEntry(RegisteredDiagnosisModel model) {
        DiseaseEntry entry = new DiseaseEntry();
        entry.setDiagnosisId(model.getId());
        entry.setDiagnosisName(model.getDiagnosis());
        entry.setDiagnosisCode(model.getDiagnosisCode());
        entry.setDepartmentCode(model.getDepartment());
        entry.setInsuranceCombinationNumber(model.getRelatedHealthInsurance());
        entry.setStartDate(model.getStartDate());
        entry.setEndDate(model.getEnded() != null ? DATE_FORMAT.format(model.getEnded()) : null);
        entry.setOutcome(model.getDiagnosisOutcomeModel() != null ? model.getDiagnosisOutcomeModel().getOutcome() : null);
        entry.setCategory(model.getCategory());
        entry.setSuspectedFlag(model.getCategoryDesc());
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
