package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.Collections;
import java.util.List;
import open.dolphin.converter.PatientVisitListConverter;
import open.dolphin.converter.PatientVisitModelConverter;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.session.ChartEventServiceBean;
import open.dolphin.session.PVTServiceBean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Contract tests for {@link PVTResource2}.
 */
class PVTResource2Test {

    private static final String FACILITY_REMOTE_USER = "F001:doctor01";

    private final ObjectMapper mapper = new ObjectMapper();

    private PVTResource2 resource;
    private RecordingPvtServiceBean pvtServiceBean;
    private StubChartEventServiceBean chartEventServiceBean;
    private HttpServletRequest servletRequest;

    @BeforeEach
    void setUp() throws Exception {
        resource = new PVTResource2();
        pvtServiceBean = new RecordingPvtServiceBean();
        chartEventServiceBean = new StubChartEventServiceBean();
        servletRequest = (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> {
                    if ("getRemoteUser".equals(method.getName())) {
                        return FACILITY_REMOTE_USER;
                    }
                    return null;
                });

        injectField(resource, "pvtServiceBean", pvtServiceBean);
        injectField(resource, "eventServiceBean", chartEventServiceBean);
        injectField(resource, "servletReq", servletRequest);
    }

    @Test
    void postPvt_assignsFacilityAndPatientRelations() throws Exception {
        PatientModel patient = new PatientModel();
        patient.setPatientId("000010");
        patient.setFacilityId("legacy");
        HealthInsuranceModel insurance = new HealthInsuranceModel();
        insurance.setBeanBytes(new byte[]{1, 2, 3});
        patient.setHealthInsurances(Collections.singletonList(insurance));

        PatientVisitModel visit = new PatientVisitModel();
        visit.setPatientModel(patient);
        visit.setFacilityId("legacy");
        visit.setDeptName("Internal");
        visit.setDeptCode("01");
        visit.setDoctorName("Smith");
        visit.setDoctorId("D01");
        visit.setPvtDate("2025-11-03");

        String payload = mapper.writeValueAsString(visit);

        String response = resource.postPvt(payload);

        assertEquals("1", response);
        assertNotNull(pvtServiceBean.received);
        assertEquals("F001", pvtServiceBean.received.getFacilityId(), "Facility ID should follow authenticated facility");
        assertEquals("F001", pvtServiceBean.received.getPatientModel().getFacilityId(), "Patient facility should align with visit");

        List<HealthInsuranceModel> insurances = pvtServiceBean.received.getPatientModel().getHealthInsurances();
        assertNotNull(insurances);
        assertEquals(1, insurances.size());
        assertSame(pvtServiceBean.received.getPatientModel(), insurances.get(0).getPatient(), "Insurance must reference patient");
    }

    @Test
    void getPvtList_wrapsServiceResultInConverter() {
        PatientVisitModel visit = new PatientVisitModel();
        visit.setFacilityId("F001");
        visit.setPvtDate("2025-11-03 10:00:00");
        chartEventServiceBean.pvtList = Collections.singletonList(visit);

        PatientVisitListConverter converter = resource.getPvtList();

        assertNotNull(converter);
        List<PatientVisitModelConverter> converted = converter.getList();
        assertNotNull(converted, "Converter should expose visit list");
        assertEquals(1, converted.size());
        assertEquals("F001", converted.get(0).getFacilityId());
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static class RecordingPvtServiceBean extends PVTServiceBean {
        private PatientVisitModel received;

        @Override
        public int addPvt(PatientVisitModel pvt) {
            this.received = pvt;
            return 1;
        }

        @Override
        public int removePvt(long id, String fid) {
            return 0;
        }
    }

    private static class StubChartEventServiceBean extends ChartEventServiceBean {
        private List<PatientVisitModel> pvtList = Collections.emptyList();

        @Override
        public List<PatientVisitModel> getPvtList(String fid) {
            return pvtList;
        }
    }
}
