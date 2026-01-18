package open.dolphin.orca.transport;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class OrcaHttpClientLogTest {

    @Test
    void summaryLog_masksPhiAndKeepsHashes() {
        OrcaHttpClient.OrcaApiResult result = OrcaHttpClient.OrcaApiResult.of(
                "00",
                "患者番号0000123 山田太郎 生年月日1978-01-02",
                List.of("住所:東京都新宿区", "電話:09012345678"));

        String log = OrcaHttpClient.formatSummaryLog(
                "trace-1", "POST", "/api/patientmodv2", 200, result, 120);

        assertTrue(log.contains("apiResult=00"));
        assertFalse(log.contains("山田太郎"));
        assertFalse(log.contains("東京都"));
        assertFalse(log.contains("09012345678"));
        assertFalse(log.contains("1978"));
        assertTrue(log.contains("apiMessageHash="));
        assertTrue(log.contains("warningsHash="));
    }

    @Test
    void numericOnlyMessage_isLoggedAsIs() {
        OrcaHttpClient.OrcaApiResult result = OrcaHttpClient.OrcaApiResult.of(
                "99",
                "0001",
                List.of());

        String log = OrcaHttpClient.formatSummaryLog(
                "trace-2", "GET", "/api/system/status", 400, result, 45);

        assertTrue(log.contains("apiMessage=0001"));
        assertFalse(log.contains("apiMessageHash")); // numeric only should avoid hash in summary
    }
}
