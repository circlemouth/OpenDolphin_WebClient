package open.dolphin.rest.orca;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModelUtils;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.orca.OrderBundleFetchResponse;
import open.dolphin.rest.dto.orca.OrderBundleMutationRequest;
import open.dolphin.rest.dto.orca.OrderBundleMutationResponse;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PatientServiceBean;
import open.dolphin.session.UserServiceBean;
import open.dolphin.touch.converter.IOSHelper;

/**
 * Order bundle (prescription/order) wrappers for Charts edit panels.
 */
@Path("/orca/order")
public class OrcaOrderBundleResource extends AbstractOrcaRestResource {

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private KarteServiceBean karteServiceBean;

    @Inject
    private UserServiceBean userServiceBean;

    @GET
    @Path("/bundles")
    @Produces(MediaType.APPLICATION_JSON)
    public OrderBundleFetchResponse getBundles(
            @Context HttpServletRequest request,
            @QueryParam("patientId") String patientId,
            @QueryParam("entity") String entity,
            @QueryParam("from") String from) {

        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        if (patientId == null || patientId.isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "patientId");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "patientId is required");
            recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "patientId", "patientId is required");
        }
        if (entity != null && !entity.isBlank() && !isValidEntity(entity)) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", patientId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "entity");
            audit.put("entity", entity);
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "entity is invalid");
            recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "entity", "entity is invalid");
        }

        PatientModel patient = patientServiceBean.getPatientById(facilityId, patientId);
        if (patient == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", patientId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "patient_not_found", "Patient not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "patient_not_found", "Patient not found");
        }

        KarteBean karte = karteServiceBean.getKarte(facilityId, patientId, null);
        if (karte == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", patientId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "karte_not_found", "Karte not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "karte_not_found", "Karte not found");
        }

        Date since = parseDate(from, Date.from(Instant.now().minusSeconds(60L * 60L * 24L * 30L)));
        List<DocumentModel> documents = resolveDocuments(karte, since);
        List<OrderBundleFetchResponse.OrderBundleEntry> bundles = new ArrayList<>();

        for (DocumentModel document : documents) {
            if (document.getModules() == null) {
                continue;
            }
            for (ModuleModel module : document.getModules()) {
                ModuleInfoBean info = module.getModuleInfoBean();
                String moduleEntity = info != null ? info.getEntity() : null;
                if (entity != null && !entity.isBlank() && moduleEntity != null && !moduleEntity.equals(entity)) {
                    continue;
                }
                if (entity != null && !entity.isBlank() && moduleEntity == null) {
                    continue;
                }
                BundleDolphin bundle = decodeBundle(module);
                if (bundle == null) {
                    continue;
                }
                OrderBundleFetchResponse.OrderBundleEntry entry = new OrderBundleFetchResponse.OrderBundleEntry();
                entry.setDocumentId(document.getId());
                entry.setModuleId(module.getId());
                entry.setEntity(moduleEntity);
                entry.setBundleName(resolveBundleName(bundle, info));
                entry.setBundleNumber(bundle.getBundleNumber());
                entry.setAdmin(bundle.getAdmin());
                entry.setAdminMemo(bundle.getAdminMemo());
                entry.setMemo(bundle.getMemo());
                entry.setStarted(formatDate(module.getStarted()));
                entry.setItems(toItems(bundle.getClaimItem()));
                bundles.add(entry);
            }
        }

        OrderBundleFetchResponse response = new OrderBundleFetchResponse();
        response.setApiResult("00");
        response.setApiResultMessage("処理終了");
        response.setRunId(RUN_ID);
        response.setPatientId(patientId);
        response.setBundles(bundles);
        response.setRecordsReturned(bundles.size());

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", patientId);
        audit.put("entity", entity);
        audit.put("recordsReturned", bundles.size());
        recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    @POST
    @Path("/bundles")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public OrderBundleMutationResponse postBundles(@Context HttpServletRequest request, OrderBundleMutationRequest payload) {
        String remoteUser = requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        if (payload == null || payload.getPatientId() == null || payload.getPatientId().isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "patientId");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "patientId is required");
            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "patientId", "patientId is required");
        }

        PatientModel patient = patientServiceBean.getPatientById(facilityId, payload.getPatientId());
        if (patient == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "patient_not_found", "Patient not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "patient_not_found", "Patient not found");
        }

        KarteBean karte = karteServiceBean.getKarte(facilityId, payload.getPatientId(), null);
        if (karte == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "karte_not_found", "Karte not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "karte_not_found", "Karte not found");
        }

        if (payload.getOperations() == null || payload.getOperations().isEmpty()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("validationError", Boolean.TRUE);
            audit.put("field", "operations");
            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "operations is required");
            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw validationError(request, "operations", "operations is required");
        }
        UserModel user = userServiceBean.getUser(remoteUser);

        List<Long> created = new ArrayList<>();
        List<Long> updated = new ArrayList<>();
        List<Long> deleted = new ArrayList<>();

        if (payload.getOperations() != null) {
            for (OrderBundleMutationRequest.BundleOperation op : payload.getOperations()) {
                if (op == null || op.getOperation() == null || op.getOperation().isBlank()) {
                    Map<String, Object> audit = new HashMap<>();
                    audit.put("facilityId", facilityId);
                    audit.put("patientId", payload.getPatientId());
                    audit.put("validationError", Boolean.TRUE);
                    audit.put("field", "operation");
                    markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "operation is required");
                    recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                    throw validationError(request, "operation", "operation is required");
                }
                String operation = op.getOperation().toLowerCase(Locale.ROOT);
                if (!isSupportedOperation(operation)) {
                    Map<String, Object> audit = new HashMap<>();
                    audit.put("facilityId", facilityId);
                    audit.put("patientId", payload.getPatientId());
                    audit.put("validationError", Boolean.TRUE);
                    audit.put("field", "operation");
                    audit.put("operation", op.getOperation());
                    markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "operation is invalid");
                    recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                    throw validationError(request, "operation", "operation is invalid");
                }
                if (op.getEntity() != null && !op.getEntity().isBlank() && !isValidEntity(op.getEntity())) {
                    Map<String, Object> audit = new HashMap<>();
                    audit.put("facilityId", facilityId);
                    audit.put("patientId", payload.getPatientId());
                    audit.put("validationError", Boolean.TRUE);
                    audit.put("field", "entity");
                    audit.put("entity", op.getEntity());
                    markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "entity is invalid");
                    recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                    throw validationError(request, "entity", "entity is invalid");
                }
                switch (operation) {
                    case "create" -> {
                        DocumentModel document = buildDocument(karte, user, op);
                        long id = karteServiceBean.addDocument(document);
                        created.add(id);
                    }
                    case "update" -> {
                        Long documentId = op.getDocumentId();
                        if (documentId == null || documentId <= 0) {
                            Map<String, Object> audit = new HashMap<>();
                            audit.put("facilityId", facilityId);
                            audit.put("patientId", payload.getPatientId());
                            audit.put("validationError", Boolean.TRUE);
                            audit.put("field", "documentId");
                            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request",
                                    "documentId is required");
                            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                            throw validationError(request, "documentId", "documentId is required");
                        }
                        DocumentModel document = fetchDocument(documentId);
                        if (document == null) {
                            continue;
                        }
                        updateDocumentWithBundle(document, user, op);
                        karteServiceBean.updateDocument(document);
                        updated.add(documentId);
                    }
                    case "delete" -> {
                        Long documentId = op.getDocumentId();
                        if (documentId == null || documentId <= 0) {
                            Map<String, Object> audit = new HashMap<>();
                            audit.put("facilityId", facilityId);
                            audit.put("patientId", payload.getPatientId());
                            audit.put("validationError", Boolean.TRUE);
                            audit.put("field", "documentId");
                            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request",
                                    "documentId is required");
                            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                            throw validationError(request, "documentId", "documentId is required");
                        }
                        karteServiceBean.deleteDocument(documentId);
                        deleted.add(documentId);
                    }
                    default -> {
                    }
                }
            }
        }

        OrderBundleMutationResponse response = new OrderBundleMutationResponse();
        response.setApiResult("00");
        response.setApiResultMessage("処理終了");
        response.setRunId(RUN_ID);
        response.setCreatedDocumentIds(created);
        response.setUpdatedDocumentIds(updated);
        response.setDeletedDocumentIds(deleted);

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", payload.getPatientId());
        audit.put("created", created.size());
        audit.put("updated", updated.size());
        audit.put("deleted", deleted.size());
        recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    private DocumentModel buildDocument(KarteBean karte, UserModel user, OrderBundleMutationRequest.BundleOperation op) {
        Date now = new Date();
        Date performDate = parseDate(op.getStartDate(), now);
        DocumentModel document = new DocumentModel();
        document.setKarteBean(karte);
        document.setUserModel(user);
        document.setStarted(performDate);
        document.setConfirmed(performDate);
        document.setRecorded(now);
        document.setStatus(IInfoModel.STATUS_FINAL);

        DocInfoModel info = document.getDocInfoModel();
        info.setDocId(UUID.randomUUID().toString().replace("-", ""));
        info.setDocType(IInfoModel.DOCTYPE_KARTE);
        info.setTitle(resolveTitle(op));
        info.setPurpose(IInfoModel.PURPOSE_RECORD);
        info.setVersionNumber("1.0");

        ModuleModel module = buildModule(karte, user, document, op, performDate, now);
        document.setModules(List.of(module));
        return document;
    }

    private void updateDocumentWithBundle(DocumentModel document, UserModel user, OrderBundleMutationRequest.BundleOperation op) {
        Date now = new Date();
        Date performDate = parseDate(op.getStartDate(), document.getStarted() != null ? document.getStarted() : now);
        document.setStarted(performDate);
        document.setConfirmed(performDate);
        document.setRecorded(now);
        document.setStatus(IInfoModel.STATUS_FINAL);
        DocInfoModel info = document.getDocInfoModel();
        if (info != null) {
            info.setTitle(resolveTitle(op));
        }
        ModuleModel module = buildModule(document.getKarteBean(), user, document, op, performDate, now);
        if (op.getModuleId() != null && op.getModuleId() > 0) {
            module.setId(op.getModuleId());
        } else if (document.getModules() != null && !document.getModules().isEmpty()) {
            module.setId(document.getModules().get(0).getId());
        }
        document.setModules(List.of(module));
    }

    private ModuleModel buildModule(KarteBean karte, UserModel user, DocumentModel document,
            OrderBundleMutationRequest.BundleOperation op, Date performDate, Date now) {
        BundleDolphin bundle = new BundleDolphin();
        bundle.setOrderName(op.getBundleName());
        bundle.setBundleNumber(hasText(op.getBundleNumber()) ? op.getBundleNumber() : "1");
        bundle.setAdmin(op.getAdmin());
        bundle.setAdminMemo(op.getAdminMemo());
        bundle.setMemo(op.getMemo());
        bundle.setClassName(op.getBundleName());
        bundle.setClaimItem(toClaimItems(op.getItems()));

        ModuleModel module = new ModuleModel();
        ModuleInfoBean info = new ModuleInfoBean();
        info.setStampName(op.getBundleName() != null ? op.getBundleName() : resolveTitle(op));
        info.setStampRole(IInfoModel.ROLE_P);
        info.setEntity(resolveEntity(op));
        info.setStampNumber(0);
        module.setModuleInfoBean(info);
        module.setModel(bundle);
        module.setBeanBytes(IOSHelper.toXMLBytes(bundle));
        module.setBeanJson(ModelUtils.jsonEncode(bundle));
        module.setKarteBean(karte);
        module.setUserModel(user);
        module.setStarted(performDate);
        module.setConfirmed(performDate);
        module.setRecorded(now);
        module.setStatus(IInfoModel.STATUS_FINAL);
        module.setDocumentModel(document);
        return module;
    }

    private ClaimItem[] toClaimItems(List<OrderBundleMutationRequest.BundleItem> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        List<ClaimItem> converted = new ArrayList<>();
        for (OrderBundleMutationRequest.BundleItem item : items) {
            if (item == null || item.getName() == null || item.getName().isBlank()) {
                continue;
            }
            ClaimItem claimItem = new ClaimItem();
            claimItem.setName(item.getName());
            claimItem.setCode(item.getCode());
            claimItem.setNumber(item.getQuantity());
            claimItem.setUnit(item.getUnit());
            claimItem.setMemo(item.getMemo());
            converted.add(claimItem);
        }
        return converted.isEmpty() ? null : converted.toArray(new ClaimItem[0]);
    }

    private String resolveEntity(OrderBundleMutationRequest.BundleOperation op) {
        if (op.getEntity() != null && !op.getEntity().isBlank()) {
            return op.getEntity();
        }
        return IInfoModel.ENTITY_GENERAL_ORDER;
    }

    private String resolveTitle(OrderBundleMutationRequest.BundleOperation op) {
        String entity = resolveEntity(op);
        if (IInfoModel.ENTITY_MED_ORDER.equals(entity)) {
            return "処方";
        }
        return "オーダー";
    }

    private List<OrderBundleFetchResponse.OrderBundleItem> toItems(ClaimItem[] items) {
        if (items == null || items.length == 0) {
            return List.of();
        }
        List<OrderBundleFetchResponse.OrderBundleItem> list = new ArrayList<>();
        for (ClaimItem item : items) {
            if (item == null) {
                continue;
            }
            OrderBundleFetchResponse.OrderBundleItem entry = new OrderBundleFetchResponse.OrderBundleItem();
            entry.setName(item.getName());
            entry.setQuantity(item.getNumber());
            entry.setUnit(item.getUnit());
            entry.setMemo(item.getMemo());
            list.add(entry);
        }
        return list;
    }

    private BundleDolphin decodeBundle(ModuleModel module) {
        if (module == null || module.getBeanBytes() == null || module.getBeanBytes().length == 0) {
            return null;
        }
        try {
            Object decoded = IOSHelper.xmlDecode(module.getBeanBytes());
            if (decoded instanceof BundleDolphin bundle) {
                return bundle;
            }
        } catch (RuntimeException ex) {
            return null;
        }
        return null;
    }

    private String resolveBundleName(BundleDolphin bundle, ModuleInfoBean info) {
        if (bundle.getOrderName() != null && !bundle.getOrderName().isBlank()) {
            return bundle.getOrderName();
        }
        if (info != null && info.getStampName() != null && !info.getStampName().isBlank()) {
            return info.getStampName();
        }
        return "—";
    }

    private Date parseDate(String input, Date fallback) {
        if (input == null || input.isBlank()) {
            return fallback;
        }
        Date parsed = ModelUtils.getDateAsObject(input);
        return parsed != null ? parsed : fallback;
    }

    private String formatDate(Date date) {
        if (date == null) {
            return null;
        }
        return ModelUtils.getDateAsString(date);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isSupportedOperation(String operation) {
        return "create".equals(operation) || "update".equals(operation) || "delete".equals(operation);
    }

    private boolean isValidEntity(String entity) {
        return IInfoModel.ENTITY_MED_ORDER.equals(entity) || IInfoModel.ENTITY_GENERAL_ORDER.equals(entity);
    }

    private DocumentModel fetchDocument(long documentId) {
        List<DocumentModel> list = karteServiceBean.getDocuments(List.of(documentId));
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }

    private List<DocumentModel> resolveDocuments(KarteBean karte, Date fromDate) {
        List<open.dolphin.infomodel.DocInfoModel> docInfos =
                karteServiceBean.getDocumentList(karte.getId(), fromDate, true);
        if (docInfos == null || docInfos.isEmpty()) {
            return List.of();
        }
        List<Long> ids = docInfos.stream()
                .map(open.dolphin.infomodel.DocInfoModel::getDocPk)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return List.of();
        }
        return karteServiceBean.getDocuments(ids);
    }
}
