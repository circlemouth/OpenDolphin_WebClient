package open.dolphin.msg;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.session.AccountSummary;
import open.orca.rest.ORCAConnection;
import open.stamp.seed.CopyStampTreeBuilder;
import org.junit.jupiter.api.Test;

class MessagingDefensiveCopyTest {

    @Test
    void diagnosisModuleItemClonesModels() {
        DocInfoModel doc = new DocInfoModel();
        doc.setTitle("original");
        RegisteredDiagnosisModel diagnosis = new RegisteredDiagnosisModel();
        diagnosis.setDiagnosis("diagnosis");

        DiagnosisModuleItem item = new DiagnosisModuleItem();
        item.setDocInfo(doc);
        item.setRegisteredDiagnosisModule(diagnosis);

        doc.setTitle("mutated");
        diagnosis.setDiagnosis("mutated");

        assertEquals("original", item.getDocInfo().getTitle());
        assertEquals("diagnosis", item.getRegisteredDiagnosisModule().getDiagnosis());

        item.getDocInfo().setTitle("changed");
        assertEquals("original", item.getDocInfo().getTitle());
    }

    @Test
    void patientHelperClonesPatientAndInsurances() {
        PatientModel patient = new PatientModel();
        patient.setFullName("Original");
        List<PVTHealthInsuranceModel> insurances = new ArrayList<>();
        PVTHealthInsuranceModel insurance = new PVTHealthInsuranceModel();
        insurance.setInsuranceNumber("1234");
        insurances.add(insurance);
        patient.setPvtHealthInsurances(insurances);

        PatientHelper helper = new PatientHelper();
        helper.setPatient(patient);
        helper.setDiagnosisList(List.of(new RegisteredDiagnosisModel()));

        patient.setFullName("Mutated");
        insurance.setInsuranceNumber("9999");

        assertEquals("Original", helper.getPatient().getFullName());
        List<PVTHealthInsuranceModel> snapshot = helper.getInsurances();
        assertEquals("1234", snapshot.get(0).getInsuranceNumber());
        assertThrows(UnsupportedOperationException.class, () -> snapshot.add(new PVTHealthInsuranceModel()));
        snapshot.get(0).setInsuranceNumber("5678");
        assertEquals("1234", helper.getInsurances().get(0).getInsuranceNumber());
    }

    @Test
    void accountSummaryClonesDate() {
        AccountSummary summary = new AccountSummary();
        Date registered = new Date();
        summary.setRegisteredDate(registered);

        registered.setTime(0);

        Date snapshot = summary.getRegisteredDate();
        assertTrue(snapshot.getTime() != 0);
        snapshot.setTime(0);
        assertTrue(summary.getRegisteredDate().getTime() != 0);
        summary.setMemberType("type");
        assertEquals(DateFormat.getDateInstance().format(summary.getRegisteredDate()), summary.getRdDate());
    }

    @Test
    void orcaConnectionReturnsPropertiesCopy() throws IOException {
        Path tempDir = Files.createTempDirectory("orca");
        Path customProperties = tempDir.resolve("custom.properties");
        Files.writeString(customProperties, String.join(System.lineSeparator(),
                "orca.orcaapi.ip=127.0.0.1",
                "dolphin.facilityId=facility01",
                "claim.jdbc.url=jdbc:h2:mem:test",
                "claim.user=user",
                "claim.password=pass"));
        System.setProperty("jboss.home.dir", tempDir.toString());

        ORCAConnection connection = ORCAConnection.getInstance();
        Properties props = connection.getProperties();
        props.setProperty("new", "value");

        assertEquals("127.0.0.1", connection.getProperty("orca.orcaapi.ip"));
        assertEquals("facility01", connection.getProperties().getProperty("dolphin.facilityId"));
        assertEquals(null, connection.getProperty("claim.password"));
        assertEquals(null, connection.getProperties().getProperty("claim.jdbc.url"));
        assertEquals(null, connection.getProperties().getProperty("new"));
    }

    @Test
    void copyStampTreeBuilderReturnsImmutableLists() throws Exception {
        CopyStampTreeBuilder builder = new CopyStampTreeBuilder();
        builder.buildStart();
        builder.buildRoot("root", "entity");
        builder.buildStampInfo("name", "role", "entity", "true", "memo", "seed-id");
        builder.buildRootEnd();
        builder.buildEnd();

        List<String> seeds = builder.getSeedStampList();
        List<open.dolphin.infomodel.StampModel> models = builder.getStampModelToPersist();

        assertEquals(List.of("seed-id"), seeds);
        assertEquals(1, models.size());
        assertThrows(UnsupportedOperationException.class, () -> seeds.add("mutated"));
        assertThrows(UnsupportedOperationException.class, () -> models.clear());
    }
}
