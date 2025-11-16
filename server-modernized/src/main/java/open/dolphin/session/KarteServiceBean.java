package open.dolphin.session;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Consumer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;
import open.dolphin.converter.ModuleModelConverter;
import open.dolphin.infomodel.*;
import open.dolphin.msg.gateway.MessagingGateway;
import open.dolphin.rest.dto.RoutineMedicationResponse;
import open.dolphin.rest.dto.RpHistoryDrugResponse;
import open.dolphin.rest.dto.RpHistoryEntryResponse;
import open.dolphin.rest.dto.UserPropertyResponse;
import open.dolphin.session.audit.DiagnosisAuditRecorder;
import open.dolphin.session.framework.SessionOperation;
import open.dolphin.storage.attachment.AttachmentStorageManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@Named
@ApplicationScoped
@Transactional
@SessionOperation
public class KarteServiceBean {

    private static final Logger LOGGER = LoggerFactory.getLogger(KarteServiceBean.class);
    private static final DateTimeFormatter ISO_INSTANT_FORMATTER = DateTimeFormatter.ISO_INSTANT;
    private static final DateTimeFormatter ISO_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);
    
    // parameters
    private static final String PATIENT_PK = "patientPk";
    private static final String KARTE_ID = "karteId";
    private static final String FROM_DATE = "fromDate";
    private static final String TO_DATE = "toDate";
    private static final String ID = "id";
    private static final String ENTITY = "entity";
    private static final String FID = "fid";
    private static final String PID = "pid";

    private static final String QUERY_KARTE = "from KarteBean k where k.patient.id=:patientPk";
    private static final String QUERY_ALLERGY = "from ObservationModel o where o.karte.id=:karteId and o.observation='Allergy'";
    private static final String QUERY_BODY_HEIGHT = "from ObservationModel o where o.karte.id=:karteId and o.observation='PhysicalExam' and o.phenomenon='bodyHeight'";
    private static final String QUERY_BODY_WEIGHT = "from ObservationModel o where o.karte.id=:karteId and o.observation='PhysicalExam' and o.phenomenon='bodyWeight'";
    // Cancel status=64 を where へ追加
    private static final String QUERY_PATIENT_VISIT = "from PatientVisitModel p where p.patient.id=:patientPk and p.pvtDate >= :fromDate and p.status!=64";
    private static final String QUERY_DOC_INFO = "from DocumentModel d where d.karte.id=:karteId and d.started >= :fromDate and (d.status='F' or d.status='T')";
    private static final String QUERY_PATIENT_MEMO = "from PatientMemoModel p where p.karte.id=:karteId";
    private static final String QUERY_USER_BY_USER_ID = "from UserModel u where u.userId=:userId";

    private static final String QUERY_DOCUMENT_INCLUDE_MODIFIED = "from DocumentModel d where d.karte.id=:karteId and d.started >= :fromDate and d.status !='D'";
    private static final String QUERY_DOCUMENT = "from DocumentModel d where d.karte.id=:karteId and d.started >= :fromDate and (d.status='F' or d.status='T')";
    private static final String QUERY_DOCUMENT_BY_LINK_ID = "from DocumentModel d where d.linkId=:id";
    private static final String QUERY_DOCUMENT_IDS_WITH_MED_ENTITY =
            "select distinct d.id from DocumentModel d join d.modules m where d.karte.id=:karteId and d.status in ('F','T') and m.moduleInfo.entity=:entity order by d.started desc";

//s.oh^ 2014/07/29 スタンプ／シェーマ／添付のソート
    //private static final String QUERY_MODULE_BY_DOC_ID = "from ModuleModel m where m.document.id=:id";
    //private static final String QUERY_SCHEMA_BY_DOC_ID = "from SchemaModel i where i.document.id=:id";
    //private static final String QUERY_ATTACHMENT_BY_DOC_ID = "from AttachmentModel a where a.document.id=:id";
    private static final String QUERY_MODULE_BY_DOC_ID = "from ModuleModel m where m.document.id=:id order by m.id";
    private static final String QUERY_SCHEMA_BY_DOC_ID = "from SchemaModel i where i.document.id=:id order by i.id";
    private static final String QUERY_ATTACHMENT_BY_DOC_ID = "from AttachmentModel a where a.document.id=:id order by a.id";
//s.oh$
//s.oh^ 2014/08/20 添付ファイルの別読
    private static final String QUERY_ATTACHMENT_BY_ID = "from AttachmentModel a where a.id=:id";
//s.oh$
//minagawa^ LSC Test
    //private static final String QUERY_MODULE_BY_ENTITY = "from ModuleModel m where m.karte.id=:karteId and m.moduleInfo.entity=:entity and m.started between :fromDate and :toDate and m.status='F'";
    private static final String QUERY_MODULE_BY_ENTITY = "from ModuleModel m where m.karte.id=:karteId and m.moduleInfo.entity=:entity and m.started between :fromDate and :toDate and m.status='F' order by m.started";
//minagawa$
    private static final String QUERY_SCHEMA_BY_KARTE_ID = "from SchemaModel i where i.karte.id =:karteId and i.started between :fromDate and :toDate and i.status='F'";

    private static final String QUERY_SCHEMA_BY_FACILITY_ID = "from SchemaModel i where i.karte.patient.facilityId like :fid and i.extRef.sop is not null and i.status='F'";

    private static final String QUERY_DIAGNOSIS_BY_KARTE_DATE = "from RegisteredDiagnosisModel r where r.karte.id=:karteId and r.started >= :fromDate";
    private static final String QUERY_DIAGNOSIS_BY_KARTE_DATE_ACTIVEONLY = "from RegisteredDiagnosisModel r where r.karte.id=:karteId and r.started >= :fromDate and r.ended is NULL";
    private static final String QUERY_DIAGNOSIS_BY_KARTE = "from RegisteredDiagnosisModel r where r.karte.id=:karteId";
    private static final String QUERY_DIAGNOSIS_BY_KARTE_ACTIVEONLY = "from RegisteredDiagnosisModel r where r.karte.id=:karteId and r.ended is NULL";

    private static final String TOUTOU = "TOUTOU";
    private static final String TOUTOU_REPLY = "TOUTOU_REPLY";
    private static final String QUERY_LETTER_BY_KARTE_ID = "from TouTouLetter f where f.karte.id=:karteId";
    private static final String QUERY_REPLY_BY_KARTE_ID = "from TouTouReply f where f.karte.id=:karteId";
    private static final String QUERY_LETTER_BY_ID = "from TouTouLetter t where t.id=:id";
    private static final String QUERY_REPLY_BY_ID = "from TouTouReply t where t.id=:id";

    private static final String QUERY_APPO_BY_KARTE_ID_PERIOD = "from AppointmentModel a where a.karte.id = :karteId and a.date between :fromDate and :toDate";

    private static final String QUERY_PATIENT_BY_FID_PID = "from PatientModel p where p.facilityId=:fid and p.patientId=:pid";
    
//masuda^
    private static final String QUERY_LASTDOC_DATE 
            = "select max(m.started) from DocumentModel m where m.karte.id = :karteId and (m.status = 'F' or m.status = 'T')";
//masuda$
    
//s.oh^ 2014/04/03 サマリー対応
    private static final String QUERY_FREEDOCU_BY_FPID = "from PatientFreeDocumentModel p where p.facilityPatId=:fpid";
    private static final String FPID = "fpid";
