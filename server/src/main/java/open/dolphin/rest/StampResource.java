package open.dolphin.rest;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import open.dolphin.converter.PublishedTreeListConverter;
import open.dolphin.converter.StampListConverter;
import open.dolphin.converter.StampModelConverter;
import open.dolphin.converter.StampTreeHolderConverter;
import open.dolphin.infomodel.*;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.StampServiceBean;
import open.dolphin.session.audit.StampAuditContext;
import open.dolphin.session.audit.StampAuditContextHolder;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;

/**
 * REST Web Service
 *
 * @author kazushi Minagawa, Digital Globe, Inc.
 */
@Path("/stamp")
public class StampResource extends AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(StampResource.class.getName());

    @Inject
    private StampServiceBean stampServiceBean;

    @Inject
    private AuditTrailService auditTrailService;

    @Context
    private HttpServletRequest httpServletRequest;

    private final ObjectMapper stampTreeMapper;

    /** Creates a new instance of StampResource */
    public StampResource() {
        stampTreeMapper = new ObjectMapper();
        stampTreeMapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    private StampTreeModel deserializeStampTree(String json) throws IOException {
        StampTreeModel model = stampTreeMapper.readValue(json, StampTreeModel.class);
        ensureTreeBytes(model);
        return model;
    }

    private void ensureTreeBytes(StampTreeModel model) {
        if (model == null) {
            return;
        }
        if ((model.getTreeBytes() == null || model.getTreeBytes().length == 0) && model.getTreeXml() != null) {
            model.setTreeBytes(model.getTreeXml().getBytes(StandardCharsets.UTF_8));
        }
    }

    private <T> T executeWithStampAuditContext(String action, StampOperation<T> operation) {
        StampAuditContextHolder.set(buildAuditContext(action));
        try {
            return operation.execute();
        } finally {
            StampAuditContextHolder.clear();
        }
    }

    private StampAuditContext buildAuditContext(String action) {
        StampAuditContext context = new StampAuditContext();
        context.setAction(action);
        context.setTraceId(resolveTraceId(httpServletRequest));
        context.setRequestId(resolveRequestId());
        context.setRemoteUser(resolveRemoteUser());
        if (httpServletRequest != null && httpServletRequest.isUserInRole("ADMIN")) {
            context.setActorRole("ADMIN");
        }
        context.setRequestUri(resolveResourcePath());
        context.setIpAddress(resolveIpAddress());
        context.setUserAgent(resolveUserAgent());
        return context;
    }

    private void logStampTreeFailure(String action, StampTreeModel model, RuntimeException e) {
        String traceId = resolveTraceId(httpServletRequest);
        Long userPk = (model != null && model.getUserModel() != null) ? model.getUserModel().getId() : null;
        LOGGER.log(Level.WARNING, formatStampTreeFailureMessage(action, traceId, userPk, model), e);
    }

    private String formatStampTreeFailureMessage(String action, String traceId, Long userPk, StampTreeModel model) {
        return String.format("Stamp tree %s failed [traceId=%s, userPk=%s, version=%s]",
                action,
                traceId,
                userPk,
                model != null ? model.getVersionNumber() : null);
    }

    @FunctionalInterface
    private interface StampOperation<T> {
        T execute();
    }

    private void recordStampTreeReadAudit(String action, String facilityId, String visibility, List<PublishedTreeModel> models) {
        if (auditTrailService == null) {
            return;
        }
        try {
            AuditEventPayload payload = createBaseAuditPayload(action);
            Map<String, Object> details = new HashMap<>();
            details.put("facilityId", facilityId);
            details.put("visibility", visibility);
            details.put("resultCount", models != null ? models.size() : 0);
            enrichUserDetails(details);
            enrichTraceDetails(details);
            payload.setDetails(details);
            auditTrailService.record(payload);
        } catch (Exception ex) {
            LOGGER.log(Level.FINE, "Failed to write stamp tree read audit for action " + action, ex);
        }
    }

    private List<PublishedTreeModel> fetchPublishedTrees(StampTreeVisibility visibility, String facilityId) {
        List<PublishedTreeModel> result;
        switch (visibility) {
            case PUBLIC:
                result = stampServiceBean.getPublicTrees();
                break;
            case SHARED:
                result = stampServiceBean.getSharedTrees(facilityId);
                break;
            case PUBLISHED:
            default:
                result = stampServiceBean.getFacilityPublishedTrees(facilityId);
                break;
        }
        return result != null ? result : Collections.emptyList();
    }

    private PublishedTreeListConverter toPublishedTreeResponse(List<PublishedTreeModel> models) {
        PublishedTreeList list = new PublishedTreeList();
        list.setList(models != null ? models : Collections.emptyList());
        PublishedTreeListConverter conv = new PublishedTreeListConverter();
        conv.setModel(list);
        return conv;
    }

    private String validateFacilityAccess(String requestedFacility, StampTreeVisibility visibility) {
        String normalized = requestedFacility != null ? requestedFacility.trim() : null;
        String visibilitySegment = visibility.getSegment();
        if (normalized == null || normalized.isEmpty()) {
            throw invalidFacilityError("Facility identifier must not be empty", normalized, visibilitySegment);
        }
        String remoteUser = resolveRemoteUser();
        if (remoteUser == null || remoteUser.isEmpty()) {
            logAccessWarning("remote_user_missing", normalized, visibilitySegment, null);
            throw unauthorizedFacilityError("Remote user is not authenticated", normalized, visibilitySegment);
        }
        boolean admin = httpServletRequest != null && httpServletRequest.isUserInRole("ADMIN");
        if (!admin) {
            String facilityOfUser = getRemoteFacility(remoteUser);
            if (facilityOfUser == null || facilityOfUser.isEmpty()) {
                logAccessWarning("user_facility_missing", normalized, visibilitySegment, remoteUser);
                throw unauthorizedFacilityError("Authenticated user is not associated with a facility", normalized, visibilitySegment);
            }
            if (!facilityOfUser.equals(normalized)) {
                logAccessWarning("facility_mismatch", normalized, visibilitySegment, remoteUser);
                throw forbiddenFacilityError("Requested facility does not match authenticated facility", normalized, visibilitySegment);
            }
        }
        return normalized;
    }

    private void logAccessWarning(String reason, String facilityId, String visibility, String remoteUser) {
        LOGGER.log(Level.WARNING,
                "Stamp tree access blocked [traceId={0}, reason={1}, facilityId={2}, visibility={3}, remoteUser={4}]",
                new Object[]{resolveTraceId(httpServletRequest), reason, facilityId, visibility, remoteUser});
    }

    private WebApplicationException badVisibilityError(String visibility) {
        String value = visibility == null ? "" : visibility;
        return buildErrorResponse(Response.Status.BAD_REQUEST, "bad_visibility",
                "Unsupported visibility: " + value, null, value);
    }

    private WebApplicationException invalidFacilityError(String message, String facilityId, String visibility) {
        return buildErrorResponse(Response.Status.BAD_REQUEST, "invalid_facility", message, facilityId, visibility);
    }

    private WebApplicationException unauthorizedFacilityError(String message, String facilityId, String visibility) {
        return buildErrorResponse(Response.Status.UNAUTHORIZED, "unauthorized", message, facilityId, visibility);
    }

    private WebApplicationException forbiddenFacilityError(String message, String facilityId, String visibility) {
        return buildErrorResponse(Response.Status.FORBIDDEN, "forbidden", message, facilityId, visibility);
    }

    private WebApplicationException buildErrorResponse(Response.Status status, String errorCode, String message,
            String facilityId, String visibility) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", errorCode);
        body.put("message", message);
        body.put("status", status.getStatusCode());
        String traceId = resolveTraceId(httpServletRequest);
        if (traceId != null && !traceId.isEmpty()) {
            body.put("traceId", traceId);
        }
        body.put("path", resolveResourcePath());
        if (facilityId != null && !facilityId.isEmpty()) {
            body.put("facilityId", facilityId);
        }
        if (visibility != null && !visibility.isEmpty()) {
            body.put("visibility", visibility);
        }
        Response response = Response.status(status)
                .entity(body)
                .type(MediaType.APPLICATION_JSON)
                .build();
        return new WebApplicationException(response);
    }

    private void recordStampDeletionAudit(String action, List<String> targetIds, String outcome, Integer affected, String reason) {
        if (auditTrailService == null) {
            return;
        }
        try {
            AuditEventPayload payload = createBaseAuditPayload(action);
            Map<String, Object> details = new HashMap<>();
            details.put("outcome", outcome);
            details.put("targets", targetIds);
            if (affected != null) {
                details.put("affectedCount", affected);
            }
            if (reason != null) {
                details.put("reason", reason);
            }
            enrichUserDetails(details);
            enrichTraceDetails(details);
            payload.setDetails(details);
            auditTrailService.record(payload);
        } catch (Exception ex) {
            LOGGER.log(Level.FINE, "Failed to write stamp deletion audit for action " + action, ex);
        }
    }

    private AuditEventPayload createBaseAuditPayload(String action) {
        AuditEventPayload payload = new AuditEventPayload();
        String actorId = resolveActorId();
        payload.setActorId(actorId);
        payload.setActorDisplayName(resolveActorDisplayName(actorId));
        if (httpServletRequest != null && httpServletRequest.isUserInRole("ADMIN")) {
            payload.setActorRole("ADMIN");
        }
        payload.setAction(action);
        payload.setResource(resolveResourcePath());
        payload.setRequestId(resolveRequestId());
        payload.setIpAddress(resolveIpAddress());
        payload.setUserAgent(resolveUserAgent());
        return payload;
    }

    private void enrichUserDetails(Map<String, Object> details) {
        String remoteUser = resolveRemoteUser();
        if (remoteUser == null) {
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

    private void enrichTraceDetails(Map<String, Object> details) {
        String traceId = resolveTraceId(httpServletRequest);
        if (traceId != null && !traceId.isEmpty()) {
            details.put("traceId", traceId);
        }
    }

    private String resolveActorId() {
        return Optional.ofNullable(resolveRemoteUser()).orElse("system");
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

    private String resolveResourcePath() {
        return httpServletRequest != null ? httpServletRequest.getRequestURI() : "/stamp";
    }

    private String resolveRequestId() {
        if (httpServletRequest == null) {
            return UUID.randomUUID().toString();
        }
        String header = httpServletRequest.getHeader("X-Request-Id");
        if (header != null && !header.isEmpty()) {
            return header;
        }
        return UUID.randomUUID().toString();
    }

    private String resolveIpAddress() {
        return httpServletRequest != null ? httpServletRequest.getRemoteAddr() : null;
    }

    private String resolveUserAgent() {
        return httpServletRequest != null ? httpServletRequest.getHeader("User-Agent") : null;
    }

    private String resolveRemoteUser() {
        return httpServletRequest != null ? httpServletRequest.getRemoteUser() : null;
    }
    
    //----------------------------------------------------------------------
    
    @GET
    @Path("/tree/{userPK}")
    @Produces(MediaType.APPLICATION_JSON)
    public StampTreeHolderConverter getStampTree(@PathParam("userPK") String userPK) {

        // IStampTreeModel=interface
        StampTreeHolder result = stampServiceBean.getTrees(Long.parseLong(userPK));
        
        // Converter
        StampTreeHolderConverter conv = new StampTreeHolderConverter();
        conv.setModel(result);

        return conv;
    }

    @GET
    @Path("/tree/{facility}/{visibility}")
    @Produces(MediaType.APPLICATION_JSON)
    public PublishedTreeListConverter getFacilityStampTrees(@PathParam("facility") String facility,
            @PathParam("visibility") String visibility) {

        StampTreeVisibility resolvedVisibility = StampTreeVisibility.from(visibility);
        if (resolvedVisibility == null) {
            LOGGER.log(Level.WARNING, "Unsupported stamp tree visibility {0} [traceId={1}]",
                    new Object[]{visibility, resolveTraceId(httpServletRequest)});
            throw badVisibilityError(visibility);
        }

        return executeWithStampAuditContext(resolvedVisibility.getAuditAction(), () -> {
            String normalizedFacility = validateFacilityAccess(facility, resolvedVisibility);
            List<PublishedTreeModel> models = fetchPublishedTrees(resolvedVisibility, normalizedFacility);
            PublishedTreeListConverter converter = toPublishedTreeResponse(models);
            recordStampTreeReadAudit(resolvedVisibility.getAuditAction(), normalizedFacility,
                    resolvedVisibility.getSegment(), models);
            return converter;
        });
    }

    @PUT
    @Path("/tree")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putTree(String json) throws IOException {
        StampTreeModel model = deserializeStampTree(json);
        try {
            return executeWithStampAuditContext("STAMP_TREE_PUT", () -> {
                long pk = stampServiceBean.putTree(model);
                String pkStr = String.valueOf(pk);
                debug(pkStr);
                return pkStr;
            });
        } catch (RuntimeException e) {
            logStampTreeFailure("STAMP_TREE_PUT", model, e);
            throw e;
        }
    }
    
    @PUT
    @Path("/tree/sync")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String syncTree(String json) throws IOException {
        StampTreeModel model = deserializeStampTree(json);
        try {
            return executeWithStampAuditContext("STAMP_TREE_SYNC", () -> {
                String pkAndVersion = stampServiceBean.syncTree(model);
                debug(pkAndVersion);
                return pkAndVersion;
            });
        } catch (RuntimeException e) {
            logStampTreeFailure("STAMP_TREE_SYNC", model, e);
            throw e;
        }
    }
    
    @PUT
    @Path("/tree/forcesync")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public void forceSyncTree(String json) throws IOException {
        StampTreeModel model = deserializeStampTree(json);
        try {
            executeWithStampAuditContext("STAMP_TREE_FORCE_SYNC", () -> {
                stampServiceBean.forceSyncTree(model);
                return Boolean.TRUE;
            });
        } catch (RuntimeException e) {
            logStampTreeFailure("STAMP_TREE_FORCE_SYNC", model, e);
            throw e;
        }
    }

    //------------------------------------------------------------------
//    @POST
//    @Path("/published/tree")
//    @Consumes(MediaType.APPLICATION_JSON)
//    @Produces(MediaType.TEXT_PLAIN)
//    public String postPublishedTree(String json) throws IOException {
//
//        ObjectMapper mapper = new ObjectMapper();
//        StampTreeHolder h = mapper.readValue(json, StampTreeHolder.class);
//
//        long pk = stampServiceBean.saveAndPublishTree(h);
//        String pkStr = String.valueOf(pk);
//        debug(pkStr);
//
//        return pkStr;
//    }

    @PUT
    @Path("/published/tree")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putPublishedTree(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampTreeHolder h = mapper.readValue(json, StampTreeHolder.class);

        String version = stampServiceBean.updatePublishedTree(h);
        debug(version);

        return version;
    }

    @PUT
    @Path("/published/cancel")
    @Consumes(MediaType.APPLICATION_JSON)
    public String cancelPublishedTree(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampTreeModel model = mapper.readValue(json, StampTreeModel.class);
        
        String version = stampServiceBean.cancelPublishedTree(model);
        debug(version);
        
        return version;
    }

    @GET
    @Path("/published/tree")
    @Produces(MediaType.APPLICATION_JSON)
    public PublishedTreeListConverter getPublishedTrees(@Context HttpServletRequest servletReq) {
        
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        List<PublishedTreeModel> result = stampServiceBean.getPublishedTrees(fid);
        PublishedTreeList list = new PublishedTreeList();
        list.setList(result);
        
        PublishedTreeListConverter conv = new PublishedTreeListConverter();
        conv.setModel(list);
        return conv;
    }

    //---------------------------------------------------------------
    @PUT
    @Path("/subscribed/tree")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String subscribeTrees(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        SubscribedTreeList list = mapper.readValue(json, SubscribedTreeList.class);
        
        List<Long> result = stampServiceBean.subscribeTrees(list.getList());

        StringBuilder sb = new StringBuilder();
        for (Long l : result) {
            sb.append(String.valueOf(l));
            sb.append(CAMMA);
        }
        String pks = sb.substring(0, sb.length()-1);
        debug(pks);

        return pks;
    }

    @DELETE
    @Path("/subscribed/tree/{idPks}")
    public void unsubscribeTrees(@PathParam("idPks") String idPks) {

        String[] params = idPks.split(CAMMA);
        List<Long> list = new ArrayList<Long>();
        for (String s : params) {
            list.add(Long.parseLong(s));
        }

        int cnt = stampServiceBean.unsubscribeTrees(list);
        
        String cntStr = String.valueOf(cnt);
        debug(cntStr);
    }
    
    //----------------------------------------------------------------------

    @GET
    @Path("/id/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public StampModelConverter getStamp(@PathParam("param") String param) {
        StampModel stamp = stampServiceBean.getStamp(param);
        StampModelConverter conv = new StampModelConverter();
        conv.setModel(stamp);
        return conv;
    }
    
    @GET
    @Path("/list/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public StampListConverter getStamps(@PathParam("param") String param) {
        
        String[] params = param.split(CAMMA);
        List<String> list = new ArrayList<String>();
        list.addAll(Arrays.asList(params));

        List<StampModel> result = stampServiceBean.getStamp(list);
        
        StampList list2 = new StampList();
        list2.setList(result);
        
        StampListConverter conv = new StampListConverter();
        conv.setModel(list2);

        return conv;
    }

    @PUT
    @Path("/id")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putStamp(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampModel model = mapper.readValue(json, StampModel.class);

        String ret = stampServiceBean.putStamp(model);
        debug(ret);

        return ret;
    }

    @PUT
    @Path("/list")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putStamps(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampList list = mapper.readValue(json, StampList.class);

        List<String> ret = stampServiceBean.putStamp(list.getList());

        StringBuilder sb = new StringBuilder();
        for (String str : ret) {
            sb.append(str);
            sb.append(",");
        }

        String retText = sb.substring(0, sb.length()-1);
        debug(retText);

        return retText;
    }


    @DELETE
    @Path("/id/{param}")
    public void deleteStamp(@PathParam("param") String param) {

        List<String> targetIds = Collections.singletonList(param);
        StampModel existing = stampServiceBean.getStamp(param);
        if (existing == null) {
            recordStampDeletionAudit("STAMP_DELETE_SINGLE", targetIds, "failed", null, "stamp_not_found");
            throw new NotFoundException("Stamp not found: " + param);
        }

        try {
            int cnt = stampServiceBean.removeStamp(param);
            recordStampDeletionAudit("STAMP_DELETE_SINGLE", targetIds, "success", cnt, null);
            debug(String.valueOf(cnt));
        } catch (RuntimeException e) {
            recordStampDeletionAudit("STAMP_DELETE_SINGLE", targetIds, "failed", null, e.getClass().getSimpleName());
            throw e;
        }
    }
    

    @DELETE
    @Path("/list/{param}")
    public void deleteStamps(@PathParam("param") String param) {

        String[] params = param.split(CAMMA);
        List<String> list = new ArrayList<String>();
        list.addAll(Arrays.asList(params));

        List<StampModel> resolved = stampServiceBean.getStamp(list);
        List<String> missing = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            StampModel model = (resolved != null && resolved.size() > i) ? resolved.get(i) : null;
            if (model == null) {
                missing.add(list.get(i));
            }
        }
        if (!missing.isEmpty()) {
            recordStampDeletionAudit("STAMP_DELETE_BULK", list, "failed", null, "stamp_not_found:" + missing);
            throw new NotFoundException("Stamps not found: " + missing);
        }

        try {
            int cnt = stampServiceBean.removeStamp(list);
            recordStampDeletionAudit("STAMP_DELETE_BULK", list, "success", cnt, null);
            debug(String.valueOf(cnt));
        } catch (RuntimeException e) {
            recordStampDeletionAudit("STAMP_DELETE_BULK", list, "failed", null, e.getClass().getSimpleName());
            throw e;
        }
    }

    private enum StampTreeVisibility {
        PUBLIC("public", "STAMP_TREE_PUBLIC_GET"),
        SHARED("shared", "STAMP_TREE_SHARED_GET"),
        PUBLISHED("published", "STAMP_TREE_PUBLISHED_GET");

        private final String segment;
        private final String auditAction;

        StampTreeVisibility(String segment, String auditAction) {
            this.segment = segment;
            this.auditAction = auditAction;
        }

        String getSegment() {
            return segment;
        }

        String getAuditAction() {
            return auditAction;
        }

        static StampTreeVisibility from(String rawVisibility) {
            if (rawVisibility == null) {
                return null;
            }
            String normalized = rawVisibility.trim().toLowerCase(Locale.ROOT);
            for (StampTreeVisibility candidate : values()) {
                if (candidate.segment.equals(normalized)) {
                    return candidate;
                }
            }
            return null;
        }
    }
}
