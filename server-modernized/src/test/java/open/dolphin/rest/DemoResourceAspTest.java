package open.dolphin.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import jakarta.ws.rs.core.Response;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.List;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.BundleMed;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DemoDisease;
import open.dolphin.infomodel.DemoPatient;
import open.dolphin.infomodel.DemoRp;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientPackage;
import open.dolphin.infomodel.ProgressCourse;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.rest.dto.DemoAspResponses.AllergyDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimItemDto;
import open.dolphin.rest.dto.DemoAspResponses.LaboTestResponse;
import open.dolphin.rest.dto.DemoAspResponses.LaboTrendResponse;
import open.dolphin.rest.dto.DemoAspResponses.ModuleResponse;
import open.dolphin.rest.dto.DemoAspResponses.PatientPackageResponse;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseDocument;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseResponse;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.IPatientVisitModel;
import open.dolphin.touch.converter.IRegisteredDiagnosis;
import open.dolphin.touch.converter.ISchemaModel;
import open.dolphin.touch.converter.IUserModel;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.session.IPhoneServiceBean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DemoResourceAspTest {

    @Mock
    private IPhoneServiceBean service;

    private DemoResourceAsp resource;

    @BeforeEach
    void setUp() throws Exception {
        resource = new DemoResourceAsp();
        setField(resource, "iPhoneServiceBean", service);
    }

    @Test
    void getUserReturnsUserWhenCredentialsMatch() {
        Response response = resource.getUser("2.100,ehrTouch,098f6bcd4621d373cade4e832627b4f6");
        assertThat(response.getEntity()).isInstanceOf(IUserModel.class);
        IUserModel user = (IUserModel) response.getEntity();
        assertThat(user.getCommonName()).isEqualTo("EHR");
    }

    @Test
    void getFirstVisitorsMapsDemoPatientsToPatientModels() {
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

        IPatientList list = resource.getFirstVisitors("2.100,0,20");
        assertThat(list.getList()).hasSize(1);
        IPatientModel patient = list.getList().get(0);
        assertThat(patient.getPatientId()).isEqualTo("00001");
        assertThat(patient.getFullName()).isEqualTo("田中 太郎");
    }

    @Test
    void getPatientPackageConvertsHealthInsurance() {
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
        assertThat(response.getPatient().getFullName()).isEqualTo("患者 一郎");
        assertThat(response.getHealthInsurances()).hasSize(1);
        assertThat(response.getHealthInsurances().get(0).getInsuranceClass()).isEqualTo("社保");
        assertThat(response.getAllergies()).extracting(AllergyDto::getFactor).containsExactly("ペニシリン");
    }

    @Test
    void getModuleBuildsClaimBundle() {
        ModuleModel module = new ModuleModel();
        module.setStarted(java.util.Date.from(LocalDate.of(2024, 4, 10).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        ModuleInfoBean info = new ModuleInfoBean();
        info.setEntity("medOrder");
        info.setStampRole("p");
        module.setModuleInfoBean(info);

        BundleMed bundle = new BundleMed();
        bundle.setOrderName("medOrder");
        bundle.setBundleNumber("7");
        bundle.setAdmin("1日3回毎食後に");
        ClaimItem item = new ClaimItem();
        item.setName("アセトアミノフェン");
        item.setNumber("3");
        item.setUnit("錠");
        bundle.addClaimItem(item);
        module.setBeanBytes(IOSHelper.toXMLBytes(bundle));

        when(service.getModuleCount(eq(1L), eq("medOrder"))).thenReturn(1L);
        when(service.getModules(eq(1L), eq("medOrder"), eq(0), eq(20))).thenReturn(List.of(module));

        ModuleResponse response = resource.getModule("1,medOrder,0,20");
        assertThat(response.getModules()).hasSize(1);
        assertThat(response.getModules().get(0).getItems()).extracting(ClaimItemDto::getName)
                .containsExactly("アセトアミノフェン");
    }

    @Test
    void getProgressCourseCollectsNotesOrdersAndSchemas() {
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

        document.setModules(List.of(soaModule, orderModule));
        document.setSchema(List.of(schema));

        when(service.getDocuments(eq(100L), eq(0), eq(10))).thenReturn(List.of(document));

        ProgressCourseResponse response = resource.getProgressCourse("100,0,10");
        assertThat(response.getDocuments()).hasSize(1);
        ProgressCourseDocument doc = response.getDocuments().get(0);
        assertThat(doc.getSoaTexts()).containsExactly("頭痛訴え");
        assertThat(doc.getOrders()).hasSize(1);
        assertThat(doc.getSchemas()).hasSize(1);
    }

    @Test
    void getLaboTestProducesModules() {
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

        NLaboModule module = new NLaboModule();
        module.setLaboCenterCode("LC01");
        module.setPatientId("00001");
        module.setItems(List.of(item));

        when(service.getLabTestCount(eq("1.3.6.1.4.1.9414.2.1"), eq("00001"))).thenReturn(1L);
        when(service.getLaboTest(eq("1.3.6.1.4.1.9414.2.1"), eq("00001"), eq(0), eq(20)))
                .thenReturn(List.of(module));

        LaboTestResponse response = resource.getLaboTest("dummy,dummy,0,20");
        assertThat(response.getModules()).hasSize(1);
        assertThat(response.getModules().get(0).getItems()).extracting(LaboItemDto::getItemName)
                .containsExactly("Hb");
    }

    @Test
    void getLaboGraphProducesTrend() {
        NLaboItem older = new NLaboItem();
        older.setItemCode("I1");
        older.setItemName("Hb");
        older.setNormalValue("12-16");
        older.setUnit("g/dL");
        older.setValue("13.0");
        older.setComment1("old");

        NLaboItem newer = new NLaboItem();
        newer.setItemCode("I1");
        newer.setItemName("Hb");
        newer.setNormalValue("12-16");
        newer.setUnit("g/dL");
        newer.setValue("14.2");
        newer.setComment1("new");

        when(service.getLaboTestItem(eq("1.3.6.1.4.1.9414.2.1"), eq("00001"), eq(0), eq(20), eq("I1")))
                .thenReturn(List.of(older, newer));

        LaboTrendResponse response = resource.getLaboGraph("fid,pid,0,20,I1");
        assertThat(response.getResults()).hasSize(2);
        assertThat(response.getItemName()).isEqualTo("Hb");
    }

    @Test
    void getDiagnosisGeneratesRegisteredDiagnosis() {
        DemoDisease disease1 = new DemoDisease();
        disease1.setId(1L);
        disease1.setDisease("感冒");
        DemoDisease disease2 = new DemoDisease();
        disease2.setId(2L);
        disease2.setDisease("頭痛");
        when(service.getDiagnosisDemo()).thenReturn(List.of(disease1, disease2));

        List<IRegisteredDiagnosis> diagnosis = resource.getDiagnosis("1,0,2");
        assertThat(diagnosis).hasSize(2);
        assertThat(diagnosis.get(0).getDiagnosis()).isNotBlank();
    }

    @Test
    void getPatientVisitRangeBuildsVisitList() {
        DemoPatient demo = new DemoPatient();
        demo.setId(5L);
        demo.setName("山田 花子");
        demo.setKana("ヤマダハナコ");
        demo.setSex("F");
        demo.setBirthday("1990/03/04");
        when(service.getPatientVisitRangeDemo(eq(0), eq(60))).thenReturn(List.of(demo));

        List<IPatientVisitModel> visits = resource.getPatientVisitRange("2.100,2024-04-01 09:00:00,2024-04-01 18:00:00,0,0,pad");
        assertThat(visits).hasSize(1);
        assertThat(visits.get(0).getPatientModel().getFullName()).isEqualTo("山田 花子");
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = DemoResourceAsp.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
