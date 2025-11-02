/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package open.dolphin.adm20.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.credential.CredentialRepository;
import com.yubico.webauthn.data.AuthenticatorAttachment;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.ClientAssertionExtensionOutputs;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.PublicKeyCredentialRequestOptions;
import com.yubico.webauthn.data.PublicKeyCredentialType;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import com.yubico.webauthn.data.AuthenticatorAssertionResponse;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import jakarta.ejb.Stateless;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.AttachmentModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.FacilityModel;
import open.dolphin.infomodel.Factor2BackupKey;
import open.dolphin.infomodel.Factor2Code;
import open.dolphin.infomodel.Factor2Challenge;
import open.dolphin.infomodel.Factor2ChallengeType;
import open.dolphin.infomodel.Factor2Credential;
import open.dolphin.infomodel.Factor2CredentialType;
import open.dolphin.infomodel.Factor2Device;
import open.dolphin.infomodel.Factor2Spec;
import open.dolphin.infomodel.ThirdPartyDisclosureRecord;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteNumber;
import open.dolphin.infomodel.IStampTreeModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.NurseProgressCourseModel;
import open.dolphin.infomodel.ObservationModel;
import open.dolphin.infomodel.OndobanModel;
import open.dolphin.infomodel.PatientMemoModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.infomodel.StampTreeModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.infomodel.VitalModel;
import open.dolphin.security.HashUtil;
import open.dolphin.security.fido.Fido2Config;
import open.dolphin.security.totp.BackupCodeGenerator;
import open.dolphin.security.totp.TotpRegistrationResult;
import open.dolphin.security.totp.TotpSecretProtector;

/**
 *
 * @author kazushi
 */
@Named
@Stateless
public class ADM20_EHTServiceBean {

    // 新規患者
    private static final String QUERY_FIRST_VISITOR_LIST = "from KarteBean k where k.patient.facilityId=:facilityId order by k.created desc";

    // Karte
    private static final String QUERY_KARTE = "from KarteBean k where k.patient.id=:patientPk";

    // Document & module
    private static final String QUERY_DOCUMENT_BY_PK = "from DocumentModel d where d.id=:pk";

    private static final int BACKUP_CODE_COUNT = 10;
    private static final int FIDO_CHALLENGE_TTL_SECONDS = 300;

    private final SecureRandom secureRandom = new SecureRandom();
    private final ObjectMapper securityMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private static final String QUERY_DOCUMENT_BY_LINK_ID = "from DocumentModel d where d.linkId=:id";
    
    private static final String QUERY_MODULE_BY_DOCUMENT = "from ModuleModel m where m.document.id=:id";
    private static final String QUERY_SCHEMA_BY_DOCUMENT = "from SchemaModel i where i.document.id=:id";
    private static final String QUERY_ATTACHMENT_BY_DOC_ID = "from AttachmentModel a where a.document.id=:id";
    private static final String QUERY_MODULE_BY_ENTITY = "from ModuleModel m where m.karte.id=:karteId and m.moduleInfo.entity=:entity and m.status='F' order by m.started desc";
    
    // memo
    private static final String QUERY_PATIENT_MEMO = "from PatientMemoModel p where p.karte.id=:karteId";
    
    // Allergy
    private static final String QUERY_ALLERGY_BY_KARTE_ID = "from ObservationModel o where o.karte.id=:karteId and o.observation='Allergy'";
    
    // Diagnosis
    private static final String QUERY_DIAGNOSIS_BY_KARTE_ACTIVEONLY_DESC = "from RegisteredDiagnosisModel r where r.karte.id=:karteId and r.ended is NULL order by r.started desc";
    private static final String QUERY_DIAGNOSIS_BY_KARTE_DESC = "from RegisteredDiagnosisModel r where r.karte.id=:karteId order by r.started desc";
    private static final String QUERY_DIAGNOSIS_BY_KARTE_OUTCOMEONLY_DESC = "from RegisteredDiagnosisModel r where r.karte.id=:karteId and r.ended is not NULL order by r.started desc";
    
    private static final String QUERY_INSURANCE_BY_PATIENT_PK = "from HealthInsuranceModel h where h.patient.id=:pk";
    
    // バイタル対応
    private static final String QUERY_VITAL_BY_ID = "from VitalModel v where v.id=:id";
    private static final String ID = "id";
    
    @PersistenceContext
    private EntityManager em;
    
    // 直近の新患リスト
    public List<PatientModel> getFirstVisitors(String facilityId, int firstResult, int maxResult) {

        List<KarteBean> list =
                (List<KarteBean>)em.createQuery(QUERY_FIRST_VISITOR_LIST)
                                           .setParameter("facilityId", facilityId)
                                           .setFirstResult(firstResult)
                                           .setMaxResults(maxResult)
                                           .getResultList();
        
        List<PatientModel> result = new ArrayList(list.size());
        
        for (KarteBean k : list) {
            PatientModel patient = k.getPatientModel();
//minagawa^  ios7 EHRTouch用          
            patient.setFirstVisited(k.getCreated());
//minagawa$            
            setHealthInsurances(patient);
            result.add(patient);
        }
        
        return result;
    }
    
    
    // 患者メモ
    public PatientMemoModel getPatientMemo(long ptPK) {
        
        KarteBean karte = (KarteBean) em.createQuery(QUERY_KARTE)
                                       .setParameter("patientPk", ptPK)
                                       .getSingleResult();
        
        // メモを取得する
        List<PatientMemoModel> memoList =
                    (List<PatientMemoModel>)em.createQuery(QUERY_PATIENT_MEMO)
                                              .setParameter("karteId", karte.getId())
                                              .getResultList();
        
        return (!memoList.isEmpty()) ? memoList.get(0) : null;
    }
    
