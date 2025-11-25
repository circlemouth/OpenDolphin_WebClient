package open.dolphin.session;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.msg.MMLSender;
import open.dolphin.msg.dto.MmlDispatchResult;
import open.dolphin.session.framework.SessionOperation;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Session-layer façade for {@link MMLSender}. Generates an MML payload from a
 * {@link DocumentModel}, surfaces summary metadata, and propagates trace IDs so
 * that REST/API layers can correlate CLI test runs with server logs.
 */
@Named
@ApplicationScoped
@Transactional(Transactional.TxType.SUPPORTS)
@SessionOperation
public class MmlSenderBean {

    private static final Logger LOGGER = LoggerFactory.getLogger(MmlSenderBean.class);
    private static final Charset SHIFT_JIS = Charset.forName("Shift_JIS");
    private static final int PREVIEW_LIMIT = 512;

    @Inject
    private SessionTraceManager traceManager;

    public MmlDispatchResult send(DocumentModel document) {
        DocumentModel target = Objects.requireNonNull(document, "document must not be null");
        DocInfoModel docInfo = Objects.requireNonNull(target.getDocInfoModel(), "docInfo must not be null");
        List<ModuleModel> modules = target.getModules();
        if (modules == null || modules.isEmpty()) {
            throw new IllegalArgumentException("At least one ModuleModel is required to build MML");
        }

        try {
            MMLSender sender = new MMLSender();
            String payload = sender.send(target);
            byte[] payloadBytes = payload.getBytes(SHIFT_JIS);
            return new MmlDispatchResult(
                    currentTraceId(),
                    docInfo.getDocId(),
                    target.getId(),
                    docInfo.isSendMml(),
                    docInfo.isSendClaim(),
                    docInfo.isSendLabtest(),
                    resolvePatientId(docInfo, target),
                    modules.size(),
                    safeSize(target.getSchema()),
                    safeSize(target.getAttachment()),
                    payload.length(),
                    payloadBytes.length,
                    SHIFT_JIS.name(),
                    hexDigest(payloadBytes),
                    preview(payload),
                    payload
            );
        } catch (Exception ex) {
            LOGGER.error("Failed to build MML payload for docId={} pk={}", docInfo.getDocId(), target.getId(), ex);
            throw new IllegalStateException("MML send failed: " + ex.getMessage(), ex);
        }
    }

    private String resolvePatientId(DocInfoModel docInfo, DocumentModel document) {
        if (docInfo.getPatientId() != null && !docInfo.getPatientId().isBlank()) {
            return docInfo.getPatientId();
        }
        if (document.getKarteBean() != null
                && document.getKarteBean().getPatientModel() != null) {
            return document.getKarteBean().getPatientModel().getPatientId();
        }
        return null;
    }

    private int safeSize(List<?> items) {
        return items == null ? 0 : items.size();
    }

    private String preview(String payload) {
        if (payload == null) {
            return null;
        }
        return payload.length() <= PREVIEW_LIMIT ? payload : payload.substring(0, PREVIEW_LIMIT);
    }

    private String hexDigest(byte[] payloadBytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payloadBytes);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 digest unavailable", e);
        }
    }

    private String currentTraceId() {
        SessionTraceContext context = traceManager != null ? traceManager.current() : null;
        return context != null ? context.getTraceId() : null;
    }
}
