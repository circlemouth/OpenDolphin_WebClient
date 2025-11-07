package open.dolphin.adm20.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdmDtoDefensiveCopyTest {

    @Test
    void phrExportRequestProtectsPatientIds() {
        List<String> ids = new ArrayList<>();
        ids.add("patient-1");

        PhrExportRequest request = new PhrExportRequest();
        request.setPatientIds(ids);

        ids.add("mutated");

        assertEquals(List.of("patient-1"), request.getPatientIds());
        assertThrows(UnsupportedOperationException.class, () -> request.getPatientIds().add("new"));
    }

    @Test
    void totpVerificationResponseProtectsBackupCodes() {
        TotpVerificationResponse response = new TotpVerificationResponse();
        response.setBackupCodes(List.of("code-1", "code-2"));

        assertEquals(List.of("code-1", "code-2"), response.getBackupCodes());
        assertThrows(UnsupportedOperationException.class, () -> response.getBackupCodes().clear());

        response.setBackupCodes(null);
        assertNull(response.getBackupCodes());
    }
}
