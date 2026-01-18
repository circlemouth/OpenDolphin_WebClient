package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import open.dolphin.adm10.converter.IUserModel;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DemoDisease;
import open.dolphin.infomodel.DemoPatient;
import open.dolphin.infomodel.DemoRp;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.FacilityModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientPackage;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.infomodel.ProgressCourse;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.infomodel.SimpleAddressModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.DemoAspResponses.AllergyDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimBundleDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimItemDto;
import open.dolphin.rest.dto.DemoAspResponses.HealthInsuranceDto;
import open.dolphin.rest.dto.DemoAspResponses.LaboItemDto;
import open.dolphin.rest.dto.DemoAspResponses.LaboTestModule;
import open.dolphin.rest.dto.DemoAspResponses.LaboTestResponse;
import open.dolphin.rest.dto.DemoAspResponses.LaboTrendResponse;
import open.dolphin.rest.dto.DemoAspResponses.LaboTrendResult;
import open.dolphin.rest.dto.DemoAspResponses.ModuleResponse;
import open.dolphin.rest.dto.DemoAspResponses.PageInfo;
import open.dolphin.rest.dto.DemoAspResponses.PatientPackageResponse;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseDocument;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseResponse;
import open.dolphin.rest.dto.DemoAspResponses.PublicInsuranceDto;
import open.dolphin.rest.config.DemoApiSettings;
import open.dolphin.rest.config.DemoApiSettingsLoader;
import open.dolphin.touch.JsonTouchSharedService;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.IPatientVisitModel;
import open.dolphin.touch.converter.IRegisteredDiagnosis;
import open.dolphin.touch.converter.ISchemaModel;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.touch.TouchAuthHandler;
import open.dolphin.touch.support.TouchAuditHelper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.support.TouchRequestContextExtractor;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PVTPublicInsuranceItemModel;
import static open.dolphin.infomodel.IInfoModel.ROLE_P;
import static open.dolphin.infomodel.IInfoModel.ROLE_P_SPEC;
import static open.dolphin.infomodel.IInfoModel.ROLE_SOA_SPEC;

/**
 * JSON modernization of DemoResourceASP endpoints.
 */
@Path("/demo")
@Produces(MediaType.APPLICATION_JSON)
public class DemoResourceAsp extends open.dolphin.touch.AbstractResource {

    private static final String ELEMENT_MEMBER_TYPE = "memberType";
    private static final String TEST_PATIENT_PK1 = "33809";
    private static final String TEST_PATIENT_PK2 = "33813";
    private static final String TEST_PATIENT_PK3 = "33817";
    private static final String TEST_PATIENT_PK4 = "33821";
    private static final String TEST_PATIENT_PK5 = "33826";

