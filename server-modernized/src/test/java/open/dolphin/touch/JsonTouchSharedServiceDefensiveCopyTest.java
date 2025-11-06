package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;

import java.util.ArrayList;
import java.util.List;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.touch.JsonTouchSharedService.PatientModelSnapshot;
import org.junit.jupiter.api.Test;

class JsonTouchSharedServiceDefensiveCopyTest {

    @Test
    void snapshotProtectsPatientModel() {
        PatientModel patient = new PatientModel();
        patient.setFullName("Original");
        List<PVTHealthInsuranceModel> insurances = new ArrayList<>();
        PVTHealthInsuranceModel insurance = new PVTHealthInsuranceModel();
        insurance.setInsuranceNumber("1234");
        insurances.add(insurance);
        patient.setPvtHealthInsurances(insurances);

        PatientModelSnapshot snapshot = JsonTouchSharedService.snapshot(patient, 123L);

        patient.setFullName("Mutated");
        insurance.setInsuranceNumber("5678");

        PatientModel snapPatient = snapshot.getPatient();
        assertEquals("Original", snapPatient.getFullName());
        assertEquals("1234", snapPatient.getPvtHealthInsurances().get(0).getInsuranceNumber());

        snapPatient.setFullName("Changed");
        snapPatient.getPvtHealthInsurances().get(0).setInsuranceNumber("9999");

        PatientModel second = snapshot.getPatient();
        assertEquals("Original", second.getFullName());
        assertEquals("1234", second.getPvtHealthInsurances().get(0).getInsuranceNumber());
        assertNotSame(snapPatient, second);
    }
}