//s.oh$
    
    @PersistenceContext
    private EntityManager em;

    @Inject
    private MessagingGateway messagingGateway;

    @Inject
    private MmlSenderBean mmlSenderBean;

    @Inject
    private AttachmentStorageManager attachmentStorageManager;

    @Inject
    private DiagnosisAuditRecorder diagnosisAuditRecorder;

//s.oh^ 2014/02/21 Claim送信方法の変更
    //@Resource(mappedName = "java:/JmsXA")
    //private ConnectionFactory connectionFactory;
    //
    //@Resource(mappedName = "java:/queue/dolphin")
    //private jakarta.jms.Queue queue;
//s.oh$
    
    public KarteBean getKarte(String fid, String pid, Date fromDate) {
        
        try {
            
            // 患者レコードは FacilityId と patientId で複合キーになっている
            PatientModel patient
                = (PatientModel)em.createQuery(QUERY_PATIENT_BY_FID_PID)
                .setParameter(FID, fid)
                .setParameter(PID, pid)
                .getSingleResult();

            long patientPK = patient.getId();
            
            // 最初に患者のカルテを取得する
            List<KarteBean> kartes = em.createQuery(QUERY_KARTE)
                                  .setParameter(PATIENT_PK, patientPK)
                                  .getResultList();
            KarteBean karte = kartes.get(0);

            // カルテの PK を得る
            long karteId = karte.getId();

            // アレルギーデータを取得する
            List<ObservationModel> list1 =
                    (List<ObservationModel>)em.createQuery(QUERY_ALLERGY)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!list1.isEmpty()) {
                List<AllergyModel> allergies = new ArrayList<>(list1.size());
                for (ObservationModel observation : list1) {
                    AllergyModel allergy = new AllergyModel();
                    allergy.setObservationId(observation.getId());
                    allergy.setFactor(observation.getPhenomenon());
                    allergy.setSeverity(observation.getCategoryValue());
                    allergy.setIdentifiedDate(observation.confirmDateAsString());
                    allergy.setMemo(observation.getMemo());
                    allergies.add(allergy);
                }
                karte.setAllergies(allergies);
            }

            // 身長データを取得する
            List<ObservationModel> list2 =
                    (List<ObservationModel>)em.createQuery(QUERY_BODY_HEIGHT)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!list2.isEmpty()) {
                List<PhysicalModel> physicals = new ArrayList<>(list2.size());
                for (ObservationModel observation : list2) {
                    PhysicalModel physical = new PhysicalModel();
                    physical.setHeightId(observation.getId());
                    physical.setHeight(observation.getValue());
                    physical.setIdentifiedDate(observation.confirmDateAsString());
                    physical.setMemo(ModelUtils.getDateAsString(observation.getRecorded()));
                    physicals.add(physical);
                }
                karte.setHeights(physicals);
            }

            // 体重データを取得する
            List<ObservationModel> list3 =
                    (List<ObservationModel>)em.createQuery(QUERY_BODY_WEIGHT)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!list3.isEmpty()) {
                List<PhysicalModel> physicals = new ArrayList<>(list3.size());
                for (ObservationModel observation : list3) {
                    PhysicalModel physical = new PhysicalModel();
                    physical.setWeightId(observation.getId());
                    physical.setWeight(observation.getValue());
                    physical.setIdentifiedDate(observation.confirmDateAsString());
                    physical.setMemo(ModelUtils.getDateAsString(observation.getRecorded()));
                    physicals.add(physical);
                }
                karte.setWeights(physicals);
            }

            // 直近の来院日エントリーを取得しカルテに設定する
            List<PatientVisitModel> latestVisits =
                    (List<PatientVisitModel>)em.createQuery(QUERY_PATIENT_VISIT)
                                               .setParameter(PATIENT_PK, patientPK)
                                               .setParameter(FROM_DATE, ModelUtils.getDateAsString(fromDate))
                                               .getResultList();

            if (!latestVisits.isEmpty()) {
                List<String> visits = new ArrayList<>(latestVisits.size());
                for (PatientVisitModel bean : latestVisits) {
                    // 2012-07-23
                    // cancelしている場合は返さない
                    // 来院日のみを使用する
                    visits.add(bean.getPvtDate());
                }
                karte.setPatientVisits(visits);
            }

            // 文書履歴エントリーを取得しカルテに設定する
            List<DocumentModel> documents =
                    (List<DocumentModel>)em.createQuery(QUERY_DOC_INFO)
                                           .setParameter(KARTE_ID, karteId)
                                           .setParameter(FROM_DATE, fromDate)
                                           .getResultList();

            if (!documents.isEmpty()) {
                List<DocInfoModel> c = new ArrayList<>(documents.size());
                for (DocumentModel docBean : documents) {
                    docBean.toDetuch();
                    c.add(docBean.getDocInfoModel());
                }
                karte.setDocInfoList(c);
            }

            // 患者Memoを取得する
            List<PatientMemoModel> memo =
                    (List<PatientMemoModel>)em.createQuery(QUERY_PATIENT_MEMO)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!memo.isEmpty()) {
                karte.setMemoList(memo);
            }
            
//masuda^
            // 最終文書日
            try {
                Date lastDocDate = (Date)
                        em.createQuery(QUERY_LASTDOC_DATE)
                        .setParameter(KARTE_ID, karteId)
                        .getSingleResult();
                karte.setLastDocDate(lastDocDate);
            } catch (NoResultException e) {
            }
