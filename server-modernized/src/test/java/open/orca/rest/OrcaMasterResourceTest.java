package open.orca.rest;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import open.dolphin.rest.dto.orca.OrcaDrugMasterEntry;
import open.dolphin.rest.dto.orca.OrcaAddressEntry;
import open.dolphin.rest.dto.orca.OrcaMasterErrorResponse;
import open.dolphin.rest.dto.orca.OrcaMasterListResponse;
import open.dolphin.rest.dto.orca.OrcaMasterMeta;
import open.dolphin.rest.dto.orca.OrcaInsurerEntry;
import open.dolphin.rest.dto.orca.OrcaTensuEntry;
import org.junit.jupiter.api.Test;

class OrcaMasterResourceTest {

    private static final String USER = "1.3.6.1.4.1.9414.70.1:admin";
    private static final String PASSWORD = "21232f297a57a5a743894a0e4a801fc3";

    @Test
    void getGenericClass_returnsPagedResponseWithMeta() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public GenericClassSearchResult searchGenericClass(GenericClassCriteria criteria) {
                GenericClassRecord record = new GenericClassRecord();
                record.classCode = "101";
                record.className = "Test Generic";
                record.startDate = "20240401";
                record.endDate = "99991231";
                record.version = "20240426";
                return new GenericClassSearchResult(List.of(record), 1, "20240426");
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

        Response response = resource.getGenericClass(USER, PASSWORD, null, uriInfo, null);

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        OrcaMasterListResponse<OrcaDrugMasterEntry> payload =
                (OrcaMasterListResponse<OrcaDrugMasterEntry>) response.getEntity();
        assertNotNull(payload);
        assertNotNull(payload.getTotalCount());
        assertNotNull(payload.getItems());
        assertFalse(payload.getItems().isEmpty());
        OrcaDrugMasterEntry entry = payload.getItems().get(0);
        assertEquals("generic", entry.getCategory());
        assertNotNull(entry.getValidFrom());
        assertNotNull(entry.getValidTo());
        OrcaMasterMeta meta = entry.getMeta();
        assertNotNull(meta);
        assertEquals("server", meta.getDataSource());
        assertNotNull(meta.getRunId());
        assertFalse(meta.getRunId().isBlank());
        assertNotNull(meta.getFetchedAt());
    }

