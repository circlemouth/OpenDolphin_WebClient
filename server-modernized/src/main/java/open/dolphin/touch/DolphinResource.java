package open.dolphin.touch;

import java.beans.XMLDecoder;
import java.io.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.Base64;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.function.Function;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import static open.dolphin.rest.AbstractResource.getRemoteFacility;
import open.dolphin.infomodel.*;
import open.dolphin.touch.TouchAuthHandler;
import open.dolphin.touch.dto.DolphinDocumentResponses.ClaimBundleDto;
import open.dolphin.touch.dto.DolphinDocumentResponses.ClaimItemDto;
import open.dolphin.touch.dto.DolphinDocumentResponses.PageInfo;
import open.dolphin.touch.dto.DolphinDocumentResponses.ProgressCourseDocument;
import open.dolphin.touch.dto.DolphinDocumentResponses.ProgressCourseResponse;
import open.dolphin.touch.dto.DolphinDocumentResponses.SchemaDto;
import open.dolphin.touch.converter.IDocument;
import open.dolphin.touch.converter.IPriscription;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.module.TouchModuleAuditLogger;
import open.dolphin.touch.module.TouchModuleDtos;
import open.dolphin.touch.module.TouchModuleService;
import open.dolphin.touch.session.IPhoneServiceBean;
//import open.dolphin.msg.ServerPrescriptionPDFMaker;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.touch.converter.IDocument2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import open.dolphin.touch.DolphinTouchAuditLogger;
import io.micrometer.core.instrument.MeterRegistry;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;

/**
 * REST Web Service
 *
 * @author kazushi Minagawa, Digital Globe, Inc.
 */

@Path("/touch")
public class DolphinResource extends AbstractResource {

    private static final String ELEMENT_PATIENT_VISIT_START = "<patientVisit>";
    private static final String ELEMENT_PATIENT_VISIT_END = "</patientVisit>";
    private static final String ELEMENT_PVT_DATE = "pvtDate";
    private static final String ELEMENT_PVT_STATUS = "pvtStatus";
//s.oh^ 2013/11/05 iPhone/iPadの受付リストに保険を追加
    private static final String ELEMENT_PVT_F_INS = "pvtFirstInsurance";    // add funabashi 20131103
//s.oh$

    private static final String ELEMENT_ADDRESS_START = "<address>";
    private static final String ELEMENT_ADDRESS_END = "</address>";
    private static final String ELEMENT_ZIP_CODE = "zipCode";
    private static final String ELEMENT_FULL_ADDRESS = "fullAddress";
    private static final String ELEMENT_TELEPHONE = "telephone";
    private static final String ELEMENT_MOBILE_PHONE = "mobilePhone";
    private static final String ELEMENT_E_MAIL = "email";

    //private static final String ENTITY_MED_ORDER = "medOrder";
    private static final String ELEMENT_BUNDLE_MED_START = "<bundleMed>";
    private static final String ELEMENT_BUNDLE_MED_END = "</bundleMed>";
    //private static final String ELEMENT_CLAIM_ITEM_START = "<claimItem>";
    //private static final String ELEMENT_CLAIM_ITEM_END = "</claimItem>";
    private static final String ELEMENT_RP_DATE = "rpDate";
    private static final String ELEMENT_CLAIM_ITEM_NAME = "name";
    private static final String ELEMENT_CLAIM_ITEM_QUANTITY = "quantity";
    private static final String ELEMENT_CLAIM_ITEM_UNIT = "unit";
    private static final String ELEMENT_CLAIM_ITEM_NUM_DAYS = "numDays";
    private static final String ELEMENT_CLAIM_ITEM_ADMINI = "administration";

    //private static final String ELEMENT_MODULE_START = "<module>";
    //private static final String ELEMENT_MODULE_END = "</module>";

    private static final String ELEMENT_LAB_ITEM_START = "<laboItem>";
    private static final String ELEMENT_LAB_ITEM_END = "</laboItem>";
    private static final String ELEMENT_LABO_CODE = "laboCode";
    private static final String ELEMENT_SAMPLE_DATE = "sampleDate";
    private static final String ELEMENT_GROUP_CODE = "groupCode";
    private static final String ELEMENT_GROUP_NAME = "groupName";
    private static final String ELEMENT_PARENT_CODE = "parentCode";
    private static final String ELEMENT_ITEM_CODE = "itemCode";
    private static final String ELEMENT_ITEM_MEDIS_CODE = "medisCode";
    private static final String ELEMENT_ITEM_NAME = "itemName";
    private static final String ELEMENT_NORMAL_VALUE = "normalValue";
    //private static final String ELEMENT_UNIT = "unit";
    //private static final String ELEMENT_VALUE = "value";
    private static final String ELEMENT_OUT_FLAG = "outFlag";
    private static final String ELEMENT_COMMENT_1 = "comment1";
    private static final String ELEMENT_COMMENT_2 = "comment2";
    private static final String ELEMENT_TEST_ITEM_START = "<testItem>";
    private static final String ELEMENT_TEST_ITEM_END = "</testItem>";
    private static final String ELEMENT_RESULT_START = "<result>";
    private static final String ELEMENT_RESULT_END = "</result>";

    private static final String ELEMENT_DIAGNOSIS_START = "<registeredDiagnosis>";
    private static final String ELEMENT_DIGNOSIS_END = "</registeredDiagnosis>";
    private static final String ELEMENT_DIAGNOSIS = "diagnosis";
    private static final String ELEMENT_CATEGORY = "category";
    private static final String ELEMENT_OUTCOME = "outcome";
    //private static final String ELEMENT_START_DATE = "startDate";
    private static final String ELEMENT_END_DATE = "endDate";

    private static final String ELEMENT_SCHEMA_START = "<schema>";
    private static final String ELEMENT_BUCKET = "bucket";
    private static final String ELEMENT_SOP = "sop";
    private static final String ELEMENT_BASE64 = "base64";
    private static final String ELEMENT_SCHEMA_END = "</schema>";

    private static final String MML_DATE_TIME_SEPARATOR = "T";
    private static final String USER_ALLOWED_TYPE = "ASP_MEMBER";
    private static final String ASP_TEST_USER = "ASP_TESTER";

    // S3 parameters
    private static final String ELEMENT_S3_URL = "s3URL";
    private static final String ELEMENT_S3_ACCESS_KEY = "s3AccessKey";
    private static final String ELEMENT_S3_SECRET_KEY = "s3SecretKey";
    // S3 parameters
    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 1000;
    private static final int DEFAULT_FALLBACK_DAYS = 6;
    private static final int MAX_FALLBACK_DAYS = 14;
    private static final String METRIC_FIRST_VISITORS = "touch.patient.firstVisitors";
    private static final String METRIC_VISIT = "touch.patient.visit";
    private static final String METRIC_VISIT_RANGE = "touch.patient.visitRange";
    private static final String METRIC_VISIT_LAST = "touch.patient.visitLast";
    private static final String METRIC_PATIENT_DETAIL = "touch.patient.detail";
    private static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final String[] AUTHORIZED_ROLES = {"TOUCH_PATIENT_VISIT", "ADMIN"};

