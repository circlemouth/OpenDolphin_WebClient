package open.dolphin.touch;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.UUID;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.annotation.Resource;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.sql.DataSource;
import javax.ws.rs.*;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import open.dolphin.converter.StringListConverter;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.KarteEntryBean;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PVTPublicInsuranceItemModel;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.StringList;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.session.ChartEventServiceBean;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.touch.converter.IDocument;
import open.dolphin.touch.converter.IDocument2;
import open.dolphin.touch.converter.IMKDocument;
import open.dolphin.touch.converter.IMKDocument2;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.ISendPackage;
import open.dolphin.touch.converter.ISendPackage2;
import open.dolphin.touch.converter.IVisitPackage;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.orca.rest.ORCAConnection;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;

/**
 *
 * @author Kazushi Minagawa.
 */
@Path("/jtouch")
public class JsonTouchResource extends open.dolphin.rest.AbstractResource {
    
    private static final String QUERY_FACILITYID_BY_1001
            ="select kanritbl from tbl_syskanri where kanricd='1001'";

    private static final ObjectMapper LEGACY_TOUCH_MAPPER = createLegacyTouchMapper();
    private static final Logger LOGGER = Logger.getLogger(JsonTouchResource.class.getName());
    
    @Inject
    private IPhoneServiceBean iPhoneService;
    
    @Inject
    private KarteServiceBean karteService;
    
    @Inject
    private ChartEventServiceBean chartService;

//minagawa^ 2013/08/29
    //@Resource(mappedName="java:jboss/datasources/OrcaDS")
    //private DataSource ds;
//minagawa$

    private static ObjectMapper createLegacyTouchMapper() {
        ObjectMapper mapper = getSerializeMapper();
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationConfig.Feature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        return mapper;
    }
    
    @GET
    @Path("/user/{uid}")
    @Produces(MediaType.APPLICATION_JSON)
    public UserModelConverter getUserById(@PathParam("uid") String uid) {
        
        // 検索
        UserModel user = iPhoneService.getUserById(uid);
        
        // Converter
        UserModelConverter conv = new UserModelConverter();
        conv.setModel(user);
        
        return conv;
    }
    
    @GET
    @Path("/patient/{pid}")
    @Produces(MediaType.APPLICATION_JSON)
    public IPatientModel getPatientById(@Context HttpServletRequest servletReq, @PathParam("pid") String pid) {
        
        // ログインに成功しているユーザーの施設ID
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        
        // 検索
        PatientModel patient = iPhoneService.getPatientById(fid, pid);
        long kartePK = iPhoneService.getKartePKByPatientPK(patient.getId());
        
        // Converter
        IPatientModel model = new IPatientModel();
        model.setModel(patient);
        model.setKartePK(kartePK);
        
        return model;
    }
    
