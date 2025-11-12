package open.dolphin.session;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.infomodel.AppointmentModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.session.framework.SessionOperation;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@Named
@ApplicationScoped
@Transactional
@SessionOperation
public class AppoServiceBean {

    private static final String QUERY_APPOINTMENT_BY_KARTE_ID = "from AppointmentModel a where a.karte.id=:karteId and a.date between :fromDate and :toDate";
    private static final String KARTE_ID = "karteId";
    private static final String FROM_DATE = "fromDate";
    private static final String TO_DATE = "toDate";

    @PersistenceContext
    private EntityManager em;

    @Inject
    private SessionAuditDispatcher sessionAuditDispatcher;

    @Inject
    private SessionTraceManager traceManager;

    public int putAppointments(List<AppointmentModel> list) {

        List<AppointmentModel> appointments = list == null ? List.of() : list;
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("requestedCount", appointments.size());

        String patientId = resolveAppointmentsPatientId(appointments);
        if (patientId != null) {
            auditDetails.put("patientId", patientId);
        }
        String previousPatientContext = setPatientContext(patientId);

        int cnt = 0;
        int created = 0;
        int updated = 0;
        int deleted = 0;

        RuntimeException failure = null;
        try {
            for (AppointmentModel model : appointments) {

                int state = model.getState();
                String appoName = model.getName();

                if (state == AppointmentModel.TT_NEW) {
                    em.persist(model);
                    cnt++;
                    created++;

                } else if (state == AppointmentModel.TT_REPLACE && appoName != null) {
                    em.merge(model);
                    cnt++;
                    updated++;

                } else if (state == AppointmentModel.TT_REPLACE && appoName == null) {
                    AppointmentModel target = (AppointmentModel) em.find(AppointmentModel.class, model.getId());
                    em.remove(target);
                    cnt++;
                    deleted++;
                }
            }
        } catch (RuntimeException ex) {
            failure = ex;
            throw ex;
        } finally {
            auditDetails.put("createdCount", created);
            auditDetails.put("updatedCount", updated);
            auditDetails.put("deletedCount", deleted);
            auditDetails.put("appliedCount", cnt);
            writeAppointmentAudit(auditDetails, failure);
            restorePatientContext(previousPatientContext);
        }

        return cnt;
    }

    /**
     * 予約を検索する。
     * @param spec 検索仕様
     * @return 予約の Collection
     */
    public List<List> getAppointmentList(long karteId, List fromDate, List toDate) {

        // 抽出期間は別けられている
        int len = fromDate.size();
        List<List> ret = new ArrayList<List>(len);

        // 抽出期間ごとに検索しコレクションに加える
        for (int i = 0; i < len; i++) {

            List c = em.createQuery(QUERY_APPOINTMENT_BY_KARTE_ID)
            .setParameter(KARTE_ID, karteId)
            .setParameter(FROM_DATE, fromDate.get(i))
            .setParameter(TO_DATE, toDate.get(i))
            .getResultList();
            ret.add(c);
        }

        return ret;
    }

    private void writeAppointmentAudit(Map<String, Object> details, Throwable error) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventEnvelope.Builder builder = newAuditBuilder("APPOINTMENT_MUTATION", "AppointmentModel");
        builder.details(details == null ? Map.of() : details);
        if (error != null) {
            builder.failure(error);
        }
        sessionAuditDispatcher.dispatch(builder.build());
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

    private String resolveAppointmentsPatientId(List<AppointmentModel> appointments) {
        if (appointments == null || appointments.isEmpty()) {
            return null;
        }
        String candidate = null;
        for (AppointmentModel model : appointments) {
            if (model == null) {
                continue;
            }
            String patientId = model.getPatientId();
            if (patientId == null || patientId.isBlank()) {
                continue;
            }
            if (candidate == null) {
                candidate = patientId;
            } else if (!candidate.equals(patientId)) {
                return "MULTIPLE";
            }
        }
        return candidate;
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
