package open.dolphin.session;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import open.dolphin.adm10.converter.IOSHelper;
import open.dolphin.adm20.converter.ISendPackage;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.DepartmentModel;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.FacilityModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.LicenseModel;
import open.dolphin.infomodel.ModuleInfoBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.SimpleAddressModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.msg.dto.MmlDispatchResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MmlSenderBeanSmokeTest {

    @Test
    @DisplayName("send() generates SHIFT_JIS MML payload from CLI fixtures without CDI container")
    void sendGeneratesMmlPayload() throws Exception {
        Path payloadPath = Path.of("..", "tmp", "mml-tests", "send_mml_success.json").normalize();
        DocumentModel document;
        if (Files.exists(payloadPath)) {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            ISendPackage pkg = mapper.readValue(payloadPath.toFile(), ISendPackage.class);
            document = pkg.documentModel();
            assertNotNull(document, "documentModel conversion failed");
            assertTrue(document.getDocInfoModel().isSendMml(), "fixture must set sendMml=true");
        } else {
            document = buildFallbackDocument();
        }

        MmlSenderBean bean = new MmlSenderBean();
        MmlDispatchResult result = bean.send(document);

        assertNotNull(result);
        assertNotNull(result.payload());
        assertFalse(result.payload().isBlank(), "payload should contain serialized MML");
        assertEquals("SHIFT_JIS", result.encoding().toUpperCase(Locale.ROOT));
        assertTrue(result.byteLength() > 0);
        assertNotNull(result.sha256());
        assertEquals(document.getDocInfoModel().getDocId(), result.documentId());
    }

    private static DocumentModel buildFallbackDocument() {
        DocumentModel document = new DocumentModel();
        document.setId(1L);

        DocInfoModel docInfo = new DocInfoModel();
        docInfo.setDocId("DOC-TEST-001");
        docInfo.setDocPk(1L);
        docInfo.setPurpose("MMLテスト");
        docInfo.setTitle("MML Smoke Test");
        docInfo.setConfirmDate(new Date());
        docInfo.setFirstConfirmDate(new Date());
        docInfo.setSendMml(true);
        document.setDocInfoModel(docInfo);

        PatientModel patient = new PatientModel();
        patient.setPatientId("PAT-001");
        patient.setFamilyName("山田");
        patient.setGivenName("太郎");
        patient.setKanaFamilyName("ヤマダ");
        patient.setKanaGivenName("タロウ");
        patient.setGender("M");
        patient.setBirthday("1980-01-01");
        SimpleAddressModel address = new SimpleAddressModel();
        address.setZipCode("100-0001");
        address.setAddress("東京都千代田区1-1-1");
        patient.setAddress(address);
        patient.setTelephone("03-0000-0000");

        KarteBean karte = new KarteBean();
        karte.setId(10L);
        karte.setPatientModel(patient);
        document.setKarteBean(karte);

        FacilityModel facility = new FacilityModel();
        facility.setFacilityId("FAC-001");
        facility.setFacilityName("テスト病院");
        facility.setZipCode("100-0001");
        facility.setAddress("東京都千代田区1-1-1");
        facility.setTelephone("03-0000-0000");

        UserModel user = new UserModel();
        user.setId(2L);
        user.setUserId("doctor");
        user.setCommonName("Dr. テスト");
        user.setFacilityModel(facility);
        user.setLicenseModel(buildLicense());
        user.setDepartmentModel(buildDepartment());
        document.setUserModel(user);

        BundleDolphin bundle = new BundleDolphin();
        bundle.setOrderName("処方");
        bundle.setClassCode("110");
        bundle.setClassCodeSystem("1");
        ClaimItem item = new ClaimItem();
        item.setName("テスト処置");
        item.setNumber("1");
        item.setUnit("回");
        bundle.setClaimItem(new ClaimItem[] { item });

        ModuleInfoBean info = new ModuleInfoBean();
        info.setStampRole(IInfoModel.ROLE_P);
        info.setEntity(IInfoModel.ENTITY_MED_ORDER);
        ModuleModel module = new ModuleModel();
        module.setModuleInfoBean(info);
        module.setBeanBytes(IOSHelper.toXMLBytes(bundle));
        document.setModules(List.of(module));

        return document;
    }

    private static LicenseModel buildLicense() {
        LicenseModel license = new LicenseModel();
        license.setLicense("doctor");
        license.setLicenseDesc("医師");
        return license;
    }

    private static DepartmentModel buildDepartment() {
        DepartmentModel department = new DepartmentModel();
        department.setDepartment("01");
        department.setDepartmentDesc("内科");
        return department;
    }
}