    private static final Logger LOGGER = Logger.getLogger(DolphinResource.class.getName());

    @Context
    private HttpServletRequest servletRequest;

    private final ObjectMapper objectMapper;

    @Inject
    private IPhoneServiceBean iPhoneServiceBean;

    @Inject
    private KarteServiceBean karteService;

    @Inject
    private TouchModuleService moduleService;

    @Inject
    private TouchAuthHandler authHandler;

    @Inject
    private AuditTrailService auditTrailService;

    @Inject
    private SessionTraceManager sessionTraceManager;

    @Inject
    private MeterRegistry meterRegistry;

    /** Creates a new instance of DolphinResource */
    public DolphinResource() {
        objectMapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @GET
    @Path("/patient/firstVisitors")
    @Produces(MediaType.APPLICATION_XML)
    public String getFirstVisitors(@Context HttpServletRequest request,
            @QueryParam("facility") String facilityParam,
            @DefaultValue("0") @QueryParam("offset") int offset,
            @DefaultValue("50") @QueryParam("limit") int limit,
            @DefaultValue("firstVisit") @QueryParam("sort") String sort,
            @DefaultValue("desc") @QueryParam("order") String order) {
        return handleFirstVisitors(request, facilityParam, offset, limit, sort, order);
    }

    @GET
    @Path("/patient/firstVisitors/{param}")
    @Produces(MediaType.APPLICATION_XML)
    @Deprecated(since = "2025-11-04")
    public String getFirstVisitorsLegacy(@Context HttpServletRequest request, @PathParam("param") String param) {
        String[] params = param.split(",");
        if (params.length != 3) {
            throw new BadRequestException("param must be facilityId,offset,limit");
        }
        return handleFirstVisitors(request, params[0],
                parseIntOrThrow(params[1], "offset"),
                parseIntOrThrow(params[2], "limit"),
                "firstVisit",
                "desc");
    }


    @GET
    @Path("/patient/visit")
    @Produces(MediaType.APPLICATION_XML)
    public String getPatientVisit(@Context HttpServletRequest request,
            @QueryParam("facility") String facilityParam,
            @DefaultValue("0") @QueryParam("offset") int offset,
            @DefaultValue("50") @QueryParam("limit") int limit,
            @DefaultValue("pvtDate") @QueryParam("sort") String sort,
            @DefaultValue("desc") @QueryParam("order") String order) {
        return handlePatientVisit(request, facilityParam, offset, limit, sort, order);
    }

    @GET
    @Path("/patient/visit/{param}")
    @Produces(MediaType.APPLICATION_XML)
    @Deprecated(since = "2025-11-04")
    public String getPatientVisitLegacy(@Context HttpServletRequest request, @PathParam("param") String param) {
        String[] params = param.split(",");
        if (params.length != 3) {
            throw new BadRequestException("param must be facilityId,offset,limit");
        }
        return handlePatientVisit(request, params[0],
                parseIntOrThrow(params[1], "offset"),
                parseIntOrThrow(params[2], "limit"),
                "pvtDate",
                "desc");
    }


    @GET
    @Path("/patient/visitRange")
    @Produces(MediaType.APPLICATION_XML)
    public String getPatientVisitRange(@Context HttpServletRequest request,
            @QueryParam("facility") String facilityParam,
            @QueryParam("from") String fromParam,
            @QueryParam("to") String toParam,
            @DefaultValue("0") @QueryParam("offset") int offset,
            @DefaultValue("50") @QueryParam("limit") int limit,
            @DefaultValue("pvtDate") @QueryParam("sort") String sort,
            @DefaultValue("desc") @QueryParam("order") String order) {
        return handlePatientVisitRange(request, facilityParam, fromParam, toParam, offset, limit, sort, order);
    }

    @GET
    @Path("/patient/visitRange/{param}")
    @Produces(MediaType.APPLICATION_XML)
    @Deprecated(since = "2025-11-04")
    public String getPatientVisitRangeLegacy(@Context HttpServletRequest request, @PathParam("param") String param) {
        String[] params = param.split(",");
        if (params.length < 3) {
            throw new BadRequestException("param must be facilityId,start,end[,offset,limit]");
        }
        String facilityId = params[0];
        String start = params[1].replace(' ', 'T');
        String end = params[2].replace(' ', 'T');
        int offset = params.length >= 4 ? parseIntOrThrow(params[3], "offset") : 0;
        int limit = params.length >= 5 ? parseIntOrThrow(params[4], "limit") : DEFAULT_LIMIT;
        return handlePatientVisitRange(request, facilityId, start, end, offset, limit, "pvtDate", "desc");
    }

    @GET
    @Path("/patient/visitLast")
    @Produces(MediaType.APPLICATION_XML)
    public String getPatientVisitLast(@Context HttpServletRequest request,
            @QueryParam("facility") String facilityParam,
            @QueryParam("from") String fromParam,
            @QueryParam("to") String toParam,
            @DefaultValue("50") @QueryParam("limit") int limit,
            @DefaultValue("pvtDate") @QueryParam("sort") String sort,
            @DefaultValue("desc") @QueryParam("order") String order,
            @DefaultValue("6") @QueryParam("fallbackDays") int fallbackDays) {
        return handlePatientVisitLast(request, facilityParam, fromParam, toParam, limit, sort, order, fallbackDays);
    }

    @GET
    @Path("/patient/visitLast/{param}")
    @Produces(MediaType.APPLICATION_XML)
    @Deprecated(since = "2025-11-04")
    public String getPatientVisitLastLegacy(@Context HttpServletRequest request, @PathParam("param") String param) {
        String[] params = param.split(",");
        if (params.length != 3) {
            throw new BadRequestException("param must be facilityId,start,end");
        }
        String facilityId = params[0];
        String start = params[1].replace(' ', 'T');
        String end = params[2].replace(' ', 'T');
        return handlePatientVisitLast(request, facilityId, start, end, DEFAULT_LIMIT, "pvtDate", "desc", DEFAULT_FALLBACK_DAYS);
    }

    private String handleFirstVisitors(HttpServletRequest request, String facilityParam, int offset, int limit, String sortParam, String orderParam) {
        final String endpoint = METRIC_FIRST_VISITORS;
        String requestId = resolveRequestId(request);
        long startNanos = System.nanoTime();
        Throwable error = null;
        boolean success = false;
        String facilityId = null;
        String actorRole = null;
        int normalizedOffset = 0;
        int normalizedLimit = 0;
        IPhoneServiceBean.FirstVisitorOrder order = null;
        boolean descending = true;
        try {
            normalizedOffset = normalizeOffset(offset);
            normalizedLimit = normalizeLimit(limit);
            order = parseFirstVisitorOrder(sortParam);
            descending = isDescending(orderParam);
            facilityId = resolveFacility(request, facilityParam, endpoint, requestId);
            actorRole = ensureRole(request, facilityId, endpoint, requestId);
            List<KarteBean> visitors = iPhoneServiceBean.getFirstVisitors(facilityId, normalizedOffset, normalizedLimit, order, descending);
            String xml = buildFirstVisitorsXml(visitors);
            Map<String, Object> details = new HashMap<>();
            details.put("offset", normalizedOffset);
            details.put("limit", normalizedLimit);
            details.put("sort", order.name());
            details.put("order", descending ? "desc" : "asc");
            details.put("resultCount", visitors != null ? visitors.size() : 0);
            recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, true);
            success = true;
            debug(xml);
            return xml;
        } catch (RuntimeException ex) {
            error = ex;
            if (facilityId != null && actorRole != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("offset", normalizedOffset);
                details.put("limit", normalizedLimit);
                if (order != null) {
                    details.put("sort", order.name());
                }
                details.put("order", descending ? "desc" : "asc");
                details.put("error", ex.getClass().getSimpleName());
                recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, false);
            }
            throw ex;
        } finally {
            recordMetrics(endpoint, success, startNanos, error);
        }
    }

    private String handlePatientVisit(HttpServletRequest request, String facilityParam, int offset, int limit, String sortParam, String orderParam) {
        final String endpoint = METRIC_VISIT;
        String requestId = resolveRequestId(request);
        long startNanos = System.nanoTime();
        Throwable error = null;
        boolean success = false;
        String facilityId = null;
        String actorRole = null;
        int normalizedOffset = 0;
        int normalizedLimit = 0;
        IPhoneServiceBean.VisitOrder order = null;
        boolean descending = true;
        try {
            normalizedOffset = normalizeOffset(offset);
            normalizedLimit = normalizeLimit(limit);
            order = parseVisitOrder(sortParam);
            descending = isDescending(orderParam);
            facilityId = resolveFacility(request, facilityParam, endpoint, requestId);
            actorRole = ensureRole(request, facilityId, endpoint, requestId);
            List<PatientVisitModel> visits = iPhoneServiceBean.getPatientVisit(facilityId, normalizedOffset, normalizedLimit, order, descending);
            String xml = buildPatientVisitXml(visits, false, false);
            Map<String, Object> details = new HashMap<>();
            details.put("offset", normalizedOffset);
            details.put("limit", normalizedLimit);
            details.put("sort", order.name());
            details.put("order", descending ? "desc" : "asc");
            details.put("resultCount", visits != null ? visits.size() : 0);
            recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, true);
            success = true;
            debug(xml);
            return xml;
        } catch (RuntimeException ex) {
            error = ex;
            if (facilityId != null && actorRole != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("offset", normalizedOffset);
                details.put("limit", normalizedLimit);
                if (order != null) {
                    details.put("sort", order.name());
                }
                details.put("order", descending ? "desc" : "asc");
                details.put("error", ex.getClass().getSimpleName());
                recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, false);
            }
            throw ex;
        } finally {
            recordMetrics(endpoint, success, startNanos, error);
        }
    }

    private String handlePatientVisitRange(HttpServletRequest request, String facilityParam, String fromParam, String toParam, int offset, int limit, String sortParam, String orderParam) {
        final String endpoint = METRIC_VISIT_RANGE;
        String requestId = resolveRequestId(request);
        long startNanos = System.nanoTime();
        Throwable error = null;
        boolean success = false;
        String facilityId = null;
        String actorRole = null;
        int normalizedOffset = 0;
        int normalizedLimit = 0;
        String normalizedFrom = null;
        String normalizedTo = null;
        IPhoneServiceBean.VisitOrder order = null;
        boolean descending = true;
        try {
            normalizedOffset = normalizeOffset(offset);
            normalizedLimit = normalizeLimit(limit);
            normalizedFrom = normalizeDateTime(fromParam, false);
            normalizedTo = normalizeDateTime(toParam, true);
            order = parseVisitOrder(sortParam);
            descending = isDescending(orderParam);
            facilityId = resolveFacility(request, facilityParam, endpoint, requestId);
            actorRole = ensureRole(request, facilityId, endpoint, requestId);
            List<PatientVisitModel> visits = iPhoneServiceBean.getPatientVisitRange(facilityId, normalizedFrom, normalizedTo, normalizedOffset, normalizedLimit, order, descending);
            String xml = buildPatientVisitXml(visits, true, true);
            Map<String, Object> details = new HashMap<>();
            details.put("offset", normalizedOffset);
            details.put("limit", normalizedLimit);
            details.put("sort", order.name());
            details.put("order", descending ? "desc" : "asc");
            details.put("from", normalizedFrom);
            details.put("to", normalizedTo);
            details.put("resultCount", visits != null ? visits.size() : 0);
            recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, true);
            success = true;
            debug(xml);
            return xml;
        } catch (RuntimeException ex) {
            error = ex;
            if (facilityId != null && actorRole != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("offset", normalizedOffset);
                details.put("limit", normalizedLimit);
                if (order != null) {
                    details.put("sort", order.name());
                }
                details.put("order", descending ? "desc" : "asc");
                details.put("from", normalizedFrom);
                details.put("to", normalizedTo);
                details.put("error", ex.getClass().getSimpleName());
                recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, false);
            }
            throw ex;
        } finally {
            recordMetrics(endpoint, success, startNanos, error);
        }
    }

    private String handlePatientVisitLast(HttpServletRequest request, String facilityParam, String fromParam, String toParam, int limit, String sortParam, String orderParam, int fallbackDays) {
        final String endpoint = METRIC_VISIT_LAST;
        String requestId = resolveRequestId(request);
        long startNanos = System.nanoTime();
        Throwable error = null;
        boolean success = false;
        String facilityId = null;
        String actorRole = null;
        String normalizedFrom = null;
        String normalizedTo = null;
        int normalizedLimit = 0;
        int normalizedFallback = 0;
        IPhoneServiceBean.VisitOrder order = null;
        boolean descending = true;
        try {
            normalizedLimit = normalizeLimit(limit);
            normalizedFallback = normalizeFallbackDays(fallbackDays);
            normalizedFrom = normalizeDateTime(fromParam, false);
            normalizedTo = normalizeDateTime(toParam, true);
            order = parseVisitOrder(sortParam);
            descending = isDescending(orderParam);
            facilityId = resolveFacility(request, facilityParam, endpoint, requestId);
            actorRole = ensureRole(request, facilityId, endpoint, requestId);
            List<PatientVisitModel> visits = iPhoneServiceBean.getPatientVisitWithFallback(facilityId, normalizedFrom, normalizedTo, normalizedLimit, normalizedFallback, order, descending);
            boolean fallbackApplied = isFallbackApplied(visits, normalizedFrom);
            String xml = buildPatientVisitXml(visits, false, false);
            Map<String, Object> details = new HashMap<>();
            details.put("limit", normalizedLimit);
            details.put("sort", order.name());
            details.put("order", descending ? "desc" : "asc");
            details.put("from", normalizedFrom);
            details.put("to", normalizedTo);
            details.put("fallbackDays", normalizedFallback);
            details.put("fallbackApplied", fallbackApplied);
            details.put("resultCount", visits != null ? visits.size() : 0);
            recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, true);
            success = true;
            debug(xml);
            return xml;
        } catch (RuntimeException ex) {
            error = ex;
            if (facilityId != null && actorRole != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("limit", normalizedLimit);
                if (order != null) {
                    details.put("sort", order.name());
                }
                details.put("order", descending ? "desc" : "asc");
                details.put("from", normalizedFrom);
                details.put("to", normalizedTo);
                details.put("fallbackDays", normalizedFallback);
                details.put("error", ex.getClass().getSimpleName());
                recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, actorRole, details, false);
            }
            throw ex;
        } finally {
            recordMetrics(endpoint, success, startNanos, error);
        }
    }

    private int normalizeOffset(int offset) {
        if (offset < 0) {
            throw new BadRequestException("offset は 0 以上を指定してください");
        }
        return offset;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        if (limit > MAX_LIMIT) {
            throw new BadRequestException("limit は " + MAX_LIMIT + " 以下を指定してください");
        }
        return limit;
    }

    private int normalizeFallbackDays(int fallbackDays) {
        if (fallbackDays < 0) {
            throw new BadRequestException("fallbackDays は 0 以上を指定してください");
        }
        return Math.min(fallbackDays, MAX_FALLBACK_DAYS);
    }

    private String normalizeDateTime(String value, boolean endOfDay) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(endOfDay ? "to パラメータは必須です" : "from パラメータは必須です");
        }
        String normalized = value.trim().replace(' ', 'T');
        if (!normalized.contains("T")) {
            normalized = normalized + (endOfDay ? "T23:59:59" : "T00:00:00");
        } else if (normalized.endsWith("T")) {
            normalized += endOfDay ? "23:59:59" : "00:00:00";
        }
        if (normalized.length() == 16) {
            normalized += endOfDay ? ":59" : ":00";
        } else if (normalized.length() == 13) {
            normalized += endOfDay ? ":59:59" : ":00:00";
        }
        try {
            LocalDateTime.parse(normalized, ISO_DATE_TIME);
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("日時は yyyy-MM-ddTHH:mm:ss 形式で指定してください");
        }
        return normalized;
    }

    private String resolveFacility(HttpServletRequest request, String facilityParam, String endpoint, String requestId) {
        if (request == null || request.getRemoteUser() == null || request.getRemoteUser().isBlank()) {
            throw new NotAuthorizedException("認証情報が不足しています");
        }
        String remoteFacility;
        try {
            remoteFacility = getRemoteFacility(request.getRemoteUser());
        } catch (RuntimeException ex) {
            throw new NotAuthorizedException("認証情報が不正です", ex);
        }
        String target = (facilityParam == null || facilityParam.isBlank()) ? remoteFacility : facilityParam;
        if (!remoteFacility.equals(target)) {
            Map<String, Object> details = new HashMap<>();
            details.put("requestedFacility", target);
            details.put("remoteFacility", remoteFacility);
            recordAuditEvent("施設突合失敗", endpoint, remoteFacility, requestId, resolveActorRole(request), details, false);
            throw new ForbiddenException("施設 ID が一致しません");
        }
        return target;
    }

    private String ensureRole(HttpServletRequest request, String facilityId, String endpoint, String requestId) {
        if (request == null) {
            throw new NotAuthorizedException("認証情報が不足しています");
        }
        String actorRole = resolveActorRole(request);
        if (actorRole != null) {
            if (sessionTraceManager != null) {
                sessionTraceManager.setActorRole(actorRole);
            }
            return actorRole;
        }
        Map<String, Object> details = new HashMap<>();
        details.put("reason", "forbiddenRole");
        recordAuditEvent("来院履歴照会", endpoint, facilityId, requestId, null, details, false);
        throw new ForbiddenException("来院履歴へのアクセス権限がありません");
    }

    private String resolveRequestId(HttpServletRequest request) {
        if (request == null) {
            return UUID.randomUUID().toString();
        }
        String header = request.getHeader("X-Request-Id");
        return (header == null || header.isBlank()) ? UUID.randomUUID().toString() : header;
    }

    private IPhoneServiceBean.FirstVisitorOrder parseFirstVisitorOrder(String sortParam) {
        if (sortParam == null) {
            return IPhoneServiceBean.FirstVisitorOrder.FIRST_VISIT;
        }
        String candidate = sortParam.trim().toLowerCase(Locale.ROOT);
        return switch (candidate) {
            case "patientkana", "kana" -> IPhoneServiceBean.FirstVisitorOrder.PATIENT_KANA;
            case "patientid", "id" -> IPhoneServiceBean.FirstVisitorOrder.PATIENT_ID;
            default -> IPhoneServiceBean.FirstVisitorOrder.FIRST_VISIT;
        };
    }

    private IPhoneServiceBean.VisitOrder parseVisitOrder(String sortParam) {
        if (sortParam == null) {
            return IPhoneServiceBean.VisitOrder.PVT_DATE;
        }
        String candidate = sortParam.trim().toLowerCase(Locale.ROOT);
        return switch (candidate) {
            case "patientkana", "kana" -> IPhoneServiceBean.VisitOrder.PATIENT_KANA;
            case "pvtdate", "date", "visitdate" -> IPhoneServiceBean.VisitOrder.PVT_DATE;
            default -> IPhoneServiceBean.VisitOrder.PVT_DATE;
        };
    }

    private boolean isDescending(String orderParam) {
        return orderParam == null || !"asc".equalsIgnoreCase(orderParam.trim());
    }

    private int parseIntOrThrow(String value, String name) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            throw new BadRequestException(name + " は数値で指定してください");
        }
    }

    private void recordAuditEvent(String action, String resource, String facilityId, String requestId, String actorRole, Map<String, Object> details, boolean success) {
        if (auditTrailService == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        String actorId = servletRequest != null ? servletRequest.getRemoteUser() : null;
        if (actorId == null || actorId.isBlank()) {
            actorId = "anonymous";
        }
        payload.setActorId(actorId);
        payload.setActorDisplayName(actorId);
        payload.setActorRole(actorRole != null ? actorRole : resolveActorRole(servletRequest));
        payload.setAction(action);
        payload.setResource(resource);
        payload.setPatientId(null);
        payload.setRequestId(requestId != null ? requestId : UUID.randomUUID().toString());
        if (servletRequest != null) {
            payload.setIpAddress(servletRequest.getRemoteAddr());
            payload.setUserAgent(servletRequest.getHeader("User-Agent"));
        }
        Map<String, Object> payloadDetails = new HashMap<>();
        if (details != null) {
            payloadDetails.putAll(details);
        }
        payloadDetails.put("status", success ? "success" : "failure");
        if (facilityId != null) {
            payloadDetails.put("facilityId", facilityId);
        }
        SessionTraceContext context = sessionTraceManager != null ? sessionTraceManager.current() : null;
        if (context != null) {
            payloadDetails.putIfAbsent("traceId", context.getTraceId());
            payloadDetails.putIfAbsent("sessionOperation", context.getOperation());
        }
        payload.setDetails(payloadDetails);
        auditTrailService.record(payload);
    }

    private void recordMetrics(String endpoint, boolean success, long startNanos, Throwable error) {
        if (meterRegistry == null) {
            return;
        }
        String outcome = success ? "success" : "failure";
        meterRegistry.counter("touch_api_requests_total", "endpoint", endpoint, "outcome", outcome).increment();
        meterRegistry.timer("touch_api_request_duration", "endpoint", endpoint, "outcome", outcome)
                .record(System.nanoTime() - startNanos, TimeUnit.NANOSECONDS);
        if (!success && error != null) {
            meterRegistry.counter("touch_api_requests_error_total", "endpoint", endpoint, "error", error.getClass().getSimpleName()).increment();
        }
    }

    private boolean isFallbackApplied(List<PatientVisitModel> visits, String originalFrom) {
        if (visits == null || visits.isEmpty() || originalFrom == null) {
            return false;
        }
        String firstDate = visits.get(0).getPvtDate();
        return firstDate != null && firstDate.compareTo(originalFrom) < 0;
    }

    private String resolveActorRole(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        for (String role : AUTHORIZED_ROLES) {
            if (request.isUserInRole(role)) {
                if (sessionTraceManager != null) {
                    sessionTraceManager.setActorRole(role);
                }
                return role;
            }
        }
        return null;
    }

    private String buildFirstVisitorsXml(List<KarteBean> visitors) {
        StringBuilder sb = new StringBuilder(XML);
        sb.append(RESOURCE_START);
        if (visitors != null) {
            for (KarteBean karte : visitors) {
                if (karte == null) {
                    continue;
                }
                PatientModel patient = karte.getPatientModel();
                if (patient == null) {
                    continue;
                }
                sb.append(PATIENT_START);
                appendPatientCore(sb, patient);
                if (karte.getCreated() != null) {
                    propertyString(ELEMENT_FIRST_VISIT, simpleFormat(karte.getCreated()), sb);
                }
                sb.append(PATIENT_END);
            }
        }
        sb.append(RESOURCE_END);
        return sb.toString();
    }

    private String buildPatientVisitXml(List<PatientVisitModel> visits, boolean includeStatus, boolean includeFirstInsurance) {
        StringBuilder sb = new StringBuilder(XML);
        sb.append(RESOURCE_START);
        if (visits != null) {
            for (PatientVisitModel visit : visits) {
                if (visit == null) {
                    continue;
                }
                sb.append(ELEMENT_PATIENT_VISIT_START);
                propertyString(ELEMENT_PK, String.valueOf(visit.getId()), sb);
                propertyString(ELEMENT_PVT_DATE, visit.getPvtDate(), sb);
                if (includeStatus) {
                    propertyString(ELEMENT_PVT_STATUS, String.valueOf(visit.getState()), sb);
                }
                if (includeFirstInsurance) {
                    propertyString(ELEMENT_PVT_F_INS, visit.getFirstInsurance(), sb);
                }
                PatientModel patient = visit.getPatientModel();
                if (patient != null) {
                    sb.append(PATIENT_START);
                    appendPatientCore(sb, patient);
                    sb.append(PATIENT_END);
                }
                sb.append(ELEMENT_PATIENT_VISIT_END);
            }
        }
        sb.append(RESOURCE_END);
        return sb.toString();
    }

    private void appendPatientCore(StringBuilder sb, PatientModel patient) {
        if (patient == null) {
            return;
        }
        propertyString(ELEMENT_PK, String.valueOf(patient.getId()), sb);
        propertyString(ELEMENT_PATIENT_ID, patient.getPatientId(), sb);
        propertyString(ELEMENT_NAME, patient.getFullName(), sb);
        propertyString(ELEMENT_KANA, patient.getKanaName(), sb);
        propertyString(ELEMENT_SEX, sexValueToDesc(patient.getGender()), sb);
        propertyString(ELEMENT_BIRTHDAY, patient.getBirthday(), sb);
    }

    private String buildPatientDetailXml(PatientModel patient) {
        StringBuilder sb = new StringBuilder(XML);
        sb.append(RESOURCE_START);
        if (patient != null) {
            sb.append(PATIENT_START);
            appendPatientCore(sb, patient);
            if (patient.getSimpleAddressModel() != null) {
                sb.append(ELEMENT_ADDRESS_START);
                propertyString(ELEMENT_ZIP_CODE, patient.getSimpleAddressModel().getZipCode(), sb);
                propertyString(ELEMENT_FULL_ADDRESS, patient.getSimpleAddressModel().getAddress(), sb);
                sb.append(ELEMENT_ADDRESS_END);
            }
            propertyString(ELEMENT_TELEPHONE, patient.getTelephone(), sb);
            propertyString(ELEMENT_MOBILE_PHONE, patient.getMobilePhone(), sb);
            propertyString(ELEMENT_E_MAIL, patient.getEmail(), sb);
            sb.append(PATIENT_END);
        }
        sb.append(RESOURCE_END);
        return sb.toString();
    }

    @GET
    @Path("/patient/{pk}")
    @Produces(MediaType.APPLICATION_XML)
    public String getPatientById(@Context HttpServletRequest request, @PathParam("pk") String pk) {
        final String endpoint = "GET /touch/patient/{pk}";
        final String requestId = resolveRequestId(request);
        long startNanos = System.nanoTime();
        Throwable error = null;
        boolean success = false;
        String facilityId = null;
        String actorRole = null;
        try {
            long patientPk = parseLong(pk, "pk", endpoint);
            facilityId = resolveFacility(request, null, endpoint, requestId);
            actorRole = ensureRole(request, facilityId, endpoint, requestId);

            PatientModel patient = iPhoneServiceBean.getPatient(patientPk);
            if (patient == null) {
                Map<String, Object> details = new HashMap<>();
                details.put("patientPk", patientPk);
                recordAuditEvent("患者情報照会", endpoint, facilityId, requestId, actorRole, details, false);
                throw new NotFoundException("指定された患者が見つかりません: " + patientPk);
            }

            String patientFacility = trimToNull(patient.getFacilityId());
            if (patientFacility != null && !patientFacility.equals(facilityId)) {
                Map<String, Object> details = new HashMap<>();
                details.put("patientPk", patientPk);
                details.put("patientFacilityId", patientFacility);
                details.put("requestedFacilityId", facilityId);
                details.put("reason", "facilityMismatch");
                recordAuditEvent("患者情報照会", endpoint, facilityId, requestId, actorRole, details, false);
                throw forbidden(endpoint, "指定された施設に所属しない患者です");
            }

            String xml = buildPatientDetailXml(patient);
            Map<String, Object> details = new HashMap<>();
            details.put("patientPk", patientPk);
            details.put("patientId", patient.getPatientId());
            details.put("resultFormat", "xml");
            recordAuditEvent("患者情報照会", endpoint, facilityId, requestId, actorRole, details, true);
            success = true;
            debug(xml);
            return xml;
        } catch (RuntimeException ex) {
            error = ex;
            if (facilityId != null && actorRole != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("error", ex.getClass().getSimpleName());
                details.put("message", ex.getMessage());
                recordAuditEvent("患者情報照会", endpoint, facilityId, requestId, actorRole, details, false);
            }
            throw ex;
        } finally {
            recordMetrics(METRIC_PATIENT_DETAIL, success, startNanos, error);
        }
    }

    @GET
    @Path("/module/rp/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getRp(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        final String endpoint = "GET /touch/module/rp/{param}";
        final String traceId = TouchModuleAuditLogger.begin(endpoint, () -> "param=" + param);
        try {
            String[] params = splitParam(param, 3, endpoint);
            long patientPk = parseLong(params[0], "patientPk", endpoint);
            int firstResult = parseInt(params[1], "firstResult", endpoint);
            int maxResult = parseInt(params[2], "maxResult", endpoint);

            TouchModuleDtos.Page<TouchModuleDtos.RpModule> page = moduleService.getRpModules(patientPk, firstResult, maxResult);
            Response response = okNoStore(page);
            TouchModuleAuditLogger.success(endpoint, traceId, () -> "items=" + size(page.items()));
            return response;
        } catch (WebApplicationException e) {
            TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
            throw e;
        } catch (RuntimeException e) {
            throw TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    private String[] splitParam(String param, int expectedParts, String endpoint) {
        if (param == null) {
            throw badRequest(endpoint, "param is required");
        }
        String[] parts = param.split(",");
        if (parts.length != expectedParts) {
            throw badRequest(endpoint, "expected " + expectedParts + " arguments but got " + parts.length);
        }
        for (int i = 0; i < parts.length; i++) {
            parts[i] = trimToNull(parts[i]);
        }
        return parts;
    }

    private long parseLong(String value, String field, String endpoint) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw badRequest(endpoint, field + " is required");
        }
        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException e) {
            throw badRequest(endpoint, field + " must be a number");
        }
    }

    private int parseInt(String value, String field, String endpoint) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw badRequest(endpoint, field + " is required");
        }
        try {
            return Integer.parseInt(normalized);
        } catch (NumberFormatException e) {
            throw badRequest(endpoint, field + " must be a number");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int size(List<?> list) {
        return list != null ? list.size() : 0;
    }

    private Response okNoStore(Object entity) {
        CacheControl cacheControl = new CacheControl();
        cacheControl.setNoStore(true);
        cacheControl.setNoCache(true);
        cacheControl.setMustRevalidate(true);
        return Response.ok(entity, MediaType.APPLICATION_JSON_TYPE)
                .cacheControl(cacheControl)
                .build();
    }

    private WebApplicationException badRequest(String endpoint, String message) {
        return error(Status.BAD_REQUEST, endpoint, message);
    }

    private WebApplicationException forbidden(String endpoint, String message) {
        return error(Status.FORBIDDEN, endpoint, message);
    }

    private WebApplicationException error(Status status, String endpoint, String message) {
        String payload = (endpoint != null ? endpoint : "") + " : " + message;
        Response response = Response.status(status)
                .type(MediaType.TEXT_PLAIN_TYPE)
                .entity(payload)
                .build();
        return new WebApplicationException(response);
    }


    @GET
    @Path("/module/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getModule(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        final String endpoint = "GET /touch/module/{param}";
        final String traceId = TouchModuleAuditLogger.begin(endpoint, () -> "param=" + param);
        try {
            String[] params = splitParam(param, 4, endpoint);
            long patientPk = parseLong(params[0], "patientPk", endpoint);
            String entity = params[1] != null ? params[1].trim() : "";
            int firstResult = parseInt(params[2], "firstResult", endpoint);
            int maxResult = parseInt(params[3], "maxResult", endpoint);

            TouchModuleDtos.Page<TouchModuleDtos.Module> page = moduleService.getModules(patientPk, entity, firstResult, maxResult);
            Response response = okNoStore(page);
            TouchModuleAuditLogger.success(endpoint, traceId, () -> "entity=" + entity + " items=" + size(page.items()));
            return response;
        } catch (WebApplicationException e) {
            TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
            throw e;
        } catch (RuntimeException e) {
            throw TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    @GET
    @Path("/module/laboTest/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLaboTest(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        final String endpoint = "GET /touch/module/laboTest/{param}";
        final String traceId = TouchModuleAuditLogger.begin(endpoint, () -> "param=" + param);
        try {
            String[] params = splitParam(param, 4, endpoint);
            String facilityId = trimToNull(params[0]);
            String patientId = trimToNull(params[1]);
            int firstResult = parseInt(params[2], "firstResult", endpoint);
            int maxResult = parseInt(params[3], "maxResult", endpoint);

            if (facilityId == null) {
                throw badRequest(endpoint, "facilityId is required");
            }
            String headerFacility = authHandler.requireFacilityHeader(servletReq, endpoint);
            if (!headerFacility.equalsIgnoreCase(facilityId)) {
                throw forbidden(endpoint, "facilityId mismatch header=" + headerFacility + " param=" + facilityId);
            }
            authHandler.verifyFacilityOwnership(servletReq, facilityId, endpoint);

            TouchModuleDtos.Page<TouchModuleDtos.LaboModule> page = moduleService.getLaboModules(facilityId, patientId, firstResult, maxResult);
            Response response = okNoStore(page);
            TouchModuleAuditLogger.success(endpoint, traceId, () -> "items=" + size(page.items()));
            return response;
        } catch (WebApplicationException e) {
            TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
            throw e;
        } catch (RuntimeException e) {
            throw TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }


    @GET
    @Path("/item/laboItem/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLaboGraph(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        final String endpoint = "GET /touch/item/laboItem/{param}";
        final String traceId = TouchModuleAuditLogger.begin(endpoint, () -> "param=" + param);
        try {
            String[] params = splitParam(param, 5, endpoint);
            String facilityId = trimToNull(params[0]);
            String patientId = trimToNull(params[1]);
            int firstResult = parseInt(params[2], "firstResult", endpoint);
            int maxResult = parseInt(params[3], "maxResult", endpoint);
            String itemCode = trimToNull(params[4]);

            if (facilityId == null) {
                throw badRequest(endpoint, "facilityId is required");
            }
            if (itemCode == null) {
                throw badRequest(endpoint, "itemCode is required");
            }
            String headerFacility = authHandler.requireFacilityHeader(servletReq, endpoint);
            if (!headerFacility.equalsIgnoreCase(facilityId)) {
                throw forbidden(endpoint, "facilityId mismatch header=" + headerFacility + " param=" + facilityId);
            }
            authHandler.verifyFacilityOwnership(servletReq, facilityId, endpoint);

            TouchModuleDtos.LaboGraph graph = moduleService.getLaboGraph(facilityId, patientId, firstResult, maxResult, itemCode);
            Response response = okNoStore(graph);
            TouchModuleAuditLogger.success(endpoint, traceId, () -> "results=" + size(graph.results()));
            return response;
        } catch (WebApplicationException e) {
            TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
            throw e;
        } catch (RuntimeException e) {
            throw TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    @GET
    @Path("/module/diagnosis/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDiagnosis(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        final String endpoint = "GET /touch/module/diagnosis/{param}";
        final String traceId = TouchModuleAuditLogger.begin(endpoint, () -> "param=" + param);
        try {
            String[] params = splitParam(param, 3, endpoint);
            long patientPk = parseLong(params[0], "patientPk", endpoint);
            int firstResult = parseInt(params[1], "firstResult", endpoint);
            int maxResult = parseInt(params[2], "maxResult", endpoint);

            TouchModuleDtos.Page<TouchModuleDtos.Diagnosis> page = moduleService.getDiagnoses(patientPk, firstResult, maxResult);
            Response response = okNoStore(page);
            TouchModuleAuditLogger.success(endpoint, traceId, () -> "items=" + size(page.items()));
            return response;
        } catch (WebApplicationException e) {
            TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
            throw e;
        } catch (RuntimeException e) {
            throw TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    @GET
    @Path("/module/schema/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSchema(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        final String endpoint = "GET /touch/module/schema/{param}";
        final String traceId = TouchModuleAuditLogger.begin(endpoint, () -> "param=" + param);
        try {
            String[] params = splitParam(param, 3, endpoint);
            long patientPk = parseLong(params[0], "patientPk", endpoint);
            int firstResult = parseInt(params[1], "firstResult", endpoint);
            int maxResult = parseInt(params[2], "maxResult", endpoint);

            TouchModuleDtos.Page<TouchModuleDtos.Schema> page = moduleService.getSchemas(patientPk, firstResult, maxResult);
            Response response = okNoStore(page);
            TouchModuleAuditLogger.success(endpoint, traceId, () -> "items=" + size(page.items()));
            return response;
        } catch (WebApplicationException e) {
            TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
            throw e;
        } catch (RuntimeException e) {
            throw TouchModuleAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    @GET
    @Path("/document/progressCourse/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public ProgressCourseResponse getProgressCource(@PathParam("param") String param) {
        final String endpoint = "GET /touch/document/progressCourse";
        final String traceId = DolphinTouchAuditLogger.begin(endpoint, () -> "param=" + param);
        long patientPk = -1L;
        try {
            String facilityId = requireFacility(endpoint, traceId);
            String[] params = param != null ? param.split(",") : new String[0];
            if (params.length != 3) {
                throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                        "Expected parameters patientPk,firstResult,maxResult");
            }

            patientPk = parseLong(params[0], -1L);
            int firstResult = parseInt(params[1], 0);
            int maxResult = parseInt(params[2], 20);
            if (patientPk <= 0) {
                throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                        "patientPk must be positive");
            }
            ensurePatientBelongsToFacility(patientPk, facilityId, endpoint, traceId);

            PageInfo pageInfo = null;
            if (firstResult == 0) {
                Long count = iPhoneServiceBean.getDocumentCount(patientPk);
                if (count != null) {
                    pageInfo = new PageInfo(count.intValue());
                }
            }

            List<DocumentModel> documents = safeList(iPhoneServiceBean.getDocuments(patientPk, firstResult, maxResult));
            List<ProgressCourseDocument> responseDocuments = new ArrayList<>(documents.size());
            for (DocumentModel document : documents) {
                responseDocuments.add(convertDocument(document));
            }

            ProgressCourseResponse response = new ProgressCourseResponse(pageInfo, responseDocuments);
            DolphinTouchAuditLogger.success(endpoint, traceId,
                    () -> "documents=" + responseDocuments.size());
            return response;
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw DolphinTouchAuditLogger.notFound(LOGGER, endpoint, traceId,
                    "Patient " + patientPk + " not found");
        }
    }
    
    //--------------------------------------------------------------------------
    
    @POST
    @Path("/idocument")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument(String json) {
        return handleDocumentSubmission("POST /touch/idocument", json, IDocument.class, IDocument::toModel);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/idocument2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument2(String json) {
        return handleDocumentSubmission("POST /touch/idocument2", json, IDocument2.class, IDocument2::toModel);
    }
    // S.Oh 2014/02/06 Add End

    private <T> String handleDocumentSubmission(String endpoint, String json, Class<T> payloadType,
                                                Function<T, DocumentModel> converter) {
        final String traceId = DolphinTouchAuditLogger.begin(endpoint,
                () -> "payloadSize=" + (json != null ? json.length() : 0));
        try {
            String facilityId = requireFacility(endpoint, traceId);
            T payload = objectMapper.readValue(json, payloadType);
            if (payload == null) {
                throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                        "Payload must not be empty");
            }
            DocumentModel model = converter.apply(payload);
            DocumentModel validated = validateDocumentModel(model, endpoint, traceId);
            enforceFacilityOwnership(validated, facilityId, endpoint, traceId);
            long pk = karteService.addDocument(validated);
            DolphinTouchAuditLogger.success(endpoint, traceId, () -> "documentPk=" + pk);
            return String.valueOf(pk);
        } catch (IOException e) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Invalid JSON payload", e);
        } catch (WebApplicationException e) {
            throw e;
        } catch (RuntimeException e) {
            throw DolphinTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    private DocumentModel validateDocumentModel(DocumentModel model, String endpoint, String traceId) {
        if (model == null) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Document payload is missing");
        }
        if (model.getKarte() == null) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Document.karte must be provided");
        }
        KarteBean karte = model.getKarte();
        PatientModel patient = karte.getPatientModel();
        if (patient == null) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Document patient model is missing");
        }
        if (patient.getFacilityId() == null || patient.getFacilityId().isEmpty()) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Document patient facilityId is missing");
        }
        if (model.getDocInfoModel() == null) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Document docInfo must be provided");
        }
        return model;
    }

    private void enforceFacilityOwnership(DocumentModel model, String facilityId,
                                          String endpoint, String traceId) {
        KarteBean karte = model.getKarte();
        PatientModel patient = karte != null ? karte.getPatientModel() : null;
        String documentFacility = patient != null ? patient.getFacilityId() : null;
        if (documentFacility == null && patient != null && patient.getId() > 0) {
            try {
                PatientModel persisted = iPhoneServiceBean.getPatient(patient.getId());
                documentFacility = persisted != null ? persisted.getFacilityId() : null;
            } catch (RuntimeException e) {
                throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                        "Patient " + patient.getId() + " not found");
            }
        }
        if (documentFacility == null) {
            throw DolphinTouchAuditLogger.validationFailure(LOGGER, endpoint, traceId,
                    "Unable to determine document facility");
        }
        if (!facilityId.equals(documentFacility)) {
            throw DolphinTouchAuditLogger.facilityMismatch(LOGGER, endpoint, traceId,
                    facilityId, documentFacility);
        }
    }

    private ProgressCourseDocument convertDocument(DocumentModel document) {
        long documentPk = document.getId();
        String started = document.getStarted() != null ? simpleFormat(document.getStarted()) : null;
        String responsibility = document.getUserModel() != null
                ? document.getUserModel().getCommonName() : null;

        String soaSpec = null;
        String pSpec = null;
        List<BundleDolphin> bundles = new ArrayList<>();

        Collection<ModuleModel> modules = document.getModules();
        if (modules != null) {
            for (ModuleModel module : modules) {
                Object decoded = decodeModule(module);
                String role = module.getModuleInfoBean() != null
                        ? module.getModuleInfoBean().getStampRole()
                        : null;

                if (decoded instanceof ProgressCourse progress) {
                    if (IInfoModel.ROLE_SOA_SPEC.equals(role)) {
                        soaSpec = progress.getFreeText();
                    } else if (IInfoModel.ROLE_P_SPEC.equals(role)) {
                        pSpec = progress.getFreeText();
                    } else if (soaSpec == null) {
                        soaSpec = progress.getFreeText();
                    } else if (pSpec == null) {
                        pSpec = progress.getFreeText();
                    }
                } else if (decoded instanceof BundleDolphin bundle) {
                    if (module.getModuleInfoBean() != null && bundle.getOrderName() == null) {
                        bundle.setOrderName(module.getModuleInfoBean().getEntity());
                    }
                    bundles.add(bundle);
                }
            }
        }

        if (soaSpec != null && pSpec != null && soaSpec.contains(NAME_STAMP_HOLDER)) {
            String tmp = soaSpec;
            soaSpec = pSpec;
            pSpec = tmp;
        }

        List<String> soaTexts = new ArrayList<>(2);
        if (hasContent(soaSpec)) {
            soaTexts.add(toPlainText(soaSpec));
        }
        if (hasContent(pSpec)) {
            soaTexts.add(toPlainText(pSpec));
        }

        List<ClaimBundleDto> orders = new ArrayList<>(bundles.size());
        for (BundleDolphin bundle : bundles) {
            orders.add(toClaimBundle(bundle));
        }

        List<SchemaDto> schemas = new ArrayList<>();
        List<SchemaModel> schemaModels = document.getSchema();
        if (schemaModels != null) {
            for (SchemaModel schema : schemaModels) {
                schemas.add(toSchemaDto(schema));
            }
        }

        return new ProgressCourseDocument(documentPk, started, responsibility, soaTexts, orders, schemas);
    }

    private Object decodeModule(ModuleModel module) {
        byte[] bytes = module.getBeanBytes();
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        try {
            return IOSHelper.xmlDecode(bytes);
        } catch (RuntimeException e) {
            LOGGER.log(Level.WARNING, "Failed to decode module id={0}", module.getId());
            return null;
        }
    }

    private ClaimBundleDto toClaimBundle(BundleDolphin bundle) {
        String entity = bundle.getOrderName();
        String entityName = entityToName(entity);
        boolean isRp = entity != null && entity.equals(ENTITY_MED_ORDER);

        List<ClaimItemDto> items = new ArrayList<>();
        ClaimItem[] claimItems = bundle.getClaimItem();
        if (claimItems != null) {
            for (ClaimItem item : claimItems) {
                items.add(new ClaimItemDto(
                        item.getName(),
                        item.getNumber(),
                        item.getUnit(),
                        isRp ? bundle.getBundleNumber() : null,
                        isRp ? bundle.getAdmin() : null
                ));
            }
        }
        return new ClaimBundleDto(entity, entityName, items);
    }

    private SchemaDto toSchemaDto(SchemaModel schema) {
        String bucket = null;
        String sop = null;
        if (schema.getExtRefModel() != null) {
            bucket = schema.getExtRefModel().getBucket();
            sop = schema.getExtRefModel().getSop();
        }
        String base64 = null;
        byte[] bytes = schema.getJpegByte();
        if (bytes != null && bytes.length > 0) {
            base64 = Base64.getEncoder().encodeToString(bytes);
        }
        return new SchemaDto(bucket, sop, base64);
    }

    private boolean hasContent(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String toPlainText(String xml) {
        if (!hasContent(xml)) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        renderPane(sb, xml);
        return sb.toString().trim();
    }

    private void ensurePatientBelongsToFacility(long patientPk, String facilityId,
                                                String endpoint, String traceId) {
        try {
            PatientModel patient = iPhoneServiceBean.getPatient(patientPk);
            if (patient == null) {
                throw DolphinTouchAuditLogger.notFound(LOGGER, endpoint, traceId,
                        "Patient " + patientPk + " not found");
            }
            String patientFacility = patient.getFacilityId();
            if (patientFacility == null || !patientFacility.equals(facilityId)) {
                throw DolphinTouchAuditLogger.facilityMismatch(LOGGER, endpoint, traceId,
                        facilityId, patientFacility);
            }
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw DolphinTouchAuditLogger.failure(LOGGER, endpoint, traceId, ex);
        }
    }

    private String requireFacility(String endpoint, String traceId) {
        if (servletRequest == null) {
            throw DolphinTouchAuditLogger.failure(LOGGER, endpoint, traceId,
                    new IllegalStateException("Servlet request unavailable"));
        }
        String remoteUser = servletRequest.getRemoteUser();
        if (remoteUser == null || remoteUser.isBlank()) {
            throw DolphinTouchAuditLogger.unauthorized(endpoint, traceId,
                    "Remote user is not authenticated");
        }
        try {
            return getRemoteFacility(remoteUser);
        } catch (RuntimeException e) {
            throw DolphinTouchAuditLogger.unauthorized(endpoint, traceId,
                    "Malformed remote user: " + remoteUser);
        }
    }

    private int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return fallback;
        }
    }

    private long parseLong(String value, long fallback) {
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            return fallback;
        }
    }

    private <T> List<T> safeList(List<T> input) {
        return input != null ? input : Collections.emptyList();
    }
    
//    @POST
//    @Path("/priscription")
//    @Consumes(MediaType.APPLICATION_JSON)
//    @Produces(MediaType.TEXT_PLAIN)
//    public String postPriscription(String json) throws IOException {
//        
//        // JSON to IPriscription
//        ObjectMapper mapper = new ObjectMapper();
//        IPriscription document = mapper.readValue(json, IPriscription.class);
//        
//        // IPriscriptionModel to PriscriptionModel
//        PriscriptionModel model = document.toModel();
//        
//        // create PDF
//        ServerPrescriptionPDFMaker maker = new ServerPrescriptionPDFMaker(model);
//        String filename = maker.output();
//        
//        return filename;
//    }
}
