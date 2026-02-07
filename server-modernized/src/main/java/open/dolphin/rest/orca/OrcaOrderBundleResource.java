package open.dolphin.rest.orca;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
import java.nio.charset.StandardCharsets;
import java.sql.Blob;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ClaimConst;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModelUtils;
import open.dolphin.infomodel.ModuleJsonConverter;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Order bundle (prescription/order) wrappers for Charts edit panels.
 */
@Path("/orca/order")
public class OrcaOrderBundleResource extends AbstractOrcaRestResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrcaOrderBundleResource.class);
    private static final String ORDER_BUNDLE_UNAVAILABLE = "order_bundle_unavailable";
    private static final String ORDER_BUNDLE_ERROR_MESSAGE = "Failed to mutate order bundle";
    public static final String ORDER_BUNDLE_CONTEXT_KEY = "orcaOrderBundleContext";
    private static final Set<String> ORDER_BUNDLE_ENTITIES = Set.of(
            IInfoModel.ENTITY_GENERAL_ORDER,
            IInfoModel.ENTITY_MED_ORDER,
            IInfoModel.ENTITY_OTHER_ORDER,
            IInfoModel.ENTITY_TREATMENT,
            IInfoModel.ENTITY_SURGERY_ORDER,
            IInfoModel.ENTITY_RADIOLOGY_ORDER,
            IInfoModel.ENTITY_LABO_TEST, // "testOrder"
            "laboTest", // legacy alias used by Web Client
            IInfoModel.ENTITY_PHYSIOLOGY_ORDER,
            IInfoModel.ENTITY_BACTERIA_ORDER,
            IInfoModel.ENTITY_INJECTION_ORDER,
            IInfoModel.ENTITY_BASE_CHARGE_ORDER,
            IInfoModel.ENTITY_INSTRACTION_CHARGE_ORDER);

    @Inject
    private PatientServiceBean patientServiceBean;

    @Inject
    private KarteServiceBean karteServiceBean;

    @Inject
    private UserServiceBean userServiceBean;

    @PersistenceContext
    private EntityManager entityManager;

    @GET
    @Path("/bundles")
    @Produces(MediaType.APPLICATION_JSON)
    public OrderBundleFetchResponse getBundles(
            @Context HttpServletRequest request,
            @QueryParam("patientId") String patientId,
            @QueryParam("entity") String entity,
            @QueryParam("from") String from) {

        String runId = resolveRunId(request);
        requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        if (patientId == null || patientId.isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("runId", runId);
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
            audit.put("runId", runId);
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
            audit.put("runId", runId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "patient_not_found", "Patient not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "patient_not_found", "Patient not found");
        }

        KarteBean karte = karteServiceBean.getKarte(facilityId, patientId, null);
        if (karte == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", patientId);
            audit.put("runId", runId);
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
                entry.setClassCode(bundle.getClassCode());
                entry.setClassCodeSystem(bundle.getClassCodeSystem());
                entry.setClassName(bundle.getClassName());
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
        response.setRunId(runId);
        response.setPatientId(patientId);
        response.setBundles(bundles);
        response.setRecordsReturned(bundles.size());

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", patientId);
        audit.put("entity", entity);
        audit.put("runId", runId);
        audit.put("recordsReturned", bundles.size());
        recordAudit(request, "ORCA_ORDER_BUNDLE_FETCH", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    @POST
    @Path("/bundles")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public OrderBundleMutationResponse postBundles(@Context HttpServletRequest request, OrderBundleMutationRequest payload) {
        String runId = resolveRunId(request);
        String remoteUser = requireRemoteUser(request);
        String facilityId = requireFacilityId(request);
        Map<String, Object> orderBundleContext = new HashMap<>();
        orderBundleContext.put("facilityId", facilityId);
        orderBundleContext.put("runId", runId);
        if (payload == null || payload.getPatientId() == null || payload.getPatientId().isBlank()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("runId", runId);
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
            audit.put("runId", runId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "patient_not_found", "Patient not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "patient_not_found", "Patient not found");
        }
        orderBundleContext.put("patientId", payload.getPatientId());
        request.setAttribute(ORDER_BUNDLE_CONTEXT_KEY, orderBundleContext);

        KarteBean karte = karteServiceBean.getKarte(facilityId, payload.getPatientId(), null);
        if (karte == null) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
            markFailureDetails(audit, Response.Status.NOT_FOUND.getStatusCode(), "karte_not_found", "Karte not found");
            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
            throw restError(request, Response.Status.NOT_FOUND, "karte_not_found", "Karte not found");
        }
        Long karteId = karte.getId();
        orderBundleContext.put("karteId", karteId);

        if (payload.getOperations() == null || payload.getOperations().isEmpty()) {
            Map<String, Object> audit = new HashMap<>();
            audit.put("facilityId", facilityId);
            audit.put("patientId", payload.getPatientId());
            audit.put("runId", runId);
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
                    audit.put("runId", runId);
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
                    audit.put("runId", runId);
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
                    audit.put("runId", runId);
                    audit.put("validationError", Boolean.TRUE);
                    audit.put("field", "entity");
                    audit.put("entity", op.getEntity());
                    markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request", "entity is invalid");
                    recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                    throw validationError(request, "entity", "entity is invalid");
                }
                orderBundleContext.put("operation", operation);
                if (op.getDocumentId() != null) {
                    orderBundleContext.put("documentId", op.getDocumentId());
                } else {
                    orderBundleContext.remove("documentId");
                }
                switch (operation) {
                    case "create" -> {
                        try {
                            DocumentModel document = buildDocument(karte, user, op);
                            long id = karteServiceBean.addDocument(document);
                            karteServiceBean.flush();
                            created.add(id);
                        } catch (RuntimeException ex) {
                            throw buildOrderBundleFailure(request, runId, facilityId, payload.getPatientId(), karteId,
                                    null, operation, ex);
                        }
                    }
                    case "update" -> {
                        Long documentId = op.getDocumentId();
                        if (documentId == null || documentId <= 0) {
                            Map<String, Object> audit = new HashMap<>();
                            audit.put("facilityId", facilityId);
                            audit.put("patientId", payload.getPatientId());
                            audit.put("runId", runId);
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
                        try {
                            updateDocumentWithBundle(document, user, op);
                            karteServiceBean.updateDocument(document);
                            karteServiceBean.flush();
                            updated.add(documentId);
                        } catch (RuntimeException ex) {
                            throw buildOrderBundleFailure(request, runId, facilityId, payload.getPatientId(), karteId,
                                    documentId, operation, ex);
                        }
                    }
                    case "delete" -> {
                        Long documentId = op.getDocumentId();
                        if (documentId == null || documentId <= 0) {
                            Map<String, Object> audit = new HashMap<>();
                            audit.put("facilityId", facilityId);
                            audit.put("patientId", payload.getPatientId());
                            audit.put("runId", runId);
                            audit.put("validationError", Boolean.TRUE);
                            audit.put("field", "documentId");
                            markFailureDetails(audit, Response.Status.BAD_REQUEST.getStatusCode(), "invalid_request",
                                    "documentId is required");
                            recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.FAILURE);
                            throw validationError(request, "documentId", "documentId is required");
                        }
                        try {
                            karteServiceBean.deleteDocument(documentId);
                            karteServiceBean.flush();
                            deleted.add(documentId);
                        } catch (RuntimeException ex) {
                            throw buildOrderBundleFailure(request, runId, facilityId, payload.getPatientId(), karteId,
                                    documentId, operation, ex);
                        }
                    }
                    default -> {
                    }
                }
            }
        }

        OrderBundleMutationResponse response = new OrderBundleMutationResponse();
        response.setApiResult("00");
        response.setApiResultMessage("処理終了");
        response.setRunId(runId);
        response.setCreatedDocumentIds(created);
        response.setUpdatedDocumentIds(updated);
        response.setDeletedDocumentIds(deleted);

        Map<String, Object> audit = new HashMap<>();
        audit.put("facilityId", facilityId);
        audit.put("patientId", payload.getPatientId());
        audit.put("runId", runId);
        audit.put("created", created.size());
        audit.put("updated", updated.size());
        audit.put("deleted", deleted.size());
        recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", audit, AuditEventEnvelope.Outcome.SUCCESS);
        return response;
    }

    private RuntimeException buildOrderBundleFailure(HttpServletRequest request,
            String runId,
            String facilityId,
            String patientId,
            Long karteId,
            Long documentId,
            String operation,
            RuntimeException ex) {
        Map<String, Object> details = new HashMap<>();
        details.put("facilityId", facilityId);
        details.put("patientId", patientId);
        details.put("karteId", karteId);
        if (documentId != null) {
            details.put("documentId", documentId);
        }
        details.put("operation", operation);
        details.put("runId", runId);
        markFailureDetails(details, Response.Status.SERVICE_UNAVAILABLE.getStatusCode(),
                ORDER_BUNDLE_UNAVAILABLE, ORDER_BUNDLE_ERROR_MESSAGE);
        recordAudit(request, "ORCA_ORDER_BUNDLE_MUTATION", details, AuditEventEnvelope.Outcome.FAILURE);
        LOGGER.warn("Order bundle mutation failed (patientId={}, karteId={}, documentId={}, operation={}, runId={})",
                patientId, karteId, documentId, operation, runId, ex);
        return restError(request, Response.Status.SERVICE_UNAVAILABLE,
                ORDER_BUNDLE_UNAVAILABLE, ORDER_BUNDLE_ERROR_MESSAGE, details, ex);
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
        if (hasText(op.getClassName())) {
            bundle.setClassName(op.getClassName());
        } else if (hasText(op.getBundleName())) {
            bundle.setClassName(op.getBundleName());
        }
        if (hasText(op.getClassCode())) {
            bundle.setClassCode(op.getClassCode());
            bundle.setClassCodeSystem(hasText(op.getClassCodeSystem()) ? op.getClassCodeSystem() : ClaimConst.CLASS_CODE_ID);
        }
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
            return op.getEntity().trim();
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
            entry.setCode(item.getCode());
            entry.setName(item.getName());
            entry.setQuantity(item.getNumber());
            entry.setUnit(item.getUnit());
            entry.setMemo(item.getMemo());
            list.add(entry);
        }
        return list;
    }

    private BundleDolphin decodeBundle(ModuleModel module) {
        if (module == null) {
            return null;
        }
        if (module.getModel() instanceof BundleDolphin bundle) {
            return bundle;
        }
        Object decoded = ModelUtils.decodeModule(module);
        if (decoded instanceof BundleDolphin bundle) {
            return bundle;
        }
        BundleDolphin fallback = decodeBundleFromLargeObject(module);
        if (fallback != null) {
            return fallback;
        }
        return null;
    }

    private BundleDolphin decodeBundleFromLargeObject(ModuleModel module) {
        if (entityManager == null || module == null || module.getId() <= 0) {
            return null;
        }
        Object[] row;
        try {
            row = (Object[]) entityManager
                    .createNativeQuery("SELECT bean_json, beanbytes FROM d_module WHERE id = ?1")
                    .setParameter(1, module.getId())
                    .getSingleResult();
        } catch (Exception ex) {
            LOGGER.warn("Failed to fetch module payload for order bundle id={}", module.getId(), ex);
            return null;
        }
        String beanJsonRaw = row != null && row.length > 0 && row[0] != null ? row[0].toString() : null;
        BundleDolphin jsonBundle = decodeBundleFromJson(beanJsonRaw);
        if (jsonBundle != null) {
            return jsonBundle;
        }
        Object beanBytesRaw = row != null && row.length > 1 ? row[1] : null;
        byte[] xmlBytes = resolveLargeObjectBytes(beanBytesRaw);
        if (xmlBytes == null || xmlBytes.length == 0) {
            return null;
        }
        try {
            Object decoded = IOSHelper.xmlDecode(xmlBytes);
            if (decoded instanceof BundleDolphin bundle) {
                return bundle;
            }
        } catch (RuntimeException ex) {
            LOGGER.warn("Failed to decode order bundle XML from large object id={}", module.getId(), ex);
        }
        return null;
    }

    private BundleDolphin decodeBundleFromJson(String beanJsonRaw) {
        if (beanJsonRaw == null || beanJsonRaw.isBlank()) {
            return null;
        }
        Object decoded = ModuleJsonConverter.getInstance().deserialize(beanJsonRaw);
        if (decoded instanceof BundleDolphin bundle) {
            return bundle;
        }
        Long oid = parseOid(beanJsonRaw);
        if (oid == null) {
            return null;
        }
        String json = fetchLargeObjectText(oid);
        if (json == null || json.isBlank()) {
            return null;
        }
        Object decodedLo = ModuleJsonConverter.getInstance().deserialize(json);
        if (decodedLo instanceof BundleDolphin bundle) {
            return bundle;
        }
        return null;
    }

    private byte[] resolveLargeObjectBytes(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof byte[] bytes) {
            return bytes;
        }
        if (value instanceof Blob blob) {
            try {
                return blob.getBytes(1, (int) blob.length());
            } catch (Exception ex) {
                return null;
            }
        }
        Long oid = parseOid(value);
        if (oid == null) {
            return null;
        }
        return fetchLargeObjectBytes(oid);
    }

    private byte[] fetchLargeObjectBytes(long oid) {
        if (oid <= 0) {
            return null;
        }
        Object result;
        try {
            result = entityManager
                    .createNativeQuery("SELECT lo_get(?1)")
                    .setParameter(1, oid)
                    .getSingleResult();
        } catch (Exception ex) {
            return null;
        }
        if (result instanceof byte[] bytes) {
            return bytes;
        }
        if (result instanceof Blob blob) {
            try {
                return blob.getBytes(1, (int) blob.length());
            } catch (Exception ex) {
                return null;
            }
        }
        if (result != null) {
            return result.toString().getBytes(StandardCharsets.UTF_8);
        }
        return null;
    }

    private String fetchLargeObjectText(long oid) {
        if (oid <= 0) {
            return null;
        }
        Object result;
        try {
            result = entityManager
                    .createNativeQuery("SELECT convert_from(lo_get(?1), 'UTF8')")
                    .setParameter(1, oid)
                    .getSingleResult();
        } catch (Exception ex) {
            return null;
        }
        return result != null ? result.toString() : null;
    }

    private Long parseOid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            long oid = number.longValue();
            return oid > 0 ? oid : null;
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return null;
        }
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (ch < '0' || ch > '9') {
                return null;
            }
        }
        try {
            long oid = Long.parseLong(text);
            return oid > 0 ? oid : null;
        } catch (NumberFormatException ex) {
            return null;
        }
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
        if (entity == null) {
            return false;
        }
        String normalized = entity.trim();
        if (normalized.isEmpty()) {
            return false;
        }
        return ORDER_BUNDLE_ENTITIES.contains(normalized);
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
