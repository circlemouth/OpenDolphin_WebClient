package open.dolphin.session;

import java.beans.XMLDecoder;
import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.annotation.Resource;
import jakarta.enterprise.concurrent.ManagedScheduledExecutorService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.AttachmentModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.infomodel.ProgressCourse;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infrastructure.concurrent.ConcurrencyResourceNames;
import open.dolphin.msg.gateway.MessagingGateway;
import open.dolphin.session.framework.SessionOperation;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.security.audit.SessionAuditDispatcher;
import open.dolphin.touch.converter.IOSHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * (予定カルテ対応)
 * @author kazushi Minagawa.
 */
@Named
@ApplicationScoped
@Transactional
@SessionOperation
public class ScheduleServiceBean {

    private static final Logger LOGGER = LoggerFactory.getLogger(ScheduleServiceBean.class);
    
    private static final String QUERY_PVT_BY_FID_DATE
            = "from PatientVisitModel p where p.facilityId=:fid and p.pvtDate like :date order by p.pvtDate";
    
    private static final String QUERY_PVT_BY_FID_DID_DATE
            = "from PatientVisitModel p where p.facilityId=:fid and p.pvtDate like :date and (doctorId=:did or doctorId=:unassigned) order by p.pvtDate";
    
    private static final String QUERY_INSURANCE_BY_PATIENT_ID 
            = "from HealthInsuranceModel h where h.patient.id=:id";
    
    private static final String QUERY_KARTE 
            = "from KarteBean k where k.patient.id=:patientPk";

    private static final String QUERY_LASTDOC_DATE_BY_KARTEID_FINAL
//minagawa^ LSC Test             
            //= "select max(m.started) from DocumentModel m where m.karte.id=:karteId and (m.status='F' or m.status='T')";
    = "select max(m.started) from d_document m where m.karte_id=:karteId and m.docType=:docType and (m.status = 'F' or m.status = 'T')";
//minagawa$    
    
    private static final String QUERY_DOCUMENT_BY_KARTEID_STARTDATE 
            = "from DocumentModel d where d.karte.id=:karteId and d.started=:started and (d.status='F' or d.status='T')";
    
    private static final String QUERY_DOCUMENT_BY_LINK_ID 
            = "from DocumentModel d where d.linkId=:id";
    
    private static final String QUERY_MODULE_BY_DOC_ID 
            = "from ModuleModel m where m.document.id=:id";
    
    private static final String QUERY_SCHEMA_BY_DOC_ID 
            = "from SchemaModel i where i.document.id=:id";
    
    private static final String QUERY_ATTACHMENT_BY_DOC_ID 
            = "from AttachmentModel a where a.document.id=:id";
    
    @PersistenceContext
    private EntityManager em;

    @Inject
    private MessagingGateway messagingGateway;

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    private SessionTraceManager traceManager;

    @Resource(lookup = ConcurrencyResourceNames.DEFAULT_SCHEDULER)
    private ManagedScheduledExecutorService scheduler;
    
//s.oh^ 2014/02/21 Claim送信方法の変更
    //@Resource(mappedName = "java:/JmsXA")
    //private ConnectionFactory connectionFactory;
    //
    //@Resource(mappedName = "java:/queue/dolphin")
    //private jakarta.jms.Queue queue;
//s.oh$
    
