package open.dolphin.rest;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.io.IOException;
import java.util.Arrays;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Properties;
import open.dolphin.infomodel.ActivityModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.RoleModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.AccountSummary;
import open.dolphin.session.SystemServiceBean;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.system.license.LicenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * REST Web Service
 *
 * @author kazushi
 */
@Path("/dolphin")
public class SystemResource extends AbstractResource {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(SystemResource.class);

    @Inject
    private SystemServiceBean systemServiceBean;

    @Inject
    private AuditTrailService auditTrailService;

    @Inject
    private SessionTraceManager sessionTraceManager;

    @Context
    private HttpServletRequest httpServletRequest;

    @Inject
    private LicenseRepository licenseRepository;

    /** Creates a new instance of SystemResource */
    public SystemResource() {
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hellowDolphin() {
        return "Hellow, Dolphin";
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String addFacilityAdmin(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        UserModel user = mapper.readValue(json, UserModel.class);

        // 関係を構築する
        List<RoleModel> roles = user.getRoles();
        if (roles != null) {
            for (RoleModel role : roles) {
                role.setUserModel(user);
                role.setUserId(user.getUserId());
            }
        }

        try {
            AccountSummary summary = systemServiceBean.addFacilityAdmin(user);
            String ret = summary.getFacilityId() + ":" + summary.getUserId();

            Map<String, Object> details = new HashMap<>();
            details.put("status", "success");
            details.put("facilityId", summary.getFacilityId());
            details.put("createdUserId", summary.getUserId());
            recordAudit("SYSTEM_FACILITY_ADMIN_ADD", details);

            return ret;
        } catch (RuntimeException ex) {
            Map<String, Object> details = new HashMap<>();
            details.put("status", "failed");
            details.put("reason", ex.getClass().getSimpleName());
            details.put("createdUserId", user.getUserId());
            recordAudit("SYSTEM_FACILITY_ADMIN_ADD", details);
            throw ex;
        }
    }
    
    @GET
    @Path("/activity/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<ActivityModel> getActivities(@PathParam("param") String param) {
        
        if (param == null || param.isBlank()) {
            recordAudit("SYSTEM_ACTIVITY_SUMMARY", failureDetails("invalid_parameter", Map.of("rawParam", param)));
            throw new BadRequestException("param must not be empty");
        }

        String[] params = param.split(CAMMA);
        if (params.length < 3) {
            recordAudit("SYSTEM_ACTIVITY_SUMMARY", failureDetails("invalid_parameter", Map.of("rawParam", param)));
            throw new BadRequestException("param must contain year, month, count");
        }

        int requestedYear;
        int requestedMonth;
        int monthsRequested;
        try {
            requestedYear = Integer.parseInt(params[0]);
            requestedMonth = Integer.parseInt(params[1]);
            monthsRequested = Integer.parseInt(params[2]);
        } catch (NumberFormatException ex) {
            recordAudit("SYSTEM_ACTIVITY_SUMMARY", failureDetails("invalid_parameter", Map.of("rawParam", param)));
            throw new BadRequestException("param must be numeric", ex);
        }

        if (monthsRequested < 1) {
            recordAudit("SYSTEM_ACTIVITY_SUMMARY", failureDetails("invalid_parameter", Map.of("monthsRequested", monthsRequested)));
            throw new BadRequestException("count must be >= 1");
        }

        String remoteUser = resolveRemoteUser();
        if (remoteUser == null) {
            recordAudit("SYSTEM_ACTIVITY_SUMMARY", failureDetails("anonymous_user", Map.of()));
            throw new NotAuthorizedException("Remote user not available");
        }

        String fid = getRemoteFacility(remoteUser);

        ActivityModel[] array = new ActivityModel[monthsRequested + 1]; // +1=total

        int year = requestedYear;
        int month = requestedMonth;

        // ex month=5,past=-3 -> 3,4,5
        GregorianCalendar gcFirst = new GregorianCalendar(year, month, 1);
        int numDays = gcFirst.getActualMaximum(Calendar.DAY_OF_MONTH);
        
        int index = array.length-2;
        while (true) {
            GregorianCalendar gcLast = new GregorianCalendar(year, month, numDays, 23,59,59);
            ActivityModel am = systemServiceBean.countActivities(fid, gcFirst.getTime(), gcLast.getTime());
            array[index]=am;
            
            index--;
            if (index < 0) {
                break;
            }
            gcFirst.add(Calendar.MONTH, -1);
            year = gcFirst.get(Calendar.YEAR);
            month = gcFirst.get(Calendar.MONTH);
            numDays = gcFirst.getActualMaximum(Calendar.DAY_OF_MONTH);
        }
        
        // 総数
        ActivityModel am = systemServiceBean.countTotalActivities(fid);
        array[array.length-1] = am;

        Map<String, Object> details = new HashMap<>();
        details.put("status", "success");
        details.put("facilityId", fid);
        details.put("startYear", requestedYear);
        details.put("startMonth", requestedMonth);
        details.put("monthsRequested", monthsRequested);
        recordAudit("SYSTEM_ACTIVITY_SUMMARY", details);

        return Arrays.asList(array);
    }
    
//s.oh^ 2014/07/08 クラウド0対応
    @POST
    @Path("/license")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    public String checkLicense(String uid) {
        
        Map<String, Object> base = new HashMap<>();
        base.put("uid", uid);

        Properties config;
        try {
            config = licenseRepository.load();
        } catch (IOException ex) {
            LOGGER.warn("ライセンスファイル読込エラー", ex);
            Map<String, Object> details = new HashMap<>(base);
            details.put("status", "failed");
            details.put("reason", "read_error");
            recordAudit("SYSTEM_LICENSE_CHECK", details);
            return "2";
        }
        
        int max;
        try {
            max = Integer.parseInt(config.getProperty("license.max", "3"));
        } catch (NumberFormatException ex) {
            max = 3;
        }

        for (int i = 0; i < max; i++) {
            String key = "license.uid" + (i + 1);
            String val = config.getProperty(key);
            if (val == null) {
                config.setProperty(key, uid);
                try {
                    licenseRepository.store(config);
                } catch (IOException ex) {
                    LOGGER.warn("ライセンスファイル保存エラー", ex);
                    Map<String, Object> details = new HashMap<>(base);
                    details.put("status", "failed");
                    details.put("reason", "write_error");
                    details.put("slot", i + 1);
                    recordAudit("SYSTEM_LICENSE_CHECK", details);
                    return "3";
                }
                LOGGER.info("ライセンス新規登録: {}", uid);
                Map<String, Object> details = new HashMap<>(base);
                details.put("status", "success");
                details.put("actionType", "registered");
                details.put("slot", i + 1);
                recordAudit("SYSTEM_LICENSE_CHECK", details);
                return "0";
            } else if (val.equals(uid)) {
                LOGGER.info("ライセンス登録済: {}", uid);
                Map<String, Object> details = new HashMap<>(base);
                details.put("status", "success");
                details.put("actionType", "already_registered");
                details.put("slot", i + 1);
                recordAudit("SYSTEM_LICENSE_CHECK", details);
                return "0";
            }
        }
        
        LOGGER.warn("ライセンス認証の制限数を超えました");
        Map<String, Object> details = new HashMap<>(base);
        details.put("status", "failed");
        details.put("reason", "limit_exceeded");
        recordAudit("SYSTEM_LICENSE_CHECK", details);
        return "4";
    }
//s.oh$
    
//s.oh^ 2014/07/08 クラウド0対応
    @GET
    @Path("/cloudzero/sendmail")
    public void sendCloudZeroMail() {
        GregorianCalendar gc = new GregorianCalendar();
        gc.add(Calendar.MONTH, -1);
        int year = gc.get(Calendar.YEAR);
        int month = gc.get(Calendar.MONTH);
        try {
            systemServiceBean.sendMonthlyActivities(year, month);
            LOGGER.info("Send CloudZero mail: year={}, month={}", year, month);
            Map<String, Object> details = new HashMap<>();
            details.put("status", "success");
            details.put("targetYear", year);
            details.put("targetMonth", month);
            recordAudit("SYSTEM_CLOUDZERO_SEND", details);
        } catch (RuntimeException ex) {
            LOGGER.error("Failed to send CloudZero mail", ex);
            Map<String, Object> details = new HashMap<>();
            details.put("status", "failed");
            details.put("reason", ex.getClass().getSimpleName());
            details.put("targetYear", year);
            details.put("targetMonth", month);
            recordAudit("SYSTEM_CLOUDZERO_SEND", details);
            throw ex;
        }
    }
//s.oh$
    
    /**
     * 
     * ResteasyClient client = new ResteasyClientBuilder().build();
     * 
    ResteasyWebTarget target = client.target("http://.../upload");

    MultipartFormDataOutput mdo = new MultipartFormDataOutput();
    mdo.addFormData("file", new FileInputStream(new File("....thermo.wav")),    MediaType.APPLICATION_OCTET_STREAM_TYPE);
    GenericEntity<MultipartFormDataOutput> entity = new GenericEntity<MultipartFormDataOutput>(mdo) {};

    Response r = target.request().post( Entity.entity(entity, MediaType.MULTIPART_FORM_DATA_TYPE));
     */

    private Map<String, Object> failureDetails(String reason, Map<String, Object> extras) {
        Map<String, Object> details = new HashMap<>();
        details.put("status", "failed");
        details.put("reason", reason);
        if (extras != null && !extras.isEmpty()) {
            details.putAll(extras);
        }
        return details;
    }

    private void recordAudit(String action, Map<String, Object> details) {
        if (auditTrailService == null) {
            return;
        }
        AuditEventPayload payload = createBaseAuditPayload(action);
        Map<String, Object> enriched = new HashMap<>();
        if (details != null) {
            enriched.putAll(details);
        }
        enrichRemoteUserDetails(enriched);
        enrichTraceDetails(enriched);
        payload.setDetails(enriched);
        auditTrailService.record(payload);
    }

    private AuditEventPayload createBaseAuditPayload(String action) {
        AuditEventPayload payload = new AuditEventPayload();
        String actorId = resolveActorId();
        payload.setActorId(actorId);
        payload.setActorDisplayName(resolveActorDisplayName(actorId));
        payload.setActorRole(resolveActorRole());
        payload.setAction(action);
        payload.setResource(resolveResourcePath());
        payload.setRequestId(resolveRequestId());
        payload.setIpAddress(resolveIpAddress());
        payload.setUserAgent(resolveUserAgent());
        return payload;
    }

    private String resolveActorRole() {
        if (httpServletRequest != null && httpServletRequest.isUserInRole("ADMIN")) {
            return "ADMIN";
        }
        return null;
    }

    private void enrichRemoteUserDetails(Map<String, Object> details) {
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
        return httpServletRequest != null ? httpServletRequest.getRequestURI() : "/dolphin";
    }

    private String resolveRequestId() {
        if (httpServletRequest == null) {
            return UUID.randomUUID().toString();
        }
        return Optional.ofNullable(httpServletRequest.getHeader("X-Request-Id"))
                .orElse(UUID.randomUUID().toString());
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
