package open.dolphin.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.BundleMed;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DemoDisease;
import open.dolphin.infomodel.DemoPatient;
import open.dolphin.infomodel.DemoRp;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.ExtRefModel;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientPackage;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PVTPublicInsuranceItemModel;
import open.dolphin.infomodel.ProgressCourse;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.DemoAspResponses.AllergyDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimBundleDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimItemDto;
import open.dolphin.rest.dto.DemoAspResponses.LaboTestResponse;
import open.dolphin.rest.dto.DemoAspResponses.LaboTrendResponse;
import open.dolphin.rest.dto.DemoAspResponses.ModuleResponse;
import open.dolphin.rest.dto.DemoAspResponses.PatientPackageResponse;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseDocument;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseResponse;
import open.dolphin.rest.config.DemoApiSettings;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.IPatientVisitModel;
import open.dolphin.touch.converter.IRegisteredDiagnosis;
import open.dolphin.touch.converter.ISchemaModel;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import open.dolphin.touch.TouchAuthHandler;
import open.dolphin.touch.support.TouchRequestContextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DemoResourceAspTest extends RuntimeDelegateTestSupport {

    @Mock
    private IPhoneServiceBean service;

    @Mock
    private HttpServletRequest request;

    private DemoResourceAsp resource;
    private TouchAuthHandler authHandler;
    private ObjectMapper objectMapper;
    private DemoApiSettings settings;

    private static final String FACILITY_ID = "2.100";
    private static final String USER_ID = "ehrTouch";
    private static final String PASSWORD_MD5 = "098f6bcd4621d373cade4e832627b4f6";
    private static final String CLIENT_UUID = "11111111-1111-1111-1111-111111111111";

    @BeforeEach
    void setUp() throws Exception {
        settings = new DemoApiSettings(
                true,
                FACILITY_ID,
                "EHR クリニック",
                "1.3.6.1.4.1.9414.2.100",
                "EHR クリニック",
                USER_ID,
                "EHR",
                PASSWORD_MD5,
                "touchTester",
                "1.3.6.1.4.1.9414.2.1",
                "00001"
        );
        resource = new DemoResourceAsp(settings);
        setField(resource, "iPhoneServiceBean", service);
        setField(resource, "servletRequest", request);
        authHandler = new TouchAuthHandler();
        setField(resource, "authHandler", authHandler);
        setField(resource, "random", new Random(0L));
        objectMapper = new ObjectMapper();
        lenient().when(request.getHeader(TouchRequestContextExtractor.HEADER_TRACE_ID)).thenReturn("trace-asp");
        lenient().when(request.getHeader(TouchRequestContextExtractor.HEADER_ACCESS_REASON)).thenReturn(null);
        lenient().when(request.getHeader(TouchRequestContextExtractor.HEADER_CONSENT_TOKEN)).thenReturn(null);
        lenient().when(request.getHeader("User-Agent")).thenReturn("JUnit");
        lenient().when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        lenient().when(request.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    private void configureAuth(String facilityId, String userId) {
        String remoteUser = facilityId + ":" + userId;
        lenient().when(request.getRemoteUser()).thenReturn(remoteUser);
        lenient().when(request.getHeader("userName")).thenReturn(remoteUser);
        lenient().when(request.getHeader("password")).thenReturn(PASSWORD_MD5);
        lenient().when(request.getHeader("clientUUID")).thenReturn(CLIENT_UUID);
        lenient().when(request.getHeader(TouchAuthHandler.FACILITY_HEADER)).thenReturn(facilityId);
    }

    private void assertMatchesFixture(String fixtureName, Object actual) throws IOException {
        assertMatchesFixture(fixtureName, actual, Map.of());
    }

    private void assertMatchesFixture(String fixtureName, Object actual, Map<String, String> placeholders)
            throws IOException {
        Path path = Path.of("src", "test", "resources", "fixtures", "demoresourceasp", fixtureName);
        String content = Files.readString(path, StandardCharsets.UTF_8);
        if (placeholders != null) {
            for (Map.Entry<String, String> entry : placeholders.entrySet()) {
                content = content.replace(entry.getKey(), entry.getValue());
            }
        }
        Map<String, String> expected = objectMapper.readValue(content, new TypeReference<>() {});
        JsonNode actualNode = objectMapper.valueToTree(actual);
        for (Map.Entry<String, String> entry : expected.entrySet()) {
            JsonNode node = actualNode.at(entry.getKey());
            assertThat(node).as("Pointer %s", entry.getKey()).isNotNull();
            assertThat(node.isMissingNode()).as("Pointer %s", entry.getKey()).isFalse();
            assertThat(node.asText()).as("Pointer %s", entry.getKey()).isEqualTo(entry.getValue());
        }
    }

    @Test
    void getUserReturnsUserWhenCredentialsMatch() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);

        Response response = resource.getUser(USER_ID + "," + FACILITY_ID + "," + PASSWORD_MD5);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getEntity()).isInstanceOf(open.dolphin.adm10.converter.IUserModel.class);
        assertMatchesFixture("demo_user_success.json", response.getEntity());
    }

    @Test
    void getUserThrowsWhenPasswordHeaderMismatch() {
        configureAuth(FACILITY_ID, USER_ID);
        lenient().when(request.getHeader("password")).thenReturn("deadbeefdeadbeefdeadbeefdeadbeef");

        assertThatThrownBy(() -> resource.getUser(USER_ID + "," + FACILITY_ID + "," + PASSWORD_MD5))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(401));
    }

    @Test
    void getUserThrowsWhenFacilityHeaderMismatch() {
        configureAuth(FACILITY_ID, USER_ID);
        when(request.getHeader(TouchAuthHandler.FACILITY_HEADER)).thenReturn("3.300");

        assertThatThrownBy(() -> resource.getUser(USER_ID + "," + FACILITY_ID + "," + PASSWORD_MD5))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(403));
    }

    @Test
    void getFirstVisitorsMapsDemoPatientsToPatientModels() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(1L);
        demo.setName("田中 太郎");
        demo.setKana("タナカタロウ");
        demo.setSex("M");
        demo.setBirthday("1980/01/02");
        demo.setAddress("東京都千代田区");
        demo.setAddressCode("1000001");
        demo.setTelephone("03-0000-0000");
        demo.setMobile("090-0000-0000");
        demo.setEmail("demo@example.com");
        when(service.getFirstVisitorsDemo(anyInt(), anyInt())).thenReturn(List.of(demo));

        IPatientList list = resource.getFirstVisitors(FACILITY_ID + ",0,20");

        assertThat(list.getList()).hasSize(1);
        String yesterday = LocalDate.now().minusDays(1).toString();
        assertMatchesFixture("demo_patient_first_visitors.json", list,
                Map.of("{{YESTERDAY}}", yesterday));
    }

    @Test
    void getFirstVisitorsThrowsWhenFacilityBlank() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getFirstVisitors(",0,20"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getFirstVisitorsPadReturnsSylkFacility() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(1L);
        demo.setName("田中 太郎");
        demo.setKana("タナカタロウ");
        demo.setSex("M");
        demo.setBirthday("1980/01/02");
        when(service.getFirstVisitorsDemo(anyInt(), anyInt())).thenReturn(List.of(demo));

        IPatientList list = resource.getFirstVisitors(FACILITY_ID + ",0,20,pad");
        assertMatchesFixture("demo_patient_first_visitors_pad.json", list);
    }

    @Test
    void getPatientPackageConvertsHealthInsurance() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        PatientModel patient = new PatientModel();
        patient.setId(10L);
        patient.setFacilityId("2.100");
        patient.setPatientId("00010");
        patient.setFullName("患者 一郎");

        PVTHealthInsuranceModel insurance = new PVTHealthInsuranceModel();
        insurance.setInsuranceClass("社保");
        insurance.setInsuranceClassCode("01");
        insurance.setInsuranceClassCodeSys("SYS");
        insurance.setInsuranceNumber("A001");
        insurance.setClientGroup("G");
        insurance.setClientNumber("123");
        insurance.setFamilyClass("本人");
        insurance.setStartDate("2024-01-01");
        insurance.setExpiredDate("2025-01-01");
        insurance.setPayInRatio("80");
        insurance.setPayOutRatio("20");

        PVTPublicInsuranceItemModel publicItem = new PVTPublicInsuranceItemModel();
        publicItem.setPriority("1");
        publicItem.setProviderName("自治体");
        publicItem.setProvider("P");
        publicItem.setRecipient("R");
        publicItem.setStartDate("2024-01-01");
        publicItem.setExpiredDate("2024-12-31");
        publicItem.setPaymentRatio("70");
        publicItem.setPaymentRatioType("割合");
        insurance.setPVTPublicInsuranceItem(new PVTPublicInsuranceItemModel[] { publicItem });

        HealthInsuranceModel stored = new HealthInsuranceModel();
        stored.setBeanBytes(IOSHelper.toXMLBytes(insurance));

        AllergyModel allergy = new AllergyModel();
        allergy.setFactor("ペニシリン");
        allergy.setSeverity("強" );
        allergy.setIdentifiedDate("2020-01-01");

        PatientPackage pack = new PatientPackage();
        pack.setPatient(patient);
        pack.setInsurances(List.of(stored));
        pack.setAllergies(List.of(allergy));

        when(service.getPatientPackage(10L)).thenReturn(pack);

        PatientPackageResponse response = resource.getPatientPackage("10");
        assertThat(response).isNotNull();
        assertMatchesFixture("demo_patient_package.json", response);
    }

    @Test
    void getPatientPackageRejectsNegativePk() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getPatientPackage("-1"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getModuleBuildsClaimBundle() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        ModuleModel module = new ModuleModel();
        module.setStarted(java.util.Date.from(LocalDate.of(2024, 4, 10).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        ModuleInfoBean info = new ModuleInfoBean();
        info.setEntity("treatmentOrder");
        info.setStampRole("p");
        module.setModuleInfoBean(info);

        BundleMed bundle = new BundleMed();
        bundle.setOrderName("treatmentOrder");
        bundle.setBundleNumber("7");
        bundle.setAdmin("1日3回毎食後に");
        ClaimItem item = new ClaimItem();
        item.setName("アセトアミノフェン");
        item.setNumber("3");
        item.setUnit("錠");
        bundle.addClaimItem(item);
        module.setBeanBytes(IOSHelper.toXMLBytes(bundle));

        when(service.getModuleCount(eq(1L), eq("treatmentOrder"))).thenReturn(1L);
        when(service.getModules(eq(1L), eq("treatmentOrder"), eq(0), eq(20))).thenReturn(List.of(module));

        ModuleResponse response = resource.getModule("1,treatmentOrder,0,20");
        assertThat(response.getModules()).hasSize(1);
        assertMatchesFixture("demo_module_response.json", response);
    }

    @Test
    void getModuleRejectsInvalidParams() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getModule("1,treatmentOrder,0"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getRpBuildsBundles() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoRp rp1 = new DemoRp();
        rp1.setName("アモキシシリン");
        rp1.setQuantity("3");
        rp1.setUnit("cap");
        DemoRp rp2 = new DemoRp();
        rp2.setName("整腸剤");
        rp2.setQuantity("1");
        rp2.setUnit("pkg");
        DemoRp rp3 = new DemoRp();
        rp3.setName("睡眠薬");
        rp3.setQuantity("1");
        rp3.setUnit("tab");
        List<DemoRp> rps = new ArrayList<>(List.of(rp1, rp2, rp3));
        when(service.getRpDemo()).thenReturn(rps);

        List<ClaimBundleDto> bundles = resource.getRp("55,0,10");
        assertThat(bundles).isNotEmpty();
        assertMatchesFixture("demo_module_rp.json", bundles);
    }

    @Test
    void getRpRejectsInvalidPk() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getRp("-1,0,10"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getSchemaReturnsConverters() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        SchemaModel schema = new SchemaModel();
        schema.setJpegByte(new byte[] {1, 2, 3});
        ExtRefModel extRef = new ExtRefModel();
        extRef.setContentType("image/jpeg");
        schema.setExtRefModel(extRef);
        when(service.getSchema(42L, 0, 10)).thenReturn(List.of(schema));

        List<ISchemaModel> schemas = resource.getSchema("42,0,10");
        assertMatchesFixture("demo_module_schema.json", schemas);
    }

    @Test
    void getSchemaRejectsInvalidParams() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getSchema("42,0"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getProgressCourseCollectsNotesOrdersAndSchemas() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DocumentModel document = new DocumentModel();
        document.setStarted(java.util.Date.from(LocalDate.of(2024, 5, 1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        UserModel user = new UserModel();
        user.setCommonName("担当 医師");
        document.setUserModel(user);

        ProgressCourse progress = new ProgressCourse();
        progress.setFreeText("<progress><section><paragraph><content><text>頭痛訴え</text></content></paragraph></section></progress>");
        ModuleModel soaModule = new ModuleModel();
        ModuleInfoBean soaInfo = new ModuleInfoBean();
        soaInfo.setStampRole("soaSpec");
        soaModule.setModuleInfoBean(soaInfo);
        soaModule.setBeanBytes(IOSHelper.toXMLBytes(progress));

        BundleMed bundle = new BundleMed();
        bundle.setOrderName("medOrder");
        bundle.setBundleNumber("3");
        bundle.setAdmin("就寝前に");
        ClaimItem item = new ClaimItem();
        item.setName("睡眠薬");
        item.setNumber("1");
        item.setUnit("錠");
        bundle.addClaimItem(item);
        ModuleModel orderModule = new ModuleModel();
        ModuleInfoBean orderInfo = new ModuleInfoBean();
        orderInfo.setStampRole("p");
        orderModule.setModuleInfoBean(orderInfo);
        orderModule.setBeanBytes(IOSHelper.toXMLBytes(bundle));

        SchemaModel schema = new SchemaModel();
        schema.setJpegByte(new byte[] {1, 2, 3});
        ExtRefModel extRef = new ExtRefModel();
        extRef.setContentType("image/jpeg");
        schema.setExtRefModel(extRef);

        document.setModules(List.of(soaModule, orderModule));
        document.setSchema(List.of(schema));

        when(service.getDocuments(eq(100L), eq(0), eq(10))).thenReturn(List.of(document));

        ProgressCourseResponse response = resource.getProgressCourse("100,0,10");
        assertThat(response.getDocuments()).hasSize(1);
        assertMatchesFixture("demo_progress_course.json", response);
    }

    @Test
    void getProgressCourseRejectsInvalidPatientPk() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getProgressCourse("-1,0,10"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getLaboTestProducesModules() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        NLaboItem item = new NLaboItem();
        item.setGroupCode("G1");
        item.setGroupName("血液");
        item.setParentCode("P1");
        item.setItemCode("I1");
        item.setMedisCode("M01");
        item.setItemName("Hb");
        item.setNormalValue("12-16");
        item.setUnit("g/dL");
        item.setValue("14.0");
        item.setAbnormalFlg("0");
        item.setComment1("コメント");
        item.setComment2(null);

        NLaboModule module = new NLaboModule();
        module.setLaboCenterCode("LC01");
        module.setPatientId("00001");
        module.setItems(List.of(item));

        when(service.getLabTestCount(eq("1.3.6.1.4.1.9414.2.1"), eq("00001"))).thenReturn(1L);
        when(service.getLaboTest(eq("1.3.6.1.4.1.9414.2.1"), eq("00001"), eq(0), eq(20)))
                .thenReturn(List.of(module));

        LaboTestResponse response = resource.getLaboTest(FACILITY_ID + ",00001,0,20");
        assertThat(response.getModules()).hasSize(1);
        assertMatchesFixture("demo_labo_test.json", response);
    }

    @Test
    void getLaboTestRejectsMissingFacility() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getLaboTest(",00001,0,20"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getLaboGraphProducesTrend() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        NLaboItem older = new NLaboItem();
        older.setItemCode("I1");
        older.setItemName("Hb");
        older.setNormalValue("12-16");
        older.setUnit("g/dL");
        older.setValue("13.0");
        older.setComment1("old");
        older.setComment2(null);

        NLaboItem newer = new NLaboItem();
        newer.setItemCode("I1");
        newer.setItemName("Hb");
        newer.setNormalValue("12-16");
        newer.setUnit("g/dL");
        newer.setValue("14.2");
        newer.setComment1("new");
        newer.setComment2(null);

        when(service.getLaboTestItem(eq("1.3.6.1.4.1.9414.2.1"), eq("00001"), eq(0), eq(20), eq("I1")))
                .thenReturn(List.of(older, newer));

        LaboTrendResponse response = resource.getLaboGraph(FACILITY_ID + ",00001,0,20,I1");
        assertThat(response.getResults()).hasSize(2);
        assertMatchesFixture("demo_labo_trend.json", response);
    }

    @Test
    void getLaboGraphRejectsMissingItemCode() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getLaboGraph(FACILITY_ID + ",00001,0,20,"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getDiagnosisGeneratesRegisteredDiagnosis() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoDisease disease1 = new DemoDisease();
        disease1.setId(1L);
        disease1.setDisease("感冒");
        DemoDisease disease2 = new DemoDisease();
        disease2.setId(2L);
        disease2.setDisease("頭痛");
        List<DemoDisease> diseases = new ArrayList<>(List.of(disease1, disease2));
        when(service.getDiagnosisDemo()).thenReturn(diseases);

        List<IRegisteredDiagnosis> diagnosis = resource.getDiagnosis("1,0,2");
        assertThat(diagnosis).hasSize(2);
        assertMatchesFixture("demo_diagnosis.json", diagnosis);
    }

    @Test
    void getDiagnosisRejectsInvalidParams() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getDiagnosis("1,0"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getPatientVisitGeneratesVisits() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(12L);
        demo.setName("来院 患者");
        demo.setKana("ライインカンジャ");
        demo.setSex("M");
        demo.setBirthday("1985/02/03");
        when(service.getPatientVisitDemo(0, 30)).thenReturn(List.of(demo));

        List<IPatientVisitModel> visits = resource.getPatientVisit(FACILITY_ID + ",0,30");
        assertThat(visits).hasSize(1);
        String today = LocalDate.now().toString();
        assertMatchesFixture("demo_patient_visit.json", visits, Map.of("{{TODAY}}", today));
    }

    @Test
    void getPatientVisitRejectsMissingFacility() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getPatientVisit(",0,30"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getPatientVisitRangeBuildsVisitList() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(5L);
        demo.setName("山田 花子");
        demo.setKana("ヤマダハナコ");
        demo.setSex("F");
        demo.setBirthday("1990/03/04");
        when(service.getPatientVisitRangeDemo(eq(0), eq(60))).thenReturn(List.of(demo));

        List<IPatientVisitModel> visits = resource.getPatientVisitRange("2.100,2024-04-01 09:00:00,2024-04-01 18:00:00,0,0,pad");
        assertThat(visits).hasSize(1);
        assertMatchesFixture("demo_patient_visit_range.json", visits);
    }

    @Test
    void getPatientVisitRangeRejectsMissingStart() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getPatientVisitRange(FACILITY_ID + ",,2024-04-01 18:00:00,0,0,pad"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getPatientVisitLastProducesVisits() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(7L);
        demo.setName("再来 患者");
        when(service.getPatientVisitRangeDemo(60, 70)).thenReturn(List.of(demo));

        List<IPatientVisitModel> visits = resource.getPatientVisitLast(FACILITY_ID + ",2024-04-02 09:00:00,2024-04-02 18:00:00");
        assertThat(visits).hasSize(1);
        assertMatchesFixture("demo_patient_visit_last.json", visits);
    }

    @Test
    void getPatientVisitLastRejectsMissingStart() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getPatientVisitLast(FACILITY_ID + ",,2024-04-02 18:00:00"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    @Test
    void getPatientByIdReturnsPatient() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(99L);
        demo.setName("個別 患者");
        when(service.getPatientDemo(99L)).thenReturn(demo);

        IPatientModel patient = resource.getPatientById("99");
        assertMatchesFixture("demo_patient_by_id.json", patient);
    }

    @Test
    void getPatientByIdReturnsNullWhenMissing() {
        configureAuth(FACILITY_ID, USER_ID);

        when(service.getPatientDemo(123L)).thenReturn(null);
        assertThat(resource.getPatientById("123")).isNull();
    }

    @Test
    void getPatientsByNameUsesKanaSearch() throws Exception {
        configureAuth(FACILITY_ID, USER_ID);
        DemoPatient demo = new DemoPatient();
        demo.setId(20L);
        demo.setName("検索 患者");
        when(service.getPatientsByKanaDemo(eq("かな"), eq(0), eq(50))).thenReturn(List.of(demo));

        IPatientList list = resource.getPatientsByName(FACILITY_ID + ",かな,0,50");
        assertMatchesFixture("demo_patients_by_name.json", list);
        verify(service).getPatientsByKanaDemo(eq("かな"), eq(0), eq(50));
    }

    @Test
    void getPatientsByNameRejectsBlankFacility() {
        configureAuth(FACILITY_ID, USER_ID);

        assertThatThrownBy(() -> resource.getPatientsByName(",keyword,0,50"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> assertThat(((WebApplicationException) ex).getResponse().getStatus()).isEqualTo(400));
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = DemoResourceAsp.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