//masuda$            

            return karte;
        
            
        } catch (Exception e) {
            
        }
        
        return null;
    }

    /**
     * カルテの基礎的な情報をまとめて返す。
     * @param patientPK
     * @param fromDate 各種エントリの検索開始日
     * @return 基礎的な情報をフェッチした KarteBean
     */
    public KarteBean getKarte(long patientPK, Date fromDate) {

        try {
            // 最初に患者のカルテを取得する
            List<KarteBean> kartes = em.createQuery(QUERY_KARTE)
                                  .setParameter(PATIENT_PK, patientPK)
                                  .getResultList();
            KarteBean karte = kartes.get(0);

            // カルテの PK を得る
            long karteId = karte.getId();

            // アレルギーデータを取得する
            List<ObservationModel> list1 =
                    (List<ObservationModel>)em.createQuery(QUERY_ALLERGY)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!list1.isEmpty()) {
                List<AllergyModel> allergies = new ArrayList<>(list1.size());
                for (ObservationModel observation : list1) {
                    AllergyModel allergy = new AllergyModel();
                    allergy.setObservationId(observation.getId());
                    allergy.setFactor(observation.getPhenomenon());
                    allergy.setSeverity(observation.getCategoryValue());
                    allergy.setIdentifiedDate(observation.confirmDateAsString());
                    allergy.setMemo(observation.getMemo());
                    allergies.add(allergy);
                }
                karte.setAllergies(allergies);
            }

            // 身長データを取得する
            List<ObservationModel> list2 =
                    (List<ObservationModel>)em.createQuery(QUERY_BODY_HEIGHT)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!list2.isEmpty()) {
                List<PhysicalModel> physicals = new ArrayList<>(list2.size());
                for (ObservationModel observation : list2) {
                    PhysicalModel physical = new PhysicalModel();
                    physical.setHeightId(observation.getId());
                    physical.setHeight(observation.getValue());
                    physical.setIdentifiedDate(observation.confirmDateAsString());
                    physical.setMemo(ModelUtils.getDateAsString(observation.getRecorded()));
                    physicals.add(physical);
                }
                karte.setHeights(physicals);
            }

            // 体重データを取得する
            List<ObservationModel> list3 =
                    (List<ObservationModel>)em.createQuery(QUERY_BODY_WEIGHT)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!list3.isEmpty()) {
                List<PhysicalModel> physicals = new ArrayList<>(list3.size());
                for (ObservationModel observation : list3) {
                    PhysicalModel physical = new PhysicalModel();
                    physical.setWeightId(observation.getId());
                    physical.setWeight(observation.getValue());
                    physical.setIdentifiedDate(observation.confirmDateAsString());
                    physical.setMemo(ModelUtils.getDateAsString(observation.getRecorded()));
                    physicals.add(physical);
                }
                karte.setWeights(physicals);
            }

            // 直近の来院日エントリーを取得しカルテに設定する
            List<PatientVisitModel> latestVisits =
                    (List<PatientVisitModel>)em.createQuery(QUERY_PATIENT_VISIT)
                                               .setParameter(PATIENT_PK, patientPK)
                                               .setParameter(FROM_DATE, ModelUtils.getDateAsString(fromDate))
                                               .getResultList();

            if (!latestVisits.isEmpty()) {
                List<String> visits = new ArrayList<>(latestVisits.size());
                for (PatientVisitModel bean : latestVisits) {
                    // 来院日のみを使用する
                    visits.add(bean.getPvtDate());
                }
                karte.setPatientVisits(visits);
            }

            // 文書履歴エントリーを取得しカルテに設定する
            List<DocumentModel> documents =
                    (List<DocumentModel>)em.createQuery(QUERY_DOC_INFO)
                                           .setParameter(KARTE_ID, karteId)
                                           .setParameter(FROM_DATE, fromDate)
                                           .getResultList();

            if (!documents.isEmpty()) {
                List<DocInfoModel> c = new ArrayList<>(documents.size());
                for (DocumentModel docBean : documents) {
                    docBean.toDetuch();
                    c.add(docBean.getDocInfoModel());
                }
                karte.setDocInfoList(c);
            }

            // 患者Memoを取得する
            List<PatientMemoModel> memo =
                    (List<PatientMemoModel>)em.createQuery(QUERY_PATIENT_MEMO)
                                              .setParameter(KARTE_ID, karteId)
                                              .getResultList();
            if (!memo.isEmpty()) {
                karte.setMemoList(memo);
            }
            
//masuda^
            // 最終文書日
            try {
                Date lastDocDate = (Date)
                        em.createQuery(QUERY_LASTDOC_DATE)
                        .setParameter(KARTE_ID, karteId)
                        .getSingleResult();
                karte.setLastDocDate(lastDocDate);
            } catch (NoResultException e) {
            }
