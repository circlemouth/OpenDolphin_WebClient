package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

        pvtServiceBean.setChartEventServiceBean(chartEventServiceBean);

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
        chartEventServiceBean.setPvtList("F001", new ArrayList<>(Collections.singletonList(visit)));

        PatientVisitListConverter converter = resource.getPvtList();

        assertNotNull(converter);
        List<PatientVisitModelConverter> converted = converter.getList();
        assertNotNull(converted, "Converter should expose visit list");
        assertEquals(1, converted.size());
        assertEquals("F001", converted.get(0).getFacilityId());
    }

    @Test
    void deletePvt_removesVisitForAuthenticatedFacility() {
        PatientVisitModel visit = new PatientVisitModel();
        visit.setId(10L);
        visit.setFacilityId("F001");
        chartEventServiceBean.setPvtList("F001", new ArrayList<>(Collections.singletonList(visit)));

        resource.deletePvt("10");

        assertEquals(10L, pvtServiceBean.getRemovedId());
        assertEquals("F001", pvtServiceBean.getRemovedFacility());
        assertTrue(chartEventServiceBean.getPvtList("F001").isEmpty(), "Visit should be removed from facility list");
    }

    @Test
    void deletePvt_throwsWhenFacilityDoesNotOwnVisit() {
        PatientVisitModel visit = new PatientVisitModel();
        visit.setId(20L);
        visit.setFacilityId("F002");
        chartEventServiceBean.setPvtList("F002", new ArrayList<>(Collections.singletonList(visit)));

        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class, () -> resource.deletePvt("20"));

        assertEquals("Facility mismatch", thrown.getMessage());
        assertEquals(20L, pvtServiceBean.getRemovedId());
        assertEquals("F001", pvtServiceBean.getRemovedFacility());
        assertEquals(1, chartEventServiceBean.getPvtList("F002").size(), "Visit list for original facility must remain intact");
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static class RecordingPvtServiceBean extends PVTServiceBean {
        private PatientVisitModel received;
        private Long removedId;
        private String removedFacility;
        private StubChartEventServiceBean chartEventServiceBean;

        void setChartEventServiceBean(StubChartEventServiceBean chartEventServiceBean) {
            this.chartEventServiceBean = chartEventServiceBean;
        }

        @Override
        public int addPvt(PatientVisitModel pvt) {
            this.received = pvt;
            return 1;
        }

        @Override
        public int removePvt(long id, String fid) {
            this.removedId = id;
            this.removedFacility = fid;

            if (chartEventServiceBean == null) {
                throw new IllegalStateException("ChartEventServiceBean is not configured");
            }

            String actualFacility = chartEventServiceBean.findFacilityFor(id);
            if (!fid.equals(actualFacility)) {
                throw new IllegalArgumentException("Facility mismatch");
            }

            List<PatientVisitModel> pvtList = chartEventServiceBean.getPvtList(fid);
            pvtList.removeIf(model -> model.getId() == id);
            return 1;
        }

        Long getRemovedId() {
            return removedId;
        }

        String getRemovedFacility() {
            return removedFacility;
        }
    }

    private static class StubChartEventServiceBean extends ChartEventServiceBean {
        private final Map<String, List<PatientVisitModel>> pvtLists = new HashMap<>();

        @Override
        public List<PatientVisitModel> getPvtList(String fid) {
            return pvtLists.computeIfAbsent(fid, key -> new ArrayList<>());
        }

        void setPvtList(String facilityId, List<PatientVisitModel> visits) {
            pvtLists.put(facilityId, visits);
        }

        String findFacilityFor(long visitId) {
            return pvtLists.entrySet().stream()
                    .filter(entry -> entry.getValue().stream().anyMatch(model -> model.getId() == visitId))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(null);
        }
    }
}
