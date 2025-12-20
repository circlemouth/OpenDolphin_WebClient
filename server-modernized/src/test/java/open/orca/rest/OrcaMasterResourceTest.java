package open.orca.rest;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.lang.reflect.Proxy;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        assertEquals("snapshot", meta.getDataSource());
        assertEquals("20251219T144408Z", meta.getRunId());
        assertNotNull(meta.getFetchedAt());
    }

    @Test
    void getGenericPrice_invalidSrycd_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource();
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("srycd", "12345");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getGenericPrice(USER, PASSWORD, null, uriInfo, null);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("SRYCD_VALIDATION_ERROR", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
        assertEquals("20251219T144408Z", payload.getRunId());
    }

    @Test
    void getGenericPrice_missingMaster_returnsFallbackMeta() {
        OrcaMasterResource resource = new OrcaMasterResource();
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        OrcaMasterResource resource = new OrcaMasterResource();
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
        Path snapshotRoot = Files.createTempDirectory("orca-etensu-snapshot");
        Path fixtureRoot = Files.createTempDirectory("orca-etensu-fixture");
        Path fixtureFile = fixtureRoot.resolve("orca-master-etensu.json");
        String fixtureJson = """
                {
                  "list": [
                    {
                      "etensuCategory": "1",
                      "category": "11",
                      "medicalFeeCode": "110000001",
                      "tensuCode": "110000001",
                      "name": "Sample Tensu",
                      "points": 288,
                      "tanka": 288,
                      "unit": "visit",
                      "noticeDate": "20240101",
                      "effectiveDate": "20240401",
                      "startDate": "20240401",
                      "endDate": "99991231",
                      "tensuVersion": "202404"
                    }
                  ],
                  "version": "20240101",
                  "snapshotVersion": "2024-01-01"
                }
                """;
        Files.write(fixtureFile, fixtureJson.getBytes(StandardCharsets.UTF_8));

        String snapshotKey = "ORCA_MASTER_SNAPSHOT_ROOT";
        String fixtureKey = "ORCA_MASTER_FIXTURE_ROOT";
        String prevSnapshot = System.getProperty(snapshotKey);
        String prevFixture = System.getProperty(fixtureKey);
        System.setProperty(snapshotKey, snapshotRoot.toString());
        System.setProperty(fixtureKey, fixtureRoot.toString());
        try {
            OrcaMasterResource resource = new OrcaMasterResource();
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
        } finally {
            restoreSystemProperty(snapshotKey, prevSnapshot);
            restoreSystemProperty(fixtureKey, prevFixture);
        }
    }

    @Test
    void getEtensu_fixtureLoadFailed_returnsServiceUnavailable() throws Exception {
        Path snapshotRoot = Files.createTempDirectory("orca-etensu-snapshot");
        Path fixtureRoot = Files.createTempDirectory("orca-etensu-fixture");
        Path fixtureFile = fixtureRoot.resolve("orca-master-etensu.json");
        Files.write(fixtureFile, "not-json".getBytes(StandardCharsets.UTF_8));

        String snapshotKey = "ORCA_MASTER_SNAPSHOT_ROOT";
        String fixtureKey = "ORCA_MASTER_FIXTURE_ROOT";
        String prevSnapshot = System.getProperty(snapshotKey);
        String prevFixture = System.getProperty(fixtureKey);
        System.setProperty(snapshotKey, snapshotRoot.toString());
        System.setProperty(fixtureKey, fixtureRoot.toString());
        try {
            OrcaMasterResource resource = new OrcaMasterResource();
            UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

            Response response = resource.getEtensu(USER, PASSWORD, null, uriInfo, null);

            assertEquals(503, response.getStatus());
            OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
            assertEquals("ETENSU_UNAVAILABLE", payload.getCode());
        } finally {
            restoreSystemProperty(snapshotKey, prevSnapshot);
            restoreSystemProperty(fixtureKey, prevFixture);
        }
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

    private void restoreSystemProperty(String key, String value) {
        if (value == null) {
            System.clearProperty(key);
        } else {
            System.setProperty(key, value);
        }
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
}