//masuda$
            return karte;

        } catch (NoResultException e) {
            // 患者登録の際にカルテも生成してある
        }

        return null;
    }

    /**
     * 文書履歴エントリを取得する。
     * @param karteId カルテId
     * @param fromDate 取得開始日
     * @param includeModifid
     * @return DocInfo のコレクション
     */
    public List<DocInfoModel> getDocumentList(long karteId, Date fromDate, boolean includeModifid) {

        List<DocumentModel> documents;

        if (includeModifid) {
            documents = (List<DocumentModel>)em.createQuery(QUERY_DOCUMENT_INCLUDE_MODIFIED)
            .setParameter(KARTE_ID, karteId)
            .setParameter(FROM_DATE, fromDate)
            .getResultList();
        } else {
            documents = (List<DocumentModel>)em.createQuery(QUERY_DOCUMENT)
            .setParameter(KARTE_ID, karteId)
            .setParameter(FROM_DATE, fromDate)
            .getResultList();
        }

        List<DocInfoModel> result = new ArrayList<>();
        for (DocumentModel doc : documents) {
            // モデルからDocInfo へ必要なデータを移す
            // クライアントが DocInfo だけを利用するケースがあるため
            doc.toDetuch();
            result.add(doc.getDocInfoModel());
        }
        return result;
    }

    /**
     * 文書(DocumentModel Object)を取得する。
     * @param ids DocumentModel の pkコレクション
     * @return DocumentModelのコレクション
     */
    public List<DocumentModel> getDocuments(List<Long> ids) {

        List<DocumentModel> ret = new ArrayList<>(3);

        // ループする
        for (Long id : ids) {

            // DocuentBean を取得する
            DocumentModel document = (DocumentModel) em.find(DocumentModel.class, id);

            // ModuleBean を取得する
            List modules = em.createQuery(QUERY_MODULE_BY_DOC_ID)
            .setParameter(ID, id)
            .getResultList();
            document.setModules(modules);

            // SchemaModel を取得する
            List images = em.createQuery(QUERY_SCHEMA_BY_DOC_ID)
            .setParameter(ID, id)
            .getResultList();
            document.setSchema(images);
            
            // AttachmentModel を取得する
            List attachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
            .setParameter(ID, id)
            .getResultList();
            document.setAttachment(attachments);

            ret.add(document);
        }
        
//s.oh^ 不具合修正
        for (DocumentModel doc : ret) {
            // モデルからDocInfo へ必要なデータを移す
            // クライアントがDocInfo だけを利用するケースがあるため
            doc.toDetuch();
        }
//s.oh$

        return ret;
    }
    
    /**
     * ドキュメント DocumentModel オブジェクトを保存する。
     * @param document 追加するDocumentModel オブジェクト
     * @return 追加した数
     */
    public long addDocument(DocumentModel document) {

        LOGGER.info("addDocument request id={}, docId={}",
                document.getId(),
                document.getDocInfoModel() != null ? document.getDocInfoModel().getDocId() : "null");

        if (document.getId() <= 0) {
            Number seqValue = (Number) em
                    .createNativeQuery("SELECT nextval('opendolphin.hibernate_sequence')")
                    .getSingleResult();
            document.setId(seqValue.longValue());
        }
        LOGGER.info("addDocument assigned seq id={}", document.getId());

        document = em.merge(document);
        attachmentStorageManager.persistExternalAssets(document.getAttachment());

        // ID
        long id = document.getId();

        // 修正版の処理を行う
        long parentPk = document.getDocInfoModel().getParentPk();

        if (parentPk != 0L) {

            // 適合終了日を新しい版の確定日にする
            Date ended = document.getConfirmed();

            // オリジナルを取得し 終了日と status = M を設定する
            DocumentModel old = (DocumentModel)em.find(DocumentModel.class, parentPk);
            old.setEnded(ended);
            old.setStatus(IInfoModel.STATUS_MODIFIED);

            // 関連するモジュールとイメージに同じ処理を実行する
            Collection oldModules = em.createQuery(QUERY_MODULE_BY_DOC_ID)
            .setParameter(ID, parentPk).getResultList();
            for (Iterator iter = oldModules.iterator(); iter.hasNext(); ) {
                ModuleModel model = (ModuleModel)iter.next();
                model.setEnded(ended);
                model.setStatus(IInfoModel.STATUS_MODIFIED);
            }

            // Schema
            Collection oldImages = em.createQuery(QUERY_SCHEMA_BY_DOC_ID)
            .setParameter(ID, parentPk).getResultList();
            for (Iterator iter = oldImages.iterator(); iter.hasNext(); ) {
                SchemaModel model = (SchemaModel)iter.next();
                model.setEnded(ended);
                model.setStatus(IInfoModel.STATUS_MODIFIED);
            }
            
            // Attachment
            Collection oldAttachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
            .setParameter(ID, parentPk).getResultList();
            for (Iterator iter = oldAttachments.iterator(); iter.hasNext(); ) {
                AttachmentModel model = (AttachmentModel)iter.next();
                model.setEnded(ended);
                model.setStatus(IInfoModel.STATUS_MODIFIED);
            }
        }
        
        //-------------------------------------------------------------
        // CLAIM送信
        //-------------------------------------------------------------
        if (!document.getDocInfoModel().isSendClaim()) {
            return id;
        }
        //Logger.getLogger("open.dolphin").info("KarteServiceBean will send claim");
        sendDocument(document);
        
        return id;
    }

    public long updateDocument(DocumentModel document) {

        if (document.getId() <= 0) {
            throw new IllegalArgumentException("Document id is required for update");
        }

        DocumentModel current = em.find(DocumentModel.class, document.getId());
        if (current == null) {
            throw new IllegalArgumentException("Document not found: " + document.getId());
        }

        removeMissingModules(current.getModules(), document.getModules());
        removeMissingSchemas(current.getSchema(), document.getSchema());
        removeMissingAttachments(current.getAttachment(), document.getAttachment());

        DocumentModel merged = em.merge(document);
        attachmentStorageManager.persistExternalAssets(merged.getAttachment());
        return merged.getId();
    }

    public List<RoutineMedicationResponse> getRoutineMedications(long karteId, int firstResult, int maxResults) {

        if (karteId <= 0) {
            return Collections.emptyList();
        }
        int safeFirst = Math.max(firstResult, 0);
        int safeMax = maxResults > 0 ? maxResults : 50;

        List<Long> docIds = em.createQuery(QUERY_DOCUMENT_IDS_WITH_MED_ENTITY, Long.class)
                .setParameter(KARTE_ID, karteId)
                .setParameter(ENTITY, IInfoModel.ENTITY_MED_ORDER)
                .setFirstResult(safeFirst)
                .setMaxResults(safeMax)
                .getResultList();
        if (docIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<DocumentModel> documents = fetchDocumentsWithModules(docIds);
        documents.sort(Comparator.comparing(DocumentModel::getStarted, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        List<RoutineMedicationResponse> responses = new ArrayList<>();
        for (DocumentModel document : documents) {
            List<ModuleModel> medModules = filterMedModules(document.getModules());
            if (medModules.isEmpty()) {
                continue;
            }
            responses.add(new RoutineMedicationResponse(
                    document.getId(),
                    determineRoutineName(document, medModules),
                    determineRoutineMemo(medModules),
                    document.getDocInfoModel() != null ? document.getDocInfoModel().getDocType() : null,
                    formatIso(document.getConfirmed() != null ? document.getConfirmed() : document.getRecorded()),
                    convertModules(medModules)
            ));
        }
        return responses;
    }

    public List<RpHistoryEntryResponse> getRpHistory(long karteId, Date fromDate, Date toDateExclusive, boolean lastOnly) {

        if (karteId <= 0) {
            return Collections.emptyList();
        }

        StringBuilder jpql = new StringBuilder("select distinct d.id from DocumentModel d join d.modules m ")
                .append("where d.karte.id=:karteId and d.status in ('F','T') and m.moduleInfo.entity=:entity");
        if (fromDate != null) {
            jpql.append(" and d.started >= :fromDate");
        }
        if (toDateExclusive != null) {
            jpql.append(" and d.started < :toDate");
        }
        jpql.append(" order by d.started desc");

        TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class)
                .setParameter(KARTE_ID, karteId)
                .setParameter(ENTITY, IInfoModel.ENTITY_MED_ORDER);
        if (fromDate != null) {
            query.setParameter(FROM_DATE, fromDate);
        }
        if (toDateExclusive != null) {
            query.setParameter(TO_DATE, toDateExclusive);
        }

        List<Long> docIds = query.getResultList();
        if (docIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<DocumentModel> documents = fetchDocumentsWithModules(docIds);
        documents.sort(Comparator.comparing(DocumentModel::getStarted, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        Map<String, RpHistoryEntryResponse> grouped = new LinkedHashMap<>();
        for (DocumentModel document : documents) {
            List<ModuleModel> medModules = filterMedModules(document.getModules());
            if (medModules.isEmpty()) {
                continue;
            }
            List<RpHistoryDrugResponse> drugs = toRpHistoryDrugs(medModules);
            if (drugs.isEmpty()) {
                continue;
            }
            String issuedDate = formatDateOnly(
                    firstNonNull(document.getConfirmed(), document.getStarted(), document.getRecorded()));
            if (lastOnly && issuedDate != null && grouped.containsKey(issuedDate)) {
                continue;
            }
            RpHistoryEntryResponse entry = new RpHistoryEntryResponse(
                    issuedDate,
                    document.getDocInfoModel() != null ? document.getDocInfoModel().getTitle() : null,
                    drugs
            );
            grouped.put(issuedDate != null ? issuedDate : UUID.randomUUID().toString(), entry);
        }

        return new ArrayList<>(grouped.values());
    }

    public List<UserPropertyResponse> getUserProperties(String userId) {

        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }

        try {
            UserModel user = em.createQuery(QUERY_USER_BY_USER_ID, UserModel.class)
                    .setParameter("userId", userId)
                    .getSingleResult();
            return buildUserPropertyResponses(user);
        } catch (NoResultException ex) {
            return Collections.emptyList();
        }
    }

    public long addDocumentAndUpdatePVTState(DocumentModel document, long pvtPK, int state) {

        // 永続化する
        em.persist(document);

        // ID
        long id = document.getId();

        // 修正版の処理を行う
        long parentPk = document.getDocInfoModel().getParentPk();

        if (parentPk != 0L) {

            // 適合終了日を新しい版の確定日にする
            Date ended = document.getConfirmed();

            // オリジナルを取得し 終了日と status = M を設定する
            DocumentModel old = (DocumentModel) em.find(DocumentModel.class, parentPk);
            old.setEnded(ended);
            old.setStatus(IInfoModel.STATUS_MODIFIED);

            // 関連するモジュールとイメージに同じ処理を実行する
            Collection oldModules = em.createQuery(QUERY_MODULE_BY_DOC_ID)
            .setParameter(ID, parentPk).getResultList();
            for (Iterator iter = oldModules.iterator(); iter.hasNext(); ) {
                ModuleModel model = (ModuleModel)iter.next();
                model.setEnded(ended);
                model.setStatus(IInfoModel.STATUS_MODIFIED);
            }

            // Schema
            Collection oldImages = em.createQuery(QUERY_SCHEMA_BY_DOC_ID)
            .setParameter(ID, parentPk).getResultList();
            for (Iterator iter = oldImages.iterator(); iter.hasNext(); ) {
                SchemaModel model = (SchemaModel)iter.next();
                model.setEnded(ended);
                model.setStatus(IInfoModel.STATUS_MODIFIED);
            }
            
            // Attachment
            Collection oldAttachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
            .setParameter(ID, parentPk).getResultList();
            for (Iterator iter = oldAttachments.iterator(); iter.hasNext(); ) {
                AttachmentModel model = (AttachmentModel)iter.next();
                model.setEnded(ended);
                model.setStatus(IInfoModel.STATUS_MODIFIED);
            }
        }
        
        //-------------------------------------------------------------
        // CLAIM送信
        //-------------------------------------------------------------
        if (!document.getDocInfoModel().isSendClaim()) {
            return id;
        }
        sendDocument(document);
        
        //------------------------------------------------------------
        // PVT 更新  state==2 || state == 4
        //------------------------------------------------------------
        try {
            // PVT 更新  state==2 || state == 4
            PatientVisitModel exist = (PatientVisitModel) em.find(PatientVisitModel.class, new Long(pvtPK));
            exist.setState(state);
        } catch (Throwable e) {
            e.printStackTrace(System.err);
        }

        return id;
    }
    
//    private void sendDocument(DocumentModel document)  {
//        try {
//            PVTHealthInsuranceModel insm = document.getDocInfoModel().getPVTHealthInsuranceModel();
//            if (insm!=null) {
//                System.err.println("PVTHealthInsuranceModel!=null");
//                List<PVTPublicInsuranceItemModel> pub = insm.getPublicItems();
//                if (pub!=null) {
//                    System.err.println("pub!=null");
//                    System.err.println("pub count=" + pub.size());
//                } else {
//                    System.err.println("pub is null");
//                }
//                System.err.println(insm);
//            } else {
//                System.err.println("PVTHealthInsuranceModel! is null");
//            }
//            ClaimSender sender = new ClaimSender("172.31.210.101",8210,"UTF-8");
//            sender.send(document);
//        } catch (Exception e) {
//            e.printStackTrace(System.err);
//        }
//    }
    
    // JMS+MDB
    public void sendDocument(DocumentModel document) {
        messagingGateway.dispatchClaim(document);
        if (shouldSendMml(document)) {
            try {
                mmlSenderBean.send(document);
            } catch (Exception ex) {
                LOGGER.warn("MML dispatch failed for document {}: {}", documentId(document), ex.getMessage(), ex);
            }
        }
    }

    private boolean shouldSendMml(DocumentModel document) {
        if (document == null || document.getDocInfoModel() == null) {
            return false;
        }
        return document.getDocInfoModel().isSendMml();
    }

    private String documentId(DocumentModel document) {
        if (document == null) {
            return null;
        }
        if (document.getDocInfoModel() != null && document.getDocInfoModel().getDocId() != null) {
            return document.getDocInfoModel().getDocId();
        }
        return document.getId() > 0 ? String.valueOf(document.getId()) : null;
    }

    /**
     * ドキュメントを論理削除する。
     * @param id
     * @return 削除したドキュメントの文書IDリスト
     */
    public List<String> deleteDocument(long id) {
        
        //----------------------------------------
        // 参照されているDocumentの場合は例外を投げる
        //----------------------------------------
        Collection refs = em.createQuery(QUERY_DOCUMENT_BY_LINK_ID)
        .setParameter(ID, id).getResultList();
        if (refs != null && refs.size() >0) {
            CanNotDeleteException ce = new CanNotDeleteException("他のドキュメントから参照されているため削除できません。");
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
                Collection deleteModules = em.createQuery(QUERY_MODULE_BY_DOC_ID)
                .setParameter(ID, id).getResultList();
                for (Iterator iter = deleteModules.iterator(); iter.hasNext(); ) {
                    ModuleModel model = (ModuleModel) iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                }

                //------------------------------
                // 関連する画像に同じ処理を行う
                //------------------------------
                Collection deleteImages = em.createQuery(QUERY_SCHEMA_BY_DOC_ID)
                .setParameter(ID, id).getResultList();
                for (Iterator iter = deleteImages.iterator(); iter.hasNext(); ) {
                    SchemaModel model = (SchemaModel) iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                }

                //------------------------------
                // 関連するAttachmentに同じ処理を行う
                //------------------------------
                Collection deleteAttachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
                .setParameter(ID, id).getResultList();
                for (Iterator iter = deleteAttachments.iterator(); iter.hasNext(); ) {
                    AttachmentModel model = (AttachmentModel)iter.next();
                    model.setStatus(IInfoModel.STATUS_DELETE);
                    model.setEnded(ended);
                    attachmentStorageManager.deleteExternalAsset(model);
                }
                
                // 削除したDocumentのlinkID を 削除するDocument id(PK) にしてLoopさせる
                id = delete.getLinkId();
                
            } catch (Exception e) {
                break;
            }
        }

        return list;
    }

    /**
     * ドキュメントのタイトルを変更する。
     * @param pk 変更するドキュメントの primary key
     * @param title* @return 変更した件数
     * @return 
     */
    public int updateTitle(long pk, String title) {
        DocumentModel update = (DocumentModel) em.find(DocumentModel.class, pk);
        update.getDocInfoModel().setTitle(title);
        return 1;
    }

    /**
     * ModuleModelエントリを取得する。
     * @param karteId
     * @param entity
     * @param fromDate
     * @param toDate
     * @return ModuleModelリストのリスト
     */
    public List<List<ModuleModel>> getModules(long karteId, String entity, List fromDate, List toDate) {

        // 抽出期間は別けられている
        int len = fromDate.size();
        List<List<ModuleModel>> ret = new ArrayList<>(len);

        // 抽出期間セットの数だけ繰り返す
        for (int i = 0; i < len; i++) {

            List<ModuleModel> modules
                    = em.createQuery(QUERY_MODULE_BY_ENTITY)
                    .setParameter(KARTE_ID, karteId)
                    .setParameter(ENTITY, entity)
                    .setParameter(FROM_DATE, fromDate.get(i))
                    .setParameter(TO_DATE, toDate.get(i))
                    .getResultList();

            ret.add(modules);
        }

        return ret;
    }

    /**
     * SchemaModelエントリを取得する。
     * @param karteId カルテID
     * @param fromDate
     * @param toDate
     * @return SchemaModelエントリの配列
     */
    public List<List> getImages(long karteId, List fromDate, List toDate) {

        // 抽出期間は別けられている
        int len = fromDate.size();
        List<List> ret = new ArrayList<>(len);

        // 抽出期間セットの数だけ繰り返す
        for (int i = 0; i < len; i++) {

            List modules
                    = em.createQuery(QUERY_SCHEMA_BY_KARTE_ID)
                    .setParameter(KARTE_ID, karteId)
                    .setParameter(FROM_DATE, fromDate.get(i))
                    .setParameter(TO_DATE, toDate.get(i))
                    .getResultList();

            ret.add(modules);
        }

        return ret;
    }

    /**
     * 画像を取得する。
     * @param id SchemaModel Id
     * @return SchemaModel
     */
    public SchemaModel getImage(long id) {
        SchemaModel image = (SchemaModel)em.find(SchemaModel.class, id);
        return image;
    }

    public List<SchemaModel> getS3Images(String fid, int firstResult, int maxResult) {

        List<SchemaModel> ret = (List<SchemaModel>)
                                em.createQuery(QUERY_SCHEMA_BY_FACILITY_ID)
                                .setParameter(FID, fid+"%")
                                .setFirstResult(firstResult)
                                .setMaxResults(maxResult)
                                .getResultList();
        return ret;
    }

    public void deleteS3Image(long pk) {
        SchemaModel target = em.find(SchemaModel.class, pk);
        target.getExtRefModel().setBucket(null);
        target.getExtRefModel().setSop(null);
        target.getExtRefModel().setUrl(null);
    }

    /**
     * 傷病名リストを取得する。
     * @param karteId
     * @param fromDate
     * @param activeOnly
     * @return 傷病名のリスト
     */
    public List<RegisteredDiagnosisModel> getDiagnosis(long karteId, Date fromDate, boolean activeOnly) {

        List<RegisteredDiagnosisModel> ret;

        // 疾患開始日を指定している
        if (fromDate != null) {
            String query = activeOnly ? QUERY_DIAGNOSIS_BY_KARTE_DATE_ACTIVEONLY : QUERY_DIAGNOSIS_BY_KARTE_DATE;
            ret = (List<RegisteredDiagnosisModel>) em.createQuery(query)
                    .setParameter(KARTE_ID, karteId)
                    .setParameter(FROM_DATE, fromDate)
                    .getResultList();
        } else {
            // 全期間の傷病名を得る
            String query = activeOnly ? QUERY_DIAGNOSIS_BY_KARTE_ACTIVEONLY : QUERY_DIAGNOSIS_BY_KARTE;
            ret = (List<RegisteredDiagnosisModel>)em.createQuery(query)
                    .setParameter(KARTE_ID, karteId)
                    .getResultList();
        }

        return ret;
    }
    
    /**
     * 新規病名保存、病名更新、CLAIM送信を一括して実行する。
     * @param wrapper DiagnosisSendWrapper
     * @return 新規病名のPKリスト
     */
    public List<Long> postPutSendDiagnosis(DiagnosisSendWrapper wrapper) {

        List<RegisteredDiagnosisModel> deletedList = wrapper.getDeletedDiagnosis();
        if (deletedList != null) {
            for (RegisteredDiagnosisModel bean : deletedList) {
                if (bean.getId() != 0L) {
                    RegisteredDiagnosisModel delete = em.find(RegisteredDiagnosisModel.class, bean.getId());
                    em.remove(delete);
                }
            }
        }

        List<RegisteredDiagnosisModel> updatedList = wrapper.getUpdatedDiagnosis();
        if (updatedList != null) {
            for (RegisteredDiagnosisModel bean : updatedList) {
                em.merge(bean);
            }
        }

        List<RegisteredDiagnosisModel> addedList = wrapper.getAddedDiagnosis();
        List<Long> ret = new ArrayList<>(addedList != null ? addedList.size() : 0);
        if (addedList != null) {
            for (RegisteredDiagnosisModel bean : addedList) {
                em.persist(bean);
                ret.add(bean.getId());
            }
        }
        
        //-------------------------------------------------------------
        // CLAIM送信
        //-------------------------------------------------------------
        if (wrapper.getSendClaim() && wrapper.getConfirmDate()!=null) {
//s.oh^ 2014/01/23 ORCAとの接続対応
            messagingGateway.dispatchDiagnosis(wrapper);
        }

        diagnosisAuditRecorder.recordCreate(wrapper, addedList, ret);
        diagnosisAuditRecorder.recordUpdate(wrapper, updatedList);

        return ret;
    }
    

    /**
     * 傷病名を追加する。
     * @param addList 追加する傷病名のリスト
     * @return idのリスト
     */
    public List<Long> addDiagnosis(List<RegisteredDiagnosisModel> addList) {

        List<Long> ret = new ArrayList<>(addList.size());

        for (RegisteredDiagnosisModel bean : addList) {
            em.persist(bean);
            ret.add(new Long(bean.getId()));
        }

        return ret;
    }

    /**
     * 傷病名を更新する。
     * @param updateList
     * @return 更新数
     */
    public int updateDiagnosis(List<RegisteredDiagnosisModel> updateList) {

        int cnt = 0;

        for (RegisteredDiagnosisModel bean : updateList) {
            em.merge(bean);
            cnt++;
        }

        return cnt;
    }

    /**
     * 傷病名を削除する。
     * @param removeList 削除する傷病名のidリスト
     * @return 削除数
     */
    public int removeDiagnosis(List<Long> removeList) {

        int cnt = 0;

        for (Long id : removeList) {
            RegisteredDiagnosisModel bean = (RegisteredDiagnosisModel) em.find(RegisteredDiagnosisModel.class, id);
            em.remove(bean);
            cnt++;
        }

        return cnt;
    }

    /**
     * Observationを取得する。
     * @param karteId
     * @param observation
     * @param phenomenon
     * @param firstConfirmed
     * @return Observationのリスト
     */
    public List<ObservationModel> getObservations(long karteId, String observation, String phenomenon, Date firstConfirmed) {

        List ret = null;

        if (observation != null) {
            if (firstConfirmed != null) {
                ret = em.createQuery("from ObservationModel o where o.karte.id=:karteId and o.observation=:observation and o.started >= :firstConfirmed")
                .setParameter(KARTE_ID, karteId)
                .setParameter("observation", observation)
                .setParameter("firstConfirmed", firstConfirmed)
                .getResultList();

            } else {
                ret = em.createQuery("from ObservationModel o where o.karte.id=:karteId and o.observation=:observation")
                .setParameter(KARTE_ID, karteId)
                .setParameter("observation", observation)
                .getResultList();
            }
        } else if (phenomenon != null) {
            if (firstConfirmed != null) {
                ret = em.createQuery("from ObservationModel o where o.karte.id=:karteId and o.phenomenon=:phenomenon and o.started >= :firstConfirmed")
                .setParameter(KARTE_ID, karteId)
                .setParameter("phenomenon", phenomenon)
                .setParameter("firstConfirmed", firstConfirmed)
                .getResultList();
            } else {
                ret = em.createQuery("from ObservationModel o where o.karte.id=:karteId and o.phenomenon=:phenomenon")
                .setParameter(KARTE_ID, karteId)
                .setParameter("phenomenon", phenomenon)
                .getResultList();
            }
        }
        return ret;
    }

    /**
     * Observationを追加する。
     * @param observations 追加するObservationのリスト
     * @return 追加したObservationのIdリスト
     */
    public List<Long> addObservations(List<ObservationModel> observations) {

        if (observations != null && observations.size() > 0) {

            List<Long> ret = new ArrayList<>(observations.size());

            for (ObservationModel model : observations) {
                em.persist(model);
                ret.add(new Long(model.getId()));
            }

            return ret;
        }
        return null;
    }

    /**
     * Observationを更新する。
     * @param observations 更新するObservationのリスト
     * @return 更新した数
     */
    public int updateObservations(List<ObservationModel> observations) {

        if (observations != null && observations.size() > 0) {
            int cnt = 0;
            for (ObservationModel model : observations) {
                em.merge(model);
                cnt++;
            }
            return cnt;
        }
        return 0;
    }

    /**
     * Observationを削除する。
     * @param observations 削除するObservationのリスト
     * @return 削除した数
     */
    
    public int removeObservations(List<Long> observations) {
        if (observations != null && observations.size() > 0) {
            int cnt = 0;
            for (Long id : observations) {
                ObservationModel model = (ObservationModel) em.find(ObservationModel.class, id);
                em.remove(model);
                cnt++;
            }
            return cnt;
        }
        return 0;
    }

    /**
     * 患者メモを更新する。
     * @param memo 更新するメモ
     * @return   */
    
    public int updatePatientMemo(PatientMemoModel memo) {

        int cnt = 0;

        if (memo.getId() == 0L) {
            //em.persist(memo);
            if(memo.getKarteBean() != null) {
                List<PatientMemoModel> memoList =
                            (List<PatientMemoModel>)em.createQuery(QUERY_PATIENT_MEMO)
                                                      .setParameter("karteId", memo.getKarteBean().getId())
                                                      .getResultList();
                if(memoList.isEmpty()) {
                    em.persist(memo);
                }else{
                    PatientMemoModel pmm = memoList.get(0);
                    pmm.setMemo(memo.getMemo());
                    em.merge(pmm);
                }
            }
        } else {
            em.merge(memo);
        }
        cnt++;
        return cnt;
    }
    
//s.oh^ 2014/04/03 サマリー対応
    public PatientFreeDocumentModel getPatientFreeDocument(String fpid) {

//        PatientFreeDocumentModel ret = (PatientFreeDocumentModel)em.createQuery(QUERY_FREEDOCU_BY_FPID)
//                                        .setParameter(FPID, fpid)
//                                        .getSingleResult();
        List<PatientFreeDocumentModel> ret = em.createQuery(QUERY_FREEDOCU_BY_FPID)
                                        .setParameter(FPID, fpid)
                                        .getResultList();

        return (ret!=null && ret.size()==1) ? ret.get(0) : null;
    }
    
    public int updatePatientFreeDocument(PatientFreeDocumentModel update) {
        PatientFreeDocumentModel current = (PatientFreeDocumentModel)em.find(PatientFreeDocumentModel.class, update.getId());
        if(current == null) {
            try{
                current = (PatientFreeDocumentModel)em.createQuery(QUERY_FREEDOCU_BY_FPID)
                          .setParameter(FPID, update.getFacilityPatId())
                          .getSingleResult();
                if(current != null) {
                    update.setId(current.getId());
                }
            }catch(NoResultException ex) {
                LOGGER.warn("FreeDocument NoResultException");
            }
            em.persist(update);
            LOGGER.info("New FreeDocument");
            return 1;
        }
        em.merge(update);
        LOGGER.info("Update FreeDocument");
        return 1;
    }
//s.oh$

    //--------------------------------------------------------------------------

    /**
     * 紹介状を保存または更新する。
     * @param model
     * @return 
     */
    
    public long saveOrUpdateLetter(LetterModel model) {
        LetterModel saveOrUpdate = em.merge(model);
        return saveOrUpdate.getId();
    }

    /**
     * 紹介状のリストを取得する。
     * @param karteId
     * @param docType
     * @return 
     */
    
    public List<LetterModel> getLetterList(long karteId, String docType) {

        if (docType.equals(TOUTOU)) {
            // 紹介状
            List<LetterModel> ret = (List<LetterModel>)
                        em.createQuery(QUERY_LETTER_BY_KARTE_ID)
                        .setParameter(KARTE_ID, karteId)
                        .getResultList();
            return ret;

        } else if (docType.equals(TOUTOU_REPLY)) {
            // 返書
            List<LetterModel> ret = (List<LetterModel>)
                        em.createQuery(QUERY_REPLY_BY_KARTE_ID)
                        .setParameter(KARTE_ID, karteId)
                        .getResultList();
            return ret;
        }

        return null;
    }

    /**
     * 紹介状を取得する。
     * @param letterPk
     * @return 
     */
    
    public LetterModel getLetter(long letterPk) {

        LetterModel ret = (LetterModel)
                        em.createQuery(QUERY_LETTER_BY_ID)
                        .setParameter(ID, letterPk)
                        .getSingleResult();
        return ret;
    }

    
    public LetterModel getLetterReply(long letterPk) {

        LetterModel ret = (LetterModel)
                        em.createQuery(QUERY_REPLY_BY_ID)
                        .setParameter(ID, letterPk)
                        .getSingleResult();
        return ret;
    }

    //--------------------------------------------------------------------------

    
    public List<List<AppointmentModel>> getAppointmentList(long karteId, List fromDate, List toDate) {

        // 抽出期間は別けられている
        int len = fromDate.size();
        List<List<AppointmentModel>> ret = new ArrayList<>(len);

        // 抽出期間セットの数だけ繰り返す
        for (int i = 0; i < len; i++) {

            List<AppointmentModel> modules
                    = em.createQuery(QUERY_APPO_BY_KARTE_ID_PERIOD)
                    .setParameter(KARTE_ID, karteId)
                    .setParameter(FROM_DATE, fromDate.get(i))
                    .setParameter(TO_DATE, toDate.get(i))
                    .getResultList();

            ret.add(modules);
        }

        return ret;
    }
    
    //---------------------------------------------------------------------------
     
    // 指定したEntityのModuleModleを一括取得
    @SuppressWarnings("unchecked")
    public List<ModuleModel> getModulesEntitySearch(String fid, long karteId, Date fromDate, Date toDate, List<String> entities) {
        
        // 指定したentityのModuleModelを返す
        List<ModuleModel> ret;
        
        //if (karteId != 0){
            final String sql = "from ModuleModel m where m.karte.id = :karteId " +
                    "and m.started between :fromDate and :toDate and m.status='F' " +
                    "and m.moduleInfo.entity in (:entities)";

            ret = em.createQuery(sql)
                    .setParameter("karteId", karteId)
                    .setParameter("fromDate", fromDate)
                    .setParameter("toDate", toDate)
                    .setParameter("entities", entities)
                    .getResultList();
//          } else {
//            // karteIdが指定されていなかったら、施設の指定期間のすべて患者のModuleModelを返す
//            long fPk = getFacilityPk(fid);
//            final String sql = "from ModuleModel m " +
//                    "where m.started between :fromDate and :toDate " +
//                    "and m.status='F' " +
//                    "and m.moduleInfo.entity in (:entities)" +
//                    "and m.creator.facility.id = :fPk";
//
//            ret = em.createQuery(sql)
//                    .setParameter("fromDate", fromDate)
//                    .setParameter("toDate", toDate)
//                    .setParameter("entities",entities)
//                    .setParameter("fPk", fPk)
//                    .getResultList();
//        }

        return ret;
    }

//s.oh^ 2014/07/22 一括カルテPDF出力
    public List<DocumentModel> getAllDocument(long patientPK) {
        
        List<DocumentModel> documents = null;
        List<DocumentModel> result = new ArrayList<>();
        
        try {
            List<KarteBean> kartes = em.createQuery(QUERY_KARTE)
                                  .setParameter(PATIENT_PK, patientPK)
                                  .getResultList();
            KarteBean karte = kartes.get(0);
            
            documents = (List<DocumentModel>)em.createQuery("from DocumentModel d where d.karte.id=:karteId and (d.status='F' or d.status='T')")
                .setParameter(KARTE_ID, karte.getId())
                .getResultList();
        } catch (NoResultException e) {
            // 患者登録の際にカルテも生成してある
        }
        
        if(documents != null) {
            for (DocumentModel model : documents) {

                model.toDetuch();
                
                long id = model.getId();

                // ModuleBean を取得する
                try {
                    List modules = em.createQuery(QUERY_MODULE_BY_DOC_ID)
                    .setParameter(ID, id)
                    .getResultList();
                    model.setModules(modules);
                } catch (NoResultException e) {
                    // 患者登録の際にカルテも生成してある
                }

                // SchemaModel を取得する
                try {
                    List images = em.createQuery(QUERY_SCHEMA_BY_DOC_ID)
                    .setParameter(ID, id)
                    .getResultList();
                    model.setSchema(images);
                } catch (NoResultException e) {
                    // 患者登録の際にカルテも生成してある
                }

                // AttachmentModel を取得する
                try {
                    List attachments = em.createQuery(QUERY_ATTACHMENT_BY_DOC_ID)
                    .setParameter(ID, id)
                    .getResultList();
                    model.setAttachment(attachments);
                } catch (NoResultException e) {
                    // 患者登録の際にカルテも生成してある
                }

                result.add(model);
            }
        }
        
        return result;
    }
//s.oh$
    
//s.oh^ 2014/08/20 添付ファイルの別読
    public AttachmentModel getAttachment(long pk) {
        try {
            AttachmentModel attachment = (AttachmentModel)em.createQuery(QUERY_ATTACHMENT_BY_ID)
                                            .setParameter(ID, pk)
                                            .getSingleResult();
            attachmentStorageManager.populateBinary(attachment);
            return attachment;
        } catch (NoResultException e) {
        }
        return null;
    }
//s.oh$

    private List<DocumentModel> fetchDocumentsWithModules(List<Long> docIds) {
        if (docIds == null || docIds.isEmpty()) {
            return Collections.emptyList();
        }
        return em.createQuery("select distinct d from DocumentModel d left join fetch d.modules m where d.id in :ids",
                DocumentModel.class)
                .setParameter("ids", docIds)
                .getResultList();
    }

    private List<ModuleModel> filterMedModules(List<ModuleModel> modules) {
        if (modules == null || modules.isEmpty()) {
            return Collections.emptyList();
        }
        List<ModuleModel> filtered = new ArrayList<>();
        for (ModuleModel module : modules) {
            if (module != null && module.getModuleInfoBean() != null
                    && IInfoModel.ENTITY_MED_ORDER.equals(module.getModuleInfoBean().getEntity())) {
                filtered.add(module);
            }
        }
        return filtered;
    }

    private String determineRoutineName(DocumentModel document, List<ModuleModel> modules) {
        String title = document.getDocInfoModel() != null ? document.getDocInfoModel().getTitle() : null;
        if (hasText(title)) {
            return title.trim();
        }
        for (ModuleModel module : modules) {
            ModuleInfoBean info = module.getModuleInfoBean();
            if (info != null && hasText(info.getStampName())) {
                return info.getStampName().trim();
            }
        }
        return "Document #" + document.getId();
    }

    private String determineRoutineMemo(List<ModuleModel> modules) {
        for (ModuleModel module : modules) {
            ModuleInfoBean info = module.getModuleInfoBean();
            if (info != null && hasText(info.getStampMemo())) {
                return info.getStampMemo().trim();
            }
        }
        return null;
    }

    private List<ModuleModelConverter> convertModules(List<ModuleModel> modules) {
        if (modules == null || modules.isEmpty()) {
            return Collections.emptyList();
        }
        List<ModuleModelConverter> converters = new ArrayList<>(modules.size());
        for (ModuleModel module : modules) {
            ModuleModelConverter converter = new ModuleModelConverter();
            converter.setModel(module);
            converters.add(converter);
        }
        return converters;
    }

    private String formatIso(Date date) {
        if (date == null) {
            return null;
        }
        Instant instant = date.toInstant();
        return ISO_INSTANT_FORMATTER.format(instant);
    }

    private String formatDateOnly(Date date) {
        if (date == null) {
            return null;
        }
        return ISO_DATE_FORMATTER.format(date.toInstant());
    }

    private Date firstNonNull(Date... candidates) {
        if (candidates == null) {
            return null;
        }
        for (Date candidate : candidates) {
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private List<RpHistoryDrugResponse> toRpHistoryDrugs(List<ModuleModel> modules) {
        if (modules == null || modules.isEmpty()) {
            return Collections.emptyList();
        }
        List<RpHistoryDrugResponse> responses = new ArrayList<>();
        for (ModuleModel module : modules) {
            BundleDolphin bundle = decodeBundle(module);
            if (bundle == null || bundle.getClaimItem() == null) {
                continue;
            }
            for (ClaimItem item : bundle.getClaimItem()) {
                responses.add(new RpHistoryDrugResponse(
                        item != null ? item.getCode() : null,
                        item != null ? item.getClassCode() : null,
                        item != null ? item.getName() : null,
                        buildAmount(item),
                        item != null ? item.getDose() : null,
                        bundle.getAdmin(),
                        bundle.getBundleNumber(),
                        firstNonBlank(item != null ? item.getMemo() : null, bundle.getMemo(), bundle.getAdminMemo())
                ));
            }
        }
        return responses;
    }

    private BundleDolphin decodeBundle(ModuleModel module) {
        if (module == null || module.getBeanBytes() == null) {
            return null;
        }
        try {
            Object decoded = ModelUtils.xmlDecode(module.getBeanBytes());
            if (decoded instanceof BundleDolphin) {
                return (BundleDolphin) decoded;
            }
        } catch (Exception ex) {
            LOGGER.debug("Failed to decode module {}", module.getId(), ex);
        }
        return null;
    }

    private String buildAmount(ClaimItem item) {
        if (item == null) {
            return null;
        }
        String number = item.getNumber();
        if (!hasText(number)) {
            return null;
        }
        StringBuilder sb = new StringBuilder(number.trim());
        if (hasText(item.getUnit())) {
            sb.append(item.getUnit().trim());
        }
        return sb.toString();
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private List<UserPropertyResponse> buildUserPropertyResponses(UserModel user) {
        List<UserPropertyResponse> responses = new ArrayList<>();
        long seq = 1L;
        String updatedAt = formatIso(user.getRegisteredDate());

        if (hasText(user.getCommonName())) {
            responses.add(new UserPropertyResponse(seq++, "担当医", user.getCommonName().trim(), null, "プロフィール", updatedAt));
        }
        if (user.getDepartmentModel() != null && hasText(user.getDepartmentModel().getDepartmentDesc())) {
            responses.add(new UserPropertyResponse(seq++, "診療科", user.getDepartmentModel().getDepartmentDesc().trim(),
                    null, "プロフィール", updatedAt));
        }
        if (hasText(user.getOrcaId())) {
            responses.add(new UserPropertyResponse(seq++, "ORCA ID", user.getOrcaId().trim(),
                    "ORCA 連携で使用するユーザーコード", "システム", updatedAt));
        }
        if (hasText(user.getMemo())) {
            responses.add(new UserPropertyResponse(seq++, "ユーザーメモ", user.getMemo().trim(), null, "メモ", updatedAt));
        }
        return responses;
    }

    private void removeMissingModules(List<ModuleModel> existing, List<ModuleModel> incoming) {
        removeMissingChildren(existing, incoming, module -> em.remove(em.contains(module) ? module : em.merge(module)));
    }

    private void removeMissingSchemas(List<SchemaModel> existing, List<SchemaModel> incoming) {
        removeMissingChildren(existing, incoming, schema -> em.remove(em.contains(schema) ? schema : em.merge(schema)));
    }

    private void removeMissingAttachments(List<AttachmentModel> existing, List<AttachmentModel> incoming) {
        removeMissingChildren(existing, incoming, attachment -> {
            attachmentStorageManager.deleteExternalAsset(attachment);
            em.remove(em.contains(attachment) ? attachment : em.merge(attachment));
        });
    }

    private <T extends KarteEntryBean> void removeMissingChildren(List<T> existing,
                                                                  List<T> incoming,
                                                                  Consumer<T> remover) {
        if (existing == null || existing.isEmpty()) {
            return;
        }
        Set<Long> incomingIds = collectIncomingIds(incoming);
        List<T> snapshot = new ArrayList<>(existing);
        for (T child : snapshot) {
            long id = child.getId();
            boolean shouldRemove = id > 0 && (incomingIds.isEmpty() || !incomingIds.contains(id));
            if (shouldRemove) {
                remover.accept(child);
                existing.remove(child);
            }
        }
    }

    private <T extends KarteEntryBean> Set<Long> collectIncomingIds(List<T> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Long> ids = new HashSet<>();
        for (T child : incoming) {
            if (child != null && child.getId() > 0) {
                ids.add(child.getId());
            }
        }
        return ids;
    }

}