    public List<PatientVisitModel> getPvt(String fid, String did, String unassigned, String date) {
        
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("facilityId", fid);
        auditDetails.put("doctorId", did);
        auditDetails.put("unassignedDoctor", unassigned);
        auditDetails.put("date", date);

        RuntimeException failure = null;
        try {
            List<PatientVisitModel> result;

            if (did==null && unassigned==null) {
                result = (List<PatientVisitModel>) em.createQuery(QUERY_PVT_BY_FID_DATE)
                                      .setParameter("fid", fid)
                                      .setParameter("date", date+"%")
                                      .getResultList();
            } else {
                result = (List<PatientVisitModel>) em.createQuery(QUERY_PVT_BY_FID_DID_DATE)
                                      .setParameter("fid", fid)
                                      .setParameter("did", did)
                                      .setParameter("unassigned", unassigned)
                                      .setParameter("date", date+"%")
                                      .getResultList();
            }

            int len = result.size();

            if (len != 0) {
                // Dateへ変換
                Date startDate = dateFromString(date);

                // 来院情報と患者は ManyToOne の関係である
                for (int i = 0; i < len; i++) {

                    PatientVisitModel pvt = result.get(i);
                    PatientModel patient = pvt.getPatientModel();

                    // 患者の健康保険を取得する
                    List<HealthInsuranceModel> insurances = (List<HealthInsuranceModel>)em.createQuery(QUERY_INSURANCE_BY_PATIENT_ID)
                    .setParameter("id", patient.getId()).getResultList();
                    patient.setHealthInsurances(insurances);
                    
                    List<KarteBean> kartes = em.createQuery(QUERY_KARTE)
                                          .setParameter("patientPk", patient.getId())
                                          .getResultList();
                    KarteBean karte = kartes.get(0);
                    
                    // この日のカルテが存在するか
                    List<DocumentModel> list = (List<DocumentModel>)em.createQuery(QUERY_DOCUMENT_BY_KARTEID_STARTDATE)
                                                         .setParameter("karteId", karte.getId())
                                                         .setParameter("started", startDate)
                                                         .getResultList();
                    if (list!=null && !list.isEmpty()) {
                        pvt.setLastDocDate(startDate);
                    }
                }
            }

            auditDetails.put("resultCount", len);
            return result;
        } catch (RuntimeException ex) {
            failure = ex;
            throw ex;
        } finally {
            writeScheduleAudit("SCHEDULE_FETCH", auditDetails, failure, null);
        }
    }
    
