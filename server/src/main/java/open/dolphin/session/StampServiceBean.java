package open.dolphin.session;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.LockModeType;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import open.dolphin.infomodel.*;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.audit.StampAuditContext;
import open.dolphin.session.audit.StampAuditContextHolder;

/**
 *
 * @author kazushi, Minagawa, Digital Globe, Inc.
 */
@Named
@Stateless
public class StampServiceBean {

    private static final Logger LOGGER = Logger.getLogger(StampServiceBean.class.getName());
    private static final String QUERY_TREE_BY_USER_PK = "from StampTreeModel s where s.user.id=:userPK";
    private static final String QUERY_SUBSCRIBED_BY_USER_PK = "from SubscribedTreeModel s where s.user.id=:userPK";
    private static final String QUERY_LOCAL_PUBLISHED_TREE = "from PublishedTreeModel p where p.publishType=:fid";
    private static final String QUERY_PUBLIC_TREE = "from PublishedTreeModel p where p.publishType='global'";
    private static final String QUERY_PUBLISHED_TREE_BY_ID = "from PublishedTreeModel p where p.id=:id";
    private static final String QUERY_SUBSCRIBED_BY_USER_PK_TREE_ID = "from SubscribedTreeModel s where s.user.id=:userPK and s.treeId=:treeId";

    private static final String USER_PK = "userPK";
    private static final String FID = "fid";
    private static final String TREE_ID = "treeId";
    private static final String ID = "id";
    
    @PersistenceContext
    private EntityManager em;

    @EJB
    private AuditTrailService auditTrailService;
    
    /**
     * user個人のStampTreeを保存/更新する。
     * @param model 保存する StampTree
     * @return id
     */
    public long putTree(StampTreeModel model) {
        try {
            StampTreeModel saved = persistPersonalTree(model);
            recordStampTreeAudit("STAMP_TREE_PUT", model, saved, saved.getVersionNumber(), "success", null);
            return saved.getId();
        } catch (RuntimeException e) {
            recordStampTreeAudit("STAMP_TREE_PUT", model, null, null, "failed", e.getClass().getSimpleName());
            throw e;
        }
    }
    
    // pk,versionNumber
    public String syncTree(StampTreeModel model) {
        try {
            StampTreeModel saved = persistPersonalTree(model);
            StringBuilder sb = new StringBuilder();
            sb.append(String.valueOf(saved.getId())).append(",").append(saved.getVersionNumber());
            String result = sb.toString();
            recordStampTreeAudit("STAMP_TREE_SYNC", model, saved, saved.getVersionNumber(), "success", null);
            return result;
        } catch (RuntimeException e) {
            recordStampTreeAudit("STAMP_TREE_SYNC", model, null, null, "failed", e.getClass().getSimpleName());
            throw e;
        }
    }
    
    // pk,versionNumber
    public void forceSyncTree(StampTreeModel model) {
        try {
            ensureTreeBytes(model);
            StampTreeModel merged = em.merge(model);
            recordStampTreeAudit("STAMP_TREE_FORCE_SYNC", model, merged, merged != null ? merged.getVersionNumber() : null, "success", null);
        } catch (RuntimeException e) {
            recordStampTreeAudit("STAMP_TREE_FORCE_SYNC", model, null, null, "failed", e.getClass().getSimpleName());
            throw e;
        }
    }

    private StampTreeModel persistPersonalTree(StampTreeModel model) {
        requireUser(model);
        ensureTreeBytes(model);

        StampTreeModel existing = findPersonalTree(model.getUserModel().getId(), true);
        if (existing == null) {
            model.setVersionNumber(sanitizeInitialVersion(model.getVersionNumber()));
            return em.merge(model);
        }

        copyIdentity(existing, model);
        String requestedVersion = model.getVersionNumber();
        String dbVersion = existing.getVersionNumber();
        if (requestedVersion == null || !requestedVersion.equals(dbVersion)) {
            logVersionMismatch(model.getUserModel().getId(), requestedVersion, dbVersion);
        }
        model.setVersionNumber(String.valueOf(nextVersion(dbVersion)));
        return em.merge(model);
    }