    @Test
    void getGenericPrice_invalidSrycd_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), new OrcaMasterDao());
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("srycd", "12345");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getGenericPrice(USER, PASSWORD, null, uriInfo, null);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("SRYCD_VALIDATION_ERROR", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
        assertNotNull(payload.getRunId());
        assertFalse(payload.getRunId().isBlank());
    }

    @Test
    void getGenericClass_usesProvidedRunIdHeader() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public GenericClassSearchResult searchGenericClass(GenericClassCriteria criteria) {
                GenericClassRecord record = new GenericClassRecord();
                record.classCode = "101";
                record.className = "Test Generic";
                record.startDate = "20240401";
                record.endDate = "99991231";
                record.version = "20240426";
                return new GenericClassSearchResult(List.of(record), 1, "20240426");
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());
        String expectedRunId = "TEST-RUN-ID-123";
        HttpServletRequest request = createRequestWithRunId(expectedRunId, "/orca/master/generic-class");

        Response response = resource.getGenericClass(USER, PASSWORD, null, uriInfo, request);

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        OrcaMasterListResponse<OrcaDrugMasterEntry> payload =
                (OrcaMasterListResponse<OrcaDrugMasterEntry>) response.getEntity();
        String actualRunId = payload.getItems().get(0).getMeta().getRunId();
        assertNotNull(actualRunId);
        assertFalse(actualRunId.isBlank());
    }

    @Test
    void getGenericPrice_missingMaster_returnsFallbackMeta() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public LookupResult<GenericPriceRecord> findGenericPrice(GenericPriceCriteria criteria) {
                return new LookupResult<>(null, "20240426", false);
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("srycd", "999999999");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getGenericPrice(USER, PASSWORD, null, uriInfo, null);

        assertEquals(200, response.getStatus());
        OrcaDrugMasterEntry payload = (OrcaDrugMasterEntry) response.getEntity();
        assertEquals("generic-price", payload.getCategory());
        assertNull(payload.getMinPrice());
        OrcaMasterMeta meta = payload.getMeta();
        assertTrue(meta.isMissingMaster());
        assertTrue(meta.isFallbackUsed());
    }

    @Test
    void getYouhou_returnsListWithMeta() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public ListSearchResult<YouhouRecord> searchYouhou(YouhouCriteria criteria) {
                YouhouRecord record = new YouhouRecord();
                record.youhouCode = "Y001";
                record.youhouName = "Sample Youhou";
                record.startDate = "20240401";
                record.endDate = "99991231";
                record.version = "20240426";
                return new ListSearchResult<>(List.of(record), 1, "20240426");
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

        Response response = resource.getYouhou(USER, PASSWORD, null, uriInfo, null);

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        List<OrcaDrugMasterEntry> payload = (List<OrcaDrugMasterEntry>) response.getEntity();
        assertFalse(payload.isEmpty());
        OrcaDrugMasterEntry entry = payload.get(0);
        assertEquals("youhou", entry.getCategory());
        assertEquals(entry.getCode(), entry.getYouhouCode());
        assertNotNull(entry.getMeta());
    }

    @Test
    void getHokenja_returnsListWithMeta() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public HokenjaSearchResult searchHokenja(HokenjaCriteria criteria) {
                HokenjaRecord record = new HokenjaRecord();
                record.payerCode = "123456";
                record.payerName = "Sample Payer";
                record.insurerType = "国保";
                record.payerRatio = 0.3;
                record.prefCode = "13";
                record.cityCode = "13000";
                record.zip = "1000001";
                record.addressLine = "Tokyo";
                record.phone = "0312345678";
                record.startDate = "20240401";
                record.endDate = "99991231";
                record.version = "20240426";
                return new HokenjaSearchResult(List.of(record), 1, "20240426");
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

        Response response = resource.getHokenja(USER, PASSWORD, null, uriInfo, null);

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        OrcaMasterListResponse<OrcaInsurerEntry> payload =
                (OrcaMasterListResponse<OrcaInsurerEntry>) response.getEntity();
        assertNotNull(payload);
        assertNotNull(payload.getTotalCount());
        assertNotNull(payload.getItems());
        assertFalse(payload.getItems().isEmpty());
        OrcaInsurerEntry entry = payload.getItems().get(0);
        assertNotNull(entry.getPayerCode());
        assertNotNull(entry.getPayerName());
        assertNotNull(entry.getPayerType());
        assertNotNull(entry.getPayerRatio());
        assertNotNull(entry.getMeta());
    }

    @Test
    void getAddress_invalidZip_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), new OrcaMasterDao());
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("zip", "123");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getAddress(USER, PASSWORD, null, uriInfo, null);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("ZIP_VALIDATION_ERROR", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
    }

    @Test
    void getAddress_returnsEntryWithMeta() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public LookupResult<AddressRecord> findAddress(AddressCriteria criteria) {
                AddressRecord record = new AddressRecord();
                record.zip = "1000001";
                record.prefCode = "13";
                record.cityCode = "13000";
                record.city = "千代田区";
                record.town = "千代田";
                record.kana = "トウキョウト チヨダク チヨダ";
                record.roman = "Chiyoda";
                record.fullAddress = "東京都千代田区千代田";
                record.startDate = "20240401";
                record.endDate = "99991231";
                record.version = "20240426";
                return new LookupResult<>(record, "20240426", true);
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("zip", "1000001");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getAddress(USER, PASSWORD, null, uriInfo, null);

        assertEquals(200, response.getStatus());
        OrcaAddressEntry payload = (OrcaAddressEntry) response.getEntity();
        assertNotNull(payload);
        assertEquals("1000001", payload.getZip());
        assertNotNull(payload.getMeta());
    }

    @Test
    void getAddress_unknownZip_returnsNotFound() {
        OrcaMasterDao masterDao = new OrcaMasterDao() {
            @Override
            public LookupResult<AddressRecord> findAddress(AddressCriteria criteria) {
                return new LookupResult<>(null, "20240426", false);
            }
        };
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), masterDao);
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("zip", "9999999");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getAddress(USER, PASSWORD, null, uriInfo, null);

        assertEquals(404, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("MASTER_ADDRESS_NOT_FOUND", payload.getCode());
    }

    @Test
    void getEtensu_emptyResult_returnsNotFound() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao() {
            @Override
            public EtensuSearchResult search(EtensuSearchCriteria criteria) {
                return new EtensuSearchResult(Collections.emptyList(), 0, "202404");
            }
        }, new OrcaMasterDao());
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("keyword", "no-such-entry");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

        assertEquals(404, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("TENSU_NOT_FOUND", payload.getCode());
    }

    @Test
    void getEtensu_returnsNoticeEffectiveKubunAndPoints() throws Exception {
        EtensuDao.EtensuRecord record = new EtensuDao.EtensuRecord();
        setEtensuField(record, "tensuCode", "110000001");
        setEtensuField(record, "name", "Sample Tensu");
        setEtensuField(record, "kubun", "11");
        setEtensuField(record, "points", 288d);
        setEtensuField(record, "tanka", 288d);
        setEtensuField(record, "unit", "visit");
        setEtensuField(record, "noticeDate", "20240101");
        setEtensuField(record, "effectiveDate", "20240401");
        setEtensuField(record, "startDate", "20240401");
        setEtensuField(record, "endDate", "99991231");
        setEtensuField(record, "tensuVersion", "202404");

        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao() {
            @Override
            public EtensuSearchResult search(EtensuSearchCriteria criteria) {
                return new EtensuSearchResult(List.of(record), 1, "202404");
            }
        }, new OrcaMasterDao());
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

        Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        OrcaMasterListResponse<OrcaTensuEntry> payload =
                (OrcaMasterListResponse<OrcaTensuEntry>) response.getEntity();
        assertNotNull(payload);
        assertEquals(1, payload.getTotalCount());
        OrcaTensuEntry entry = payload.getItems().get(0);
        assertEquals("11", entry.getKubun());
        assertEquals(288d, entry.getPoints());
        assertEquals("20240101", entry.getNoticeDate());
        assertEquals("20240401", entry.getEffectiveDate());
    }

    @Test
    void getEtensu_dbUnavailable_returnsServiceUnavailable() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao() {
            @Override
            public EtensuSearchResult search(EtensuSearchCriteria criteria) {
                return new EtensuSearchResult(Collections.emptyList(), 0, "202404", 0, true);
            }
        }, new OrcaMasterDao());
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

        Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

        assertEquals(503, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("ETENSU_UNAVAILABLE", payload.getCode());
    }

    @Test
    void getEtensu_invalidCategory_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), new OrcaMasterDao());
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("category", "ABC");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("TENSU_CATEGORY_INVALID", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
    }

    @Test
    void getEtensu_invalidAsOf_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), new OrcaMasterDao());
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("asOf", "2024-01-01");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("TENSU_ASOF_INVALID", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
    }

    @Test
    void getEtensu_invalidTensuVersion_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource(new EtensuDao(), new OrcaMasterDao());
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("tensuVersion", "2024-04");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("TENSU_VERSION_INVALID", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
    }

    @Test
    void etagMatches_acceptsWeakMultipleAndWildcardValues() throws Exception {
        OrcaMasterResource resource = new OrcaMasterResource();
        Method method = OrcaMasterResource.class.getDeclaredMethod("etagMatches", String.class, String.class);
        method.setAccessible(true);
        assertTrue((Boolean) method.invoke(resource, "\"abc\"", "abc"));
        assertTrue((Boolean) method.invoke(resource, "W/\"abc\"", "abc"));
        assertTrue((Boolean) method.invoke(resource, "\"nope\", \"abc\"", "abc"));
        assertTrue((Boolean) method.invoke(resource, "*", "abc"));
        assertFalse((Boolean) method.invoke(resource, "\"nope\"", "abc"));
    }

    @Test
    void normalizeQuery_sortsKeysAndValuesWithDuplicates() throws Exception {
        OrcaMasterResource resource = new OrcaMasterResource();
        Method method = OrcaMasterResource.class.getDeclaredMethod("normalizeQuery", MultivaluedMap.class);
        method.setAccessible(true);
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("b", "2");
        params.add("a", "3");
        params.add("b", "1");
        params.add("b", "1");
        String normalized = (String) method.invoke(resource, params);
        assertEquals("a=3&b=1,1,2", normalized);
    }

    private UriInfo createUriInfo(MultivaluedMap<String, String> params) {
        return (UriInfo) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{UriInfo.class},
                (proxy, method, args) -> {
                    if ("getQueryParameters".equals(method.getName())) {
                        return params;
                    }
                    return null;
                }
        );
    }

    private HttpServletRequest createRequestWithRunId(String runId, String requestUri) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{HttpServletRequest.class},
                (proxy, method, args) -> {
                    switch (method.getName()) {
                        case "getHeader":
                            String headerName = (String) args[0];
                            if ("X-Run-Id".equalsIgnoreCase(headerName)) {
                                return runId;
                            }
                            return null;
                        case "getRemoteAddr":
                            return "127.0.0.1";
                        case "getRequestURI":
                            return requestUri;
                        default:
                            return null;
                    }
                }
        );
    }

    private static final Pattern RUN_ID_PATTERN = Pattern.compile("\\\\d{8}T\\\\d{6}Z");

    private void setEtensuField(EtensuDao.EtensuRecord record, String fieldName, Object value) throws Exception {
        Field field = EtensuDao.EtensuRecord.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(record, value);
    }
}
