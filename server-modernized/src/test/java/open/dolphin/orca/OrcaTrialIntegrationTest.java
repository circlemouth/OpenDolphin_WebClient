package open.dolphin.orca;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import open.dolphin.orca.transport.OrcaEndpoint;
import open.dolphin.orca.transport.OrcaTransportRequest;
import open.dolphin.orca.transport.OrcaTransportResult;
import open.dolphin.orca.transport.RestOrcaTransport;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

@EnabledIfEnvironmentVariable(named = "ORCA_TRIAL_ENABLED", matches = "true|1")
class OrcaTrialIntegrationTest {

    @Test
    void systemAndMedicalApis_shouldRespondOrSkipWhenClosed() throws Exception {
        RestOrcaTransport transport = buildTransport();

        List<RequestSpec> specs = List.of(
                new RequestSpec(OrcaEndpoint.SYSTEM_DAILY, readXml("docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/44_system01dailyv2_request.xml")),
                new RequestSpec(OrcaEndpoint.SYSTEM_INFO, readXml("docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/28_systeminfv2_request.xml")),
                new RequestSpec(OrcaEndpoint.TEMP_MEDICAL_GET, readXml("docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/21_tmedicalgetv2_request.xml")),
                new RequestSpec(OrcaEndpoint.INCOME_INFO, readXml("docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/27_incomeinfv2_request.xml")),
                new RequestSpec(OrcaEndpoint.MEDICAL_SET, readXml("docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/33_medicalsetv2_request.xml")),
                new RequestSpec(OrcaEndpoint.INSURANCE_LIST, insuranceListPayload()),
                new RequestSpec(OrcaEndpoint.MASTER_LAST_UPDATE, "<data></data>"),
                new RequestSpec(OrcaEndpoint.CONTRAINDICATION_CHECK, contraindicationPayload()),
                new RequestSpec(OrcaEndpoint.MEDICATION_GET, medicationGetPayload()),
                new RequestSpec(OrcaEndpoint.PUSH_EVENT_GET, pushEventPayload())
        );

        for (RequestSpec spec : specs) {
            assertOrSkip(transport, spec);
        }
    }

    private void assertOrSkip(RestOrcaTransport transport, RequestSpec spec) {
        try {
            OrcaTransportResult result = transport.invokeDetailed(spec.endpoint, OrcaTransportRequest.post(spec.payload));
            assertNotNull(result);
            String body = result.getBody();
            assertNotNull(body);
            assertFalse(body.isBlank());
            assertTrue(body.contains("Api_Result"), "Api_Result missing for " + spec.endpoint.name());
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "";
            if (message.contains("HTTP response status 404")
                    || message.contains("HTTP response status 405")
                    || message.contains("HTTP response status 502")
                    || message.contains("HTTP response status 503")) {
                Assumptions.assumeTrue(false, "Trial endpoint closed: " + spec.endpoint.getPath());
            }
            throw ex;
        }
    }

    private RestOrcaTransport buildTransport() throws Exception {
        RestOrcaTransport transport = new RestOrcaTransport();
        Method initialize = RestOrcaTransport.class.getDeclaredMethod("initialize");
        initialize.setAccessible(true);
        initialize.invoke(transport);
        return transport;
    }

    private String readXml(String path) {
        try {
            return Files.readString(Path.of(path), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            return "<data></data>";
        }
    }

    private String insuranceListPayload() {
        String date = LocalDate.now().toString();
        return "<data><insuranceinf1v2req type=\"record\">"
                + "<Request_Number type=\"string\">01</Request_Number>"
                + "<Base_Date type=\"string\">" + date + "</Base_Date>"
                + "</insuranceinf1v2req></data>";
    }

    private String contraindicationPayload() {
        String month = LocalDate.now().withDayOfMonth(1).toString().substring(0, 7);
        return "<data><contraindication_checkreq type=\"record\">"
                + "<Request_Number type=\"string\">01</Request_Number>"
                + "<Patient_ID type=\"string\">00001</Patient_ID>"
                + "<Perform_Month type=\"string\">" + month + "</Perform_Month>"
                + "<Check_Term type=\"string\">1</Check_Term>"
                + "</contraindication_checkreq></data>";
    }

    private String medicationGetPayload() {
        String date = LocalDate.now().toString();
        return "<data><medicationgetreq type=\"record\">"
                + "<Request_Number type=\"string\">01</Request_Number>"
                + "<Request_Code type=\"string\">123456789</Request_Code>"
                + "<Base_Date type=\"string\">" + date + "</Base_Date>"
                + "</medicationgetreq></data>";
    }

    private String pushEventPayload() {
        String date = LocalDate.now().toString();
        return "<data><pusheventgetv2req type=\"record\">"
                + "<Request_Number type=\"string\">01</Request_Number>"
                + "<Base_Date type=\"string\">" + date + "</Base_Date>"
                + "</pusheventgetv2req></data>";
    }

    private record RequestSpec(OrcaEndpoint endpoint, String payload) {
    }
}
