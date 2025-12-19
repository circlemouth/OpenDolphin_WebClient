package open.orca.rest;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.lang.reflect.Proxy;
import java.util.List;
import open.dolphin.rest.dto.orca.OrcaDrugMasterEntry;
import open.dolphin.rest.dto.orca.OrcaMasterErrorResponse;
import open.dolphin.rest.dto.orca.OrcaMasterListResponse;
import open.dolphin.rest.dto.orca.OrcaMasterMeta;
import org.junit.jupiter.api.Test;

class OrcaMasterResourceTest {

    private static final String USER = "1.3.6.1.4.1.9414.70.1:admin";
    private static final String PASSWORD = "21232f297a57a5a743894a0e4a801fc3";

    @Test
    void getGenericClass_returnsPagedResponseWithMeta() {
        OrcaMasterResource resource = new OrcaMasterResource();
        UriInfo uriInfo = createUriInfo(new MultivaluedHashMap<>());

        Response response = resource.getGenericClass(USER, PASSWORD, uriInfo);

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
        assertEquals("20251219T140028Z", meta.getRunId());
        assertNotNull(meta.getFetchedAt());
    }

    @Test
    void getGenericPrice_invalidSrycd_returnsValidationError() {
        OrcaMasterResource resource = new OrcaMasterResource();
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("srycd", "12345");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getGenericPrice(USER, PASSWORD, uriInfo);

        assertEquals(422, response.getStatus());
        OrcaMasterErrorResponse payload = (OrcaMasterErrorResponse) response.getEntity();
        assertEquals("SRYCD_VALIDATION_ERROR", payload.getCode());
        assertEquals(Boolean.TRUE, payload.getValidationError());
        assertEquals("20251219T140028Z", payload.getRunId());
    }

    @Test
    void getGenericPrice_missingMaster_returnsFallbackMeta() {
        OrcaMasterResource resource = new OrcaMasterResource();
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("srycd", "999999999");
        UriInfo uriInfo = createUriInfo(params);

        Response response = resource.getGenericPrice(USER, PASSWORD, uriInfo);

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

        Response response = resource.getYouhou(USER, PASSWORD, uriInfo);

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        List<OrcaDrugMasterEntry> payload = (List<OrcaDrugMasterEntry>) response.getEntity();
        assertFalse(payload.isEmpty());
        OrcaDrugMasterEntry entry = payload.get(0);
        assertEquals("youhou", entry.getCategory());
        assertEquals(entry.getCode(), entry.getYouhouCode());
        assertNotNull(entry.getMeta());
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
