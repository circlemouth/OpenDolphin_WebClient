package open.dolphin.session;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.LetterDate;
import open.dolphin.infomodel.LetterItem;
import open.dolphin.infomodel.LetterModule;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.LetterText;
import open.dolphin.infomodel.UserModel;
import open.dolphin.session.framework.SessionOperation;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.security.audit.SessionAuditDispatcher;
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
public class LetterServiceBean {

    private static final Logger LOGGER = LoggerFactory.getLogger(LetterServiceBean.class);
    
    private static final String KARTE_ID = "karteId";
    private static final String ID = "id";

    private static final String QUERY_LETTER_BY_KARTE_ID = "from LetterModule l where l.karte.id=:karteId";
    private static final String QUERY_LETTER_BY_ID = "from LetterModule l where l.id=:id";
    private static final String QUERY_ITEM_BY_ID = "from LetterItem l where l.module.id=:id";
    private static final String QUERY_TEXT_BY_ID = "from LetterText l where l.module.id=:id";
    private static final String QUERY_DATE_BY_ID = "from LetterDate l where l.module.id=:id";

    @PersistenceContext
    private EntityManager em;

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    private SessionTraceManager traceManager;

    @Inject
    private UserServiceBean userService;

    
    public long saveOrUpdateLetter(LetterModule model) {

        KarteBean resolvedKarte = null;
        boolean updating = model != null && model.getLinkId() != 0L;
        String previousPatientContext = setPatientContext(model != null ? model.getPatientId() : null);
        String action = updating ? "LETTER_UPDATE" : "LETTER_CREATE";

        try {
            resolvedKarte = resolveKarteReference(model);
            model.setKarteBean(resolvedKarte);

            UserModel resolvedUser = resolveUserReference(model);
            if (resolvedUser == null) {
                throw new IllegalStateException("Unable to resolve creator for letter (userModel/userId missing)");
            }
            model.setUserModel(resolvedUser);

            // 保存
            em.persist(model);
            List<LetterItem> items = model.getLetterItems();
            if (items != null) {
                for (LetterItem item : items) {
                    item.setModule(model);
                    em.persist(item);
                }
            }
            List<LetterText> texts = model.getLetterTexts();
            if (texts != null) {
                for (LetterText txt : texts) {
                    txt.setModule(model);
                    em.persist(txt);
                }
            }
            List<LetterDate> dates = model.getLetterDates();
            if (dates != null) {
                for (LetterDate date : dates) {
                    date.setModule(model);
                    em.persist(date);
                }
            }

            // 削除
            if (model.getLinkId()!=0L) {

                try {
                    List<LetterItem> itemList = (List<LetterItem>)
                         em.createQuery(QUERY_ITEM_BY_ID)
                           .setParameter(ID, model.getLinkId())
                           .getResultList();
                    for (LetterItem item : itemList) {
                        em.remove(item);
                    }
                }catch(NoResultException e) {
                    LOGGER.warn("QUERY_ITEM_BY_ID : {}", e.toString());
                }

                try {
                    List<LetterText> textList = (List<LetterText>)
                         em.createQuery(QUERY_TEXT_BY_ID)
                           .setParameter(ID, model.getLinkId())
                           .getResultList();

                    for (LetterText txt : textList) {
                        em.remove(txt);
                    }
                }catch(NoResultException e) {
                    LOGGER.warn("QUERY_TEXT_BY_ID : {}", e.toString());
                }

                try {
                    List<LetterDate> dateList = (List<LetterDate>)
                         em.createQuery(QUERY_DATE_BY_ID)
                           .setParameter(ID, model.getLinkId())
                           .getResultList();

                    for (LetterDate date : dateList) {
                        em.remove(date);
                    }
                }catch(NoResultException e) {
                    LOGGER.warn("QUERY_DATE_BY_ID : {}", e.toString());
                }

                try {
                    LetterModule delete = (LetterModule)
                                em.createQuery(QUERY_LETTER_BY_ID)
                                .setParameter(ID, model.getLinkId())
                                .getSingleResult();
                    em.remove(delete);
                }catch(NoResultException e) {
                    LOGGER.warn("QUERY_LETTER_BY_ID : {}", e.toString());
                }
            }

            recordLetterMutation(model, resolvedKarte, action, null);
            return model.getId();
        } catch (RuntimeException ex) {
            recordLetterMutation(model, resolvedKarte, action, ex);
            throw ex;
        } finally {
            restorePatientContext(previousPatientContext);
        }
    }

    
    private KarteBean resolveKarteReference(LetterModule model) {
        KarteBean resolved = tryResolveKarte(model);
        if (resolved == null) {
            throw new IllegalStateException(String.format("Unable to resolve Karte for patientId=%s (karteId=%s)",
                    model.getPatientId(),
                    model.getKarteBean()!=null ? model.getKarteBean().getId() : "n/a"));
        }
        return resolved;
    }

