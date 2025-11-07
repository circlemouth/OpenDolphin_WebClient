package open.dolphin.rest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.converter.PublishedTreeListConverter;
import open.dolphin.converter.StampListConverter;
import open.dolphin.converter.StampModelConverter;
import open.dolphin.converter.StampTreeHolderConverter;
import open.dolphin.infomodel.*;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.StampServiceBean;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * REST Web Service
 *
 * @author kazushi Minagawa, Digital Globe, Inc.
 */
@Path("/stamp")
public class StampResource extends AbstractResource {

    @Inject
    private StampServiceBean stampServiceBean;

    @Inject
    private AuditTrailService auditTrailService;

    @Inject
    private SessionTraceManager sessionTraceManager;

    @Context
    private HttpServletRequest httpServletRequest;

    /** Creates a new instance of StampResource */
    public StampResource() {
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

    @PUT
    @Path("/tree")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putTree(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampTreeModel model = mapper.readValue(json, StampTreeModel.class);

        long pk = stampServiceBean.putTree(model);
        String pkStr = String.valueOf(pk);
        debug(pkStr);

        return pkStr;
    }
    
    @PUT
    @Path("/tree/sync")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String syncTree(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampTreeModel model = mapper.readValue(json, StampTreeModel.class);

        String pkAndVersion = stampServiceBean.syncTree(model);
        debug(pkAndVersion);

        return pkAndVersion;
    }
    
    @PUT
    @Path("/tree/forcesync")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public void forceSyncTree(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StampTreeModel model = mapper.readValue(json, StampTreeModel.class);

        stampServiceBean.forceSyncTree(model);
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
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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

        List<String> targetIds = List.of(param);
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
            recordStampDeletionAudit("STAMP_DELETE_BULK", list, "failed", null,
                    "missing_ids:" + String.join(CAMMA, missing));
            throw new NotFoundException("Missing stamp ids: " + String.join(CAMMA, missing));
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

    private void recordStampDeletionAudit(String action, List<String> ids, String status, Integer deletedCount, String reason) {
        if (auditTrailService == null) {
            return;
        }
        AuditEventPayload payload = createBaseAuditPayload(action);
        Map<String, Object> details = new HashMap<>();
        details.put("stampIds", List.copyOf(ids));
        details.put("status", status);
        if (deletedCount != null) {
            details.put("deletedCount", deletedCount);
        }
        if (reason != null) {
            details.put("reason", reason);
        }
        enrichUserDetails(details);
        enrichTraceDetails(details);
        payload.setDetails(details);
        auditTrailService.record(payload);
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
        if (remoteUser != null) {
            details.put("remoteUser", remoteUser);
            int idx = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
            if (idx > 0) {
                details.put("facilityId", remoteUser.substring(0, idx));
                if (idx + 1 < remoteUser.length()) {
                    details.put("userId", remoteUser.substring(idx + 1));
                }
            }
        }
    }

    private void enrichTraceDetails(Map<String, Object> details) {
        if (sessionTraceManager == null) {
            return;
        }
        SessionTraceContext context = sessionTraceManager.current();
        if (context != null) {
            details.put("traceId", context.getTraceId());
            details.put("sessionOperation", context.getOperation());
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
        return Optional.ofNullable(httpServletRequest.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString());
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
}