    public int makeScheduleAndSend(long pvtPK, long userPK, Date startDate, boolean send) {
        
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("pvtPk", pvtPK);
        auditDetails.put("userPk", userPK);
        auditDetails.put("sendClaim", send);
        auditDetails.put("startDate", startDate);
        String auditPatientId = null;

        Exception failure = null;
        try {
            // 受付情報を取得する
            PatientVisitModel pvt = (PatientVisitModel)em.find(PatientVisitModel.class, pvtPK);
            PatientModel patient = pvt.getPatientModel();
            auditPatientId = patient != null ? patient.getPatientId() : null;
            if (auditPatientId != null) {
                auditDetails.put("patientId", auditPatientId);
            }

            // 患者の健康保険を取得する
            List<HealthInsuranceModel> insurances = (List<HealthInsuranceModel>)em.createQuery(QUERY_INSURANCE_BY_PATIENT_ID)
            .setParameter("id", patient.getId()).getResultList();
            patient.setHealthInsurances(insurances);
            
            // 受け付けた保険をデコードする
            PVTHealthInsuranceModel pvtHealthInsurance=null;
            for (HealthInsuranceModel m : insurances) {
                XMLDecoder d = new XMLDecoder(
                    new BufferedInputStream(
                    new ByteArrayInputStream(m.getBeanBytes())));
                pvtHealthInsurance = (PVTHealthInsuranceModel)d.readObject();
                break;
            }
            
            // Creator
            UserModel user = em.find(UserModel.class, userPK);
            
            // 患者のカルテを取得する
            List<KarteBean> kartes = em.createQuery(QUERY_KARTE)
                                  .setParameter("patientPk", patient.getId())
                                  .getResultList();
            KarteBean karte = kartes.get(0);
            
            // startDateに相当する日の文書があるか startDate(00:00:00)
            List<DocumentModel> list = (List<DocumentModel>)em.createQuery(QUERY_DOCUMENT_BY_KARTEID_STARTDATE)
                                                 .setParameter("karteId", karte.getId())
                                                 .setParameter("started", startDate)
                                                 .getResultList();
            if (!list.isEmpty()) {
                // 当日のカルテがある場合は何もしない
                LOGGER.info("{} has karte at {}", patient.getFullName(), startDate);
                return 0;
            }
            
            // 当日のカルテがない場合
            DocumentModel schedule;
            
            try {
                // Documentの最終日を得る
                Date lastDocDate = (Date)
//minagawa^ LSC Test                        
                        em.createNativeQuery(QUERY_LASTDOC_DATE_BY_KARTEID_FINAL)
                        .setParameter("karteId", karte.getId())
                        .setParameter("docType", "karte")
                        .getSingleResult();
//minagawa$                
                
                // そのDocumentを得る ToDo
                List<DocumentModel> list2 = (List<DocumentModel>)em.createQuery(QUERY_DOCUMENT_BY_KARTEID_STARTDATE)
                                                     .setParameter("karteId", karte.getId())
                                                     .setParameter("started", lastDocDate)
                                                     .getResultList();
                DocumentModel latest = list2.get(0);

                // 予定文書（カルテ）
                schedule = latest.rpClone();
//s.oh^ 2014/02/06 iPadのFreeText対応
                if(schedule.getModules() != null && !schedule.getModules().isEmpty()) {
                    // SOA
                    StringBuilder sb = new StringBuilder();
                    sb.append("<section>");
                    sb.append("<paragraph>");
                    sb.append("<content><text></text></content>");
                    sb.append("</paragraph>");
                    sb.append("</section>");
                    ProgressCourse soaProgress = new ProgressCourse();
                    soaProgress.setFreeText(sb.toString());
                    ModuleModel soaSpecModule = new ModuleModel();
                    soaSpecModule.setBeanBytes(IOSHelper.toXMLBytes(soaProgress));
                    soaSpecModule.setConfirmed(latest.getConfirmed());
                    soaSpecModule.setStarted(latest.getStarted());
                    soaSpecModule.setRecorded(latest.getRecorded());
                    soaSpecModule.setStatus(latest.getStatus());
                    soaSpecModule.setUserModel(latest.getUserModel());
                    soaSpecModule.setKarteBean(latest.getKarteBean());
                    soaSpecModule.getModuleInfoBean().setStampName("progressCourse");
                    soaSpecModule.getModuleInfoBean().setStampRole("soaSpec");
                    soaSpecModule.getModuleInfoBean().setEntity("progressCourse");
                    soaSpecModule.getModuleInfoBean().setStampNumber(0);
                    soaSpecModule.setDocumentModel(schedule);
                    schedule.addModule(soaSpecModule);
                    // P
                    int number = 0;
                    sb = new StringBuilder();
                    sb.append("<section>");
                    for(int i = 0; i < schedule.getModules().size(); i++) {
                        if(i != 0)  {
                            sb.append("<paragraph>");
                            sb.append("<content><text>\n</text></content>");
                            sb.append("</paragraph>");
                        }
                        sb.append("<paragraph>");
                        sb.append("<component component=").append("\"").append(i).append("\"").append(" name=\"stampHolder\">").append("</component>");
                        sb.append("<content><text></text></content>");
                        sb.append("<content><text>\n</text></content>");
                        sb.append("</paragraph>");
                    }
                    sb.append("</section>");
                    ProgressCourse pProgress = new ProgressCourse();
                    pProgress.setFreeText(sb.toString());
                    ModuleModel pSpecModule = new ModuleModel();
                    pSpecModule.setBeanBytes(IOSHelper.toXMLBytes(pProgress));
                    pSpecModule.setConfirmed(latest.getConfirmed());
                    pSpecModule.setStarted(latest.getStarted());
                    pSpecModule.setRecorded(latest.getRecorded());
                    pSpecModule.setStatus(latest.getStatus());
                    pSpecModule.setUserModel(latest.getUserModel());
                    pSpecModule.setKarteBean(latest.getKarteBean());
                    pSpecModule.getModuleInfoBean().setStampName("progressCourse");
                    pSpecModule.getModuleInfoBean().setStampRole("pSpec");
                    pSpecModule.getModuleInfoBean().setEntity("progressCourse");
                    pSpecModule.getModuleInfoBean().setStampNumber(number++);
                    pSpecModule.setDocumentModel(schedule);
                    schedule.addModule(pSpecModule);
                }
//s.oh$
                LOGGER.info("did rpClone");
                
            } catch (Exception e) {
                LOGGER.info("lastDocDate dose not exist");
                schedule = new DocumentModel();
                String uuid = UUID.randomUUID().toString().replaceAll("-", "");
                schedule.getDocInfoModel().setDocId(uuid);
                schedule.getDocInfoModel().setDocType(IInfoModel.DOCTYPE_KARTE);
                schedule.getDocInfoModel().setTitle("予定");
                schedule.getDocInfoModel().setPurpose(IInfoModel.PURPOSE_RECORD);
                schedule.getDocInfoModel().setHasRp(false);
                schedule.getDocInfoModel().setVersionNumber("1.0");
                LOGGER.info("did create new karte");
            }
            
            // Confirmed
            Date now = new Date();
            
            // DocInfoを設定する
            StringBuilder sb = new StringBuilder();
            sb.append(pvt.getDeptName()).append(",");           // 診療科名
            sb.append(pvt.getDeptCode()).append(",");           // 診療科コード : 受けと不一致、受信？
            sb.append(user.getCommonName()).append(",");        // 担当医名
            if (pvt.getDoctorId()!=null) {
                sb.append(pvt.getDoctorId()).append(",");       // 担当医コード: 受付でIDがある場合
            } else if (user.getOrcaId()!=null) {
                sb.append(user.getOrcaId()).append(",");        // 担当医コード: ORCA ID がある場合
            } else {
                sb.append(user.getUserId()).append(",");        // 担当医コード: ログインユーザーID
            }
            sb.append(pvt.getJmariNumber());                    // JMARI
            schedule.getDocInfoModel().setDepartmentDesc(sb.toString());    // 上記をカンマ区切りで docInfo.departmentDesc へ設定
            schedule.getDocInfoModel().setDepartment(pvt.getDeptCode());    // 診療科コード 01 内科等

            // 施設名、ライセンス、患者情報
            schedule.getDocInfoModel().setFacilityName(user.getFacilityModel().getFacilityName());
            schedule.getDocInfoModel().setCreaterLisence(user.getLicenseModel().getLicense());
            schedule.getDocInfoModel().setPatientId(patient.getPatientId());
            schedule.getDocInfoModel().setPatientName(patient.getFullName());
            schedule.getDocInfoModel().setPatientGender(patient.getGenderDesc());

            // 健康保険を設定する-新規カルテダイアログで選択された保険をセットしている
            schedule.getDocInfoModel().setHealthInsurance(pvtHealthInsurance.getInsuranceClassCode());      // classCode
            schedule.getDocInfoModel().setHealthInsuranceDesc(pvtHealthInsurance.toString());               // 説明
            schedule.getDocInfoModel().setHealthInsuranceGUID(pvtHealthInsurance.getGUID());                // UUID
            schedule.getDocInfoModel().setPVTHealthInsuranceModel(pvtHealthInsurance);                      // 適用保険
            
            // 基本属性
            schedule.setStarted(startDate);
            schedule.setConfirmed(now);
            schedule.setRecorded(now);
            schedule.setKarteBean(karte);
            schedule.setUserModel(user);
            schedule.setStatus("T");
            
            // 関係構築
            List<ModuleModel> modules = schedule.getModules();
            if (modules!=null) {
                for (ModuleModel module : modules) {
                    module.setStarted(schedule.getStarted());
                    module.setConfirmed(schedule.getConfirmed());
                    module.setRecorded(schedule.getRecorded());
                    module.setKarteBean(schedule.getKarteBean());
                    module.setUserModel(user);
                    module.setStatus(schedule.getStatus());
                    module.setDocumentModel(schedule);
                }
            }
            
            // CLAIM送信
            send = send && (modules!=null && !modules.isEmpty());
            schedule.getDocInfoModel().setSendClaim(send);
            
            // 永続化
            em.persist(schedule);
            
            // CLAIM送信
            if (send) {
                schedule.toDetuch();
                dispatchClaimAsync(schedule);
            }
            
            auditDetails.put("karteId", karte.getId());
            auditDetails.put("documentId", schedule.getId());
            auditDetails.put("patientPk", patient.getId());
            return 1;
            
        } catch (Exception e) {
            failure = e;
            LOGGER.error("Failed to create schedule entry", e);
            e.printStackTrace(System.err);
            return 0;
        } finally {
            writeScheduleAudit("SCHEDULE_CREATE", auditDetails, failure, auditPatientId);
        }
    }
    