    private KarteBean tryResolveKarte(LetterModule model) {
        KarteBean payloadKarte = model.getKarteBean();
        KarteBean byId = findKarteById(payloadKarte);
        if (byId != null) {
            return byId;
        }

        KarteBean byPatientPk = findKarteByPatientModel(payloadKarte != null ? payloadKarte.getPatientModel() : null);
        if (byPatientPk != null) {
            return byPatientPk;
        }

        return findKarteByIdentifiers(model);
    }

    private KarteBean findKarteById(KarteBean candidate) {
        if (candidate == null) {
            return null;
        }
        long karteId = candidate.getId();
        if (karteId <= 0) {
            return null;
        }
        KarteBean managed = em.find(KarteBean.class, karteId);
        if (managed == null) {
            LOGGER.warn("Referenced KarteBean id={} not found; falling back to patientId search.", karteId);
        }
        return managed;
    }

    private KarteBean findKarteByPatientModel(PatientModel patient) {
        if (patient == null) {
            return null;
        }
        if (patient.getId() > 0) {
            List<KarteBean> hits = em.createQuery("select k from KarteBean k where k.patient.id = :patientPk", KarteBean.class)
                                     .setParameter("patientPk", patient.getId())
                                     .setMaxResults(1)
                                     .getResultList();
            if (!hits.isEmpty()) {
                return hits.get(0);
            }
        }
        return findKarteByIdentifiers(patient.getFacilityId(), patient.getPatientId());
    }

    private KarteBean findKarteByIdentifiers(LetterModule model) {
        return findKarteByIdentifiers(resolveFacilityId(model), model.getPatientId());
    }

    private KarteBean findKarteByIdentifiers(String facilityId, String patientIdentifier) {
        if (patientIdentifier == null || patientIdentifier.isBlank()) {
            return null;
        }
        String normalizedPid = patientIdentifier.trim();
        String resolvedFacility = facilityId;
        int compositeIdx = normalizedPid.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (compositeIdx > 0) {
            resolvedFacility = normalizedPid.substring(0, compositeIdx);
            normalizedPid = normalizedPid.substring(compositeIdx + 1);
        }

        StringBuilder jpql = new StringBuilder("select k from KarteBean k where k.patient.patientId = :pid");
        if (resolvedFacility != null && !resolvedFacility.isBlank()) {
            jpql.append(" and k.patient.facilityId = :fid");
        } else {
            jpql.append(" order by k.id");
        }

        TypedQuery<KarteBean> query = em.createQuery(jpql.toString(), KarteBean.class)
                                        .setParameter("pid", normalizedPid);
        if (resolvedFacility != null && !resolvedFacility.isBlank()) {
            query.setParameter("fid", resolvedFacility);
        } else {
            query.setMaxResults(1);
        }
        List<KarteBean> hits = query.getResultList();
        return hits.isEmpty() ? null : hits.get(0);
    }

    private String resolveFacilityId(LetterModule model) {
        if (model.getUserModel()!=null && model.getUserModel().getFacilityModel()!=null) {
            return model.getUserModel().getFacilityModel().getFacilityId();
        }
        KarteBean payloadKarte = model.getKarteBean();
        if (payloadKarte!=null && payloadKarte.getPatientModel()!=null) {
            return payloadKarte.getPatientModel().getFacilityId();
        }
        SessionTraceContext context = traceManager != null ? traceManager.current() : null;
        if (context != null) {
            String actorId = context.getAttribute(SessionTraceAttributes.ACTOR_ID);
            return resolveFacilityId(actorId);
        }
        return null;
    }

    private UserModel resolveUserReference(LetterModule model) {
        if (model == null) {
            return null;
        }
        UserModel payload = model.getUserModel();
        if (payload != null && payload.getId() > 0) {
            UserModel byId = em.find(UserModel.class, payload.getId());
            if (byId != null) {
                return byId;
            }
        }
        if (payload != null && payload.getUserId() != null && !payload.getUserId().isBlank()) {
            try {
                return userService.getUser(payload.getUserId());
            } catch (NoResultException ex) {
                LOGGER.warn("User not found by userId={}", payload.getUserId());
            }
        }
        SessionTraceContext context = traceManager != null ? traceManager.current() : null;
        if (context != null) {
            String actorId = context.getAttribute(SessionTraceAttributes.ACTOR_ID);
            if (actorId != null && !actorId.isBlank()) {
                try {
                    return userService.getUser(actorId);
                } catch (NoResultException ex) {
                    LOGGER.warn("User not found by actorId={}", actorId);
                }
            }
        }
        return null;
    }