    private static final String ACTION_USER_LOOKUP = "DEMO_USER_LOOKUP";
    private static final String ACTION_PATIENT_FIRST_VISIT = "DEMO_PATIENT_FIRST_VISIT";
    private static final String ACTION_PATIENT_VISIT = "DEMO_PATIENT_VISIT";
    private static final String ACTION_PATIENT_VISIT_RANGE = "DEMO_PATIENT_VISIT_RANGE";
    private static final String ACTION_PATIENT_VISIT_LAST = "DEMO_PATIENT_VISIT_LAST";
    private static final String ACTION_PATIENT_DETAIL = "DEMO_PATIENT_DETAIL";
    private static final String ACTION_PATIENT_PACKAGE = "DEMO_PATIENT_PACKAGE";
    private static final String ACTION_PATIENT_SEARCH = "DEMO_PATIENT_SEARCH";
    private static final String ACTION_MODULE_FETCH = "DEMO_MODULE_FETCH";
    private static final String ACTION_MODULE_RP = "DEMO_MODULE_RP";
    private static final String ACTION_MODULE_DIAGNOSIS = "DEMO_MODULE_DIAGNOSIS";
    private static final String ACTION_MODULE_SCHEMA = "DEMO_MODULE_SCHEMA";
    private static final String ACTION_MODULE_LAB = "DEMO_MODULE_LAB";
    private static final String ACTION_LAB_TREND = "DEMO_LAB_TREND";
    private static final String ACTION_PROGRESS_COURSE = "DEMO_PROGRESS_COURSE";

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.JAPAN);
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss", Locale.JAPAN);
    private static final DateTimeFormatter DATE_TIME_PARAM_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss", Locale.JAPAN);

    private static final DemoIdentifiers[] PAD_IDENTIFIERS = new DemoIdentifiers[] {
            new DemoIdentifiers(TEST_PATIENT_PK1, "00001"),
            new DemoIdentifiers(TEST_PATIENT_PK2, "00002"),
            new DemoIdentifiers(TEST_PATIENT_PK3, "00003"),
            new DemoIdentifiers(TEST_PATIENT_PK4, "00004"),
            new DemoIdentifiers(TEST_PATIENT_PK5, "00005")
    };

    private final Random random = new Random();
    private final DemoApiSettings settings;

    @Inject
    private IPhoneServiceBean iPhoneServiceBean;

    @Context
    private HttpServletRequest servletRequest;

    @Inject
    private TouchAuthHandler authHandler;

    @Inject
    private TouchAuditHelper auditHelper;

    public DemoResourceAsp() {
        this(new DemoApiSettingsLoader().load());
    }

    DemoResourceAsp(DemoApiSettings settings) {
        this.settings = settings;
    }

    @GET
    @Path("/user/{param}")
    public Response getUser(@PathParam("param") String param) {
        final String endpoint = "GET /demo/user/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length < 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain userId,facilityId,password");
        }
        String userId = trimToNull(params[0]);
        String facilityId = trimToNull(params[1]);
        String password = trimToNull(params[2]);
        boolean pad = params.length >= 4 && "pad".equalsIgnoreCase(trimToNull(params[3]));

        if (userId == null || facilityId == null || password == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "parameters must not be blank");
        }

        validateFacility(facilityId, endpoint);

        if (!settings.facilityId().equalsIgnoreCase(facilityId)
                || !settings.userId().equalsIgnoreCase(userId)
                || !settings.passwordMd5().equalsIgnoreCase(password)) {
            recordAudit(context, ACTION_USER_LOOKUP, "/demo/user",
                    detailsOf("facilityId", facilityId, "userId", userId, "pad", pad, "result", "mismatch"));
            throw failure(Response.Status.UNAUTHORIZED, endpoint, "credential mismatch");
        }

        UserModel user = new UserModel();
        user.setUserId(userId);
        user.setPassword(settings.passwordMd5());
        user.setCommonName(settings.userName());
        user.setMemberType(settings.memberType());
        user.setRegisteredDate(java.util.Date.from(Instant.now()));
        user.setEmail("ehr-touch@example.jp");

        if (pad) {
            FacilityModel padFacility = new FacilityModel();
            padFacility.setFacilityId(settings.padFacilityId());
            padFacility.setFacilityName(settings.padFacilityName());
            padFacility.setRegisteredDate(java.util.Date.from(Instant.now()));
            padFacility.setMemberType(settings.memberType());
            user.setFacilityModel(padFacility);
        } else {
            FacilityModel facility = new FacilityModel();
            facility.setFacilityId(settings.facilityId());
            facility.setFacilityName(settings.facilityName());
            facility.setRegisteredDate(java.util.Date.from(Instant.now()));
            facility.setMemberType(settings.memberType());
            user.setFacilityModel(facility);
        }

        IUserModel converter = new IUserModel();
        converter.setModel(user);
        recordAudit(context, ACTION_USER_LOOKUP, "/demo/user",
                detailsOf("facilityId", facilityId, "userId", userId, "pad", pad, "result", "success"));
        return Response.ok(converter).build();
    }

    @GET
    @Path("/patient/firstVisitors/{param}")
    public IPatientList getFirstVisitors(@PathParam("param") String param) {
        final String endpoint = "GET /demo/patient/firstVisitors/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length < 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,offset,count");
        }
        String facilityId = trimToNull(params[0]);
        boolean pad = params.length >= 4 && "pad".equalsIgnoreCase(trimToNull(params[3]));
        if (facilityId == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId must not be blank");
        }

        validateFacility(facilityId, endpoint);

        List<DemoPatient> source = safeList(iPhoneServiceBean.getFirstVisitorsDemo(150, 50));
        List<PatientModel> models = new ArrayList<>(source.size());
        LocalDate cursor = LocalDate.now();
        AtomicInteger padIndex = new AtomicInteger();
        for (DemoPatient demo : source) {
            DemoIdentifiers identifiers = pad ? nextPadIdentifier(padIndex.getAndIncrement()) :
                    new DemoIdentifiers(String.valueOf(demo.getId()), formatPatientId(demo.getId()));
            PatientModel patient = createPatientModel(demo, pad ? settings.padFacilityId() : facilityId,
                    identifiers.pk(), identifiers.patientId());
            cursor = cursor.minusDays(1);
            patient.setFirstVisited(toDate(cursor));
            models.add(patient);
        }
        IPatientList response = toPatientList(models);
        recordAudit(context, ACTION_PATIENT_FIRST_VISIT, "/demo/patient/firstVisitors",
                detailsOf("facilityId", facilityId, "pad", pad, "resultCount", models.size()));
        return response;
    }

    @GET
    @Path("/patient/visit/{param}")
    public List<IPatientVisitModel> getPatientVisit(@PathParam("param") String param) {
        final String endpoint = "GET /demo/patient/visit/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length != 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,offset,count");
        }
        String facilityId = trimToNull(params[0]);
        if (facilityId == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId must not be blank");
        }
        validateFacility(facilityId, endpoint);

        List<DemoPatient> source = safeList(iPhoneServiceBean.getPatientVisitDemo(0, 30));
        String pvtDate = DATE_FORMAT.format(LocalDate.now());
        List<IPatientVisitModel> visits = new ArrayList<>(source.size());
        for (DemoPatient demo : source) {
            DemoIdentifiers identifiers = new DemoIdentifiers(String.valueOf(demo.getId()), formatPatientId(demo.getId()));
            PatientModel patient = createPatientModel(demo, facilityId, identifiers.pk(), identifiers.patientId());
            PatientVisitModel visit = new PatientVisitModel();
            visit.setId(Long.parseLong(identifiers.pk()));
            visit.setFacilityId(facilityId);
            visit.setPatientModel(patient);
            visit.setPvtDate(pvtDate);
            visit.setState(0);
            visits.add(toPatientVisit(visit));
        }
        recordAudit(context, ACTION_PATIENT_VISIT, "/demo/patient/visit",
                detailsOf("facilityId", facilityId, "resultCount", visits.size()));
        return visits;
    }

    @GET
    @Path("/patient/visitRange/{param}")
    public List<IPatientVisitModel> getPatientVisitRange(@PathParam("param") String param) {
        final String endpoint = "GET /demo/patient/visitRange/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length < 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,start,...");
        }
        String facilityId = trimToNull(params[0]);
        String start = trimToNull(params[1]);
        int firstResult = params.length >= 6 ? parseInt(params[3], 0) : 0;
        int maxResult = params.length >= 6 ? (firstResult == 0 ? 60 : 1) : 60;
        boolean pad = params.length >= 6 && "pad".equalsIgnoreCase(trimToNull(params[5]));
        if (facilityId == null || start == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId and start must not be blank");
        }

        validateFacility(facilityId, endpoint);

        List<DemoPatient> source = safeList(iPhoneServiceBean.getPatientVisitRangeDemo(firstResult, maxResult));
        AtomicInteger padIndex = new AtomicInteger();
        List<IPatientVisitModel> visits = new ArrayList<>(source.size());
        LocalDate baseDate = parseDate(start.split(" ")[0]);
        int dummyHour = 9;
        int dummyMinute = 0;
        int processed = 0;
        for (DemoPatient demo : source) {
            DemoIdentifiers identifiers = pad ? nextPadIdentifier(padIndex.getAndAdd(1)) :
                    new DemoIdentifiers(String.valueOf(demo.getId()), formatPatientId(demo.getId()));
            PatientModel patient = createPatientModel(demo, facilityId, identifiers.pk(), identifiers.patientId());
            String dateTime = buildDateTime(baseDate, dummyHour, dummyMinute);
            PatientVisitModel visit = new PatientVisitModel();
            visit.setId(Long.parseLong(identifiers.pk()));
            visit.setFacilityId(facilityId);
            visit.setPatientModel(patient);
            visit.setPvtDate(dateTime);
            visit.setState(processed++ < 30 ? 1 : 0);
            visits.add(toPatientVisit(visit));

            dummyMinute += 5;
            if (dummyMinute >= 60) {
                dummyMinute = 0;
                dummyHour++;
            }
        }
        recordAudit(context, ACTION_PATIENT_VISIT_RANGE, "/demo/patient/visitRange",
                detailsOf("facilityId", facilityId, "start", start, "pad", pad,
                        "firstResult", firstResult, "maxResult", maxResult, "resultCount", visits.size()));
        return visits;
    }

    @GET
    @Path("/patient/visitLast/{param}")
    public List<IPatientVisitModel> getPatientVisitLast(@PathParam("param") String param) {
        final String endpoint = "GET /demo/patient/visitLast/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length < 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,start,...");
        }
        String facilityId = trimToNull(params[0]);
        String start = trimToNull(params[1]);
        boolean pad = params.length >= 4 && "pad".equalsIgnoreCase(trimToNull(params[3]));
        if (facilityId == null || start == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId and start must not be blank");
        }

        validateFacility(facilityId, endpoint);

        List<DemoPatient> source = safeList(iPhoneServiceBean.getPatientVisitRangeDemo(60, 70));
        AtomicInteger padIndex = new AtomicInteger();
        List<IPatientVisitModel> visits = new ArrayList<>(source.size());
        LocalDate baseDate = parseDate(start.split(" ")[0]);
        int dummyHour = 9;
        int dummyMinute = 0;
        int examDone = 0;
        for (DemoPatient demo : source) {
            DemoIdentifiers identifiers = pad ? nextPadIdentifier(padIndex.getAndIncrement()) :
                    new DemoIdentifiers(String.valueOf(demo.getId()), formatPatientId(demo.getId()));
            PatientModel patient = createPatientModel(demo, facilityId, identifiers.pk(), identifiers.patientId());
            String dateTime = buildDateTime(baseDate, dummyHour, dummyMinute);
            PatientVisitModel visit = new PatientVisitModel();
            visit.setId(Long.parseLong(identifiers.pk()));
            visit.setFacilityId(facilityId);
            visit.setPatientModel(patient);
            visit.setPvtDate(dateTime);
            visit.setState(examDone++ < 30 ? 1 : 0);
            visits.add(toPatientVisit(visit));

            dummyMinute += 5;
            if (dummyMinute >= 60) {
                dummyMinute = 0;
                dummyHour++;
            }
        }
        recordAudit(context, ACTION_PATIENT_VISIT_LAST, "/demo/patient/visitLast",
                detailsOf("facilityId", facilityId, "start", start, "pad", pad, "resultCount", visits.size()));
        return visits;
    }

    @GET
    @Path("/patient/{pk}")
    public IPatientModel getPatientById(@PathParam("pk") String pk) {
        final String endpoint = "GET /demo/patient/{pk}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        long id = parseLong(pk, 0L);
        DemoPatient demo = iPhoneServiceBean.getPatientDemo(id);
        if (demo == null) {
            recordAudit(context, ACTION_PATIENT_DETAIL, "/demo/patient/" + pk,
                    detailsOf("patientPk", pk, "found", false));
            return null;
        }
        PatientModel patient = createPatientModel(demo, settings.demoFacilityId(),
                String.valueOf(demo.getId()), formatPatientId(demo.getId()));
        IPatientModel result = toPatientModel(patient);
        recordAudit(context, ACTION_PATIENT_DETAIL, "/demo/patient/" + pk,
                detailsOf("patientPk", pk, "facilityId", patient.getFacilityId(), "found", true));
        return result;
    }

    @GET
    @Path("/patients/name/{param}")
    public IPatientList getPatientsByName(@PathParam("param") String param) {
        final String endpoint = "GET /demo/patients/name/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length < 4) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,keyword,first,max");
        }
        String facilityId = trimToNull(params[0]);
        String keyword = params[1] != null ? params[1].trim() : "";
        int firstResult = parseInt(params[2], 0);
        int maxResult = parseInt(params[3], 50);
        boolean pad = params.length >= 5 && "pad".equalsIgnoreCase(trimToNull(params[4]));
        if (facilityId == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId must not be blank");
        }

        validateFacility(facilityId, endpoint);

        List<DemoPatient> source;
        if (!keyword.isEmpty() && isHiragana(keyword.charAt(0))) {
            source = safeList(iPhoneServiceBean.getPatientsByKanaDemo(keyword, firstResult, maxResult));
        } else {
            source = safeList(iPhoneServiceBean.getPatientsByNameDemo(keyword, firstResult, maxResult));
        }

        List<PatientModel> models = new ArrayList<>(source.size());
        AtomicInteger padIndex = new AtomicInteger();
        for (DemoPatient demo : source) {
            DemoIdentifiers identifiers = pad ? nextPadIdentifier(padIndex.getAndIncrement()) :
                    new DemoIdentifiers(String.valueOf(demo.getId()), formatPatientId(demo.getId()));
            PatientModel patient = createPatientModel(demo, facilityId, identifiers.pk(), identifiers.patientId());
            models.add(patient);
        }
        IPatientList response = toPatientList(models);
        recordAudit(context, ACTION_PATIENT_SEARCH, "/demo/patients/name",
                detailsOf("facilityId", facilityId, "keyword", keyword, "pad", pad,
                        "firstResult", firstResult, "maxResult", maxResult, "resultCount", models.size()));
        return response;
    }

    @GET
    @Path("/patientPackage/{pk}")
    public PatientPackageResponse getPatientPackage(@PathParam("pk") String pk) {
        final String endpoint = "GET /demo/patientPackage/{pk}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        long id = parseLong(pk, -1L);
        if (id < 0) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "patientPk must be numeric");
        }
        PatientPackage pack = iPhoneServiceBean.getPatientPackage(id);
        if (pack == null || pack.getPatient() == null) {
            recordAudit(context, ACTION_PATIENT_PACKAGE, "/demo/patientPackage/" + pk,
                    detailsOf("patientPk", pk, "found", false));
            return null;
        }
        PatientModel patientModel = pack.getPatient();
        if (authHandler != null) {
            authHandler.verifyFacilityOwnership(servletRequest, patientModel.getFacilityId(), endpoint);
        }
        long kartePk = iPhoneServiceBean.getKartePKByPatientPK(patientModel.getId());
        JsonTouchSharedService.PatientModelSnapshot patientSnapshot =
                JsonTouchSharedService.snapshot(patientModel, kartePk);

        List<HealthInsuranceDto> insurances = new ArrayList<>();
        List<HealthInsuranceModel> rawIns = safeList(pack.getInsurances());
        for (HealthInsuranceModel model : rawIns) {
            Object decoded = IOSHelper.xmlDecode(model.getBeanBytes());
            if (decoded instanceof PVTHealthInsuranceModel health) {
                List<PublicInsuranceDto> publics = new ArrayList<>();
                PVTPublicInsuranceItemModel[] publicItems = health.getPVTPublicInsuranceItem();
                if (publicItems != null) {
                    for (PVTPublicInsuranceItemModel item : publicItems) {
                        publics.add(new PublicInsuranceDto(item.getPriority(), item.getProviderName(),
                                item.getProvider(), item.getRecipient(), item.getStartDate(), item.getExpiredDate(),
                                item.getPaymentRatio(), item.getPaymentRatioType()));
                    }
                }
                insurances.add(new HealthInsuranceDto(health.getInsuranceClass(), health.getInsuranceClassCode(),
                        health.getInsuranceClassCodeSys(), health.getInsuranceNumber(), health.getClientGroup(),
                        health.getClientNumber(), health.getFamilyClass(), health.getStartDate(),
                        health.getExpiredDate(), health.getPayInRatio(), health.getPayOutRatio(), publics));
            }
        }

        List<AllergyDto> allergies = new ArrayList<>();
        for (AllergyModel allergy : safeList(pack.getAllergies())) {
            allergies.add(new AllergyDto(allergy.getFactor(), allergy.getSeverity(), allergy.getIdentifiedDate()));
        }
        PatientPackageResponse response = new PatientPackageResponse(patientSnapshot, insurances, allergies);
        recordAudit(context, ACTION_PATIENT_PACKAGE, "/demo/patientPackage/" + pk,
                detailsOf("patientPk", pk, "insuranceCount", insurances.size(),
                        "allergyCount", allergies.size(), "facilityId", patientModel.getFacilityId(),
                        "kartePk", kartePk, "found", true));
        return response;
    }

    @GET
    @Path("/module/{param}")
    public ModuleResponse getModule(@PathParam("param") String param) {
        final String endpoint = "GET /demo/module/{param}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        String[] params = splitParams(param);
        if (params.length != 4) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain kartePk,entity,first,max");
        }
        long pk = parseLong(params[0], -1L);
        String entity = trimToNull(params[1]);
        int firstResult = parseInt(params[2], 0);
        int maxResult = parseInt(params[3], 20);

        if (pk < 0 || entity == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "kartePk and entity must be specified");
        }

        PageInfo pageInfo = null;
        if (firstResult == 0) {
            Long count = iPhoneServiceBean.getModuleCount(pk, entity);
            if (count != null) {
                pageInfo = new PageInfo(count.intValue());
            }
        }

        List<ModuleModel> modules = safeList(iPhoneServiceBean.getModules(pk, entity, firstResult, maxResult));
        List<ClaimBundleDto> bundles = new ArrayList<>(modules.size());
        for (ModuleModel module : modules) {
            Object decoded = IOSHelper.xmlDecode(module.getBeanBytes());
            if (!(decoded instanceof BundleDolphin bundle)) {
                continue;
            }
            populateOrderName(bundle, module);
            ClaimItem[] items = bundle.getClaimItem();
            List<ClaimItemDto> claimItems = new ArrayList<>();
            if (items != null) {
                for (ClaimItem item : items) {
                    claimItems.add(new ClaimItemDto(item.getName(), item.getNumber(), item.getUnit(),
                            bundle.getBundleNumber(), bundle.getAdmin()));
                }
            }
            String started = module.getStarted() != null ? DATE_FORMAT.format(toLocalDate(module.getStarted())) : null;
            bundles.add(new ClaimBundleDto(bundle.getOrderName(), entityToName(bundle.getOrderName()), started,
                    bundle.getBundleNumber(), bundle.getAdmin(), claimItems));
        }
        ModuleResponse response = new ModuleResponse(pageInfo, bundles);
        recordAudit(context, ACTION_MODULE_FETCH, "/demo/module",
                detailsOf("kartePk", pk, "entity", entity, "firstResult", firstResult,
                        "maxResult", maxResult, "resultCount", bundles.size()));
        return response;
    }

    @GET
    @Path("/module/rp/{param}")
    public List<ClaimBundleDto> getRp(@PathParam("param") String param) {
        final String endpoint = "GET /demo/module/rp/{param}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        String[] params = splitParams(param);
        if (params.length != 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain kartePk,first,max");
        }
        long pk = parseLong(params[0], -1L);
        int firstResult = parseInt(params[1], 0);
        int maxResult = parseInt(params[2], 20);

        if (pk < 0) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "kartePk must be numeric");
        }
        List<DemoRp> source = safeList(iPhoneServiceBean.getRpDemo());
        Collections.shuffle(source, random);
        List<ClaimBundleDto> bundles = new ArrayList<>();
        int index = 0;
        LocalDate anchor = LocalDate.now();
        for (int i = 0; i < 5 && index < source.size(); i++) {
            anchor = anchor.minusDays(14);
            List<ClaimItemDto> items = new ArrayList<>();
            for (int j = 0; j < 3 && index < source.size(); j++) {
                DemoRp rp = source.get(index++);
                items.add(new ClaimItemDto(rp.getName(), rp.getQuantity(), rp.getUnit(), String.valueOf(i + 3),
                        administrationLabel(i)));
            }
            bundles.add(new ClaimBundleDto(ENTITY_MED_ORDER, entityToName(ENTITY_MED_ORDER),
                    DATE_FORMAT.format(anchor), String.valueOf(i + 3), administrationLabel(i), items));
        }
        recordAudit(context, ACTION_MODULE_RP, "/demo/module/rp",
                detailsOf("kartePk", pk, "firstResult", firstResult, "maxResult", maxResult,
                        "resultCount", bundles.size()));
        return bundles;
    }

    @GET
    @Path("/module/diagnosis/{param}")
    public List<IRegisteredDiagnosis> getDiagnosis(@PathParam("param") String param) {
        final String endpoint = "GET /demo/module/diagnosis/{param}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        String[] params = splitParams(param);
        if (params.length != 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain kartePk,first,max");
        }
        long pk = parseLong(params[0], -1L);
        int firstResult = parseInt(params[1], 0);
        int maxResult = parseInt(params[2], 10);
        if (pk < 0) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "kartePk must be numeric");
        }
        List<DemoDisease> diseases = safeList(iPhoneServiceBean.getDiagnosisDemo());
        Collections.shuffle(diseases, random);
        List<IRegisteredDiagnosis> result = new ArrayList<>();
        LocalDate startAnchor = LocalDate.now();
        LocalDate endAnchor = LocalDate.now();
        for (int i = firstResult; i < Math.min(diseases.size(), firstResult + maxResult); i++) {
            DemoDisease disease = diseases.get(i);
            RegisteredDiagnosisModel model = new RegisteredDiagnosisModel();
            model.setDiagnosis(disease.getDisease());
            model.setCategory("主病名");
            startAnchor = startAnchor.minusDays(14);
            model.setStarted(toDate(startAnchor));
            if (result.size() >= 2) {
                String outcome = (result.size() % 3 != 0) ? "治癒" : "中止";
                model.setOutcome(outcome);
                endAnchor = endAnchor.minusDays(7);
                model.setEnded(toDate(endAnchor));
            }
            IRegisteredDiagnosis converter = new IRegisteredDiagnosis();
            converter.fromModel(model);
            result.add(converter);
        }
        recordAudit(context, ACTION_MODULE_DIAGNOSIS, "/demo/module/diagnosis",
                detailsOf("kartePk", pk, "firstResult", firstResult, "maxResult", maxResult,
                        "resultCount", result.size()));
        return result;
    }

    @GET
    @Path("/module/schema/{param}")
    public List<ISchemaModel> getSchema(@PathParam("param") String param) {
        final String endpoint = "GET /demo/module/schema/{param}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        String[] params = splitParams(param);
        if (params.length != 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain kartePk,first,max");
        }
        long pk = parseLong(params[0], -1L);
        int firstResult = parseInt(params[1], 0);
        int maxResult = parseInt(params[2], 10);
        if (pk < 0) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "kartePk must be numeric");
        }
        List<SchemaModel> schemas = safeList(iPhoneServiceBean.getSchema(pk, firstResult, maxResult));
        List<ISchemaModel> result = new ArrayList<>(schemas.size());
        for (SchemaModel schema : schemas) {
            ISchemaModel converter = new ISchemaModel();
            converter.fromModel(schema);
            result.add(converter);
        }
        recordAudit(context, ACTION_MODULE_SCHEMA, "/demo/module/schema",
                detailsOf("kartePk", pk, "firstResult", firstResult, "maxResult", maxResult,
                        "resultCount", result.size()));
        return result;
    }

    @GET
    @Path("/module/laboTest/{param}")
    public LaboTestResponse getLaboTest(@PathParam("param") String param) {
        final String endpoint = "GET /demo/module/laboTest/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length != 4) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,patientId,first,max");
        }
        String facilityId = trimToNull(params[0]);
        String patientId = trimToNull(params[1]);
        int firstResult = parseInt(params[2], 0);
        int maxResult = parseInt(params[3], 20);
        if (facilityId == null || patientId == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId and patientId must not be blank");
        }

        validateFacility(facilityId, endpoint);
        Long count = null;
        if (firstResult == 0) {
            count = iPhoneServiceBean.getLabTestCount(settings.demoFacilityId(), settings.demoPatientId());
        }
        List<NLaboModule> modules = safeList(iPhoneServiceBean.getLaboTest(settings.demoFacilityId(),
                settings.demoPatientId(), firstResult, maxResult));
        List<LaboTestModule> moduleDtos = new ArrayList<>(modules.size());
        LocalDate anchor = LocalDate.now();
        for (NLaboModule module : modules) {
            anchor = anchor.minusDays(14);
            List<LaboItemDto> items = new ArrayList<>();
            for (NLaboItem item : safeList(module.getItems())) {
                String fallbackComment2 = fallbackComment2(item);
                items.add(new LaboItemDto(item.getGroupCode(), item.getGroupName(), item.getParentCode(),
                        item.getItemCode(), item.getMedisCode(), item.getItemName(), item.getNormalValue(),
                        item.getUnit(), item.getValue(), item.getAbnormalFlg(), item.getComment1(), fallbackComment2));
            }
            moduleDtos.add(new LaboTestModule(module.getLaboCenterCode(), DATE_FORMAT.format(anchor),
                    module.getPatientId(), items));
        }
        PageInfo pageInfo = count != null ? new PageInfo(count.intValue()) : null;
        LaboTestResponse response = new LaboTestResponse(pageInfo, moduleDtos);
        recordAudit(context, ACTION_MODULE_LAB, "/demo/module/laboTest",
                detailsOf("facilityId", facilityId, "patientId", patientId, "firstResult", firstResult,
                        "maxResult", maxResult, "resultCount", moduleDtos.size()));
        return response;
    }

    @GET
    @Path("/item/laboItem/{param}")
    public LaboTrendResponse getLaboGraph(@PathParam("param") String param) {
        final String endpoint = "GET /demo/item/laboItem/{param}";
        TouchRequestContext context = requireContext(endpoint);
        String[] params = splitParams(param);
        if (params.length != 5) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain facilityId,patientId,first,max,itemCode");
        }
        String facilityId = trimToNull(params[0]);
        String patientId = trimToNull(params[1]);
        int firstResult = parseInt(params[2], 0);
        int maxResult = parseInt(params[3], 20);
        String itemCode = trimToNull(params[4]);
        if (facilityId == null || patientId == null || itemCode == null) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId, patientId and itemCode must not be blank");
        }

        validateFacility(facilityId, endpoint);
        List<NLaboItem> items = safeList(iPhoneServiceBean.getLaboTestItem(settings.demoFacilityId(),
                settings.demoPatientId(), firstResult, maxResult, itemCode));
        if (items.isEmpty()) {
            recordAudit(context, ACTION_LAB_TREND, "/demo/item/laboItem",
                    detailsOf("facilityId", facilityId, "patientId", patientId, "itemCode", itemCode,
                            "firstResult", firstResult, "maxResult", maxResult, "resultCount", 0));
            return null;
        }
        NLaboItem header = items.get(items.size() - 1);
        List<LaboTrendResult> results = new ArrayList<>();
        LocalDate anchor = LocalDate.now();
        for (NLaboItem item : items) {
            anchor = anchor.minusDays(14);
            results.add(new LaboTrendResult(DATE_FORMAT.format(anchor), item.getValue(),
                    item.getComment1(), fallbackComment2(item)));
        }
        LaboTrendResponse response = new LaboTrendResponse(header.getItemCode(), header.getItemName(), header.getNormalValue(),
                header.getUnit(), results);
        recordAudit(context, ACTION_LAB_TREND, "/demo/item/laboItem",
                detailsOf("facilityId", facilityId, "patientId", patientId, "itemCode", itemCode,
                        "firstResult", firstResult, "maxResult", maxResult, "resultCount", results.size()));
        return response;
    }

    @GET
    @Path("/document/progressCourse/{param}")
    public ProgressCourseResponse getProgressCourse(@PathParam("param") String param) {
        final String endpoint = "GET /demo/document/progressCourse/{param}";
        TouchRequestContext context = requireContext(endpoint);
        ensureFacilityHeader(endpoint);
        String[] params = splitParams(param);
        if (params.length != 3) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "param must contain patientPk,first,max");
        }
        long patientPk = parseLong(params[0], -1L);
        int firstResult = parseInt(params[1], 0);
        int maxResult = parseInt(params[2], 10);
        if (patientPk < 0) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "patientPk must be numeric");
        }

        PageInfo pageInfo = null;
        if (firstResult == 0) {
            pageInfo = new PageInfo(progressDocumentCount(patientPk));
        }

        List<DocumentModel> documents = safeList(iPhoneServiceBean.getDocuments(patientPk, firstResult, maxResult));
        List<ProgressCourseDocument> result = new ArrayList<>(documents.size());
        for (DocumentModel doc : documents) {
            String started = doc.getStarted() != null ? DATE_FORMAT.format(toLocalDate(doc.getStarted())) : null;
            String responsibility = doc.getUserModel() != null ? doc.getUserModel().getCommonName() : null;

            List<ClaimBundleDto> orders = new ArrayList<>();
            List<String> soaTexts = new ArrayList<>();
            List<ISchemaModel> schemas = new ArrayList<>();

            String soaSpec = null;
            String pSpec = null;

            for (ModuleModel module : safeCollection(doc.getModules())) {
                Object decoded = IOSHelper.xmlDecode(module.getBeanBytes());
                String role = module.getModuleInfoBean() != null ? module.getModuleInfoBean().getStampRole() : null;

                if (ROLE_SOA_SPEC.equals(role) && decoded instanceof ProgressCourse progress) {
                    soaSpec = progress.getFreeText();
                } else if (ROLE_P_SPEC.equals(role) && decoded instanceof ProgressCourse progress) {
                    pSpec = progress.getFreeText();
                } else if (ROLE_P.equals(role) && decoded instanceof BundleDolphin bundle) {
                    populateOrderName(bundle, module);
                    orders.add(toClaimBundle(bundle, module.getStarted()));
                }
            }

            if (soaSpec != null && pSpec != null && soaSpec.contains(NAME_STAMP_HOLDER)) {
                String tmp = soaSpec;
                soaSpec = pSpec;
                pSpec = tmp;
            }

            if (soaSpec != null && !soaSpec.isEmpty()) {
                StringBuilder text = new StringBuilder();
                renderPane(text, soaSpec);
                soaTexts.add(text.toString());
            }

            for (SchemaModel schema : safeCollection(doc.getSchema())) {
                ISchemaModel converter = new ISchemaModel();
                converter.fromModel(schema);
                schemas.add(converter);
            }

            result.add(new ProgressCourseDocument(started, responsibility, soaTexts, orders, schemas));
        }
        ProgressCourseResponse response = new ProgressCourseResponse(pageInfo, result);
        recordAudit(context, ACTION_PROGRESS_COURSE, "/demo/document/progressCourse",
                detailsOf("patientPk", patientPk, "firstResult", firstResult, "maxResult", maxResult,
                        "resultCount", result.size()));
        return response;
    }

    private ClaimBundleDto toClaimBundle(BundleDolphin bundle, java.util.Date startedDate) {
        ClaimItem[] items = bundle.getClaimItem();
        List<ClaimItemDto> claimItems = new ArrayList<>();
        if (items != null) {
            for (ClaimItem item : items) {
                claimItems.add(new ClaimItemDto(item.getName(), item.getNumber(), item.getUnit(),
                        bundle.getBundleNumber(), bundle.getAdmin()));
            }
        }
        String started = startedDate != null ? DATE_FORMAT.format(toLocalDate(startedDate)) : null;
        return new ClaimBundleDto(bundle.getOrderName(), entityToName(bundle.getOrderName()), started,
                bundle.getBundleNumber(), bundle.getAdmin(), claimItems);
    }

    private static IPatientList toPatientList(List<PatientModel> models) {
        PatientList list = new PatientList();
        list.setList(models);
        IPatientList response = new IPatientList();
        response.setModel(list);
        return response;
    }

    private static IPatientModel toPatientModel(PatientModel model) {
        IPatientModel converter = new IPatientModel();
        converter.setModel(model);
        return converter;
    }

    private static IPatientVisitModel toPatientVisit(PatientVisitModel model) {
        IPatientVisitModel converter = new IPatientVisitModel();
        converter.setModel(model);
        return converter;
    }

    private TouchRequestContext requireContext(String endpoint) {
        ensureEnabled(endpoint);
        if (servletRequest == null) {
            throw failure(Response.Status.INTERNAL_SERVER_ERROR, endpoint, "servlet request not available");
        }
        try {
            TouchRequestContext context = TouchRequestContextExtractor.from(servletRequest);
            validateUserHeaders(context, endpoint);
            return context;
        } catch (IllegalStateException ex) {
            throw failure(Response.Status.UNAUTHORIZED, endpoint, ex.getMessage());
        }
    }

    private void ensureEnabled(String endpoint) {
        if (settings != null && !settings.enabled()) {
            throw failure(Response.Status.NOT_FOUND, endpoint, "demo API disabled");
        }
    }

    private void validateFacility(String facilityId, String endpoint) {
        if (!hasText(facilityId)) {
            throw failure(Response.Status.BAD_REQUEST, endpoint, "facilityId must not be blank");
        }
        if (authHandler != null) {
            String headerFacility = authHandler.requireFacilityHeader(servletRequest, endpoint);
            if (hasText(headerFacility) && !headerFacility.equalsIgnoreCase(facilityId)) {
                throw failure(Response.Status.FORBIDDEN, endpoint,
                        "facilityId mismatch header=" + headerFacility + " param=" + facilityId);
            }
            authHandler.verifyFacilityOwnership(servletRequest, facilityId, endpoint);
        }
    }

    private void ensureFacilityHeader(String endpoint) {
        if (authHandler != null) {
            authHandler.requireFacilityHeader(servletRequest, endpoint);
        }
    }

    private void validateUserHeaders(TouchRequestContext context, String endpoint) {
        if (context == null || !hasText(context.remoteUser())) {
            throw failure(Response.Status.UNAUTHORIZED, endpoint, "remote user not available");
        }
    }

    private String header(String name) {
        if (servletRequest == null || name == null) {
            return null;
        }
        return trimToNull(servletRequest.getHeader(name));
    }

    private PatientModel createPatientModel(DemoPatient demo, String facilityId, String pk, String patientId) {
        PatientModel model = new PatientModel();
        long numericPk = parseLong(pk, demo.getId() != null ? demo.getId() : 0L);
        model.setId(numericPk);
        model.setFacilityId(facilityId);
        model.setPatientId(patientId);
        model.setFullName(demo.getName());
        model.setKanaName(demo.getKana());
        String gender = sexValueToDesc(defaultString(demo.getSex(), "U"));
        model.setGender(gender);
        model.setGenderDesc(gender);
        if (demo.getBirthday() != null) {
            model.setBirthday(toIsoBirtday(demo.getBirthday()));
        }
        SimpleAddressModel address = new SimpleAddressModel();
        address.setAddress(demo.getAddress());
        address.setZipCode(demo.getAddressCode());
        model.setSimpleAddressModel(address);
        model.setTelephone(demo.getTelephone());
        model.setMobilePhone(demo.getMobile());
        model.setEmail(demo.getEmail());
        return model;
    }

    private static String buildDateTime(LocalDate date, int hour, int minute) {
        LocalDateTime dateTime = date.atTime(hour, minute);
        return DATE_TIME_FORMAT.format(dateTime);
    }

    private static java.util.Date toDate(LocalDate date) {
        return java.util.Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    private static LocalDate toLocalDate(java.util.Date date) {
        return Instant.ofEpochMilli(date.getTime()).atZone(ZoneId.systemDefault()).toLocalDate();
    }

    private static LocalDate parseDate(String date) {
        return LocalDate.parse(date, DATE_FORMAT);
    }

    private static DemoIdentifiers nextPadIdentifier(int index) {
        return PAD_IDENTIFIERS[index % PAD_IDENTIFIERS.length];
    }

    private static String formatPatientId(Long id) {
        long value = id != null ? id : 0L;
        return String.format(Locale.JAPAN, "%05d", value);
    }

    private static String formatPatientId(long id) {
        return String.format(Locale.JAPAN, "%05d", Math.max(0, id));
    }

    private static String defaultString(String value, String fallback) {
        return value != null ? value : fallback;
    }

    private static boolean isHiragana(char ch) {
        return ch >= '\u3040' && ch <= '\u309F';
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static long parseLong(String value, long fallback) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static <T> List<T> safeList(List<T> items) {
        return items != null ? items : Collections.emptyList();
    }

    private static <T> Iterable<T> safeCollection(Iterable<T> collection) {
        return collection != null ? collection : Collections.emptyList();
    }

    private static String[] splitParams(String param) {
        return param != null ? param.split(",") : new String[0];
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String fallbackComment2(NLaboItem item) {
        if (item == null) {
            return null;
        }
        String comment2 = item.getComment2();
        if (hasText(comment2)) {
            return comment2;
        }
        return item.getComment1();
    }

    private static void populateOrderName(BundleDolphin bundle, ModuleModel module) {
        if (bundle == null || module == null) {
            return;
        }
        ModuleInfoBean info = module.getModuleInfoBean();
        if (info != null && hasText(info.getEntity())) {
            bundle.setOrderName(info.getEntity());
        }
    }

    private WebApplicationException failure(Response.Status status, String endpoint, String message) {
        Response.Status actual = status != null ? status : Response.Status.INTERNAL_SERVER_ERROR;
        StringBuilder builder = new StringBuilder();
        builder.append(actual.getStatusCode()).append(' ');
        builder.append(endpoint != null ? endpoint : "unknown-endpoint");
        if (hasText(message)) {
            builder.append(" : ").append(message);
        }
        Response response = Response.status(actual)
                .type(MediaType.TEXT_PLAIN_TYPE)
                .entity(builder.toString())
                .build();
        return new WebApplicationException(response);
    }

    private Map<String, Object> detailsOf(Object... keyValues) {
        if (keyValues == null || keyValues.length == 0) {
            return Map.of();
        }
        Map<String, Object> details = new HashMap<>();
        for (int i = 0; i + 1 < keyValues.length; i += 2) {
            Object key = keyValues[i];
            Object value = keyValues[i + 1];
            if (key != null && value != null) {
                details.put(key.toString(), value);
            }
        }
        return details;
    }

    private void recordAudit(TouchRequestContext context, String action, String resource, Map<String, Object> details) {
        if (auditHelper != null && context != null && hasText(action) && hasText(resource)) {
            auditHelper.record(context, action, resource, details);
        }
    }

    private static int progressDocumentCount(long patientPk) {
        if (patientPk == Long.parseLong(TEST_PATIENT_PK1)) {
            return 9;
        } else if (patientPk == Long.parseLong(TEST_PATIENT_PK2)) {
            return 8;
        } else if (patientPk == Long.parseLong(TEST_PATIENT_PK3)) {
            return 7;
        } else if (patientPk == Long.parseLong(TEST_PATIENT_PK4)) {
            return 6;
        } else if (patientPk == Long.parseLong(TEST_PATIENT_PK5)) {
            return 5;
        }
        return 4;
    }

    private static String administrationLabel(int index) {
        return switch (index) {
            case 0 -> "医師の指示通りに";
            case 1 -> "1日3回毎食後に";
            case 2 -> "就寝前に";
            case 3 -> "1日3回食間に";
            default -> "1日1回朝食後に";
        };
    }

    private record DemoIdentifiers(String pk, String patientId) {
    }
}
