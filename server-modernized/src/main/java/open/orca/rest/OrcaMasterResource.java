package open.orca.rest;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.EntityTag;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.UriInfo;
import open.dolphin.rest.dto.orca.OrcaDrugMasterEntry;
import open.dolphin.rest.dto.orca.OrcaMasterErrorResponse;
import open.dolphin.rest.dto.orca.OrcaMasterListResponse;
import open.dolphin.rest.dto.orca.OrcaMasterMeta;
import open.dolphin.rest.dto.orca.OrcaAddressEntry;
import open.dolphin.rest.dto.orca.OrcaInsurerEntry;
import open.dolphin.rest.dto.orca.OrcaTensuEntry;
import open.dolphin.rest.AbstractResource;
import open.dolphin.audit.AuditEventEnvelope;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.SessionAuditDispatcher;

/**
 * ORCA master endpoints for the modernized server.
 * Provides read-only responses with audit/meta fields that align with the web client bridge.
 */
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
public class OrcaMasterResource extends AbstractResource {

    private static final String DEFAULT_USERNAME = "1.3.6.1.4.1.9414.70.1:admin";
    private static final String DEFAULT_PASSWORD = "21232f297a57a5a743894a0e4a801fc3";
    private static final String RUN_ID = "20251219T144408Z";
    private static final String DEFAULT_VERSION = "20240426";
    private static final String DEFAULT_VALID_FROM = "20240401";
    private static final String DEFAULT_VALID_TO = "99991231";
    private static final long CACHE_TTL_SHORT_SECONDS = 300;
    private static final long CACHE_TTL_LONG_SECONDS = 604800;
    private static final long CACHE_STALE_REVALIDATE_SECONDS = 86400;
    private static final int MAX_PAGE_SIZE = 2000;
    private static final Pattern SRYCD_PATTERN = Pattern.compile("^\\d{9}$");
    private static final Pattern ZIP_PATTERN = Pattern.compile("^\\d{7}$");
    private static final Pattern PREF_PATTERN = Pattern.compile("^(0[1-9]|[1-3][0-9]|4[0-7])$");
    private static final Pattern ETENSU_CATEGORY_PATTERN = Pattern.compile("^\\d{1,2}$");
    private static final Pattern TENSU_VERSION_PATTERN = Pattern.compile("^\\d{6}$");
    private static final Pattern AS_OF_PATTERN = Pattern.compile("^\\d{8}$");
    private static final java.nio.file.Path SNAPSHOT_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "master-snapshots");
    private static final java.nio.file.Path MSW_FIXTURE_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "msw-fixture");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
            .findAndRegisterModules()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    private final EtensuDao etensuDao;
    private final OrcaMasterDao masterDao;

    public OrcaMasterResource() {
        this(new EtensuDao(), new OrcaMasterDao());
    }

    OrcaMasterResource(EtensuDao etensuDao) {
        this(etensuDao, new OrcaMasterDao());
    }

    OrcaMasterResource(EtensuDao etensuDao, OrcaMasterDao masterDao) {
        this.etensuDao = etensuDao != null ? etensuDao : new EtensuDao();
        this.masterDao = masterDao != null ? masterDao : new OrcaMasterDao();
    }

    private enum DataOrigin {
        ORCA_DB,
        SNAPSHOT,
        MSW_FIXTURE,
        FALLBACK
    }

    private static final class LoadedFixture<T> {
        final List<T> entries;
        final String snapshotVersion;
        final String version;
        final DataOrigin origin;
        final boolean loadFailed;

        LoadedFixture(List<T> entries, String snapshotVersion, String version, DataOrigin origin, boolean loadFailed) {
            this.entries = entries;
            this.snapshotVersion = snapshotVersion;
            this.version = version;
            this.origin = origin;
            this.loadFailed = loadFailed;
        }
    }

    private static final class FixtureLoadResult<T> {
        final FixtureListResponse<T> response;
        final boolean loadFailed;

        FixtureLoadResult(FixtureListResponse<T> response, boolean loadFailed) {
            this.response = response;
            this.loadFailed = loadFailed;
        }
    }

    @GET
    @Path("/api/orca/master/generic-class")
    public Response getGenericClass(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.GenericClassCriteria criteria = new OrcaMasterDao.GenericClassCriteria();
        criteria.setKeyword(keyword);
        criteria.setEffective(effective);
        criteria.setPage(parsePositiveInt(params, "page", 1));
        criteria.setSize(parsePageSize(params, "size", 100));
        OrcaMasterDao.GenericClassSearchResult dbResult = masterDao.searchGenericClass(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.GenericClassRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_GENERIC_CLASS_UNAVAILABLE",
                    "薬効分類マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/generic-class", "orca05-generic-class", 503, dbFixture, false,
                    true, 0, buildQueryDetails(null, keyword, effective, params));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.GenericClassRecord> fixture = buildDbFixture(
                dbResult.getRecords(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca05-generic-class";
        final String etagValue = buildEtag("/orca/master/generic-class", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/generic-class", masterType, 304, fixture, true, null, null,
                    buildQueryDetails(null, keyword, effective, params));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        final int totalCount = dbResult.getTotalCount();
        final List<OrcaDrugMasterEntry> items = fixture.entries.stream()
                .map(entry -> toGenericClassEntry(entry, fixture))
                .collect(Collectors.toList());
        OrcaMasterListResponse<OrcaDrugMasterEntry> response = new OrcaMasterListResponse<>();
        response.setTotalCount(totalCount);
        response.setItems(items);
        recordMasterAudit(request, "/orca/master/generic-class", masterType, 200, fixture, false, totalCount == 0,
                totalCount, buildQueryDetails(null, keyword, effective, params));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/orca/master/generic-class")
    public Response getGenericClassAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getGenericClass(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/api/orca/master/generic-price")
    public Response getGenericPrice(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String srycd = getFirstValue(params, "srycd");
        if (srycd == null || !SRYCD_PATTERN.matcher(srycd).matches()) {
            return validationError(request, "SRYCD_VALIDATION_ERROR", "SRYCD は数字 9 桁で指定してください");
        }
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.GenericPriceCriteria criteria = new OrcaMasterDao.GenericPriceCriteria();
        criteria.setSrycd(srycd);
        criteria.setEffective(effective);
        OrcaMasterDao.LookupResult<OrcaMasterDao.GenericPriceRecord> dbResult =
                masterDao.findGenericPrice(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.GenericPriceRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_GENERIC_PRICE_UNAVAILABLE",
                    "最低薬価マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/generic-price", "orca05-generic-price", 503, dbFixture, false,
                    true, 0, buildSrycdDetails(srycd, effective, params));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.GenericPriceRecord> fixture = buildDbFixture(
                dbResult.isFound() && dbResult.getRecord() != null
                        ? List.of(dbResult.getRecord())
                        : Collections.emptyList(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca05-generic-price";
        final String etagValue = buildEtag("/orca/master/generic-price", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/generic-price", masterType, 304, fixture, true, null, null,
                    buildSrycdDetails(srycd, effective, params));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        final OrcaMasterDao.GenericPriceRecord hit = dbResult.isFound() ? dbResult.getRecord() : null;
        if (hit == null) {
            OrcaDrugMasterEntry missing = buildDrugEntry(
                    srycd,
                    "未収載薬",
                    "generic-price",
                    null,
                    null,
                    null,
                    null,
                    null,
                    DEFAULT_VALID_FROM,
                    DEFAULT_VALID_TO,
                    null,
                    fixture,
                    false,
                    true,
                    false
            );
            recordMasterAudit(request, "/orca/master/generic-price", masterType, 200, fixture, false, true, 0,
                    true, true, buildSrycdDetails(srycd, effective, params));
            return buildCachedOkResponse(missing, etagValue, ttlSeconds);
        }
        OrcaDrugMasterEntry response = toGenericPriceEntry(hit, fixture);
        recordMasterAudit(request, "/orca/master/generic-price", masterType, 200, fixture, false, false, 1,
                buildSrycdDetails(srycd, effective, params));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/orca/master/generic-price")
    public Response getGenericPriceAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getGenericPrice(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/api/orca/master/youhou")
    public Response getYouhou(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.YouhouCriteria criteria = new OrcaMasterDao.YouhouCriteria();
        criteria.setKeyword(keyword);
        criteria.setEffective(effective);
        OrcaMasterDao.ListSearchResult<OrcaMasterDao.YouhouRecord> dbResult = masterDao.searchYouhou(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.YouhouRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_YOUHOU_UNAVAILABLE", "用法マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/youhou", "orca05-youhou", 503, dbFixture, false,
                    true, 0, buildQueryDetails(null, keyword, effective, params));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.YouhouRecord> fixture = buildDbFixture(
                dbResult.getRecords(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca05-youhou";
        final String etagValue = buildEtag("/orca/master/youhou", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/youhou", masterType, 304, fixture, true, null, null,
                    buildQueryDetails(null, keyword, effective, params));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        final List<OrcaDrugMasterEntry> response = fixture.entries.stream()
                .map(entry -> toYouhouEntry(entry, fixture))
                .collect(Collectors.toList());
        recordMasterAudit(request, "/orca/master/youhou", masterType, 200, fixture, false, response.isEmpty(),
                response.size(), buildQueryDetails(null, keyword, effective, params));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/orca/master/youhou")
    public Response getYouhouAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getYouhou(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/api/orca/master/material")
    public Response getMaterial(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.MaterialCriteria criteria = new OrcaMasterDao.MaterialCriteria();
        criteria.setKeyword(keyword);
        criteria.setEffective(effective);
        OrcaMasterDao.ListSearchResult<OrcaMasterDao.MaterialRecord> dbResult = masterDao.searchMaterial(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.MaterialRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_MATERIAL_UNAVAILABLE", "特定器材マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/material", "orca05-material", 503, dbFixture, false,
                    true, 0, buildQueryDetails(null, keyword, effective, params));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.MaterialRecord> fixture = buildDbFixture(
                dbResult.getRecords(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca05-material";
        final String etagValue = buildEtag("/orca/master/material", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/material", masterType, 304, fixture, true, null, null,
                    buildQueryDetails(null, keyword, effective, params));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        final List<OrcaDrugMasterEntry> response = fixture.entries.stream()
                .map(entry -> toMaterialEntry(entry, fixture))
                .collect(Collectors.toList());
        recordMasterAudit(request, "/orca/master/material", masterType, 200, fixture, false, response.isEmpty(),
                response.size(), buildQueryDetails(null, keyword, effective, params));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/orca/master/material")
    public Response getMaterialAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getMaterial(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/api/orca/master/kensa-sort")
    public Response getKensaSort(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.KensaSortCriteria criteria = new OrcaMasterDao.KensaSortCriteria();
        criteria.setKeyword(keyword);
        criteria.setEffective(effective);
        OrcaMasterDao.ListSearchResult<OrcaMasterDao.KensaSortRecord> dbResult = masterDao.searchKensaSort(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.KensaSortRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_KENSA_SORT_UNAVAILABLE",
                    "検査区分マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/kensa-sort", "orca05-kensa-sort", 503, dbFixture, false,
                    true, 0, buildQueryDetails(null, keyword, effective, params));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.KensaSortRecord> fixture = buildDbFixture(
                dbResult.getRecords(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca05-kensa-sort";
        final String etagValue = buildEtag("/orca/master/kensa-sort", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/kensa-sort", masterType, 304, fixture, true, null, null,
                    buildQueryDetails(null, keyword, effective, params));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        final List<OrcaDrugMasterEntry> response = fixture.entries.stream()
                .map(entry -> toKensaSortEntry(entry, fixture))
                .collect(Collectors.toList());
        recordMasterAudit(request, "/orca/master/kensa-sort", masterType, 200, fixture, false, response.isEmpty(),
                response.size(), buildQueryDetails(null, keyword, effective, params));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/api/orca/master/hokenja")
    public Response getHokenja(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String pref = getFirstValue(params, "pref");
        if (pref != null && !PREF_PATTERN.matcher(pref).matches()) {
            return validationError(request, "PREF_VALIDATION_ERROR", "都道府県コードは 01-47 の 2 桁で指定してください");
        }
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.HokenjaCriteria criteria = new OrcaMasterDao.HokenjaCriteria();
        criteria.setPref(pref);
        criteria.setKeyword(keyword);
        criteria.setEffective(effective);
        criteria.setPage(parsePositiveInt(params, "page", 1));
        criteria.setSize(parsePageSize(params, "size", 100));
        OrcaMasterDao.HokenjaSearchResult dbResult = masterDao.searchHokenja(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.HokenjaRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_HOKENJA_UNAVAILABLE",
                    "保険者マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/hokenja", "orca06-hokenja", 503, dbFixture, false,
                    true, 0, buildQueryDetails(pref, keyword, effective, params));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.HokenjaRecord> fixture = buildDbFixture(
                dbResult.getRecords(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca06-hokenja";
        final String etagValue = buildEtag("/orca/master/hokenja", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/hokenja", masterType, 304, fixture, true, null, null,
                    buildQueryDetails(pref, keyword, effective, params));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        final int totalCount = dbResult.getTotalCount();
        final List<OrcaInsurerEntry> items = fixture.entries.stream()
                .map(entry -> toInsurerEntry(entry, fixture))
                .collect(Collectors.toList());
        OrcaMasterListResponse<OrcaInsurerEntry> response = new OrcaMasterListResponse<>();
        response.setTotalCount(totalCount);
        response.setItems(items);
        recordMasterAudit(request, "/orca/master/hokenja", masterType, 200, fixture, false, totalCount == 0,
                totalCount, buildQueryDetails(pref, keyword, effective, params));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/orca/master/hokenja")
    public Response getHokenjaAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getHokenja(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/api/orca/master/address")
    public Response getAddress(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String zip = getFirstValue(params, "zip");
        if (zip == null || !ZIP_PATTERN.matcher(zip).matches()) {
            return validationError(request, "ZIP_VALIDATION_ERROR", "郵便番号は数字 7 桁で指定してください");
        }
        final String effective = getFirstValue(params, "effective");
        OrcaMasterDao.AddressCriteria criteria = new OrcaMasterDao.AddressCriteria();
        criteria.setZip(zip);
        criteria.setEffective(effective);
        OrcaMasterDao.LookupResult<OrcaMasterDao.AddressRecord> dbResult = masterDao.findAddress(criteria);
        if (dbResult == null) {
            LoadedFixture<OrcaMasterDao.AddressRecord> dbFixture = buildDbFixture(
                    Collections.emptyList(),
                    null,
                    true
            );
            Response failure = serviceUnavailable(request, "MASTER_ADDRESS_UNAVAILABLE",
                    "住所マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/address", "orca06-address", 503, dbFixture, false,
                    true, 0, buildQueryDetails(null, null, effective, params, zip));
            return failure;
        }
        LoadedFixture<OrcaMasterDao.AddressRecord> fixture = buildDbFixture(
                dbResult.isFound() && dbResult.getRecord() != null
                        ? List.of(dbResult.getRecord())
                        : Collections.emptyList(),
                dbResult.getVersion(),
                false
        );
        final String masterType = "orca06-address";
        final String etagValue = buildEtag("/orca/master/address", masterType, fixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/master/address", masterType, 304, fixture, true, null, null,
                    buildQueryDetails(null, null, effective, params, zip));
            return buildNotModifiedResponse(etagValue, ttlSeconds);
        }
        OrcaMasterDao.AddressRecord match = dbResult.isFound() ? dbResult.getRecord() : null;
        if (match == null) {
            Response notFound = notFound("MASTER_ADDRESS_NOT_FOUND", "指定の郵便番号に該当する住所がありません", request);
            recordMasterAudit(request, "/orca/master/address", masterType, 404, fixture, false, true, 0,
                    true, true, buildQueryDetails(null, null, effective, params, zip));
            return notFound;
        }
        OrcaAddressEntry response = toAddressEntry(match, fixture);
        recordMasterAudit(request, "/orca/master/address", masterType, 200, fixture, false, false, 1,
                buildQueryDetails(null, null, effective, params, zip));
        return buildCachedOkResponse(response, etagValue, ttlSeconds);
    }

    @GET
    @Path("/orca/master/address")
    public Response getAddressAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getAddress(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/orca/master/kensa-sort")
    public Response getKensaSortAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getKensaSort(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/orca/tensu/etensu")
    public Response getEtensu(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized(request);
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String masterType = "orca08-etensu";
        final String category = getFirstValue(params, "category");
        if (category != null && !ETENSU_CATEGORY_PATTERN.matcher(category).matches()) {
            recordEtensuValidationAudit(request, masterType, keyword, category, null, null,
                    "TENSU_CATEGORY_INVALID", params);
            return validationError(request, "TENSU_CATEGORY_INVALID", "category must be numeric 1-2 digits");
        }
        final String asOf = getFirstValue(params, "asOf");
        if (asOf != null && !AS_OF_PATTERN.matcher(asOf).matches()) {
            recordEtensuValidationAudit(request, masterType, keyword, category, asOf, null,
                    "TENSU_ASOF_INVALID", params);
            return validationError(request, "TENSU_ASOF_INVALID", "asOf must be YYYYMMDD");
        }
        final String tensuVersion = getFirstValue(params, "tensuVersion");
        if (tensuVersion != null && !TENSU_VERSION_PATTERN.matcher(tensuVersion).matches()) {
            recordEtensuValidationAudit(request, masterType, keyword, category, asOf, tensuVersion,
                    "TENSU_VERSION_INVALID", params);
            return validationError(request, "TENSU_VERSION_INVALID", "tensuVersion must be YYYYMM");
        }
        EtensuDao.EtensuSearchCriteria criteria = new EtensuDao.EtensuSearchCriteria();
        criteria.setKeyword(keyword);
        criteria.setCategory(category);
        criteria.setAsOf(asOf);
        criteria.setTensuVersion(tensuVersion);
        criteria.setPage(parsePositiveInt(params, "page", 1));
        criteria.setSize(parsePageSize(params, "size", 100));
        EtensuDao.EtensuSearchResult dbResult = etensuDao.search(criteria);
        if (dbResult == null || dbResult.isLoadFailed()) {
            LoadedFixture<EtensuDao.EtensuRecord> dbFixture = new LoadedFixture<>(
                    Collections.emptyList(),
                    null,
                    tensuVersion,
                    DataOrigin.ORCA_DB,
                    true
            );
            Response failure = serviceUnavailable(request, "ETENSU_UNAVAILABLE", "etensu master unavailable");
            recordMasterAudit(request, "/orca/tensu/etensu", masterType, 503, dbFixture, false, true, 0,
                    buildTensuQueryDetails(keyword, category, asOf, tensuVersion, params));
            return failure;
        }
        LoadedFixture<EtensuDao.EtensuRecord> dbFixture = new LoadedFixture<>(
                dbResult.getRecords(),
                null,
                dbResult.getVersion(),
                DataOrigin.ORCA_DB,
                false
        );
        final String etagValue = buildEtag("/orca/tensu/etensu", masterType, dbFixture, params);
        final long ttlSeconds = cacheTtlSeconds(masterType);
        final Map<String, Object> etensuAuditDetails = buildEtensuAuditDetails(keyword, category, asOf, tensuVersion,
                params, dbResult);
        final Map<String, String> basePerfHeaders = buildEtensuPerformanceHeaders(dbResult, false);
        if (etagMatches(ifNoneMatch, etagValue)) {
            recordMasterAudit(request, "/orca/tensu/etensu", masterType, 304, dbFixture, true, null,
                    dbResult.getTotalCount(), etensuAuditDetails);
            Map<String, String> perfHeaders = buildEtensuPerformanceHeaders(dbResult, true);
            return buildNotModifiedResponse(etagValue, ttlSeconds, perfHeaders);
        }
        if (dbResult.getRecords().isEmpty()) {
            Response notFound = buildErrorResponse(Status.NOT_FOUND, "TENSU_NOT_FOUND",
                    "no etensu entries matched", request, basePerfHeaders);
            recordMasterAudit(request, "/orca/tensu/etensu", masterType, 404, dbFixture, false, true, 0,
                    true, true, etensuAuditDetails);
            return notFound;
        }
        final int totalCount = dbResult.getTotalCount();
        final List<OrcaTensuEntry> items = new ArrayList<>(dbResult.getRecords().size());
        for (EtensuDao.EtensuRecord entry : dbResult.getRecords()) {
            items.add(toEtensuEntry(entry, dbFixture));
        }
        OrcaMasterListResponse<OrcaTensuEntry> response = new OrcaMasterListResponse<>();
        response.setTotalCount(totalCount);
        response.setItems(items);
        recordMasterAudit(request, "/orca/tensu/etensu", masterType, 200, dbFixture, false, totalCount == 0,
                totalCount,
                etensuAuditDetails);
        return buildCachedOkResponse(response, etagValue, ttlSeconds, basePerfHeaders);
    }

    private void recordEtensuValidationAudit(HttpServletRequest request, String masterType, String keyword,
            String category, String asOf, String tensuVersion, String errorCode,
            MultivaluedMap<String, String> params) {
        LoadedFixture<EtensuDao.EtensuRecord> dbFixture = new LoadedFixture<>(
                Collections.emptyList(),
                null,
                tensuVersion,
                DataOrigin.ORCA_DB,
                false
        );
        java.util.Map<String, Object> details = buildTensuQueryDetails(keyword, category, asOf, tensuVersion, params);
        details.put("validationError", true);
        if (errorCode != null && !errorCode.isBlank()) {
            details.put("errorCode", errorCode);
        }
        recordMasterAudit(request, "/orca/tensu/etensu", masterType, 422, dbFixture, false, null, 0, details);
    }

    private Response unauthorized(HttpServletRequest request) {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode("ORCA_MASTER_UNAUTHORIZED");
        response.setMessage("Invalid Basic headers");
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            response.setCorrelationId(traceId);
        }
        return Response.status(Status.UNAUTHORIZED).entity(response).build();
    }

    private Response validationError(HttpServletRequest request, String code, String message) {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode(code);
        response.setMessage(message);
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            response.setCorrelationId(traceId);
        }
        response.setValidationError(Boolean.TRUE);
        return Response.status(422).entity(response).build();
    }

    private <T> LoadedFixture<T> loadEntries(Class<T> entryType, String snapshotRelativePath, String fixtureFileName) {
        FixtureLoadResult<T> snapshot = tryReadResponse(entryType, snapshotRoot().resolve(snapshotRelativePath));
        if (snapshot.response != null) {
            return new LoadedFixture<>(safeList(snapshot.response.list), snapshot.response.snapshotVersion,
                    snapshot.response.version, DataOrigin.SNAPSHOT, snapshot.loadFailed);
        }
        FixtureLoadResult<T> fixture = tryReadResponse(entryType, fixtureRoot().resolve(fixtureFileName));
        if (fixture.response != null) {
            return new LoadedFixture<>(safeList(fixture.response.list), fixture.response.snapshotVersion,
                    fixture.response.version, DataOrigin.MSW_FIXTURE, fixture.loadFailed);
        }
        return new LoadedFixture<>(Collections.emptyList(), null, null, DataOrigin.FALLBACK,
                snapshot.loadFailed || fixture.loadFailed);
    }

    private java.nio.file.Path snapshotRoot() {
        return resolveRoot("ORCA_MASTER_SNAPSHOT_ROOT", SNAPSHOT_ROOT);
    }

    private java.nio.file.Path fixtureRoot() {
        return resolveRoot("ORCA_MASTER_FIXTURE_ROOT", MSW_FIXTURE_ROOT);
    }

    private java.nio.file.Path resolveRoot(String key, java.nio.file.Path fallback) {
        String override = System.getProperty(key);
        if (override == null || override.isBlank()) {
            override = System.getenv(key);
        }
        if (override == null || override.isBlank()) {
            return resolveProjectRelative(fallback);
        }
        return Paths.get(override);
    }

    private java.nio.file.Path resolveProjectRelative(java.nio.file.Path fallback) {
        if (fallback == null || fallback.isAbsolute()) {
            return fallback;
        }
        String multiModuleRoot = System.getProperty("maven.multiModuleProjectDirectory");
        if (multiModuleRoot == null || multiModuleRoot.isBlank()) {
            multiModuleRoot = null;
        }
        if (multiModuleRoot != null) {
            java.nio.file.Path candidate = Paths.get(multiModuleRoot).resolve(fallback);
            if (Files.exists(candidate)) {
                return candidate;
            }
        }
        java.nio.file.Path current = Paths.get("").toAbsolutePath();
        while (current != null) {
            java.nio.file.Path candidate = current.resolve(fallback);
            if (Files.exists(candidate)) {
                return candidate;
            }
            current = current.getParent();
        }
        return fallback;
    }

    private <T> FixtureLoadResult<T> tryReadResponse(Class<T> entryType, java.nio.file.Path file) {
        if (Files.notExists(file)) {
            return new FixtureLoadResult<>(null, false);
        }
        try {
            JavaType type = TypeFactory.defaultInstance().constructParametricType(FixtureListResponse.class, entryType);
            FixtureListResponse<T> response = OBJECT_MAPPER.readValue(file.toFile(), type);
            if (response == null || response.list == null) {
                return new FixtureLoadResult<>(null, true);
            }
            return new FixtureLoadResult<>(response, false);
        } catch (IOException e) {
            return new FixtureLoadResult<>(null, true);
        }
    }

    private <T> List<T> safeList(List<T> source) {
        return source == null ? Collections.emptyList() : source;
    }

    private <T> LoadedFixture<T> buildDbFixture(List<T> entries, String version, boolean loadFailed) {
        return new LoadedFixture<>(safeList(entries), null, version, DataOrigin.ORCA_DB, loadFailed);
    }

    private <T> List<T> paginateList(List<T> source, MultivaluedMap<String, String> params) {
        int page = parsePositiveInt(params, "page", 1);
        int size = parsePageSize(params, "size", 100);
        int fromIndex = Math.max(0, (page - 1) * size);
        if (fromIndex >= source.size()) {
            return Collections.emptyList();
        }
        int toIndex = Math.min(source.size(), fromIndex + size);
        return source.subList(fromIndex, toIndex);
    }

    private int parsePositiveInt(MultivaluedMap<String, String> params, String key, int fallback) {
        String raw = getFirstValue(params, key);
        if (raw == null) {
            return fallback;
        }
        try {
            int parsed = Integer.parseInt(raw);
            return parsed > 0 ? parsed : fallback;
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private int parsePageSize(MultivaluedMap<String, String> params, String key, int fallback) {
        int parsed = parsePositiveInt(params, key, fallback);
        return Math.min(parsed, MAX_PAGE_SIZE);
    }

    private OrcaDrugMasterEntry toGenericClassEntry(OrcaMasterDao.GenericClassRecord entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.endDate, DEFAULT_VALID_TO);
        return buildDrugEntry(
                entry.classCode,
                entry.className,
                "generic",
                null,
                null,
                null,
                null,
                null,
                validFrom,
                validTo,
                null,
                fixture,
                entry.cacheHit,
                entry.missingMaster,
                entry.fallbackUsed
        );
    }

    private OrcaDrugMasterEntry toGenericPriceEntry(OrcaMasterDao.GenericPriceRecord entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.endDate, DEFAULT_VALID_TO);
        return buildDrugEntry(
                entry.srycd,
                entry.drugName,
                "generic-price",
                entry.unit,
                entry.price,
                entry.youhouCode,
                null,
                null,
                validFrom,
                validTo,
                null,
                fixture,
                entry.cacheHit,
                entry.missingMaster,
                entry.fallbackUsed
        );
    }

    private OrcaDrugMasterEntry toYouhouEntry(OrcaMasterDao.YouhouRecord entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.endDate, DEFAULT_VALID_TO);
        return buildDrugEntry(
                entry.youhouCode,
                entry.youhouName,
                "youhou",
                null,
                null,
                entry.youhouCode,
                null,
                null,
                validFrom,
                validTo,
                null,
                fixture,
                false,
                false,
                false
        );
    }

    private OrcaDrugMasterEntry toMaterialEntry(OrcaMasterDao.MaterialRecord entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.endDate, DEFAULT_VALID_TO);
        return buildDrugEntry(
                entry.materialCode,
                entry.materialName,
                "material",
                entry.unit,
                entry.price,
                null,
                entry.materialCategory,
                null,
                validFrom,
                validTo,
                entry.category,
                fixture,
                false,
                false,
                false
        );
    }

    private OrcaDrugMasterEntry toKensaSortEntry(OrcaMasterDao.KensaSortRecord entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.endDate, DEFAULT_VALID_TO);
        return buildDrugEntry(
                entry.kensaCode,
                entry.kensaName,
                "kensa-sort",
                null,
                null,
                null,
                null,
                entry.kensaSort,
                validFrom,
                validTo,
                entry.classification,
                fixture,
                false,
                false,
                false
        );
    }

    private OrcaInsurerEntry toInsurerEntry(OrcaMasterDao.HokenjaRecord entry, LoadedFixture<?> fixture) {
        OrcaInsurerEntry response = new OrcaInsurerEntry();
        String payerCode = firstNonBlank(entry.payerCode);
        response.setPayerCode(payerCode);
        response.setPayerName(firstNonBlank(entry.payerName));
        String payerType = resolvePayerType(entry.insurerType, payerCode);
        response.setPayerType(payerType);
        response.setPayerRatio(resolvePayerRatio(entry.payerRatio, payerType));
        String prefCode = firstNonBlank(entry.prefCode, derivePrefCode(payerCode));
        response.setPrefCode(prefCode);
        response.setCityCode(firstNonBlank(entry.cityCode, deriveCityCode(prefCode)));
        response.setZip(firstNonBlank(entry.zip));
        response.setAddressLine(firstNonBlank(entry.addressLine));
        response.setPhone(entry.phone);
        response.setValidFrom(firstNonBlank(entry.startDate, DEFAULT_VALID_FROM));
        response.setValidTo(firstNonBlank(entry.endDate, DEFAULT_VALID_TO));
        response.setMeta(buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, false, false, false, null));
        return response;
    }

    private OrcaAddressEntry toAddressEntry(OrcaMasterDao.AddressRecord entry, LoadedFixture<?> fixture) {
        OrcaAddressEntry response = new OrcaAddressEntry();
        response.setZip(firstNonBlank(entry.zip));
        String prefCode = firstNonBlank(entry.prefCode);
        response.setPrefCode(prefCode);
        response.setCityCode(firstNonBlank(entry.cityCode, deriveCityCode(prefCode)));
        response.setCity(entry.city);
        response.setTown(entry.town);
        response.setKana(entry.kana);
        response.setRoman(entry.roman);
        response.setFullAddress(firstNonBlank(entry.fullAddress));
        response.setMeta(buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, false, false, false, null));
        return response;
    }

    private OrcaTensuEntry toEtensuEntry(FixtureEtensuEntry entry, LoadedFixture<?> fixture) {
        OrcaTensuEntry response = new OrcaTensuEntry();
        response.setTensuCode(firstNonBlank(entry.tensuCode, entry.medicalFeeCode));
        response.setName(entry.name);
        response.setKubun(firstNonBlank(entry.kubun, entry.category, entry.etensuCategory));
        response.setNoticeDate(firstNonBlank(entry.noticeDate, entry.version, fixture.version, entry.snapshotVersion));
        response.setEffectiveDate(firstNonBlank(entry.effectiveDate, entry.startDate, entry.validFrom, DEFAULT_VALID_FROM));
        response.setPoints(firstNonBlankDouble(entry.points, entry.tanka));
        response.setTanka(firstNonBlankDouble(entry.tanka, entry.points));
        response.setUnit(entry.unit);
        response.setCategory(firstNonBlank(entry.category, entry.etensuCategory));
        response.setStartDate(firstNonBlank(entry.startDate, entry.validFrom, DEFAULT_VALID_FROM));
        response.setEndDate(firstNonBlank(entry.endDate, entry.validTo, DEFAULT_VALID_TO));
        response.setTensuVersion(resolveTensuVersion(entry));
        boolean missing = Boolean.TRUE.equals(entry.missingMaster);
        boolean fallback = Boolean.TRUE.equals(entry.fallbackUsed) || missing || fixture.origin == DataOrigin.FALLBACK;
        boolean cache = Boolean.TRUE.equals(entry.cacheHit);
        response.setMeta(buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, cache, missing, fallback, null));
        return response;
    }

    private OrcaTensuEntry toEtensuEntry(EtensuDao.EtensuRecord record, LoadedFixture<?> fixture) {
        OrcaTensuEntry response = new OrcaTensuEntry();
        response.setTensuCode(record.getTensuCode());
        response.setName(record.getName());
        response.setKubun(record.getKubun());
        response.setNoticeDate(firstNonBlank(record.getNoticeDate(), record.getTensuVersion()));
        response.setEffectiveDate(firstNonBlank(record.getEffectiveDate(), record.getStartDate(), DEFAULT_VALID_FROM));
        response.setPoints(firstNonBlankDouble(record.getPoints(), record.getTanka()));
        response.setTanka(firstNonBlankDouble(record.getTanka(), record.getPoints()));
        response.setUnit(record.getUnit());
        response.setCategory(record.getCategory());
        response.setStartDate(firstNonBlank(record.getStartDate(), DEFAULT_VALID_FROM));
        response.setEndDate(firstNonBlank(record.getEndDate(), DEFAULT_VALID_TO));
        response.setTensuVersion(record.getTensuVersion());
        response.setConflicts(record.getConflicts().isEmpty() ? null : record.getConflicts());
        response.setAdditions(record.getAdditions().isEmpty() ? null : record.getAdditions());
        response.setCalcUnits(record.getCalcUnits().isEmpty() ? null : record.getCalcUnits());
        response.setBundlingMembers(record.getBundlingMembers().isEmpty() ? null : record.getBundlingMembers());
        response.setSpecimens(record.getSpecimens().isEmpty() ? null : record.getSpecimens());
        response.setMeta(buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, false, false, false, null));
        return response;
    }

    private OrcaDrugMasterEntry buildDrugEntry(
            String code,
            String name,
            String category,
            String unit,
            Double minPrice,
            String youhouCode,
            String materialCategory,
            String kensaSort,
            String validFrom,
            String validTo,
            String note,
            LoadedFixture<?> fixture,
            Boolean cacheHit,
            Boolean missingMaster,
            Boolean fallbackUsed
    ) {
        OrcaDrugMasterEntry entry = new OrcaDrugMasterEntry();
        entry.setCode(code);
        entry.setName(name);
        entry.setCategory(category);
        entry.setUnit(unit);
        entry.setMinPrice(minPrice);
        entry.setYouhouCode(youhouCode);
        entry.setMaterialCategory(materialCategory);
        entry.setKensaSort(kensaSort);
        entry.setValidFrom(validFrom);
        entry.setValidTo(validTo);
        entry.setNote(note);
        boolean missing = Boolean.TRUE.equals(missingMaster);
        boolean fallback = Boolean.TRUE.equals(fallbackUsed) || missing || fixture.origin == DataOrigin.FALLBACK;
        boolean cache = Boolean.TRUE.equals(cacheHit);
        OrcaMasterMeta meta = buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, cache, missing, fallback, null);
        entry.setMeta(meta);
        return entry;
    }

    private OrcaMasterMeta buildMeta(
            DataOrigin origin,
            String snapshotVersion,
            String version,
            boolean cacheHit,
            boolean missingMaster,
            boolean fallbackUsed,
            Boolean validationError
    ) {
        OrcaMasterMeta meta = new OrcaMasterMeta();
        meta.setVersion(firstNonBlank(version, DEFAULT_VERSION));
        meta.setRunId(RUN_ID);
        meta.setSnapshotVersion(snapshotVersion);
        meta.setDataSource(dataSourceForOrigin(origin));
        meta.setCacheHit(cacheHit);
        meta.setMissingMaster(missingMaster);
        meta.setFallbackUsed(fallbackUsed);
        meta.setValidationError(validationError);
        meta.setFetchedAt(Instant.now().toString());
        return meta;
    }

    private String dataSourceForOrigin(DataOrigin origin) {
        if (origin == DataOrigin.FALLBACK) {
            return "fallback";
        }
        if (origin == DataOrigin.ORCA_DB) {
            return "server";
        }
        return "snapshot";
    }

    private boolean isEffective(String effective, String... ranges) {
        if (effective == null || effective.isBlank()) {
            return true;
        }
        String validFrom = null;
        String validTo = null;
        if (ranges != null && ranges.length > 0) {
            if (ranges.length >= 1) {
                validFrom = ranges[0];
            }
            if (ranges.length >= 2) {
                validTo = ranges[1];
            }
            if (ranges.length >= 3 && validFrom == null) {
                validFrom = ranges[2];
            }
            if (ranges.length >= 4 && validTo == null) {
                validTo = ranges[3];
            }
        }
        validFrom = firstNonBlank(validFrom, DEFAULT_VALID_FROM);
        validTo = firstNonBlank(validTo, DEFAULT_VALID_TO);
        return effective.compareTo(validFrom) >= 0 && effective.compareTo(validTo) <= 0;
    }

    private String getFirstValue(MultivaluedMap<String, String> params, String... keys) {
        if (params == null) {
            return null;
        }
        for (String key : keys) {
            List<String> values = params.get(key);
            if (values != null && !values.isEmpty()) {
                String value = values.get(0);
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }
        return null;
    }

    private boolean matchesKeyword(String keyword, String... values) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        if (values == null) {
            return false;
        }
        for (String value : values) {
            if (value != null && value.toLowerCase().contains(keyword.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesEtensuCategory(String category, FixtureEtensuEntry entry) {
        if (category == null || category.isBlank()) {
            return true;
        }
        String entryCategory = firstNonBlank(entry.category, entry.etensuCategory, entry.kubun);
        if (entryCategory == null) {
            return false;
        }
        if (category.equals(entryCategory)) {
            return true;
        }
        return category.length() > entryCategory.length() && category.startsWith(entryCategory);
    }

    private boolean matchesTensuVersion(String normalized, FixtureEtensuEntry entry) {
        if (normalized == null || normalized.isBlank()) {
            return true;
        }
        String entryVersion = normalizeTensuVersion(resolveTensuVersion(entry));
        if (entryVersion == null) {
            return false;
        }
        return normalized.equals(entryVersion);
    }

    private boolean isAuthorized(String userName, String password) {
        String expectedUser = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_USER"),
                System.getProperty("ORCA_MASTER_BASIC_USER"),
                DEFAULT_USERNAME
        );
        String expectedPassword = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_PASSWORD"),
                System.getProperty("ORCA_MASTER_BASIC_PASSWORD"),
                DEFAULT_PASSWORD
        );
        return Objects.equals(expectedUser, userName) && Objects.equals(expectedPassword, password);
    }

    private String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }

    private Double firstNonBlankDouble(Double... candidates) {
        if (candidates == null) {
            return null;
        }
        for (Double candidate : candidates) {
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private String normalizeTensuVersion(String version) {
        if (version == null || version.isBlank()) {
            return null;
        }
        if (TENSU_VERSION_PATTERN.matcher(version).matches()) {
            return version;
        }
        String digits = version.replaceAll("\\D", "");
        if (digits.length() >= 6) {
            return digits.substring(0, 6);
        }
        return version;
    }

    private String resolveTensuVersion(FixtureEtensuEntry entry) {
        return firstNonBlank(entry.tensuVersion, entry.version, entry.snapshotVersion);
    }

    private Response notFound(String code, String message, HttpServletRequest request) {
        return buildErrorResponse(Status.NOT_FOUND, code, message, request, null);
    }

    private Response serviceUnavailable(HttpServletRequest request, String code, String message) {
        return buildErrorResponse(Status.SERVICE_UNAVAILABLE, code, message, request, null);
    }

    private Response buildErrorResponse(Status status, String code, String message, HttpServletRequest request,
            Map<String, String> extraHeaders) {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode(code);
        response.setMessage(message);
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            response.setCorrelationId(traceId);
        }
        Response.ResponseBuilder builder = Response.status(status).entity(response);
        applyExtraHeaders(builder, extraHeaders);
        return builder.build();
    }

    private String resolvePayerType(String rawType, String payerCode) {
        String source = rawType != null ? rawType : "";
        if (source.contains("国保")) {
            return "national_health";
        }
        if (source.contains("船員")) {
            return "seamen";
        }
        if (source.contains("共済")) {
            return "mutual_aid";
        }
        if (source.contains("後期")) {
            return "late_elderly";
        }
        if (source.contains("社保") || source.contains("健保") || source.contains("協会")) {
            return "social_insurance";
        }
        if (payerCode != null && payerCode.startsWith("39")) {
            return "late_elderly";
        }
        return "other";
    }

    private Double resolvePayerRatio(Double ratio, String payerType) {
        if (ratio != null) {
            return ratio;
        }
        if ("late_elderly".equals(payerType)) {
            return 0.1;
        }
        return 0.3;
    }

    private String derivePrefCode(String payerCode) {
        if (payerCode == null || payerCode.length() < 2) {
            return null;
        }
        return payerCode.substring(0, 2);
    }

    private String deriveCityCode(String prefCode) {
        if (prefCode == null || prefCode.isBlank()) {
            return null;
        }
        return prefCode + "000";
    }

    private boolean matchesPref(String pref, FixtureHokenjaEntry entry) {
        if (pref == null || pref.isBlank()) {
            return true;
        }
        String entryPref = firstNonBlank(entry.prefCode, entry.prefectureCode, derivePrefCode(entry.payerCode), derivePrefCode(entry.insurerNumber));
        return pref.equals(entryPref);
    }

    private void recordMasterAudit(HttpServletRequest request, String apiRoute, String masterType, int httpStatus,
            LoadedFixture<?> fixture, boolean cacheHit, Boolean emptyResult, Integer resultCount,
            java.util.Map<String, Object> extraDetails) {
        recordMasterAudit(request, apiRoute, masterType, httpStatus, fixture, cacheHit, emptyResult, resultCount,
                null, null, extraDetails);
    }

    private void recordMasterAudit(HttpServletRequest request, String apiRoute, String masterType, int httpStatus,
            LoadedFixture<?> fixture, boolean cacheHit, Boolean emptyResult, Integer resultCount,
            Boolean missingMasterOverride, Boolean fallbackUsedOverride, java.util.Map<String, Object> extraDetails) {
        if (sessionAuditDispatcher == null) {
            return;
        }
        AuditEventPayload payload = new AuditEventPayload();
        payload.setAction("ORCA_MASTER_FETCH");
        payload.setResource(apiRoute);
        payload.setActorId(request != null ? request.getRemoteUser() : null);
        payload.setIpAddress(request != null ? request.getRemoteAddr() : null);
        payload.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            payload.setTraceId(traceId);
        }
        String requestId = request != null ? request.getHeader("X-Request-Id") : null;
        if (requestId != null && !requestId.isBlank()) {
            payload.setRequestId(requestId);
        } else if (traceId != null && !traceId.isBlank()) {
            payload.setRequestId(traceId);
        }
        java.util.Map<String, Object> details = new java.util.LinkedHashMap<>();
        details.put("runId", RUN_ID);
        details.put("masterType", masterType);
        details.put("httpStatus", httpStatus);
        details.put("status", httpStatus >= 400 ? "failed" : "success");
        details.put("dataSource", dataSourceForOrigin(fixture.origin));
        details.put("snapshotVersion", fixture.snapshotVersion);
        details.put("version", firstNonBlank(fixture.version, DEFAULT_VERSION));
        details.put("cacheHit", cacheHit);
        boolean missingMaster = fixture.origin == DataOrigin.FALLBACK;
        if (missingMasterOverride != null) {
            missingMaster = missingMasterOverride;
        }
        boolean fallbackUsed = fixture.origin == DataOrigin.FALLBACK;
        if (fallbackUsedOverride != null) {
            fallbackUsed = fallbackUsedOverride;
        } else if (missingMaster) {
            fallbackUsed = true;
        }
        details.put("missingMaster", missingMaster);
        details.put("fallbackUsed", fallbackUsed);
        if (traceId != null && !traceId.isBlank()) {
            details.put("traceId", traceId);
        }
        if (resultCount != null) {
            details.put("resultCount", resultCount);
            details.put("totalCount", resultCount);
        }
        if (emptyResult != null) {
            details.put("emptyResult", emptyResult);
        }
        if (extraDetails != null) {
            details.putAll(extraDetails);
        }
        payload.setDetails(details);
        AuditEventEnvelope.Outcome outcome = httpStatus >= 400
                ? AuditEventEnvelope.Outcome.FAILURE
                : AuditEventEnvelope.Outcome.SUCCESS;
        String errorCode = httpStatus >= 400 ? "http_" + httpStatus : null;
        sessionAuditDispatcher.record(payload, outcome, errorCode, null);
    }

    private java.util.Map<String, Object> buildQueryDetails(String pref, String keyword, String effective,
            MultivaluedMap<String, String> params) {
        return buildQueryDetails(pref, keyword, effective, params, null);
    }

    private java.util.Map<String, Object> buildQueryDetails(String pref, String keyword, String effective,
            MultivaluedMap<String, String> params, String zip) {
        java.util.Map<String, Object> details = new java.util.LinkedHashMap<>();
        if (pref != null) {
            details.put("queryPref", pref);
        }
        if (zip != null) {
            details.put("queryZip", zip);
        }
        if (keyword != null && !keyword.isBlank()) {
            details.put("keywordPresent", true);
            details.put("keywordLength", keyword.length());
        } else {
            details.put("keywordPresent", false);
        }
        if (effective != null) {
            details.put("effective", effective);
        }
        if (params != null) {
            details.put("page", parsePositiveInt(params, "page", 1));
            details.put("size", parsePageSize(params, "size", 100));
        }
        return details;
    }

    private java.util.Map<String, Object> buildSrycdDetails(String srycd, String effective,
            MultivaluedMap<String, String> params) {
        java.util.Map<String, Object> details = buildQueryDetails(null, null, effective, params);
        details.put("srycd", srycd);
        return details;
    }

    private java.util.Map<String, Object> buildTensuQueryDetails(String keyword, String category, String asOf,
            String tensuVersion, MultivaluedMap<String, String> params) {
        java.util.Map<String, Object> details = new java.util.LinkedHashMap<>();
        if (keyword != null && !keyword.isBlank()) {
            details.put("keywordPresent", true);
            details.put("keywordLength", keyword.length());
        } else {
            details.put("keywordPresent", false);
        }
        if (category != null) {
            details.put("category", category);
        }
        if (asOf != null) {
            details.put("asOf", asOf);
        }
        if (tensuVersion != null) {
            details.put("tensuVersion", tensuVersion);
        }
        if (params != null) {
            details.put("page", parsePositiveInt(params, "page", 1));
            details.put("size", parsePageSize(params, "size", 100));
        }
        return details;
    }

    private java.util.Map<String, Object> buildEtensuAuditDetails(String keyword, String category, String asOf,
            String tensuVersion, MultivaluedMap<String, String> params, EtensuDao.EtensuSearchResult result) {
        java.util.Map<String, Object> details = buildTensuQueryDetails(keyword, category, asOf, tensuVersion, params);
        if (result == null) {
            return details;
        }
        details.put("loadFailed", result.isLoadFailed());
        details.put("rowCount", result.getRecords().size());
        details.put("dbTimeMs", result.getDbTimeMs());
        return details;
    }

    private Map<String, String> buildEtensuPerformanceHeaders(EtensuDao.EtensuSearchResult result, boolean cacheHit) {
        if (result == null) {
            return Collections.emptyMap();
        }
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("X-Orca-Db-Time", Long.toString(result.getDbTimeMs()));
        headers.put("X-Orca-Row-Count", Integer.toString(result.getRecords().size()));
        headers.put("X-Orca-Total-Count", Integer.toString(result.getTotalCount()));
        headers.put("X-Orca-Cache-Hit", Boolean.toString(cacheHit));
        return headers;
    }

    private String buildEtag(String apiRoute, String masterType, LoadedFixture<?> fixture,
            MultivaluedMap<String, String> params) {
        StringBuilder seed = new StringBuilder();
        seed.append(apiRoute).append('|');
        seed.append(masterType).append('|');
        seed.append(dataSourceForOrigin(fixture.origin)).append('|');
        seed.append(firstNonBlank(fixture.snapshotVersion, "none")).append('|');
        seed.append(firstNonBlank(fixture.version, DEFAULT_VERSION)).append('|');
        seed.append(normalizeQuery(params));
        return sha256Hex(seed.toString());
    }

    private String normalizeQuery(MultivaluedMap<String, String> params) {
        if (params == null || params.isEmpty()) {
            return "";
        }
        Map<String, List<String>> sorted = new TreeMap<>();
        for (Map.Entry<String, List<String>> entry : params.entrySet()) {
            if (entry.getKey() == null) {
                continue;
            }
            List<String> values = entry.getValue() != null ? entry.getValue() : Collections.emptyList();
            List<String> normalized = values.stream()
                    .filter(Objects::nonNull)
                    .sorted()
                    .collect(Collectors.toList());
            sorted.put(entry.getKey(), normalized);
        }
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, List<String>> entry : sorted.entrySet()) {
            if (query.length() > 0) {
                query.append('&');
            }
            query.append(entry.getKey()).append('=');
            query.append(String.join(",", entry.getValue()));
        }
        return query.toString();
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                String part = Integer.toHexString(value & 0xff);
                if (part.length() == 1) {
                    hex.append('0');
                }
                hex.append(part);
            }
            return hex.toString();
        } catch (Exception e) {
            return Integer.toHexString(input.hashCode());
        }
    }

    private boolean etagMatches(String ifNoneMatch, String etagValue) {
        if (ifNoneMatch == null || ifNoneMatch.isBlank()) {
            return false;
        }
        String[] tokens = ifNoneMatch.split(",");
        for (String token : tokens) {
            String candidate = token.trim();
            if (candidate.isEmpty()) {
                continue;
            }
            if ("*".equals(candidate)) {
                return true;
            }
            if (candidate.startsWith("W/")) {
                candidate = candidate.substring(2).trim();
            }
            if (candidate.startsWith("\"") && candidate.endsWith("\"") && candidate.length() >= 2) {
                candidate = candidate.substring(1, candidate.length() - 1);
            }
            if (etagValue.equals(candidate)) {
                return true;
            }
        }
        return false;
    }

    private Response buildCachedOkResponse(Object entity, String etagValue, long ttlSeconds) {
        return buildCachedOkResponse(entity, etagValue, ttlSeconds, null);
    }

    private Response buildNotModifiedResponse(String etagValue, long ttlSeconds) {
        return buildNotModifiedResponse(etagValue, ttlSeconds, null);
    }

    private Response buildCachedOkResponse(Object entity, String etagValue, long ttlSeconds,
            Map<String, String> extraHeaders) {
        EntityTag tag = new EntityTag(etagValue);
        Response.ResponseBuilder builder = Response.ok(entity)
                .tag(tag)
                .header("Cache-Control", cacheControlHeader(ttlSeconds))
                .header("Vary", "userName,password");
        applyExtraHeaders(builder, extraHeaders);
        return builder.build();
    }

    private Response buildNotModifiedResponse(String etagValue, long ttlSeconds, Map<String, String> extraHeaders) {
        EntityTag tag = new EntityTag(etagValue);
        Response.ResponseBuilder builder = Response.status(Status.NOT_MODIFIED)
                .tag(tag)
                .header("Cache-Control", cacheControlHeader(ttlSeconds))
                .header("Vary", "userName,password");
        applyExtraHeaders(builder, extraHeaders);
        return builder.build();
    }

    private void applyExtraHeaders(Response.ResponseBuilder builder, Map<String, String> extraHeaders) {
        if (builder == null || extraHeaders == null || extraHeaders.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : extraHeaders.entrySet()) {
            if (entry.getKey() == null || entry.getKey().isBlank()) {
                continue;
            }
            if (entry.getValue() == null) {
                continue;
            }
            builder.header(entry.getKey(), entry.getValue());
        }
    }

    private String cacheControlHeader(long ttlSeconds) {
        return "public, max-age=" + ttlSeconds + ", stale-while-revalidate=" + CACHE_STALE_REVALIDATE_SECONDS;
    }

    private long cacheTtlSeconds(String masterType) {
        if ("orca06-address".equals(masterType) || "orca06-hokenja".equals(masterType)) {
            return CACHE_TTL_LONG_SECONDS;
        }
        return CACHE_TTL_SHORT_SECONDS;
    }

    private static final class FixtureListResponse<T> {
        public List<T> list;
        public Integer totalCount;
        public String snapshotVersion;
        public String version;
    }

    private static final class FixtureGenericClassEntry {
        public String classCode;
        public String className;
        public String kanaName;
        public String categoryCode;
        public String parentClassCode;
        public Boolean isLeaf;
        public String startDate;
        public String endDate;
        public String validFrom;
        public String validTo;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }

    private static final class FixtureGenericPriceEntry {
        public String srycd;
        public String drugName;
        public String kanaName;
        public Double price;
        public String unit;
        public String priceType;
        public String youhouCode;
        public String startDate;
        public String endDate;
        public String validFrom;
        public String validTo;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
        public FixtureReference reference;
    }

    private static final class FixtureReference {
        public String yukostymd;
        public String yukoedymd;
        public String source;
    }

    private static final class FixtureYouhouEntry {
        public String youhouCode;
        public String youhouName;
        public String timingCode;
        public String routeCode;
        public Integer daysLimit;
        public Integer dosePerDay;
        public String comment;
        public String validFrom;
        public String validTo;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }

    private static final class FixtureMaterialEntry {
        public String materialCode;
        public String materialName;
        public String category;
        public String materialCategory;
        public String insuranceType;
        public String unit;
        public Double price;
        public String startDate;
        public String endDate;
        public String validFrom;
        public String validTo;
        public String maker;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }

    private static final class FixtureKensaSortEntry {
        public String kensaCode;
        public String kensaName;
        public String sampleType;
        public String classification;
        public String insuranceCategory;
        public String category;
        public String departmentCode;
        public String kensaSort;
        public String validFrom;
        public String validTo;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }

    private static final class FixtureHokenjaEntry {
        public String payerCode;
        public String payerName;
        public Double payerRatio;
        public String payerType;
        public String insurerNumber;
        public String insurerName;
        public String insurerKana;
        public String prefectureCode;
        public String prefCode;
        public String cityCode;
        public String zip;
        public String zipCode;
        public String addressLine;
        public String address;
        public String phone;
        public String insurerType;
        public String validFrom;
        public String validTo;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }

    private static final class FixtureAddressEntry {
        public String zip;
        public String zipCode;
        public String prefCode;
        public String prefectureCode;
        public String cityCode;
        public String city;
        public String town;
        public String kana;
        public String roman;
        public String fullAddress;
        public String addressLine;
        public String address;
        public String validFrom;
        public String validTo;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }

    private static final class FixtureEtensuEntry {
        public String etensuCategory;
        public String category;
        public String medicalFeeCode;
        public String tensuCode;
        public String name;
        public String note;
        public Double points;
        public Double tanka;
        public String unit;
        public String noticeDate;
        public String effectiveDate;
        public String startDate;
        public String endDate;
        public String validFrom;
        public String validTo;
        public String tensuVersion;
        public String version;
        public String snapshotVersion;
        public String kubun;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
    }
}
