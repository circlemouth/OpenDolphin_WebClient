package open.dolphin.touch;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.logging.Logger;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.BadRequestException;
import open.dolphin.converter.StringListConverter;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.KarteEntryBean;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.StringList;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.touch.converter.IDocument;
import open.dolphin.touch.converter.IDocument2;
import open.dolphin.touch.converter.IMKDocument;
import open.dolphin.touch.converter.IMKDocument2;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.ISendPackage;
import open.dolphin.touch.converter.ISendPackage2;
import open.dolphin.touch.converter.IVisitPackage;
import open.dolphin.touch.support.TouchJsonConverter;

/**
 *
 * @author Kazushi Minagawa.
 */
@Path("/jtouch")
public class JsonTouchResource extends open.dolphin.rest.AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(JsonTouchResource.class.getName());

    @Inject
    private TouchJsonConverter touchJsonConverter;

    @Inject
    private JsonTouchSharedService sharedService;

    @Context
    private HttpServletRequest servletRequest;
    
    @GET
    @Path("/user/{uid}")
    @Produces(MediaType.APPLICATION_JSON)
    public UserModelConverter getUserById(@PathParam("uid") String uid) {
        return sharedService.getUserById(uid);
    }
    
    @GET
    @Path("/patient/{pid}")
    @Produces(MediaType.APPLICATION_JSON)
    public IPatientModel getPatientById(@Context HttpServletRequest servletReq, @PathParam("pid") String pid) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        JsonTouchSharedService.PatientModelSnapshot snapshot = sharedService.getPatientSnapshot(fid, pid);
        IPatientModel model = new IPatientModel();
        model.setModel(snapshot.getPatient());
        model.setKartePK(snapshot.getKartePk());
        return model;
    }
    
    @GET
    @Path("/patients/name/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public IPatientList getPatientsByNameOrId(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        String [] params = param.split(",");
        
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        String name = params[0];
        int firstResult = params.length==3 ? Integer.parseInt(params[1]) : 0;
        int maxResult = params.length==3 ? Integer.parseInt(params[2]) :100;

        List<PatientModel> found = sharedService.getPatientsByNameOrId(fid, name, firstResult, maxResult);
        PatientList patients = new PatientList();
        patients.setList(found);
        IPatientList response = new IPatientList();
        response.setModel(patients);
        return response;
    }
    
//minagawa^ 音声検索辞書作成
    @GET
    @Path("/patients/count")
    @Produces(MediaType.TEXT_PLAIN)
    public String getPatientCount(@Context HttpServletRequest servletReq) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        return String.valueOf(sharedService.countPatients(fid));
    }
    
    @GET
    @Path("/patients/dump/kana/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public StringListConverter getPatientsWithKana(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        String [] params = param.split(",");
        int first = Integer.parseInt(params[0]);
        int max = Integer.parseInt(params[1]);
        List<String> kanaList = sharedService.getPatientsWithKana(fid, first, max);
        StringList stringList = new StringList();
        stringList.setList(kanaList);
        StringListConverter converter = new StringListConverter();
        converter.setModel(stringList);
        return converter;
    }
