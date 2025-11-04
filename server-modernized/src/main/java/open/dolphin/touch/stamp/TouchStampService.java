package open.dolphin.touch.stamp;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import open.dolphin.converter.StampModelConverter;
import open.dolphin.converter.StampTreeHolderConverter;
import open.dolphin.infomodel.StampModel;
import open.dolphin.infomodel.StampTreeHolder;
import open.dolphin.session.StampServiceBean;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchErrorMapper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.support.TouchResponseCache;

/**
 * Touch スタンプ系 API の業務ロジック。
 */
@ApplicationScoped
public class TouchStampService {

    private static final String ACTION_STAMP_FETCH = "TOUCH_STAMP_FETCH";
    private static final String ACTION_STAMP_TREE_FETCH = "TOUCH_STAMP_TREE_FETCH";

    @Inject
    StampServiceBean stampServiceBean;

    @Inject
    TouchResponseCache responseCache;

    @Inject
    TouchAuditHelper auditHelper;

    public StampModelConverter getStamp(TouchRequestContext context, String stampId) {
        requireAccessReason(context);
        StampModelConverter converter = responseCache.computeIfAbsent(cacheKey("stamp", stampId), () -> {
            StampModel stamp = stampServiceBean.getStamp(stampId);
            if (stamp == null) {
                throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.NOT_FOUND,
                        "stamp_not_found", "スタンプが見つかりません。", context.traceId());
            }
            StampModelConverter conv = new StampModelConverter();
            conv.setModel(stamp);
            return conv;
        });
        Map<String, Object> details = new HashMap<>();
        details.put("stampId", stampId);
        auditHelper.record(context, ACTION_STAMP_FETCH,
                "/touch/stamp/" + stampId,
                details);
        return converter;
    }

    public StampTreeHolderConverter getStampTree(TouchRequestContext context, long userPk) {
        requireAccessReason(context);
        StampTreeHolderConverter converter = responseCache.computeIfAbsent(cacheKey("stampTree", String.valueOf(userPk)), () -> {
            StampTreeHolder holder = stampServiceBean.getTrees(userPk);
            if (holder == null) {
                throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.NOT_FOUND,
                        "stamp_tree_not_found", "スタンプツリーが見つかりません。", context.traceId());
            }
            StampTreeHolderConverter conv = new StampTreeHolderConverter();
            conv.setModel(holder);
            return conv;
        });
        auditHelper.record(context, ACTION_STAMP_TREE_FETCH,
                "/touch/stampTree/" + userPk,
                Map.of("userPk", userPk));
        return converter;
    }

    private void requireAccessReason(TouchRequestContext context) {
        if (context.accessReason() == null) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.FORBIDDEN,
                    "access_reason_required", "アクセス理由ヘッダーが必要です。", context.traceId());
        }
    }

    private String cacheKey(String type, String identifier) {
        return type + ":" + identifier;
    }
}