    public int removePvt(long pvtPK, long ptPK, Date startDate) {
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("pvtPk", pvtPK);
        auditDetails.put("patientPk", ptPK);
        auditDetails.put("startDate", startDate);
        auditDetails.put("pvtDeletedCount", 0);
        auditDetails.put("documentsDeletedCount", 0);
        String auditPatientId = null;

        RuntimeException failure = null;
        try {
            // 受付咲くジョン
            PatientVisitModel exist = (PatientVisitModel)em.find(PatientVisitModel.class, new Long(pvtPK));
            if (exist != null) {
                auditPatientId = exist.getPatientModel() != null ? exist.getPatientModel().getPatientId() : null;
                auditDetails.put("pvtDeletedCount", 1);
                if (auditPatientId != null) {
                    auditDetails.put("patientId", auditPatientId);
                }
                em.remove(exist);
            }
            
            // 患者のカルテを取得する
            List<KarteBean> kartes = em.createQuery(QUERY_KARTE)
                                  .setParameter("patientPk", ptPK)
                                  .getResultList();
            KarteBean karte = kartes.get(0);
            
            // 当日のドキュメントを検索
            List<DocumentModel> list = (List<DocumentModel>)em.createQuery(QUERY_DOCUMENT_BY_KARTEID_STARTDATE)
                                                     .setParameter("karteId", karte.getId())
                                                     .setParameter("started", startDate)
                                                     .getResultList();
            if (list.isEmpty()) {
                auditDetails.put("documentsDeletedCount", 0);
                auditDetails.put("documentsDeletedStatus", "noDocumentsForStartDate");
                return 1;
            }
            
            // それを削除
            int documentsDeleted = 0;
            for (DocumentModel d : list) {
                List<String> l = deleteDocument(d.getId());
                documentsDeleted += l.size();
            }
            auditDetails.put("documentsDeletedCount", documentsDeleted);
            if (documentsDeleted == 0) {
                auditDetails.put("documentsDeletedStatus", "documentsAlreadyDeleted");
            }
            return documentsDeleted + 1;
        } catch (RuntimeException ex) {
            failure = ex;
            throw ex;
        } finally {
            writeScheduleAudit("SCHEDULE_DELETE", auditDetails, failure, auditPatientId);
        }
    }