    public long addPatientMemo(PatientMemoModel model) {
        //em.persist(model);
        if(model.getKarteBean() != null) {
            List<PatientMemoModel> memoList =
                        (List<PatientMemoModel>)em.createQuery(QUERY_PATIENT_MEMO)
                                                  .setParameter("karteId", model.getKarteBean().getId())
                                                  .getResultList();
            if(memoList.isEmpty()) {
                em.persist(model);
            }else{
                PatientMemoModel pmm = memoList.get(0);
                pmm.setMemo(model.getMemo());
                em.merge(pmm);
            }
        }else{
            em.persist(model);
        }
        return model.getId();
    }
    
    public int updatePatientMemo(PatientMemoModel model) {
        em.merge(model);
        return 1;
    }
    
    public int deletePatientMemo(PatientMemoModel model) {
        PatientMemoModel delete = em.find(PatientMemoModel.class, model.getId());
        em.remove(delete);
        return 1;
    }
    
    // Allergy
    public List<AllergyModel> getAllergies(long patientPk) {

       List<AllergyModel> retList = new ArrayList<>();

       KarteBean karte = (KarteBean) em.createQuery(QUERY_KARTE)
                                       .setParameter("patientPk", patientPk)
                                       .getSingleResult();

        List<ObservationModel> observations =
                (List<ObservationModel>)em.createQuery(QUERY_ALLERGY_BY_KARTE_ID)
                              .setParameter("karteId", karte.getId())
                              .getResultList();

        for (ObservationModel observation : observations) {
            AllergyModel allergy = new AllergyModel();
            allergy.setObservationId(observation.getId());
            allergy.setFactor(observation.getPhenomenon());
            allergy.setSeverity(observation.getCategoryValue());
            allergy.setIdentifiedDate(observation.confirmDateAsString());
            allergy.setMemo(observation.getMemo());
            retList.add(allergy);
        }

        return retList;
    }
    
    public long addAllergy(ObservationModel model) {
        em.persist(model);
        return model.getId();
    }
    
    public int updateAllergy(ObservationModel model) {
        em.merge(model);
        return 1;
    }
    
    public int deleteAllergy(ObservationModel model) {
        ObservationModel target = em.find(ObservationModel.class, model.getId());
        em.remove(target);
        return 1;
    }

    // Active 病名のみ
    public List<RegisteredDiagnosisModel> getDiagnosis(long patientPk, boolean active, boolean outcomeOnly, int firstResult, int maxResult) {

        List<RegisteredDiagnosisModel> ret;
        
        KarteBean karte = (KarteBean) em.createQuery(QUERY_KARTE)
                                       .setParameter("patientPk", patientPk)
                                       .getSingleResult();

        if (active) {
            // 疾患開始日の降順 i.e. 直近分
            ret = em.createQuery(QUERY_DIAGNOSIS_BY_KARTE_ACTIVEONLY_DESC)
                        .setParameter("karteId", karte.getId())
                        .setFirstResult(firstResult)
                        .setMaxResults(maxResult)
                        .getResultList();
            
        } else if (outcomeOnly) {
            ret = em.createQuery(QUERY_DIAGNOSIS_BY_KARTE_OUTCOMEONLY_DESC)
                        .setParameter("karteId", karte.getId())
                        .setFirstResult(firstResult)
                        .setMaxResults(maxResult)
                        .getResultList();
               
        } else {
            ret = em.createQuery(QUERY_DIAGNOSIS_BY_KARTE_DESC)
                        .setParameter("karteId", karte.getId())
                        .setFirstResult(firstResult)
                        .setMaxResults(maxResult)
                        .getResultList();
        }
        
        return ret;
    }
    
    public int addDiagnosis(RegisteredDiagnosisModel model) {
        em.persist(model);
        return 1;
    }
    
    public int updateDiagnosis(RegisteredDiagnosisModel model) {
        em.merge(model);
        return 1;
    }
    
    public int deleteDiagnosis(RegisteredDiagnosisModel model) {
        RegisteredDiagnosisModel delete = em.find(RegisteredDiagnosisModel.class, model.getId());
        em.remove(delete);
        return 1;
    }
    
    // EHT Karte
    public KarteNumber getKarteNumber(long ptPK) {
        
        KarteNumber ret = new KarteNumber();
        
        // Karte
        KarteBean karte = (KarteBean) em.createQuery(QUERY_KARTE)
                                       .setParameter("patientPk", ptPK)
                                       .getSingleResult();
        
        ret.setKarteNumber(karte.getId());
        ret.setCreated(karte.getCreated());
        
        return ret;
    }
    
    
    // Document
    public DocumentModel getDocumentByPk(long docPk) {

        DocumentModel ret;

        ret = (DocumentModel) em.createQuery(QUERY_DOCUMENT_BY_PK)
                                       .setParameter("pk", docPk)
                                       .getSingleResult();
        
        // module
        List<ModuleModel> modules =
                em.createQuery(QUERY_MODULE_BY_DOCUMENT)
                  .setParameter("id", ret.getId())
                  .getResultList();

        ret.setModules(modules);

        // SchemaModel を取得する
        List<SchemaModel> images =
                em.createQuery(QUERY_SCHEMA_BY_DOCUMENT)
                  .setParameter("id", ret.getId())
                  .getResultList();
        ret.setSchema(images);
        
        // AttachmentModel を取得する
            List attachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
            .setParameter("id", ret.getId())
            .getResultList();
            ret.setAttachment(attachments);
        
        return ret;
    }
    