    public List<LetterModule> getLetterList(long karteId) {

        List<LetterModule> list = (List<LetterModule>)
                        em.createQuery(QUERY_LETTER_BY_KARTE_ID)
                        .setParameter(KARTE_ID, karteId)
                        .getResultList();
        return list;

    }

    
    public LetterModule getLetter(long letterPk) {

        LetterModule ret = (LetterModule)
                        em.createQuery(QUERY_LETTER_BY_ID)
                        .setParameter(ID, letterPk)
                        .getSingleResult();
        // item
        List<LetterItem> items = (List<LetterItem>)
                 em.createQuery(QUERY_ITEM_BY_ID)
                   .setParameter(ID, ret.getId())
                   .getResultList();
        ret.setLetterItems(items);

        // text
        List<LetterText> texts = (List<LetterText>)
                 em.createQuery(QUERY_TEXT_BY_ID)
                   .setParameter(ID, ret.getId())
                   .getResultList();
        ret.setLetterTexts(texts);

        // date
        List<LetterDate> dates = (List<LetterDate>)
                 em.createQuery(QUERY_DATE_BY_ID)
                   .setParameter(ID, ret.getId())
                   .getResultList();
        ret.setLetterDates(dates);

        return ret;
    }

    
    public void delete(long pk) {
        try {
            List<LetterItem> itemList = (List<LetterItem>)
                     em.createQuery(QUERY_ITEM_BY_ID)
                       .setParameter(ID, pk)
                       .getResultList();
            for (LetterItem item : itemList) {
                em.remove(item);
            }
        }catch(NoResultException e) {
            LOGGER.warn("QUERY_ITEM_BY_ID : {}", e.toString());
        }

        try {
            List<LetterText> textList = (List<LetterText>)
                 em.createQuery(QUERY_TEXT_BY_ID)
                   .setParameter(ID, pk)
                   .getResultList();

            for (LetterText txt : textList) {
                em.remove(txt);
            }
        }catch(NoResultException e) {
            LOGGER.warn("QUERY_TEXT_BY_ID : {}", e.toString());
        }

        try {
            List<LetterDate> dateList = (List<LetterDate>)
                 em.createQuery(QUERY_DATE_BY_ID)
                   .setParameter(ID, pk)
                   .getResultList();

            for (LetterDate date : dateList) {
                em.remove(date);
            }
        }catch(NoResultException e) {
            LOGGER.warn("QUERY_DATE_BY_ID : {}", e.toString());
        }

        try {
            LetterModule delete = (LetterModule)
                        em.createQuery(QUERY_LETTER_BY_ID)
                        .setParameter(ID, pk)
                        .getSingleResult();
            em.remove(delete);
        }catch(NoResultException e) {
            LOGGER.warn("QUERY_LETTER_BY_ID : {}", e.toString());
        }
    }

    private void recordLetterMutation(LetterModule model, KarteBean karte, String action, Throwable error) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        try {
            AuditEventEnvelope.Builder builder = newAuditBuilder(action);
            builder.patientId(determinePatientId(model));
            builder.details(buildLetterDetails(model, karte, action));
            if (error != null) {
                builder.failure(error);
            }
            sessionAuditDispatcher.dispatch(builder.build());
        } catch (IllegalStateException ex) {
            LOGGER.warn("Failed to dispatch letter audit event [action={}]: {}", action, ex.getMessage());
        }
    }

    private Map<String, Object> buildLetterDetails(LetterModule model, KarteBean karte, String action) {
        Map<String, Object> details = new HashMap<>();
        details.put("mutationType", action);
        if (model != null) {
            details.put("letterId", model.getId());
            details.put("linkId", model.getLinkId());
            details.put("patientExternalId", model.getPatientId());
            details.put("letterType", model.getLetterType());
            details.put("consultantHospital", model.getConsultantHospital());
            details.put("itemCount", model.getLetterItems() != null ? model.getLetterItems().size() : 0);
            details.put("textCount", model.getLetterTexts() != null ? model.getLetterTexts().size() : 0);
            details.put("dateCount", model.getLetterDates() != null ? model.getLetterDates().size() : 0);
            details.put("status", model.getStatus());
        }
        if (karte != null) {
            details.put("karteId", karte.getId());
            if (karte.getPatientModel() != null) {
                details.put("resolvedFacilityId", karte.getPatientModel().getFacilityId());
                details.put("resolvedPatientPk", karte.getPatientModel().getId());
            }
        }
        return details;
    }

    private AuditEventEnvelope.Builder newAuditBuilder(String action) {
        AuditEventEnvelope.Builder builder = AuditEventEnvelope.builder(action, "LetterServiceBean");
        SessionTraceContext context = traceManager != null ? traceManager.current() : null;
        String actorId = resolveActorId(context);
        builder.actorId(actorId);
        builder.actorDisplayName(resolveActorDisplayName(actorId));
        builder.actorRole(context != null ? context.getActorRole() : null);
        builder.facilityId(resolveFacilityId(actorId));
        String traceId = resolveTraceId(context);
        builder.traceId(traceId);
        builder.requestId(resolveRequestId(context, traceId));
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

    private String resolveContextPatientId(SessionTraceContext context) {
        if (context == null) {
            return "N/A";
        }
        String patient = context.getAttribute(SessionTraceAttributes.PATIENT_ID);
        return patient == null || patient.isBlank() ? "N/A" : patient;
    }

    private String determinePatientId(LetterModule model) {
        if (model != null && model.getPatientId() != null && !model.getPatientId().isBlank()) {
            return model.getPatientId();
        }
        SessionTraceContext context = traceManager != null ? traceManager.current() : null;
        return resolveContextPatientId(context);
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