    private void dispatchClaimAsync(DocumentModel document) {
        Runnable task = () -> messagingGateway.dispatchClaim(document);
        try {
            if (scheduler != null) {
                scheduler.execute(task);
            } else {
                task.run();
            }
        } catch (Exception ex) {
            LOGGER.error("Failed to submit claim dispatch task", ex);
            task.run();
        }
    }

    public List<String> deleteDocument(long id) {
        
        //----------------------------------------
        // 参照されているDocumentの場合は例外を投げる
        //----------------------------------------
        Collection refs = em.createQuery(QUERY_DOCUMENT_BY_LINK_ID)
        .setParameter("id", id).getResultList();
        if (refs != null && refs.size() >0) {
            CanNotDeleteException ce = new CanNotDeleteException("他のドキュメントから参照されているため削除できません。");
            throw ce;
        } 
        
        // 終了日
        Date ended = new Date();
        
        // 削除件数
        int cnt=0;
        
        // 削除リスト　文書ID
        List<String> list = new ArrayList<String>();
        
        // Loop で削除
        while (true) {
            
            try {
                //-----------------------
                // 対象 Document を取得する
                //-----------------------
                DocumentModel delete = (DocumentModel)em.find(DocumentModel.class, id);
                
                //------------------------
                // 削除フラグをたてる
                //------------------------
                delete.setStatus(IInfoModel.STATUS_DELETE);
                delete.setEnded(ended);
                cnt++;
                list.add(delete.getDocInfoModel().getDocId());
                
                //------------------------------
                // 関連するモジュールに同じ処理を行う
                //------------------------------
                Collection deleteModules = em.createQuery(QUERY_MODULE_BY_DOC_ID)
                .setParameter("id", id).getResultList();
                for (Iterator iter = deleteModules.iterator(); iter.hasNext(); ) {
                    ModuleModel model = (ModuleModel) iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                }

                //------------------------------
                // 関連する画像に同じ処理を行う
                //------------------------------
                Collection deleteImages = em.createQuery(QUERY_SCHEMA_BY_DOC_ID)
                .setParameter("id", id).getResultList();
                for (Iterator iter = deleteImages.iterator(); iter.hasNext(); ) {
                    SchemaModel model = (SchemaModel) iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                }

                //------------------------------
                // 関連するAttachmentに同じ処理を行う
                //------------------------------
                Collection deleteAttachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
                .setParameter("id", id).getResultList();
                for (Iterator iter = deleteAttachments.iterator(); iter.hasNext(); ) {
                    AttachmentModel model = (AttachmentModel)iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                }
                
                // 削除したDocumentのlinkID を 削除するDocument id(PK) にしてLoopさせる
                id = delete.getLinkId();
                
            } catch (Exception e) {
                break;
            }
        }

        return list;
    }
    
