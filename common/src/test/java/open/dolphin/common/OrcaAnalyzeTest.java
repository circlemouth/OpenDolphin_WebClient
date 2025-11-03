package open.dolphin.common;

// 更新日: 2025-11-03, 担当: Codex

import static org.junit.Assert.assertEquals;

import java.util.Arrays;
import org.junit.Test;

public class OrcaAnalyzeTest {

    private static final String SAMPLE_XML = """
            <?xml version="1.0" encoding="UTF-8"?>
            <xmlio2>
              <patientinfores>
                <Patient_Information>
                  <Patient_ID>000001</Patient_ID>
                  <HealthInsurance_Information>
                    <HealthInsurance_Information_child>
                      <InsuranceProvider_Class>SocialInsurance</InsuranceProvider_Class>
                    </HealthInsurance_Information_child>
                    <HealthInsurance_Information_child>
                      <InsuranceProvider_Class>NationalInsurance</InsuranceProvider_Class>
                    </HealthInsurance_Information_child>
                  </HealthInsurance_Information>
                </Patient_Information>
              </patientinfores>
            </xmlio2>
            """;

    @Test
    public void parsePatientInformation_extractsPatientIdAndInsuranceClasses() throws Exception {
        OrcaAnalyze analyzer = new OrcaAnalyze();

        OrcaAnalyze.OrcaPatientInfo info = analyzer.parsePatientInformation(SAMPLE_XML);

        assertEquals("000001", info.getPatientId());
        assertEquals(Arrays.asList("SocialInsurance", "NationalInsurance"), info.getInsuranceProviderClasses());
    }
}