    private StampTreeModel findPersonalTree(long userPk, boolean lock) {
        try {
            TypedQuery<StampTreeModel> query = em.createQuery(QUERY_TREE_BY_USER_PK, StampTreeModel.class)
                    .setParameter(USER_PK, userPk);
            if (lock) {
                query.setLockMode(LockModeType.PESSIMISTIC_WRITE);
            }
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    private void ensureTreeBytes(StampTreeModel model) {
        if (model == null) {
            return;
        }
        if ((model.getTreeBytes() == null || model.getTreeBytes().length == 0) && model.getTreeXml() != null) {
            model.setTreeBytes(model.getTreeXml().getBytes(StandardCharsets.UTF_8));
        }
    }

    private void copyIdentity(StampTreeModel existing, StampTreeModel target) {
        target.setId(existing.getId());
        target.setUserModel(existing.getUserModel());
    }

    private void requireUser(StampTreeModel model) {
        if (model == null || model.getUserModel() == null || model.getUserModel().getId() == 0) {
            throw new IllegalArgumentException("StampTreeModel.userModel is required");
        }
    }

    private int nextVersion(String dbVersion) {
        int base = 0;
        if (dbVersion != null) {
            try {
                base = Integer.parseInt(dbVersion);
            } catch (NumberFormatException e) {
                LOGGER.log(Level.FINE, "Invalid version format {0}; resetting to 0", dbVersion);
                base = 0;
            }
        }
        return base + 1;
    }

    private String sanitizeInitialVersion(String version) {
        if (version == null) {
            return "0";
        }
        try {
            int parsed = Integer.parseInt(version);
            return parsed < 0 ? "0" : String.valueOf(parsed);
        } catch (NumberFormatException e) {
            return "0";
        }
    }

    private void logVersionMismatch(long userPk, String requested, String current) {
        LOGGER.log(Level.INFO, formatVersionMismatchMessage(userPk, requested, current));
    }

    private String formatVersionMismatchMessage(long userPk, String requested, String current) {
        return String.format("StampTree version desync detected [userPk=%d, payloadVersion=%s, dbVersion=%s]",
                userPk,
                requested,
                current);
    }

    private void recordStampTreeAudit(String action, StampTreeModel requestModel, StampTreeModel persistedModel,
                                      String persistedVersion, String outcome, String reason) {
        if (auditTrailService == null) {
            return;
        }
        StampAuditContext context = StampAuditContextHolder.get();
        if (context == null) {
            return;
        }
        try {
            AuditEventPayload payload = createBaseAuditPayload(action, context);
            Map<String, Object> details = new HashMap<>();
            details.put("outcome", outcome);
            if (reason != null) {
                details.put("reason", reason);
            }
            if (requestModel != null && requestModel.getUserModel() != null) {
                details.put("userPk", requestModel.getUserModel().getId());
                details.put("payloadVersion", requestModel.getVersionNumber());
            }
            long treeId = persistedModel != null ? persistedModel.getId() : (requestModel != null ? requestModel.getId() : 0L);
            if (treeId > 0) {
                details.put("treeId", treeId);
            }
            if (persistedVersion != null) {
                details.put("persistedVersion", persistedVersion);
            }
            if (requestModel != null && requestModel.getTreeBytes() != null) {
                details.put("treeBytesLength", requestModel.getTreeBytes().length);
            }
            enrichUserDetails(details, context.getRemoteUser());
            addTraceDetails(details, context);
            payload.setDetails(details);
            auditTrailService.record(payload);
        } catch (Exception ex) {
            LOGGER.log(Level.FINE, "Failed to record stamp audit for action " + action, ex);
        }
    }

    private AuditEventPayload createBaseAuditPayload(String action, StampAuditContext context) {
        AuditEventPayload payload = new AuditEventPayload();
        String actorId = Optional.ofNullable(context.getRemoteUser()).orElse("system");
        payload.setActorId(actorId);
        payload.setActorDisplayName(resolveActorDisplayName(actorId));
        payload.setActorRole(context.getActorRole());
        payload.setAction(action);
        payload.setResource(defaultResourcePath(context));
        String resolvedTraceId = coalesce(context.getTraceId(), context.getRequestId());
        payload.setRequestId(resolvedTraceId);
        payload.setTraceId(resolvedTraceId);
        payload.setIpAddress(context.getIpAddress());
        payload.setUserAgent(context.getUserAgent());
        return payload;
    }

    private void enrichUserDetails(Map<String, Object> details, String remoteUser) {
        if (remoteUser == null || remoteUser.isEmpty()) {
            return;
        }
        details.put("remoteUser", remoteUser);
        int idx = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (idx > 0) {
            details.put("facilityId", remoteUser.substring(0, idx));
            if (idx + 1 < remoteUser.length()) {
                details.put("userId", remoteUser.substring(idx + 1));
            }
        }
    }

    private void addTraceDetails(Map<String, Object> details, StampAuditContext context) {
        if (context.getTraceId() != null && !context.getTraceId().isEmpty()) {
            details.put("traceId", context.getTraceId());
        }
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

    private String defaultResourcePath(StampAuditContext context) {
        return context.getRequestUri() != null ? context.getRequestUri() : "/stamp";
    }

    private String coalesce(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isEmpty()) {
                return value;
            }
        }
        return null;
    }

    /**
     * User個人及びサブスクライブしているTreeを取得する。
     * @param userPk userId(DB key)
     * @return User個人及びサブスクライブしているTreeのリスト
     */
    public StampTreeHolder getTrees(long userPK) {

        StampTreeHolder ret = new StampTreeHolder();

        //-----------------------------------
        // パーソナルツリーを取得する
        //-----------------------------------
        List<StampTreeModel> list = (List<StampTreeModel>)
                em.createQuery(QUERY_TREE_BY_USER_PK)
                  .setParameter(USER_PK, userPK)
                  .getResultList();

        // 新規ユーザの場合
        if (list.isEmpty()) {
            return ret;
        }

        // 最初の Tree を追加
        StampTreeModel st = (StampTreeModel)list.remove(0);
        ret.setPersonalTree(st);

        // まだある場合 BUG
        if (list.size() > 0) {
            // 後は delete する
            for (int i=0; i < list.size(); i++) {
                st = (StampTreeModel) list.remove(0);
                em.remove(st);
            }
        }

        //--------------------------------------------------
        // ユーザがサブスクライブしているStampTreeのリストを取得する
        //--------------------------------------------------
        List<SubscribedTreeModel> subscribed =
            (List<SubscribedTreeModel>)em.createQuery(QUERY_SUBSCRIBED_BY_USER_PK)
                                         .setParameter(USER_PK, userPK)
                                         .getResultList();

        HashMap tmp = new HashMap(5, 0.8f);

        for (SubscribedTreeModel sm : subscribed) {

            // BUG 重複をチェックする
            if (tmp.get(sm.getTreeId()) == null) {

                // まだ存在しない場合
                tmp.put(sm.getTreeId(), "A");

                try {
                    PublishedTreeModel published = (PublishedTreeModel)em.find(PublishedTreeModel.class, sm.getTreeId());

                    if (published != null) {
                        ret.addSubscribedTree(published);

                    } else {
                        em.remove(sm);
                    }

                } catch (NoResultException e) {
                    em.remove(sm);
                }

            } else {
                // 重複してインポートしている場合に削除する
                em.remove(sm);
            }
        }

        return ret;
    }

    // version
    public String updatePublishedTree(StampTreeHolder h) {

        StampTreeModel personal = (StampTreeModel) h.getPersonalTree();
        PublishedTreeModel published = (PublishedTreeModel) h.getSubscribedList().get(0);

        StampTreeModel saved = persistPersonalTree(personal);

        if (published.getId() == 0L) {
            published.setId(saved.getId());
            em.persist(published);
        } else {
            em.merge(published);
        }

        return saved.getVersionNumber();
    }

    /**
     * 公開したTreeを削除する。
     * @param id 削除するTreeのId
     * @return VersionNumber
     */
    public String cancelPublishedTree(StampTreeModel st) {

        StampTreeModel saved = persistPersonalTree(st);

        List<PublishedTreeModel> list = em.createQuery(QUERY_PUBLISHED_TREE_BY_ID)
                                          .setParameter(ID, saved.getId())
                                          .getResultList();
        for (PublishedTreeModel m : list) {
            em.remove(m);
        }

        return saved.getVersionNumber();
    }

    /**
     * 公開されているStampTreeのリストを取得する。
     * @return ローカル及びパブリックTreeのリスト
     */
    
    public List<PublishedTreeModel> getPublishedTrees(String fid) {
        return getFacilityPublishedTrees(fid);
    }

    public List<PublishedTreeModel> getFacilityPublishedTrees(String facilityId) {
        List<PublishedTreeModel> combined = new ArrayList<>();
        String normalized = facilityId != null ? facilityId.trim() : null;
        if (normalized != null && !normalized.isEmpty()) {
            combined.addAll(getSharedTrees(normalized));
        }
        combined.addAll(getPublicTrees());
        return combined;
    }

    public List<PublishedTreeModel> getPublicTrees() {
        List<PublishedTreeModel> publics = em.createQuery(QUERY_PUBLIC_TREE, PublishedTreeModel.class)
                .getResultList();
        return new ArrayList<>(publics);
    }

    public List<PublishedTreeModel> getSharedTrees(String facilityId) {
        String normalized = facilityId != null ? facilityId.trim() : null;
        if (normalized == null || normalized.isEmpty()) {
            return new ArrayList<>();
        }
        List<PublishedTreeModel> locals = em.createQuery(QUERY_LOCAL_PUBLISHED_TREE, PublishedTreeModel.class)
                .setParameter(FID, normalized)
                .getResultList();
        return new ArrayList<>(locals);
    }

    /**
     * 公開Treeにサブスクライブする。
     * @param addList サブスクライブする
     * @return
     */
    
    public List<Long> subscribeTrees(List<SubscribedTreeModel> addList) {

        List<Long> ret = new ArrayList<Long>();
        for (SubscribedTreeModel model : addList) {
            em.persist(model);
            ret.add(new Long(model.getId()));
        }
        return ret;
    }

    /**
     * 公開Treeにアンサブスクライブする。
     * @param ids アンサブスクライブするTreeのIdリスト
     * @return
     */
    
    public int unsubscribeTrees(List<Long> list) {

        int cnt = 0;

        int len = list.size();

        for (int i = 0; i < len; i+=2) {
            Long treeId = list.get(i);
            Long userPK = list.get(i+1);
            List<SubscribedTreeModel> removes = (List<SubscribedTreeModel>)
                    em.createQuery(QUERY_SUBSCRIBED_BY_USER_PK_TREE_ID)
                      .setParameter(USER_PK, userPK)
                      .setParameter(TREE_ID, treeId)
                      .getResultList();

            for (SubscribedTreeModel sm : removes) {
                em.remove(sm);
            }
            cnt++;
        }
        return cnt;
    }

    /**
     * Stampを保存する。
     * @param model StampModel
     * @return 保存件数
     */
    
    public List<String> putStamp(List<StampModel> list) {
        List<String> ret = new ArrayList<String>();
        for (StampModel model : list) {
            em.persist(model);
            ret.add(model.getId());
        }
        return ret;
    }

    /**
     * Stampを保存する。
     * @param model StampModel
     * @return 保存件数
     */
    
    public String putStamp(StampModel model) {
        //em.persist(model);
        em.merge(model);
        return model.getId();
    }

    /**
     * Stampを取得する。
     * @param stampId 取得する StampModel の id
     * @return StampModel
     */
    public StampModel getStamp(String stampId) {

        try {
            return (StampModel) em.find(StampModel.class, stampId);
        } catch (NoResultException e) {
        }

        return null;
    }

    /**
     * Stampを取得する。
     * @param stampId 取得する StampModel の id
     * @return StampModel
     */
    
    public List<StampModel> getStamp(List<String> ids) {

        List<StampModel> ret = new ArrayList<StampModel>();

        try {
            for (String stampId : ids) {
                StampModel test = (StampModel) em.find(StampModel.class, stampId);
                ret.add(test);
            }
        } catch (Exception e) {
        }

        return ret;
    }

    /**
     * Stampを削除する。
     * @param stampId 削除する StampModel の id
     * @return 削除件数
     */
    
    public int removeStamp(String stampId) {
        StampModel exist = (StampModel) em.find(StampModel.class, stampId);
        em.remove(exist);
        return 1;
    }

    /**
     * Stampを削除する。
     * @param stampId 削除する StampModel の id List
     * @return 削除件数
     */
    
    public int removeStamp(List<String> ids) {
        int cnt =0;
        for (String stampId : ids) {
            StampModel exist = (StampModel) em.find(StampModel.class, stampId);
            em.remove(exist);
            cnt++;
        }
        return cnt;
    }
}