    @GET
    @Path("/patients/name/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public IPatientList getPatientsByNameOrId(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        //System.err.println("getPatientsByNameOrId");
        
        String [] params = param.split(",");
        
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        String name = params[0];
        //System.err.println(name);
        int firstResult = params.length==3 ? Integer.parseInt(params[1]) : 0;
        int maxResult = params.length==3 ? Integer.parseInt(params[2]) :100;

        List<PatientModel> list;

        // ひらがなで始まっている場合はカナに変換する
        if (KanjiHelper.isHiragana(name.charAt(0))) {
            name = KanjiHelper.hiraganaToKatakana(name);
        }

        if (KanjiHelper.isKatakana(name.charAt(0))) {
            list = iPhoneService.getPatientsByKana(fid, name, firstResult, maxResult);

        } else {
            // 漢字で検索
            list = iPhoneService.getPatientsByName(fid, name, firstResult, maxResult);
        }
        
        //System.err.println(list.size());

        PatientList patients = new PatientList();
        patients.setList(list);
        IPatientList ipatients = new IPatientList();
        ipatients.setModel(patients);

        return ipatients;
    }
    
//minagawa^ 音声検索辞書作成
    @GET
    @Path("/patients/count")
    @Produces(MediaType.TEXT_PLAIN)
    public String getPatientCount(@Context HttpServletRequest servletReq) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        int cnt = iPhoneService.countPatients(fid);
        return String.valueOf(cnt);
    }
    
    @GET
    @Path("/patients/dump/kana/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public StringListConverter getPatientsWithKana(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        String [] params = param.split(",");
        int first = Integer.parseInt(params[0]);
        int max = Integer.parseInt(params[1]);
        
        List<String> list = iPhoneService.getAllPatientsWithKana(fid, first, max);
        StringList strList = new StringList();
        strList.setList(list);
        
        StringListConverter conv = new StringListConverter();
        conv.setModel(strList);
        
        return conv;
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
        
        // VisitTouchでカルテ作成に必要なwrapperオブジェクト
        VisitPackage visit = iPhoneService.getVisitPackage(pvtPK, patientPK, docPK, mode);
        
        if (visit.getDocumenModel()!=null) {
            visit.getDocumenModel().toDetuch();
        }
        
        // 保健医療機関コードとJMARI番号
        String number = getFacilityCodeBy1001();
        visit.setNumber(number);
        
        // Converter
        IVisitPackage conv = new IVisitPackage();
        conv.setModel(visit);
        
        return conv;
    }
    
    @POST
    @Path("/sendPackage")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage(@Context HttpServletRequest servletReq, String json) throws IOException {
        
        ISendPackage pkg = LEGACY_TOUCH_MAPPER.readValue(json, ISendPackage.class);
        
        long retPk = 0L;
        
        // カルテ文書
        DocumentModel model = pkg.documentModel();
        if (model!=null) {
 //minagawa^ VisitTouch 公費保険不具合        
            DocInfoModel docInfo = model.getDocInfoModel();
            PVTHealthInsuranceModel pvtIns = docInfo.getPVTHealthInsuranceModel();
            if (pvtIns!=null) {
                PVTPublicInsuranceItemModel[] arr;
                arr = pvtIns.getPVTPublicInsuranceItem();
                if (arr!=null && arr.length>0) {
                    List<PVTPublicInsuranceItemModel> list = new ArrayList(arr.length);
                    list.addAll(Arrays.asList(arr));
                    pvtIns.setPublicItems(list);
                }   
            }
//minagawa$      
            retPk = karteService.addDocument(model);
        }
        
        // 病名Wrapper
        DiagnosisSendWrapper wrapper = pkg.diagnosisSendWrapperModel();
        if (wrapper!=null) {
            populateDiagnosisAuditMetadata(servletReq, wrapper, "/touch/sendPackage");
            karteService.postPutSendDiagnosis(wrapper);
        }
        
        // 削除病名
        List<String> deleted = pkg.deletedDiagnsis();
        if (deleted!=null) {
            List<Long> list = new ArrayList(deleted.size());
            for (String str : deleted) {
                list.add(Long.parseLong(str));
            }
            karteService.removeDiagnosis(list);
        }
        
        // Status更新
        ChartEventModel cvt = pkg.chartEventModel();
        if (cvt!=null) {
            chartService.processChartEvent(cvt);
        }
        
        return String.valueOf(retPk);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/sendPackage2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage2(@Context HttpServletRequest servletReq, String json) throws IOException {
        
        ISendPackage2 pkg = LEGACY_TOUCH_MAPPER.readValue(json, ISendPackage2.class);
        
        long retPk = 0L;
        
        // カルテ文書
        DocumentModel model = pkg.documentModel();
        if (model!=null) {
 //minagawa^ VisitTouch 公費保険不具合        
            DocInfoModel docInfo = model.getDocInfoModel();
            PVTHealthInsuranceModel pvtIns = docInfo.getPVTHealthInsuranceModel();
            if (pvtIns!=null) {
                PVTPublicInsuranceItemModel[] arr;
                arr = pvtIns.getPVTPublicInsuranceItem();
                if (arr!=null && arr.length>0) {
                    List<PVTPublicInsuranceItemModel> list = new ArrayList(arr.length);
                    list.addAll(Arrays.asList(arr));
                    pvtIns.setPublicItems(list);
                }   
            }
//minagawa$      
            retPk = karteService.addDocument(model);
        }
        
        // 病名Wrapper
        DiagnosisSendWrapper wrapper = pkg.diagnosisSendWrapperModel();
        if (wrapper!=null) {
            populateDiagnosisAuditMetadata(servletReq, wrapper, "/touch/sendPackage2");
            karteService.postPutSendDiagnosis(wrapper);
        }
        
        // 削除病名
        List<String> deleted = pkg.deletedDiagnsis();
        if (deleted!=null) {
            List<Long> list = new ArrayList(deleted.size());
            for (String str : deleted) {
                list.add(Long.parseLong(str));
            }
            karteService.removeDiagnosis(list);
        }
        
        // Status更新
        ChartEventModel cvt = pkg.chartEventModel();
        if (cvt!=null) {
            chartService.processChartEvent(cvt);
        }
        
        return String.valueOf(retPk);
    }
    // S.Oh 2014/02/06 Add End
    
    @POST
    @Path("/document")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) throws IOException {
        return handleDocumentPayload(json, IDocument.class, IDocument::toModel, dryRun, servletReq);
    }

    public String postDocument(boolean dryRun, String json) throws IOException {
        return postDocument(null, dryRun, json);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/document2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument2(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) throws IOException {
        return handleDocumentPayload(json, IDocument2.class, IDocument2::toModel, dryRun, servletReq);
    }

    public String postDocument2(boolean dryRun, String json) throws IOException {
        return postDocument2(null, dryRun, json);
    }
    // S.Oh 2014/02/06 Add End
    
    @POST
    @Path("/mkdocument")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postMkDocument(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) throws IOException {
        return handleDocumentPayload(json, IMKDocument.class, IMKDocument::toModel, dryRun, servletReq);
    }

    public String postMkDocument(boolean dryRun, String json) throws IOException {
        return postMkDocument(null, dryRun, json);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/mkdocument2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postMkDocument2(@Context HttpServletRequest servletReq,
            @QueryParam("dryRun") @DefaultValue("false") boolean dryRun,
            String json) throws IOException {
        return handleDocumentPayload(json, IMKDocument2.class, IMKDocument2::toModel, dryRun, servletReq);
    }

    public String postMkDocument2(boolean dryRun, String json) throws IOException {
        return postMkDocument2(null, dryRun, json);
    }
    // S.Oh 2014/02/06 Add End

    private <T> String handleDocumentPayload(String json, Class<T> payloadType,
            Function<T, DocumentModel> converter, boolean dryRun, HttpServletRequest servletReq) throws IOException {
        T payload = LEGACY_TOUCH_MAPPER.readValue(json, payloadType);
        DocumentModel model = converter.apply(payload);
        if (dryRun) {
            return String.valueOf(resolveDryRunDocumentPk(model));
        }
        prepareDocumentForPersist(model, servletReq);
        long pk = karteService.addDocument(model);
        return String.valueOf(pk);
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
            try {
                user = iPhoneService.getUserById(remoteUser);
            } catch (Throwable ex) {
                LOGGER.log(Level.WARNING, "Failed to load user {0}", remoteUser);
            }
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
            try {
                PatientModel patient = iPhoneService.getPatientById(facilityId, patientId);
                if (patient != null) {
                    KarteBean resolved = karteService.getKarte(patient.getId(), null);
                    if (resolved != null) {
                        model.setKarte(resolved);
                        return resolved;
                    }
                }
            } catch (Throwable ex) {
                LOGGER.log(Level.WARNING, "Failed to load karte for facility {0}, patient {1}", new Object[]{facilityId, patientId});
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

    /**
     * 保健医療機関コードとJMARIコードを取得する。
     * @return 
     */
    private String getFacilityCodeBy1001() {
       
//s.oh^ 2013/10/17 ローカルORCA対応
        try {
            // custom.properties から 保健医療機関コードとJMARIコードを読む
            Properties config = new Properties();
            // コンフィグファイルを読み込む
            StringBuilder sb = new StringBuilder();
            sb.append(System.getProperty("jboss.home.dir"));
            sb.append(File.separator);
            sb.append("custom.properties");
            File f = new File(sb.toString());
            FileInputStream fin = new FileInputStream(f);
            InputStreamReader r = new InputStreamReader(fin, "JISAutoDetect");
            config.load(r);
            r.close();
            // JMARI code
            String jmari = config.getProperty("jamri.code");
            String hcfacility = config.getProperty("healthcarefacility.code");
            if(jmari != null && jmari.length() == 12 && hcfacility != null && hcfacility.length() == 10) {
                StringBuilder ret = new StringBuilder();
                ret.append(hcfacility);
                ret.append("JPN");
                ret.append(jmari);
                return ret.toString();
            }
        } catch (FileNotFoundException ex) {
            Logger.getLogger(JsonTouchResource.class.getName()).log(Level.SEVERE, null, ex);
        } catch (UnsupportedEncodingException ex) {
            Logger.getLogger(JsonTouchResource.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
            Logger.getLogger(JsonTouchResource.class.getName()).log(Level.SEVERE, null, ex);
        }
//s.oh$
        // SQL 文
        StringBuilder buf = new StringBuilder();
        buf.append(QUERY_FACILITYID_BY_1001);
        String sql = buf.toString();

        Connection con = null;
        PreparedStatement ps;
        
        StringBuilder ret = new StringBuilder();

        try {
//minagawa^ 2013/08/29
            //con = ds.getConnection();
            con = ORCAConnection.getInstance().getConnection();
//minagawa$
            ps = con.prepareStatement(sql);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                String line = rs.getString(1);
                
                // 保険医療機関コード 10桁
                ret.append(line.substring(0, 10));
                
                // JMARIコード JPN+12桁 (total 15)
                int index = line.indexOf("JPN");
                if (index>0) {
                    ret.append(line.substring(index, index+15));
                }
            }
            rs.close();
            ps.close();
            con.close();
            con = null;

        } catch (Exception e) {
            e.printStackTrace(System.err);

        } finally {
            if (con != null) {
                try {
                    con.close();
                } catch (Exception e) {
                }
            }
        }

        return ret.toString();        
    }
//minagawa^    
    private void log(String msg) {
        Logger.getLogger("open.dolphin").info(msg);
    }
    
    private void warn(String msg) {
        Logger.getLogger("open.dolphin").info(msg);
    }
//minagawa$
}
