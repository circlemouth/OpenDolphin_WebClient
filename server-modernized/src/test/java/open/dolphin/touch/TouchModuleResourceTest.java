package open.dolphin.touch;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Base64;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.BundleMed;
import open.dolphin.infomodel.ClaimItem;
import open.dolphin.infomodel.ExtRefModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SchemaModel;
import open.dolphin.touch.converter.IOSHelper;
import open.dolphin.touch.module.TouchModuleDtos;
import open.dolphin.touch.module.TouchModuleService;
import open.dolphin.touch.session.IPhoneServiceBean;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TouchModuleResourceTest extends RuntimeDelegateTestSupport {

    @Mock
    private IPhoneServiceBean iphoneService;

    private TouchModuleService moduleService;
    private DolphinResource resource;

    @BeforeEach
    void setUp() throws Exception {
        moduleService = new TouchModuleService();
        inject(moduleService, "iPhoneServiceBean", iphoneService);

        resource = new DolphinResource();
        inject(resource, "moduleService", moduleService);
        inject(resource, "authHandler", new TouchAuthHandler());
        inject(resource, "iPhoneServiceBean", iphoneService);
    }

    @Test
    void getModules_convertsLegacyValues() {
        ModuleModel module = createModule("treatmentOrder",
                Instant.parse("2025-10-01T09:00:00Z"),
                claimItem("点滴注射", "1", "amp"));

        when(iphoneService.getModuleCount(42L, "treatmentOrder")).thenReturn(1L);
        when(iphoneService.getModules(42L, "treatmentOrder", 0, 20))
                .thenReturn(List.of(module));

        Response response = resource.getModule(null, "42,treatmentOrder,0,20");
        @SuppressWarnings("unchecked")
        TouchModuleDtos.Page<TouchModuleDtos.Module> page =
                (TouchModuleDtos.Page<TouchModuleDtos.Module>) response.getEntity();

        assertEquals(1L, page.totalRecords());
        assertEquals(0, page.firstResult());
        assertEquals(20, page.maxResult());
        assertEquals(1, page.items().size());

        TouchModuleDtos.Module dto = page.items().get(0);
        assertEquals("treatmentOrder", dto.entity());
        assertEquals("処 置", dto.entityName(), "legacy entityToName mapping should remain");
        assertEquals("2025-10-01", dto.startDate());
        assertEquals(1, dto.items().size());
        TouchModuleDtos.ModuleItem first = dto.items().get(0);
        assertEquals("点滴注射", first.name());
        assertEquals("1", first.quantity());
        assertEquals("amp", first.unit());
        assertNull(first.numDays());
        assertNull(first.administration());

        assertCacheControlNoStore(response);
    }

    @Test
    void getRpModules_includesNumDaysAndAdministration() {
        ModuleModel module = createRpModule("2025-09-15T00:00:00Z", "7", "3x /day",
                claimItem("アモキシシリン", "3", "cap"),
                claimItem("整腸剤", "1", "pkg"));

        when(iphoneService.getModuleCount(55L, "medOrder")).thenReturn(1L);
        when(iphoneService.getModules(55L, "medOrder", 0, 10))
                .thenReturn(List.of(module));

        Response response = resource.getRp(null, "55,0,10");
        @SuppressWarnings("unchecked")
        TouchModuleDtos.Page<TouchModuleDtos.RpModule> page =
                (TouchModuleDtos.Page<TouchModuleDtos.RpModule>) response.getEntity();

        assertEquals("2025-09-15", page.items().get(0).rpDate());
        List<TouchModuleDtos.ModuleItem> items = page.items().get(0).items();
        assertEquals(List.of("アモキシシリン", "整腸剤"),
                items.stream().map(TouchModuleDtos.ModuleItem::name).collect(Collectors.toList()));
        assertTrue(items.stream().allMatch(i -> "7".equals(i.numDays())));
        assertTrue(items.stream().allMatch(i -> "3x /day".equals(i.administration())));
    }

    @Test
    void moduleServiceCachesByKey() {
        ModuleModel module = createModule("generalOrder",
                Instant.parse("2025-09-01T09:00:00Z"),
                claimItem("検査", "1", "set"));
        when(iphoneService.getModuleCount(88L, "generalOrder")).thenReturn(1L);
        when(iphoneService.getModules(88L, "generalOrder", 0, 5))
                .thenReturn(List.of(module));

        moduleService.getModules(88L, "generalOrder", 0, 5);
        moduleService.getModules(88L, "generalOrder", 0, 5);

        verify(iphoneService, times(1)).getModuleCount(88L, "generalOrder");
        verify(iphoneService, times(1)).getModules(88L, "generalOrder", 0, 5);
    }

    @Test
    void getLaboTest_enforcesFacilityHeader() {
        when(iphoneService.getLabTestCount("F001", "00001")).thenReturn(0L);
        when(iphoneService.getLaboTest("F001", "00001", 0, 50))
                .thenReturn(List.of());
        HttpServletRequest request = mock(HttpServletRequest.class);
        lenient().when(request.getHeader(anyString())).thenReturn(null);
        when(request.getHeader(TouchAuthHandler.FACILITY_HEADER)).thenReturn("F001");
        when(request.getRemoteUser()).thenReturn("F001:doctor01");

        Response response = resource.getLaboTest(request, "F001,00001,0,50");
        assertEquals(0, ((TouchModuleDtos.Page<?>) response.getEntity()).items().size());
        assertCacheControlNoStore(response);
    }

    @Test
    void getLaboTest_missingHeaderThrows() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        lenient().when(request.getRemoteUser()).thenReturn("F001:doctor01");

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> resource.getLaboTest(request, "F001,00001,0,20"));
        assertEquals(400, ex.getResponse().getStatus());
    }

    @Test
    void getLaboGraph_returnsResultSeries() {
        NLaboItem recent = createLaboItem("2025-09-05", "7.2", "comment-a", "comment-b");
        recent.setItemCode("TP");
        recent.setItemName("総蛋白");
        recent.setNormalValue("6.5-8.0");
        recent.setUnit("g/dL");
        NLaboItem older = createLaboItem("2025-08-20", "6.9", "comment-old", "comment-old2");

        when(iphoneService.getLaboTestItem("F100", "00045", 0, 10, "TP"))
                .thenReturn(List.of(recent, older));

        HttpServletRequest request = facilityRequest("F100");
        Response response = resource.getLaboGraph(request, "F100,00045,0,10,TP");
        TouchModuleDtos.LaboGraph graph = (TouchModuleDtos.LaboGraph) response.getEntity();

        assertEquals("TP", graph.itemCode());
        assertEquals("総蛋白", graph.itemName());
        assertEquals("6.5-8.0", graph.normalValue());
        assertEquals("g/dL", graph.unit());
        assertEquals(List.of("2025-09-05", "2025-08-20"),
                graph.results().stream().map(TouchModuleDtos.LaboGraphResult::sampleDate).collect(Collectors.toList()));
    }

    @Test
    void getDiagnosis_returnsAliasAndDates() {
        RegisteredDiagnosisModel model = new RegisteredDiagnosisModel();
        model.setDiagnosis("喘息");
        model.setCategoryDesc("慢性");
        model.setOutcomeDesc("継続観察");
        model.setStartDate("2025-08-01");
        model.setEndDate("2025-09-15");

        when(iphoneService.getDiagnosisCount(70L)).thenReturn(1L);
        when(iphoneService.getDiagnosis(70L, 0, 5)).thenReturn(List.of(model));

        Response response = resource.getDiagnosis(null, "70,0,5");
        @SuppressWarnings("unchecked")
        TouchModuleDtos.Page<TouchModuleDtos.Diagnosis> page =
                (TouchModuleDtos.Page<TouchModuleDtos.Diagnosis>) response.getEntity();

        TouchModuleDtos.Diagnosis dto = page.items().get(0);
        assertEquals("喘息", dto.diagnosis());
        assertEquals("慢性", dto.category());
        assertEquals("継続観察", dto.outcome());
        assertEquals("2025-08-01", dto.startDate());
        assertEquals("2025-09-15", dto.endDate());
    }

    @Test
    void moduleServiceEncodesSchemaToBase64() {
        byte[] bytes = new byte[4096];
        Arrays.fill(bytes, (byte) 0x5A);
        SchemaModel schema = createSchema("bucket-a", "sop-1", bytes);
        when(iphoneService.getSchema(99L, 0, 1)).thenReturn(List.of(schema));

        TouchModuleDtos.Page<TouchModuleDtos.Schema> page = moduleService.getSchemas(99L, 0, 1);
        assertEquals("bucket-a", page.items().get(0).bucket());
        assertEquals("sop-1", page.items().get(0).sop());
        assertEquals(Base64.getEncoder().encodeToString(bytes), page.items().get(0).base64());
    }

    private static ModuleModel createModule(String entity, Instant started, ClaimItem... items) {
        ModuleModel module = new ModuleModel();
        module.setStarted(Date.from(started));
        module.setStatus(IInfoModel.STATUS_FINAL);
        module.getModuleInfoBean().setEntity(entity);
        module.getModuleInfoBean().setStampName("stamp");
        module.getModuleInfoBean().setStampRole(IInfoModel.ROLE_P);
        module.getModuleInfoBean().setStampNumber(1);
        BundleDolphin bundle = new BundleDolphin();
        bundle.setOrderName(entity);
        bundle.setClaimItem(items);
        module.setBeanBytes(IOSHelper.toXMLBytes(bundle));
        module.setModel(null);
        return module;
    }

    private static ModuleModel createRpModule(String startIso, String numDays, String admin, ClaimItem... items) {
        ModuleModel module = new ModuleModel();
        module.setStarted(Date.from(Instant.parse(startIso)));
        module.setStatus(IInfoModel.STATUS_FINAL);
        module.getModuleInfoBean().setEntity("medOrder");
        module.getModuleInfoBean().setStampName("RP");
        module.getModuleInfoBean().setStampRole(IInfoModel.ROLE_P);
        module.getModuleInfoBean().setStampNumber(1);
        BundleMed bundle = new BundleMed();
        bundle.setOrderName("medOrder");
        bundle.setBundleNumber(numDays);
        bundle.setAdmin(admin);
        bundle.setClaimItem(items);
        module.setBeanBytes(IOSHelper.toXMLBytes(bundle));
        module.setModel(null);
        return module;
    }

    private static ClaimItem claimItem(String name, String number, String unit) {
        ClaimItem item = new ClaimItem();
        item.setName(name);
        item.setNumber(number);
        item.setUnit(unit);
        return item;
    }

    private static NLaboItem createLaboItem(String sampleDate, String value, String comment1, String comment2) {
        NLaboItem item = new NLaboItem();
        item.setSampleDate(sampleDate);
        item.setValue(value);
        item.setComment1(comment1);
        item.setComment2(comment2);
        item.setGroupCode("001");
        item.setParentCode("P001");
        item.setItemCode("TP");
        item.setItemName("総蛋白");
        item.setUnit("g/dL");
        item.setNormalValue("6.5-8.0");
        return item;
    }

    private static SchemaModel createSchema(String bucket, String sop, byte[] bytes) {
        SchemaModel schema = new SchemaModel();
        ExtRefModel extRef = new ExtRefModel();
        extRef.setBucket(bucket);
        extRef.setSop(sop);
        extRef.setContentType("image/jpeg");
        extRef.setTitle("schema");
        extRef.setHref("urn:dummy");
        extRef.setMedicalRole("role");
        schema.setExtRefModel(extRef);
        schema.setJpegByte(bytes);
        return schema;
    }

    private HttpServletRequest facilityRequest(String facilityId) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        lenient().when(request.getHeader(anyString())).thenReturn(null);
        when(request.getHeader(TouchAuthHandler.FACILITY_HEADER)).thenReturn(facilityId);
        when(request.getRemoteUser()).thenReturn(facilityId + ":doctor");
        return request;
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field field = findField(target.getClass(), fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static Field findField(Class<?> type, String fieldName) throws NoSuchFieldException {
        Class<?> current = type;
        while (current != null) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException ex) {
                current = current.getSuperclass();
            }
        }
        throw new NoSuchFieldException(fieldName);
    }

    private static void assertCacheControlNoStore(Response response) {
        Object header = response.getHeaders().getFirst("Cache-Control");
        assertNotNull(header);
        String value = header.toString().toLowerCase(Locale.ROOT);
        assertTrue(value.contains("no-store"));
        assertTrue(value.contains("no-cache"));
    }
}