    private Date dateFromString(String str) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            return sdf.parse(str);
        } catch (Exception e) {           
        }
        return null;
    }

    private void writeScheduleAudit(String action, Map<String, Object> details, Throwable error, String patientId) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        String previousPatient = setPatientContext(patientId);
        try {
            AuditEventEnvelope.Builder builder = newAuditBuilder(action, "ScheduleServiceBean");
            builder.details(details == null ? Map.of() : details);
            if (error != null) {
                builder.failure(error);
            }
            sessionAuditDispatcher.dispatch(builder.build());
        } finally {
            restorePatientContext(previousPatient);
        }
    }

    private AuditEventEnvelope.Builder newAuditBuilder(String action, String resource) {
        AuditEventEnvelope.Builder builder = AuditEventEnvelope.builder(action, resource);
        SessionTraceContext context = traceManager != null ? traceManager.current() : null;
        String actorId = resolveActorId(context);
        builder.actorId(actorId);
        builder.actorDisplayName(resolveActorDisplayName(actorId));
        builder.actorRole(context != null ? context.getActorRole() : null);
        builder.facilityId(resolveFacilityId(actorId));
        String traceId = resolveTraceId(context);
        builder.traceId(traceId);
        builder.requestId(resolveRequestId(context, traceId));
        builder.patientId(resolvePatientId(context));
        builder.component(context != null ? context.getAttribute(SessionTraceAttributes.COMPONENT) : null);
        builder.operation(context != null ? context.getOperation() : null);
        return builder;
    }

    private String resolveActorId(SessionTraceContext context) {
        if (context == null) {
            return "system";
        }
        String actorId = context.getAttribute(SessionTraceAttributes.ACTOR_ID);
        return actorId == null || actorId.isBlank() ? "system" : actorId;
    }

    private String resolveActorDisplayName(String actorId) {
        if (actorId == null) {
            return "system";
        }
        int idx = actorId.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (idx >= 0 && idx + 1 < actorId.length()) {
            return actorId.substring(idx + 1);
        }
        return actorId;
    }

    private String resolveFacilityId(String actorId) {
        if (actorId == null) {
            return null;
        }
        int idx = actorId.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (idx <= 0) {
            return null;
        }
        return actorId.substring(0, idx);
    }

    private String resolveTraceId(SessionTraceContext context) {
        if (context != null && context.getTraceId() != null && !context.getTraceId().isBlank()) {
            return context.getTraceId();
        }
        return UUID.randomUUID().toString();
    }

    private String resolveRequestId(SessionTraceContext context, String traceId) {
        if (context != null) {
            String requestId = context.getAttribute(SessionTraceAttributes.REQUEST_ID);
            if (requestId != null && !requestId.isBlank()) {
                return requestId;
            }
        }
        return traceId;
    }

    private String resolvePatientId(SessionTraceContext context) {
        if (context == null) {
            return "N/A";
        }
        String patient = context.getAttribute(SessionTraceAttributes.PATIENT_ID);
        return patient == null || patient.isBlank() ? "N/A" : patient;
    }

    private String setPatientContext(String patientId) {
        if (traceManager == null) {
            return null;
        }
        String normalized = (patientId == null || patientId.isBlank()) ? null : patientId;
        String previous = traceManager.getAttribute(SessionTraceAttributes.PATIENT_ID);
        traceManager.putAttribute(SessionTraceAttributes.PATIENT_ID, normalized);
        return previous;
    }

    private void restorePatientContext(String previousPatientId) {
        if (traceManager == null) {
            return;
        }
        traceManager.putAttribute(SessionTraceAttributes.PATIENT_ID, previousPatientId);
    }
}