//minagawa$    
    
    @GET
    @Path("/visitpackage/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public IVisitPackage getVisitPackage(@PathParam("param") String param) {
        
        String[] params = param.split(",");
        
        long pvtPK = Long.parseLong(params[0]);
        long patientPK = Long.parseLong(params[1]);
        long docPK = Long.parseLong(params[2]);
        int mode = Integer.parseInt(params[3]);
        VisitPackage visit = sharedService.getVisitPackage(pvtPK, patientPK, docPK, mode);
        IVisitPackage conv = new IVisitPackage();
        conv.setModel(visit);
        return conv;
    }
    
    @POST
    @Path("/sendPackage")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage(String json) {
        final String endpoint = "POST /jtouch/sendPackage";
        final String traceId = JsonTouchAuditLogger.begin(servletRequest, endpoint,
                () -> "payloadSize=" + (json != null ? json.length() : 0));
        try {
            ISendPackage pkg = touchJsonConverter.readLegacy(json, ISendPackage.class);
            long retPk = sharedService.processSendPackage(pkg);
            JsonTouchAuditLogger.success(endpoint, traceId, () -> "documentPk=" + retPk);
            return String.valueOf(retPk);
        } catch (IOException | RuntimeException e) {
            throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/sendPackage2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage2(String json) {
        final String endpoint = "POST /jtouch/sendPackage2";
        final String traceId = JsonTouchAuditLogger.begin(servletRequest, endpoint,
                () -> "payloadSize=" + (json != null ? json.length() : 0));
        try {
            ISendPackage2 pkg = touchJsonConverter.readLegacy(json, ISendPackage2.class);
            long retPk = sharedService.processSendPackage2(pkg);
            JsonTouchAuditLogger.success(endpoint, traceId, () -> "documentPk=" + retPk);
            return String.valueOf(retPk);
        } catch (IOException | RuntimeException e) {
            throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }
    // S.Oh 2014/02/06 Add End
    
    @POST
    @Path("/document")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) {
        return handleDocumentPayload("POST /jtouch/document", json, IDocument.class, IDocument::toModel, dryRun, servletReq);
    }

    public String postDocument(boolean dryRun, String json) {
        return postDocument(null, dryRun, json);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/document2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument2(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) {
        return handleDocumentPayload("POST /jtouch/document2", json, IDocument2.class, IDocument2::toModel, dryRun, servletReq);
    }

    public String postDocument2(boolean dryRun, String json) {
        return postDocument2(null, dryRun, json);
    }
    // S.Oh 2014/02/06 Add End
    
    @POST
    @Path("/mkdocument")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postMkDocument(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) {
        return handleDocumentPayload("POST /jtouch/mkdocument", json, IMKDocument.class, IMKDocument::toModel, dryRun, servletReq);
    }

    public String postMkDocument(boolean dryRun, String json) {
        return postMkDocument(null, dryRun, json);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/mkdocument2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postMkDocument2(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) {
        return handleDocumentPayload("POST /jtouch/mkdocument2", json, IMKDocument2.class, IMKDocument2::toModel, dryRun, servletReq);
    }

    public String postMkDocument2(boolean dryRun, String json) {
        return postMkDocument2(null, dryRun, json);
    }

    private <T> String handleDocumentPayload(String endpoint, String json, Class<T> payloadType,
            Function<T, DocumentModel> converter, boolean dryRun, HttpServletRequest servletReq) {
        final String traceId = JsonTouchAuditLogger.begin(servletReq, endpoint,
                () -> "payloadSize=" + (json != null ? json.length() : 0));
        try {
            T payload = touchJsonConverter.readLegacy(json, payloadType);
            DocumentModel model = converter.apply(payload);
            if (!dryRun) {
                prepareDocumentForPersist(model, servletReq);
            }
            long pk = dryRun ? resolveDryRunDocumentPk(model) : sharedService.saveDocument(model);
            JsonTouchAuditLogger.success(endpoint, traceId,
                    () -> dryRun ? "dryRun=true,documentPk=" + pk : "documentPk=" + pk);
            return String.valueOf(pk);
        } catch (IOException | RuntimeException e) {
            throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    private void prepareDocumentForPersist(DocumentModel model, HttpServletRequest servletReq) {
        if (model == null) {
            throw new BadRequestException("Document payload is required.");
        }
        Date now = new Date();
        ensureEntryDefaults(model, now);
        UserModel user = ensureUser(model, servletReq);
        KarteBean karte = ensureKarte(model, servletReq);
        ensureDocInfoDefaults(model, now, karte);
        ensureModuleDefaults(model, now, user, karte);
    }

    private void ensureEntryDefaults(KarteEntryBean entry, Date now) {
        if (entry.getConfirmed() == null) {
            entry.setConfirmed(now);
        }
        if (entry.getStarted() == null) {
            entry.setStarted(entry.getConfirmed());
        }
        if (entry.getRecorded() == null) {
            entry.setRecorded(now);
        }
        if (!hasText(entry.getStatus())) {
            entry.setStatus(IInfoModel.STATUS_FINAL);
        }
    }

    private UserModel ensureUser(DocumentModel model, HttpServletRequest servletReq) {
        UserModel user = model.getUserModel();
        if (user != null) {
            return user;
        }
        String remoteUser = servletReq != null ? servletReq.getRemoteUser() : null;
        if (remoteUser != null) {
            user = sharedService.findUserModel(remoteUser);
        }
        if (user != null) {
            model.setUserModel(user);
            return user;
        }
        if (servletReq == null) {
            UserModel fallback = new UserModel();
            fallback.setUserId("touch-placeholder");
            model.setUserModel(fallback);
            return fallback;
        }
        throw new BadRequestException("userModel is required when dryRun=false");
    }

    private KarteBean ensureKarte(DocumentModel model, HttpServletRequest servletReq) {
        KarteBean karte = model.getKarte();
        if (karte != null && karte.getId() > 0L) {
            return karte;
        }
        String facilityId = resolveFacilityId(servletReq);
        String patientId = extractPatientId(model.getDocInfoModel());
        if (facilityId != null && patientId != null) {
            KarteBean resolved = sharedService.findKarteByPatient(facilityId, patientId);
            if (resolved != null) {
                model.setKarte(resolved);
                return resolved;
            }
        }
        if (karte != null && karte.getId() > 0L) {
            return karte;
        }
        if (servletReq == null) {
            KarteBean fallback = new KarteBean();
            fallback.setId(0L);
            model.setKarte(fallback);
            return fallback;
        }
        throw new BadRequestException("karte reference is required when dryRun=false");
    }

    private void ensureDocInfoDefaults(DocumentModel model, Date now, KarteBean karte) {
        DocInfoModel docInfo = model.getDocInfoModel();
        if (docInfo == null) {
            docInfo = new DocInfoModel();
            model.setDocInfoModel(docInfo);
        }
        if (!hasText(docInfo.getDocId())) {
            docInfo.setDocId(generateDocId());
        }
        if (!hasText(docInfo.getDocType())) {
            docInfo.setDocType(IInfoModel.DOCTYPE_KARTE);
        }
        if (!hasText(docInfo.getTitle())) {
            docInfo.setTitle("Touch Document");
        }
        if (!hasText(docInfo.getPurpose())) {
            docInfo.setPurpose("SOAP");
        }
        if (docInfo.getConfirmDate() == null) {
            docInfo.setConfirmDate(model.getConfirmed());
        }
        if (docInfo.getFirstConfirmDate() == null) {
            docInfo.setFirstConfirmDate(model.getStarted());
        }
        if (docInfo.getClaimDate() == null) {
            docInfo.setClaimDate(model.getConfirmed());
        }
        if (!hasText(docInfo.getStatus())) {
            docInfo.setStatus(model.getStatus());
        }
        if (!hasText(docInfo.getAdmFlag())) {
            docInfo.setAdmFlag("O");
        }
        if (!hasText(docInfo.getPatientId()) && karte != null && karte.getPatientModel() != null) {
            docInfo.setPatientId(karte.getPatientModel().getPatientId());
        }
        if (!hasText(docInfo.getPatientName()) && karte != null && karte.getPatientModel() != null) {
            docInfo.setPatientName(karte.getPatientModel().getFullName());
        }
        if (!hasText(docInfo.getPatientGender()) && karte != null && karte.getPatientModel() != null) {
            docInfo.setPatientGender(karte.getPatientModel().getGender());
        }
    }

    private void ensureModuleDefaults(DocumentModel model, Date now, UserModel user, KarteBean karte) {
        List<ModuleModel> modules = model.getModules();
        if (modules == null || modules.isEmpty()) {
            return;
        }
        for (int i = 0; i < modules.size(); i++) {
            ModuleModel module = modules.get(i);
            if (module == null) {
                continue;
            }
            ensureEntryDefaults(module, now);
            if (module.getUserModel() == null) {
                module.setUserModel(user);
            }
            if (module.getKarte() == null) {
                module.setKarte(karte);
            }
            ModuleInfoBean info = module.getModuleInfoBean();
            if (info != null) {
                if (info.getStampNumber() == 0) {
                    info.setStampNumber(i);
                }
                if (!hasText(info.getPerformFlag())) {
                    info.setPerformFlag("1");
                }
            }
        }
    }

    private String extractPatientId(DocInfoModel docInfo) {
        if (docInfo == null) {
            return null;
        }
        String patientId = docInfo.getPatientId();
        return hasText(patientId) ? patientId : null;
    }

    private String resolveFacilityId(HttpServletRequest servletReq) {
        if (servletReq == null) {
            return null;
        }
        String remoteUser = servletReq.getRemoteUser();
        return remoteUser != null ? getRemoteFacility(remoteUser) : null;
    }

    private String generateDocId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private long resolveDryRunDocumentPk(DocumentModel model) {
        if (model == null) {
            return 0L;
        }
        DocInfoModel info = model.getDocInfoModel();
        if (info != null && info.getDocPk() > 0L) {
            return info.getDocPk();
        }
        long id = model.getId();
        return id > 0L ? id : 0L;
    }
}