    public List<String> deleteDocumentByPk(long id) {
        
        //----------------------------------------
        // 参照されているDocumentの場合は例外を投げる
        //----------------------------------------
        Collection refs = em.createQuery(QUERY_DOCUMENT_BY_LINK_ID)
        .setParameter("id", id).getResultList();
        if (refs != null && refs.size() >0) {
            RuntimeException ce = new RuntimeException("他のドキュメントから参照されているため削除できません。");
            throw ce;
        } 
        
        // 終了日
        Date ended = new Date();
        
        // 削除件数
        int cnt=0;
        
        // 削除リスト　文書ID
        List<String> list = new ArrayList<>();
        
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
                Collection deleteModules = em.createQuery(QUERY_MODULE_BY_DOCUMENT)
                .setParameter("id", id).getResultList();
                for (Iterator iter = deleteModules.iterator(); iter.hasNext(); ) {
                    ModuleModel model = (ModuleModel) iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                }

                //------------------------------
                // 関連する画像に同じ処理を行う
                //------------------------------
                Collection deleteImages = em.createQuery(QUERY_SCHEMA_BY_DOCUMENT)
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
    
    //------------------------------------------------------------------------
    // 相互作用 関連
    //------------------------------------------------------------------------ 
    public List<ModuleModel> collectModules(long patientPk, Date fromDate, Date toDate, List<String> entities) {
        
        // 指定したentityのModuleModelを返す
        List<ModuleModel> ret;
        
        KarteBean karte = (KarteBean)
                        em.createQuery(QUERY_KARTE)
                          .setParameter("patientPk", patientPk)
                          .getSingleResult();
        
        if (entities!=null && entities.size()>0) {
            final String sql = "from ModuleModel m where m.karte.id = :karteId " +
                    "and m.started between :fromDate and :toDate and m.status='F' " +
                    "and m.moduleInfo.entity in (:entities)";
            ret = em.createQuery(sql)
                    .setParameter("karteId", karte.getId())
                    .setParameter("fromDate", fromDate)
                    .setParameter("toDate", toDate)
                    .setParameter("entities", entities)
                    .getResultList();
        } else {
            final String sql = "from ModuleModel m where m.karte.id = :karteId " +
                    "and m.started between :fromDate and :toDate and m.status='F' ";
            ret = em.createQuery(sql)
                    .setParameter("karteId", karte.getId())
                    .setParameter("fromDate", fromDate)
                    .setParameter("toDate", toDate)
                    .getResultList();
        }
        
        return ret;
    }
    
    //------------------------------------------------------------------------
    // Module 関連
    //------------------------------------------------------------------------ 
    public List<ModuleModel> getModules(long patientPk, String entity, int firstResult, int maxResult) {
        
        List<ModuleModel> retList;
        
        KarteBean karte = (KarteBean)
                        em.createQuery(QUERY_KARTE)
                          .setParameter("patientPk", patientPk)
                          .getSingleResult();

        if (entity.equals("all")) {

            retList = em.createQuery("from ModuleModel m where m.karte.id=:karteId and m.moduleInfo.entity!=:entity and m.status='F' order by m.started desc")
                        .setParameter("karteId", karte.getId())
                        .setParameter("entity", "progressCourse")
                        .setFirstResult(firstResult)
                        .setMaxResults(maxResult)
                        .getResultList();

        } else {

            retList = em.createQuery(QUERY_MODULE_BY_ENTITY)
                        .setParameter("karteId", karte.getId())
                        .setParameter("entity", entity)
                        .setFirstResult(firstResult)
                        .setMaxResults(maxResult)
                        .getResultList();
        }
        
        return retList;
    }
    
    
    public List<NLaboModule> getLaboTest(String facilityId, String patientId, int firstResult, int maxResult) {

        StringBuilder sb = new StringBuilder();
        sb.append(facilityId);
        sb.append(":");
        sb.append(patientId);
        String fidPid = sb.toString();
        
        List<FacilityModel> fList = em.createQuery("from FacilityModel f where f.facilityId=:facilityId")
                .setParameter("facilityId", facilityId)
                .getResultList();
        FacilityModel facility = fList.get(0);

        List<NLaboModule> ret = (List<NLaboModule>)
                        em.createQuery("from NLaboModule l where l.patientId=:fidPid order by l.sampleDate desc")
                          .setParameter("fidPid", fidPid)
                          .setFirstResult(firstResult)
                          .setMaxResults(maxResult)
                          .getResultList();

        for (NLaboModule m : ret) {
            
            m.setFacilityId(facility.getFacilityId());
            m.setFacilityName(facility.getFacilityName());

            List<NLaboItem> items = (List<NLaboItem>)
                            em.createQuery("from NLaboItem l where l.laboModule.id=:mid order by groupCode,parentCode,itemCode")
                              .setParameter("mid", m.getId())
                              .getResultList();
            m.setItems(items);
        }
        return ret;
    }
    
    public List<NLaboItem> getLaboTestItem(String facilityId, String patientId, int firstResult, int maxResult, String itemCode) {

        StringBuilder sb = new StringBuilder();
        sb.append(facilityId);
        sb.append(":");
        sb.append(patientId);
        String fidPid = sb.toString();

        List<NLaboItem> ret = (List<NLaboItem>)
                        em.createQuery("from NLaboItem l where l.patientId=:fidPid and l.itemCode=:itemCode order by l.sampleDate desc")
                          .setParameter("fidPid", fidPid)
                          .setParameter("itemCode", itemCode)
                          .setFirstResult(firstResult)
                          .setMaxResults(maxResult)
                          .getResultList();

        return ret;
    }
    
    //------------------------------------------------------------------------
    // Stamp 関連
    //------------------------------------------------------------------------    
    public IStampTreeModel getTrees(long userPK) {

        // パーソナルツリーを取得する
        List<StampTreeModel> list = (List<StampTreeModel>)
                em.createQuery("from StampTreeModel s where s.user.id=:userPK")
                  .setParameter("userPK", userPK)
                  .getResultList();

        // 新規ユーザの場合
        if (list.isEmpty()) {
            return null;
        }

        // 最初の Tree を取得
        IStampTreeModel ret = (StampTreeModel)list.remove(0);

        // まだある場合 BUG
        if (!list.isEmpty()) {
            // 後は delete する
            for (int i=0; i < list.size(); i++) {
                StampTreeModel st = (StampTreeModel)list.remove(0);
                em.remove(st);
            }
        }

        return ret;
    }
    
    public StampModel getStamp(String stampId) {

        try {
            return (StampModel)em.find(StampModel.class, stampId);
        } catch (NoResultException e) {
        }

        return null;
    }
    
    protected void setHealthInsurances(Collection<PatientModel> list) {
        if (list != null && !list.isEmpty()) {
            for (PatientModel pm : list) {
                setHealthInsurances(pm);
            }
        }
    }
    
    protected void setHealthInsurances(PatientModel pm) {
        if (pm != null) {
            List<HealthInsuranceModel> ins = getHealthInsurances(pm.getId());
            pm.setHealthInsurances(ins);
        }
    }

    protected List<HealthInsuranceModel> getHealthInsurances(long pk) {
        
        List<HealthInsuranceModel> ins =
                em.createQuery(QUERY_INSURANCE_BY_PATIENT_PK)
                .setParameter("pk", pk)
                .getResultList();
        return ins;
    }
    

    public VitalModel getVital(String id) {
        VitalModel vital
                = (VitalModel)em.createQuery(QUERY_VITAL_BY_ID)
                .setParameter(ID, Long.parseLong(id))
                .getSingleResult();

        return vital;
    }

//-----------------------------------------------------------------------------
// 温度板
//-----------------------------------------------------------------------------     
    public List<OndobanModel> getOndoban(long ptPK, Date fromDate, Date toDate) {
        
        // Karte
        KarteBean karte;
        karte = (KarteBean)
                em.createQuery(QUERY_KARTE)
                        .setParameter("patientPk", ptPK)
                        .getSingleResult();
        
        // 文書履歴エントリーを取得しカルテに設定する
        List<OndobanModel> result;
        result = (List<OndobanModel>)em.createQuery("from OndobanModel o where o.karte.id=:karteId and o.started between :fromDate and :toDate")
                .setParameter("karteId", karte.getId())
                .setParameter("fromDate", fromDate)
                .setParameter("toDate", toDate)
                .getResultList();
        return result;
    }
    
    public List<Long> addOndoban(List<OndobanModel> observations) {
        if (observations != null && observations.size() > 0) {
            List<Long> ret = new ArrayList<>(observations.size());
            for (OndobanModel model : observations) {
                em.persist(model);
                ret.add(model.getId());
            }
            return ret;
        }
        return null;
    }
    
    public int updateOndoban(List<OndobanModel> observations) {
        if (observations != null && observations.size() > 0) {
            for (OndobanModel model : observations) {
                em.merge(model);
            }
            return observations.size();
        }
        return 0;
    }
    
    public int deleteOndoban(List<OndobanModel> observations) {
        if (observations != null && observations.size() > 0) {
            for (OndobanModel model : observations) {
                OndobanModel delete = em.find(OndobanModel.class, model.getId());
                em.remove(delete);
            }
            return observations.size();
        }
        return 0;
    }
//-----------------------------------------------------------------------------
// 看護記録
//-----------------------------------------------------------------------------     
    public List<NurseProgressCourseModel> getNurseProgressCourse(long ptPK, int firstResult, int maxResult) {
        
        // Karte
        KarteBean karte;
        karte = (KarteBean)
                em.createQuery(QUERY_KARTE)
                        .setParameter("patientPk", ptPK)
                        .getSingleResult();
        
        // started で降順にして取り出す
        List<NurseProgressCourseModel> result;
        result = (List<NurseProgressCourseModel>)em.createQuery("from NurseProgressCourseModel n where n.karte.id=:karteId order by n.started desc")
                .setParameter("karteId", karte.getId())
                .setFirstResult(firstResult)
                .setMaxResults(maxResult)
                .getResultList();
        return result;
    }
    
    public Long addNurseProgressCourse(NurseProgressCourseModel model) {
        em.persist(model);
        return model.getId();
    }
    
    public int updateNurseProgressCourse(NurseProgressCourseModel model) {
        em.merge(model);
        return 1;
    }
    
    public int deleteNurseProgressCourse(NurseProgressCourseModel model) {
        NurseProgressCourseModel delete = em.find(NurseProgressCourseModel.class, model.getId());
        em.remove(delete);
        return 1;
    }
    
//minagawa^ ２段階認証
    public TotpRegistrationResult startTotpRegistration(long userPk, String label, String accountName, String issuer, TotpSecretProtector protector) {

        UserModel user = em.find(UserModel.class, userPk);
        if (user == null) {
            throw new NoResultException("User not found");
        }
        if (user.getMemberType() != null && user.getMemberType().equals("EXPIRED")) {
            throw new SecurityException("Expired User");
        }

        cleanupUnverifiedTotp(userPk);

        OTPHelper helper = new OTPHelper();
        String secret = helper.generateSecret();
        Instant now = Instant.now();

        Factor2Credential credential = new Factor2Credential();
        credential.setUserPK(userPk);
        credential.setCredentialType(Factor2CredentialType.TOTP);
        credential.setLabel(label != null && !label.isBlank() ? label : "Authenticator");
        credential.setCredentialId(generateCredentialReference());
        credential.setSecret(protector.encrypt(secret));
        credential.setVerified(false);
        credential.setCreatedAt(now);
        credential.setUpdatedAt(now);
        credential.setTransports("TOTP");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("issuer", issuer);
        metadata.put("accountName", accountName);
        credential.setMetadata(writeJson(metadata));

        em.persist(credential);

        String provisioningUri = helper.buildProvisioningUri(secret,
                accountName != null && !accountName.isBlank() ? accountName : user.getUserId(),
                issuer != null && !issuer.isBlank() ? issuer : "OpenDolphin");

        return new TotpRegistrationResult(credential.getId(), secret, provisioningUri);
    }

    public List<String> completeTotpRegistration(long userPk, long credentialId, String code, TotpSecretProtector protector) {

        Factor2Credential credential = em.find(Factor2Credential.class, credentialId);
        if (credential == null || credential.getUserPK() != userPk) {
            throw new SecurityException("TOTP credential not found");
        }
        if (credential.isVerified()) {
            throw new SecurityException("TOTP credential already verified");
        }
        if (credential.getCredentialType() != Factor2CredentialType.TOTP) {
            throw new SecurityException("Invalid credential type");
        }

        int numericCode;
        try {
            numericCode = Integer.parseInt(code.trim());
        } catch (NumberFormatException e) {
            throw new SecurityException("Invalid TOTP code", e);
        }

        OTPHelper helper = new OTPHelper();
        String secret = protector.decrypt(credential.getSecret());
        if (!helper.verifyCurrentWindow(secret, numericCode)) {
            throw new SecurityException("TOTP verification failed");
        }

        Instant now = Instant.now();
        credential.setVerified(true);
        credential.setUpdatedAt(now);
        credential.setLastUsedAt(now);
        em.merge(credential);

        UserModel user = em.find(UserModel.class, userPk);
        user.setFactor2Auth("TOTP");

        cleanupBackupKeys(userPk);

        BackupCodeGenerator generator = new BackupCodeGenerator();
        List<String> codes = generator.generateCodes(BACKUP_CODE_COUNT);
        for (String raw : codes) {
            Factor2BackupKey key = new Factor2BackupKey();
            key.setUserPK(userPk);
            key.setBackupKey(hashBackupCode(userPk, raw));
            key.setHashAlgorithm("SHA-256");
            key.setCreatedAt(now);
            em.persist(key);
        }

        removeFactor2Codes(userPk);
        return codes;
    }

    public void saveFactor2Code(Factor2Code f2Code) {

        List<Factor2Code> list = em.createQuery("from Factor2Code f where f.userPK=:userPK")
                .setParameter("userPK", f2Code.getUserPK())
                .getResultList();
        if (list.size()>0) {
            for (Factor2Code f2 : list) {
                em.remove(f2);
            }
        }
        em.persist(f2Code);
    }

    private void cleanupUnverifiedTotp(long userPk) {
        List<Factor2Credential> stale = em.createQuery("from Factor2Credential f where f.userPK=:userPK and f.credentialType=:type and f.verified=false", Factor2Credential.class)
                .setParameter("userPK", userPk)
                .setParameter("type", Factor2CredentialType.TOTP)
                .getResultList();
        for (Factor2Credential credential : stale) {
            em.remove(credential);
        }
    }

    private void cleanupBackupKeys(long userPk) {
        List<Factor2BackupKey> existing = em.createQuery("from Factor2BackupKey f where f.userPK=:userPK", Factor2BackupKey.class)
                .setParameter("userPK", userPk)
                .getResultList();
        for (Factor2BackupKey key : existing) {
            em.remove(key);
        }
    }

    private void removeFactor2Codes(long userPk) {
        List<Factor2Code> list = em.createQuery("from Factor2Code f where f.userPK=:userPK", Factor2Code.class)
                .setParameter("userPK", userPk)
                .getResultList();
        for (Factor2Code code : list) {
            em.remove(code);
        }
    }

    private String generateCredentialReference() {
        byte[] buffer = new byte[16];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private String writeJson(Object value) {
        try {
            return securityMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize security metadata", e);
        }
    }

    private String hashBackupCode(long userPk, String rawCode) {
        String normalized = rawCode == null ? "" : rawCode.replace(" ", "").toUpperCase();
        return HashUtil.sha256(userPk + ":" + normalized);
    }

    public Factor2Challenge startFidoRegistration(long userPk, Fido2Config config, String authenticatorAttachment) {

        UserModel user = em.find(UserModel.class, userPk);
        if (user == null) {
            throw new NoResultException("User not found");
        }
        if (user.getMemberType() != null && user.getMemberType().equals("EXPIRED")) {
            throw new SecurityException("Expired User");
        }

        cleanupChallenges(userPk, Factor2ChallengeType.FIDO2_REGISTRATION);

        RelyingParty rp = buildRelyingParty(config);
        UserIdentity identity = UserIdentity.builder()
                .name(user.getUserId())
                .displayName(user.getCommonName() != null ? user.getCommonName() : user.getUserId())
                .id(userHandle(userPk))
                .build();

        StartRegistrationOptions.Builder builder = StartRegistrationOptions.builder()
                .user(identity)
                .timeout(60000L)
                .authenticatorSelection(buildAuthenticatorSelection(authenticatorAttachment))
                .excludeCredentials(descriptorsForUser(userPk));

        PublicKeyCredentialCreationOptions options = rp.startRegistration(builder.build());

        Factor2Challenge challenge = new Factor2Challenge();
        challenge.setUserPK(userPk);
        challenge.setChallengeType(Factor2ChallengeType.FIDO2_REGISTRATION);
        challenge.setRequestId(UUID.randomUUID().toString());
        challenge.setChallengePayload(writeJson(options));
        Instant now = Instant.now();
        challenge.setCreatedAt(now);
        challenge.setExpiresAt(now.plusSeconds(FIDO_CHALLENGE_TTL_SECONDS));
        challenge.setRpId(config.getRelyingPartyId());
        challenge.setOrigin(config.getAllowedOrigins().isEmpty() ? null : config.getAllowedOrigins().get(0));
        em.persist(challenge);
        return challenge;
    }

    public Factor2Credential finishFidoRegistration(long userPk, String requestId, String credentialResponseJson, String label, Fido2Config config) {

        Factor2Challenge challenge = requireChallenge(requestId, Factor2ChallengeType.FIDO2_REGISTRATION, userPk);
        PublicKeyCredentialCreationOptions options = readJson(challenge.getChallengePayload(), PublicKeyCredentialCreationOptions.class);

        RelyingParty rp = buildRelyingParty(config);

        PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> credential =
                readJson(credentialResponseJson, new TypeReference<PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs>>() {});

        try {
            var result = rp.finishRegistration(FinishRegistrationOptions.builder()
                    .request(options)
                    .response(credential)
                    .build());

            Factor2Credential entity = new Factor2Credential();
            entity.setUserPK(userPk);
            entity.setCredentialType(Factor2CredentialType.FIDO2);
            entity.setCredentialId(result.getKeyId().getId().getBase64Url());
            entity.setPublicKey(result.getPublicKeyCose().getBase64Url());
            entity.setSignCount(result.getSignatureCount());
            entity.setLabel(label != null && !label.isBlank() ? label : "FIDO2 Authenticator");
            Instant now = Instant.now();
            entity.setCreatedAt(now);
            entity.setUpdatedAt(now);
            entity.setVerified(true);
            entity.setTransports(result.getKeyId().getTransports().map(this::writeJson).orElse(null));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("attestationTrusted", result.isAttestationTrusted());
            result.getAttestationType().ifPresent(type -> metadata.put("attestationType", type.name()));
            entity.setMetadata(writeJson(metadata));

            em.persist(entity);
            em.remove(challenge);
            return entity;
        } catch (RegistrationFailedException e) {
            throw new SecurityException("FIDO2 registration failed", e);
        }
    }

    public Factor2Challenge startFidoAssertion(long userPk, String userId, Fido2Config config) {
        cleanupChallenges(userPk, Factor2ChallengeType.FIDO2_ASSERTION);
        RelyingParty rp = buildRelyingParty(config);
        StartAssertionOptions options = StartAssertionOptions.builder()
                .username(userId)
                .userVerification(UserVerificationRequirement.REQUIRED)
                .timeout(60000L)
                .build();

        AssertionRequest request = rp.startAssertion(options);
        Factor2Challenge challenge = new Factor2Challenge();
        challenge.setUserPK(userPk);
        challenge.setChallengeType(Factor2ChallengeType.FIDO2_ASSERTION);
        challenge.setRequestId(UUID.randomUUID().toString());
        challenge.setChallengePayload(writeJson(request));
        Instant now = Instant.now();
        challenge.setCreatedAt(now);
        challenge.setExpiresAt(now.plusSeconds(FIDO_CHALLENGE_TTL_SECONDS));
        challenge.setRpId(config.getRelyingPartyId());
        challenge.setOrigin(config.getAllowedOrigins().isEmpty() ? null : config.getAllowedOrigins().get(0));
        em.persist(challenge);
        return challenge;
    }

    public boolean finishFidoAssertion(long userPk, String requestId, String credentialResponseJson, Fido2Config config) {
        Factor2Challenge challenge = requireChallenge(requestId, Factor2ChallengeType.FIDO2_ASSERTION, userPk);
        AssertionRequest assertionRequest = readJson(challenge.getChallengePayload(), AssertionRequest.class);
        RelyingParty rp = buildRelyingParty(config);
        PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> credential =
                readJson(credentialResponseJson, new TypeReference<PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs>>() {});

        try {
            AssertionResult result = rp.finishAssertion(FinishAssertionOptions.builder()
                    .request(assertionRequest)
                    .response(credential)
                    .build());
            if (!result.isSuccess()) {
                return false;
            }

            String credentialId = result.getCredentialId().getBase64Url();
            Factor2Credential entity = requireFidoCredential(userPk, credentialId);
            entity.setSignCount(result.getSignatureCount());
            entity.setLastUsedAt(Instant.now());
            entity.setUpdatedAt(Instant.now());
            em.merge(entity);
            em.remove(challenge);
            return true;
        } catch (AssertionFailedException e) {
            throw new SecurityException("FIDO2 assertion failed", e);
        }
    }

    private void cleanupChallenges(long userPk, Factor2ChallengeType type) {
        List<Factor2Challenge> list = em.createQuery("from Factor2Challenge c where c.userPK=:userPK and c.challengeType=:type", Factor2Challenge.class)
                .setParameter("userPK", userPk)
                .setParameter("type", type)
                .getResultList();
        for (Factor2Challenge challenge : list) {
            em.remove(challenge);
        }
    }

    private Factor2Challenge requireChallenge(String requestId, Factor2ChallengeType type, long userPk) {
        Factor2Challenge challenge = em.createQuery("from Factor2Challenge c where c.requestId=:requestId and c.challengeType=:type", Factor2Challenge.class)
                .setParameter("requestId", requestId)
                .setParameter("type", type)
                .getSingleResult();
        if (challenge.getUserPK() != userPk) {
            throw new SecurityException("Challenge user mismatch");
        }
        if (challenge.getExpiresAt() != null && challenge.getExpiresAt().isBefore(Instant.now())) {
            em.remove(challenge);
            throw new SecurityException("Challenge expired");
        }
        return challenge;
    }

    private AuthenticatorSelectionCriteria buildAuthenticatorSelection(String attachment) {
        if (attachment == null || attachment.isBlank()) {
            return AuthenticatorSelectionCriteria.builder().userVerification(UserVerificationRequirement.REQUIRED).build();
        }
        AuthenticatorSelectionCriteria.Builder builder = AuthenticatorSelectionCriteria.builder()
                .userVerification(UserVerificationRequirement.REQUIRED);
        if ("platform".equalsIgnoreCase(attachment)) {
            builder.authenticatorAttachment(AuthenticatorAttachment.PLATFORM);
        } else if ("cross-platform".equalsIgnoreCase(attachment) || "cross_platform".equalsIgnoreCase(attachment)) {
            builder.authenticatorAttachment(AuthenticatorAttachment.CROSS_PLATFORM);
        }
        return builder.build();
    }

    private RelyingParty buildRelyingParty(Fido2Config config) {
        RelyingPartyIdentity identity = RelyingPartyIdentity.builder()
                .id(config.getRelyingPartyId())
                .name(config.getRelyingPartyName())
                .build();
        return RelyingParty.builder()
                .identity(identity)
                .credentialRepository(createCredentialRepository())
                .origins(new HashSet<>(config.getAllowedOrigins()))
                .build();
    }

    private CredentialRepository createCredentialRepository() {
        return new CredentialRepository() {
            @Override
            public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
                UserModel user = findUserByUsername(username);
                if (user == null) {
                    return Set.of();
                }
                return descriptorsForUser(user.getId());
            }

            @Override
            public Optional<ByteArray> getUserHandleForUsername(String username) {
                UserModel user = findUserByUsername(username);
                return user == null ? Optional.empty() : Optional.of(userHandle(user.getId()));
            }

            @Override
            public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
                long userPk = userPkFromHandle(userHandle);
                UserModel user = em.find(UserModel.class, userPk);
                return user == null ? Optional.empty() : Optional.ofNullable(user.getUserId());
            }

            @Override
            public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
                long userPk = userPkFromHandle(userHandle);
                Factor2Credential credential = findFidoCredential(userPk, credentialId.getBase64Url());
                if (credential == null) {
                    return Optional.empty();
                }
                return Optional.of(RegisteredCredential.builder()
                        .credentialId(credentialId)
                        .userHandle(userHandle)
                        .publicKeyCose(new ByteArray(Base64.getUrlDecoder().decode(credential.getPublicKey())))
                        .signatureCount(credential.getSignCount())
                        .build());
            }

            @Override
            public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
                List<Factor2Credential> list = em.createQuery("from Factor2Credential f where f.credentialId=:credentialId and f.credentialType=:type", Factor2Credential.class)
                        .setParameter("credentialId", credentialId.getBase64Url())
                        .setParameter("type", Factor2CredentialType.FIDO2)
                        .getResultList();
                Set<RegisteredCredential> result = new HashSet<>();
                for (Factor2Credential credential : list) {
                    result.add(RegisteredCredential.builder()
                            .credentialId(credentialId)
                            .userHandle(userHandle(credential.getUserPK()))
                            .publicKeyCose(new ByteArray(Base64.getUrlDecoder().decode(credential.getPublicKey())))
                            .signatureCount(credential.getSignCount())
                            .build());
                }
                return result;
            }
        };
    }

    private Set<PublicKeyCredentialDescriptor> descriptorsForUser(long userPk) {
        List<Factor2Credential> credentials = em.createQuery("from Factor2Credential f where f.userPK=:userPK and f.credentialType=:type and f.verified=true", Factor2Credential.class)
                .setParameter("userPK", userPk)
                .setParameter("type", Factor2CredentialType.FIDO2)
                .getResultList();
        Set<PublicKeyCredentialDescriptor> descriptors = new HashSet<>();
        for (Factor2Credential credential : credentials) {
            ByteArray id = new ByteArray(Base64.getUrlDecoder().decode(credential.getCredentialId()));
            descriptors.add(PublicKeyCredentialDescriptor.builder()
                    .id(id)
                    .type(PublicKeyCredentialType.PUBLIC_KEY)
                    .build());
        }
        return descriptors;
    }

    private Factor2Credential requireFidoCredential(long userPk, String credentialId) {
        Factor2Credential credential = findFidoCredential(userPk, credentialId);
        if (credential == null) {
            throw new SecurityException("FIDO2 credential not registered");
        }
        return credential;
    }

    private Factor2Credential findFidoCredential(long userPk, String credentialId) {
        return em.createQuery("from Factor2Credential f where f.userPK=:userPK and f.credentialId=:credentialId and f.credentialType=:type", Factor2Credential.class)
                .setParameter("userPK", userPk)
                .setParameter("credentialId", credentialId)
                .setParameter("type", Factor2CredentialType.FIDO2)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    private UserModel findUserByUsername(String username) {
        return em.createQuery("from UserModel u where u.userId=:userId", UserModel.class)
                .setParameter("userId", username)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    private ByteArray userHandle(long userPk) {
        ByteBuffer buffer = ByteBuffer.allocate(Long.BYTES);
        buffer.putLong(userPk);
        return new ByteArray(buffer.array());
    }

    private long userPkFromHandle(ByteArray handle) {
        ByteBuffer buffer = ByteBuffer.wrap(handle.getBytes());
        return buffer.getLong();
    }

    private <T> T readJson(String json, Class<T> type) {
        try {
            return securityMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse JSON", e);
        }
    }

    private <T> T readJson(String json, TypeReference<T> type) {
        try {
            return securityMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse JSON", e);
        }
    }
    
    public void saveFactor2(Factor2Spec spec) {
        
        // 対象ユーザー
        long userPK = spec.getUserPK();
        
        // 確認コードが一致しているか
        // 一致していない場合はNoResultExceptionがスローされる->resource側でstatus=404
        // getResultListは無用な例外をスローさせないため
        List<Factor2Code> entries = (List<Factor2Code>) em.createQuery("from Factor2Code f where f.userPK=:userPK and f.code=:code")
                .setParameter("userPK", userPK)
                .setParameter("code", spec.getCode())
                .getResultList();
        if (entries.isEmpty()) {
            throw new NoResultException("2-Factor code error");
        }
        
        // User 属性を更新する
        UserModel user = em.find(UserModel.class, userPK);
        user.setFactor2Auth(spec.getFactor2Auth());
        user.setMainMobile(spec.getPhoneNumber());
        
        // 信頼デバイス
        Factor2Device device = new Factor2Device();
        device.setUserPK(userPK);
        device.setDeviceName(spec.getDeviceName());
        device.setMacAddress(spec.getMacAddress());
        device.setEntryDate(spec.getEntryDate());
        em.persist(device);

        // バックアップキー
        Instant now = Instant.now();
        Factor2BackupKey key = new Factor2BackupKey();
        key.setUserPK(userPK);
        key.setBackupKey(hashBackupCode(userPK, spec.getBackupKey()));
        key.setHashAlgorithm("SHA-256");
        key.setCreatedAt(now);
        em.persist(key);
    }
    
    public void resetFactor2Auth(long userPK) {
        
        // User 属性を更新する
        UserModel user = em.find(UserModel.class, userPK);
        user.setFactor2Auth("off");
        
        // 信頼デバイスを削除する
        List<Factor2Device> list = em.createQuery("from Factor2Device f where f.userPK=:userPK")
                .setParameter("userPK", userPK)
                .getResultList();
        for (Factor2Device device : list) {
            em.remove(device);
        }

        cleanupBackupKeys(userPK);
        cleanupUnverifiedTotp(userPK);
        cleanupChallenges(userPK, Factor2ChallengeType.FIDO2_REGISTRATION);
        cleanupChallenges(userPK, Factor2ChallengeType.FIDO2_ASSERTION);
        removeFactor2Codes(userPK);

        List<Factor2Credential> credentials = em.createQuery("from Factor2Credential f where f.userPK=:userPK", Factor2Credential.class)
                .setParameter("userPK", userPK)
                .getResultList();
        for (Factor2Credential credential : credentials) {
            em.remove(credential);
        }
    }
    
    public UserModel getUserWithNewFactor2Device(Factor2Spec spec) {
        
        // 対象ユーザーを得る
        UserModel user = (UserModel)
                em.createQuery("from UserModel u where u.userId=:uid")
                  .setParameter("uid", spec.getUserId())
                  .getSingleResult();

        if (user.getMemberType() != null && user.getMemberType().equals("EXPIRED")) {
            throw new SecurityException("Expired User");
        }
        long userPK = user.getId();
        
        // 確認コードが一致しているか
        // 一致していない場合はNoResultExceptionがスローされる->resource側でstatus=404
        // getResultListは無用な例外をスローさせないため
        List<Factor2Code> entries = (List<Factor2Code>) em.createQuery("from Factor2Code f where f.userPK=:userPK and f.code=:code")
                .setParameter("userPK", userPK)
                .setParameter("code", spec.getCode())
                .getResultList();
        if (entries.isEmpty()) {
            throw new NoResultException("2-Factor code error");
        }
        
        // 信頼デバイス
        Factor2Device device = new Factor2Device();
        device.setUserPK(userPK);
        device.setDeviceName(spec.getDeviceName());
        device.setMacAddress(spec.getMacAddress());
        device.setEntryDate(spec.getEntryDate());
        em.persist(device);
        
        return user;
    }
    
    public UserModel getUserWithF2Backup(Factor2Spec spec) {
        
        // 対象ユーザーを得る
        UserModel user = (UserModel)
                em.createQuery("from UserModel u where u.userId=:uid")
                  .setParameter("uid", spec.getUserId())
                  .getSingleResult();

        if (user.getMemberType() != null && user.getMemberType().equals("EXPIRED")) {
            throw new SecurityException("Expired User");
        }
        long userPK = user.getId();
        
        // バックアップコードが一致しているか
        // 一致していない場合はNoResultExceptionがスローされる->resource側でstatus=404
        // getResultListは無用な例外をスローさせないため
        List<Factor2BackupKey> entries = (List<Factor2BackupKey>) em.createQuery("from Factor2BackupKey f where f.userPK=:userPK and f.backupKey=:backupKey")
                .setParameter("userPK", userPK)
                .setParameter("backupKey", hashBackupCode(userPK, spec.getBackupKey()))
                .getResultList();
        if (entries.isEmpty()) {
            throw new NoResultException("2-Factor backupKey error");
        }
        
        // ２段階認証を無効化する
        user.setFactor2Auth("off");
        
        // 信頼デバイスを削除する
        List<Factor2Device> list = em.createQuery("from Factor2Device f where f.userPK=:userPK")
                .setParameter("userPK", userPK)
                .getResultList();
        for (Factor2Device device : list) {
            em.remove(device);
        }
        
        // バックアップキーを削除する
        List<Factor2BackupKey> list2 = em.createQuery("from Factor2BackupKey f where f.userPK=:userPK")
                .setParameter("userPK", userPK)
                .getResultList();
        for (Factor2BackupKey bk : list2) {
            em.remove(bk);
        }
        
        return user;
    }
//minagawa$    
}
