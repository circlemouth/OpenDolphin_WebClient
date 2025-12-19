package open.orca.rest;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
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
    private static final Pattern SRYCD_PATTERN = Pattern.compile("^\\d{9}$");
    private static final Pattern ZIP_PATTERN = Pattern.compile("^\\d{7}$");
    private static final Pattern PREF_PATTERN = Pattern.compile("^(0[1-9]|[1-3][0-9]|4[0-7])$");
    private static final Pattern ETENSU_CATEGORY_PATTERN = Pattern.compile("^\\d{1,2}$");
    private static final Pattern TENSU_VERSION_PATTERN = Pattern.compile("^\\d{6}$");
    private static final Pattern AS_OF_PATTERN = Pattern.compile("^\\d{8}$");
    private static final java.nio.file.Path SNAPSHOT_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "master-snapshots");
    private static final java.nio.file.Path MSW_FIXTURE_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "msw-fixture");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    @Inject
    SessionAuditDispatcher sessionAuditDispatcher;

    private enum DataOrigin {
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
            @Context UriInfo uriInfo
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureGenericClassEntry> fixture = loadEntries(
                FixtureGenericClassEntry.class,
                "generic-class/orca_master_generic-class_response.json",
                "orca-master-generic-class.json"
        );
        final List<FixtureGenericClassEntry> filtered = fixture.entries.stream()
                .filter(entry -> matchesKeyword(keyword, entry.className, entry.kanaName))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, entry.startDate, entry.endDate))
                .collect(Collectors.toList());
        final int totalCount = filtered.size();
        final List<FixtureGenericClassEntry> paged = paginateList(filtered, params);
        final List<OrcaDrugMasterEntry> items = paged.stream()
                .map(entry -> toGenericClassEntry(entry, fixture))
                .collect(Collectors.toList());
        OrcaMasterListResponse<OrcaDrugMasterEntry> response = new OrcaMasterListResponse<>();
        response.setTotalCount(totalCount);
        response.setItems(items);
        return Response.ok(response).build();
    }

    @GET
    @Path("/orca/master/generic-class")
    public Response getGenericClassAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        return getGenericClass(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/generic-price")
    public Response getGenericPrice(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String srycd = getFirstValue(params, "srycd");
        if (srycd == null || !SRYCD_PATTERN.matcher(srycd).matches()) {
            return validationError("SRYCD_VALIDATION_ERROR", "SRYCD は数字 9 桁で指定してください");
        }
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureGenericPriceEntry> fixture = loadEntries(
                FixtureGenericPriceEntry.class,
                "generic-price/orca_master_generic-price_response.json",
                "orca-master-generic-price.json"
        );
        final FixtureGenericPriceEntry hit = fixture.entries.stream()
                .filter(entry -> srycd.equals(entry.srycd))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, entry.startDate, entry.endDate))
                .findFirst()
                .orElse(null);
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
            return Response.ok(missing).build();
        }
        OrcaDrugMasterEntry response = toGenericPriceEntry(hit, fixture);
        return Response.ok(response).build();
    }

    @GET
    @Path("/orca/master/generic-price")
    public Response getGenericPriceAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        return getGenericPrice(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/youhou")
    public Response getYouhou(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureYouhouEntry> fixture = loadEntries(
                FixtureYouhouEntry.class,
                "youhou/orca_master_youhou_response.json",
                "orca-master-youhou.json"
        );
        final List<OrcaDrugMasterEntry> response = fixture.entries.stream()
                .filter(entry -> matchesKeyword(keyword, entry.youhouName, entry.comment))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, null, null))
                .map(entry -> toYouhouEntry(entry, fixture))
                .collect(Collectors.toList());
        return Response.ok(response).build();
    }

    @GET
    @Path("/orca/master/youhou")
    public Response getYouhouAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        return getYouhou(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/material")
    public Response getMaterial(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureMaterialEntry> fixture = loadEntries(
                FixtureMaterialEntry.class,
                "material/orca_master_material_response.json",
                "orca-master-material.json"
        );
        final List<OrcaDrugMasterEntry> response = fixture.entries.stream()
                .filter(entry -> matchesKeyword(keyword, entry.materialName))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, entry.startDate, entry.endDate))
                .map(entry -> toMaterialEntry(entry, fixture))
                .collect(Collectors.toList());
        return Response.ok(response).build();
    }

    @GET
    @Path("/orca/master/material")
    public Response getMaterialAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        return getMaterial(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/kensa-sort")
    public Response getKensaSort(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureKensaSortEntry> fixture = loadEntries(
                FixtureKensaSortEntry.class,
                "kensa-sort/orca_master_kensa-sort_response.json",
                "orca-master-kensa-sort.json"
        );
        final List<OrcaDrugMasterEntry> response = fixture.entries.stream()
                .filter(entry -> matchesKeyword(keyword, entry.kensaName, entry.classification))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, null, null))
                .map(entry -> toKensaSortEntry(entry, fixture))
                .collect(Collectors.toList());
        return Response.ok(response).build();
    }

    @GET
    @Path("/api/orca/master/hokenja")
    public Response getHokenja(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String pref = getFirstValue(params, "pref");
        if (pref != null && !PREF_PATTERN.matcher(pref).matches()) {
            return validationError("PREF_VALIDATION_ERROR", "都道府県コードは 01-47 の 2 桁で指定してください");
        }
        final String keyword = getFirstValue(params, "keyword");
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureHokenjaEntry> fixture = loadEntries(
                FixtureHokenjaEntry.class,
                "hokenja/orca_master_hokenja_response.json",
                "orca-master-hokenja.json"
        );
        if (fixture.origin == DataOrigin.FALLBACK && fixture.loadFailed) {
            Response failure = serviceUnavailable("MASTER_HOKENJA_UNAVAILABLE", "保険者マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/hokenja", "orca06-hokenja", 503, fixture, true, 0,
                    buildQueryDetails(pref, keyword, effective, params));
            return failure;
        }
        final List<FixtureHokenjaEntry> filtered = fixture.entries.stream()
                .filter(entry -> matchesPref(pref, entry))
                .filter(entry -> matchesKeyword(keyword, entry.insurerName, entry.insurerKana, entry.insurerNumber))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, null, null))
                .collect(Collectors.toList());
        final int totalCount = filtered.size();
        final List<FixtureHokenjaEntry> paged = paginateList(filtered, params);
        final List<OrcaInsurerEntry> items = paged.stream()
                .map(entry -> toInsurerEntry(entry, fixture))
                .collect(Collectors.toList());
        OrcaMasterListResponse<OrcaInsurerEntry> response = new OrcaMasterListResponse<>();
        response.setTotalCount(totalCount);
        response.setItems(items);
        recordMasterAudit(request, "/orca/master/hokenja", "orca06-hokenja", 200, fixture,
                totalCount == 0, totalCount, buildQueryDetails(pref, keyword, effective, params));
        return Response.ok(response).build();
    }

    @GET
    @Path("/orca/master/hokenja")
    public Response getHokenjaAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getHokenja(userName, password, uriInfo, request);
    }

    @GET
    @Path("/api/orca/master/address")
    public Response getAddress(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String zip = getFirstValue(params, "zip");
        if (zip == null || !ZIP_PATTERN.matcher(zip).matches()) {
            return validationError("ZIP_VALIDATION_ERROR", "郵便番号は数字 7 桁で指定してください");
        }
        final String effective = getFirstValue(params, "effective");
        final LoadedFixture<FixtureAddressEntry> fixture = loadEntries(
                FixtureAddressEntry.class,
                "address/orca_master_address_response.json",
                "orca-master-address.json"
        );
        if (fixture.origin == DataOrigin.FALLBACK && fixture.loadFailed) {
            Response failure = serviceUnavailable("MASTER_ADDRESS_UNAVAILABLE", "住所マスタを取得できませんでした");
            recordMasterAudit(request, "/orca/master/address", "orca06-address", 503, fixture, true, 0,
                    buildQueryDetails(null, null, effective, params, zip));
            return failure;
        }
        FixtureAddressEntry match = fixture.entries.stream()
                .filter(entry -> zip.equals(firstNonBlank(entry.zip, entry.zipCode)))
                .filter(entry -> isEffective(effective, entry.validFrom, entry.validTo, null, null))
                .findFirst()
                .orElse(null);
        if (match == null) {
            if (fixture.origin == DataOrigin.FALLBACK) {
                recordMasterAudit(request, "/orca/master/address", "orca06-address", 200, fixture, true, 0,
                        buildQueryDetails(null, null, effective, params, zip));
                return Response.ok(Collections.emptyMap()).build();
            }
            Response notFound = notFound("MASTER_ADDRESS_NOT_FOUND", "指定の郵便番号に該当する住所がありません", request);
            recordMasterAudit(request, "/orca/master/address", "orca06-address", 404, fixture, true, 0,
                    buildQueryDetails(null, null, effective, params, zip));
            return notFound;
        }
        OrcaAddressEntry response = toAddressEntry(match, fixture);
        recordMasterAudit(request, "/orca/master/address", "orca06-address", 200, fixture, false, 1,
                buildQueryDetails(null, null, effective, params, zip));
        return Response.ok(response).build();
    }

    @GET
    @Path("/orca/master/address")
    public Response getAddressAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return getAddress(userName, password, uriInfo, request);
    }

    @GET
    @Path("/orca/master/kensa-sort")
    public Response getKensaSortAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        return getKensaSort(userName, password, uriInfo);
    }

    @GET
    @Path("/orca/tensu/etensu")
    public Response getEtensu(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        final String keyword = getFirstValue(params, "keyword");
        final String category = getFirstValue(params, "category");
        if (category != null && !ETENSU_CATEGORY_PATTERN.matcher(category).matches()) {
            return validationError("TENSU_CATEGORY_INVALID", "category must be numeric 1-2 digits");
        }
        final String asOf = getFirstValue(params, "asOf");
        if (asOf != null && !AS_OF_PATTERN.matcher(asOf).matches()) {
            return validationError("TENSU_ASOF_INVALID", "asOf must be YYYYMMDD");
        }
        final String tensuVersion = getFirstValue(params, "tensuVersion");
        if (tensuVersion != null && !TENSU_VERSION_PATTERN.matcher(tensuVersion).matches()) {
            return validationError("TENSU_VERSION_INVALID", "tensuVersion must be YYYYMM");
        }
        final LoadedFixture<FixtureEtensuEntry> fixture = loadEntries(
                FixtureEtensuEntry.class,
                "etensu/orca_master_etensu_response.json",
                "orca-master-etensu.json"
        );
        if (fixture.origin == DataOrigin.FALLBACK && fixture.loadFailed) {
            Response failure = serviceUnavailable("ETENSU_UNAVAILABLE", "etensu master unavailable");
            recordMasterAudit(request, "/orca/tensu/etensu", "orca08-etensu", 503, fixture, true, 0,
                    buildTensuQueryDetails(keyword, category, asOf, tensuVersion, params));
            return failure;
        }
        final String normalizedVersion = normalizeTensuVersion(tensuVersion);
        final List<FixtureEtensuEntry> filtered = fixture.entries.stream()
                .filter(entry -> matchesKeyword(keyword, entry.name))
                .filter(entry -> matchesEtensuCategory(category, entry))
                .filter(entry -> isEffective(asOf, entry.validFrom, entry.validTo, entry.startDate, entry.endDate))
                .filter(entry -> matchesTensuVersion(normalizedVersion, entry))
                .collect(Collectors.toList());
        if (filtered.isEmpty()) {
            Response notFound = notFound("TENSU_NOT_FOUND", "no etensu entries matched", request);
            recordMasterAudit(request, "/orca/tensu/etensu", "orca08-etensu", 404, fixture, true, 0,
                    buildTensuQueryDetails(keyword, category, asOf, tensuVersion, params));
            return notFound;
        }
        final int totalCount = filtered.size();
        final List<FixtureEtensuEntry> paged = paginateList(filtered, params);
        final List<OrcaTensuEntry> items = paged.stream()
                .map(entry -> toEtensuEntry(entry, fixture))
                .collect(Collectors.toList());
        OrcaMasterListResponse<OrcaTensuEntry> response = new OrcaMasterListResponse<>();
        response.setTotalCount(totalCount);
        response.setItems(items);
        recordMasterAudit(request, "/orca/tensu/etensu", "orca08-etensu", 200, fixture, false, totalCount,
                buildTensuQueryDetails(keyword, category, asOf, tensuVersion, params));
        return Response.ok(response).build();
    }

    private Response unauthorized() {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode("ORCA_MASTER_UNAUTHORIZED");
        response.setMessage("Invalid Basic headers");
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        return Response.status(Status.UNAUTHORIZED).entity(response).build();
    }

    private Response validationError(String code, String message) {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode(code);
        response.setMessage(message);
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        response.setValidationError(Boolean.TRUE);
        return Response.status(Status.UNPROCESSABLE_ENTITY).entity(response).build();
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
            return fallback;
        }
        return Paths.get(override);
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

    private <T> List<T> paginateList(List<T> source, MultivaluedMap<String, String> params) {
        int page = parsePositiveInt(params, "page", 1);
        int size = parsePositiveInt(params, "size", 100);
        if (size > 2000) {
            size = 2000;
        }
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

    private OrcaDrugMasterEntry toGenericClassEntry(FixtureGenericClassEntry entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.validFrom, entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.validTo, entry.endDate, DEFAULT_VALID_TO);
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

    private OrcaDrugMasterEntry toGenericPriceEntry(FixtureGenericPriceEntry entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.validFrom, entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.validTo, entry.endDate, DEFAULT_VALID_TO);
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

    private OrcaDrugMasterEntry toYouhouEntry(FixtureYouhouEntry entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.validFrom, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.validTo, DEFAULT_VALID_TO);
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
                entry.comment,
                fixture,
                entry.cacheHit,
                entry.missingMaster,
                entry.fallbackUsed
        );
    }

    private OrcaDrugMasterEntry toMaterialEntry(FixtureMaterialEntry entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.validFrom, entry.startDate, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.validTo, entry.endDate, DEFAULT_VALID_TO);
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
                entry.cacheHit,
                entry.missingMaster,
                entry.fallbackUsed
        );
    }

    private OrcaDrugMasterEntry toKensaSortEntry(FixtureKensaSortEntry entry, LoadedFixture<?> fixture) {
        String validFrom = firstNonBlank(entry.validFrom, DEFAULT_VALID_FROM);
        String validTo = firstNonBlank(entry.validTo, DEFAULT_VALID_TO);
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
                entry.cacheHit,
                entry.missingMaster,
                entry.fallbackUsed
        );
    }

    private OrcaInsurerEntry toInsurerEntry(FixtureHokenjaEntry entry, LoadedFixture<?> fixture) {
        OrcaInsurerEntry response = new OrcaInsurerEntry();
        String payerCode = firstNonBlank(entry.payerCode, entry.insurerNumber);
        response.setPayerCode(payerCode);
        response.setPayerName(firstNonBlank(entry.payerName, entry.insurerName));
        String payerType = resolvePayerType(entry.insurerType, payerCode);
        response.setPayerType(payerType);
        response.setPayerRatio(resolvePayerRatio(entry.payerRatio, payerType));
        String prefCode = firstNonBlank(entry.prefCode, entry.prefectureCode, derivePrefCode(payerCode));
        response.setPrefCode(prefCode);
        response.setCityCode(firstNonBlank(entry.cityCode, deriveCityCode(prefCode)));
        response.setZip(firstNonBlank(entry.zip, entry.zipCode));
        response.setAddressLine(firstNonBlank(entry.addressLine, entry.address));
        response.setPhone(entry.phone);
        response.setValidFrom(firstNonBlank(entry.validFrom, DEFAULT_VALID_FROM));
        response.setValidTo(firstNonBlank(entry.validTo, DEFAULT_VALID_TO));
        boolean missing = Boolean.TRUE.equals(entry.missingMaster);
        boolean fallback = Boolean.TRUE.equals(entry.fallbackUsed) || missing || fixture.origin == DataOrigin.FALLBACK;
        boolean cache = Boolean.TRUE.equals(entry.cacheHit);
        response.setMeta(buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, cache, missing, fallback, null));
        return response;
    }

    private OrcaAddressEntry toAddressEntry(FixtureAddressEntry entry, LoadedFixture<?> fixture) {
        OrcaAddressEntry response = new OrcaAddressEntry();
        response.setZip(firstNonBlank(entry.zip, entry.zipCode));
        String prefCode = firstNonBlank(entry.prefCode, entry.prefectureCode);
        response.setPrefCode(prefCode);
        response.setCityCode(firstNonBlank(entry.cityCode, deriveCityCode(prefCode)));
        response.setCity(entry.city);
        response.setTown(entry.town);
        response.setKana(entry.kana);
        response.setRoman(entry.roman);
        response.setFullAddress(firstNonBlank(entry.fullAddress, entry.addressLine, entry.address));
        boolean missing = Boolean.TRUE.equals(entry.missingMaster);
        boolean fallback = Boolean.TRUE.equals(entry.fallbackUsed) || missing || fixture.origin == DataOrigin.FALLBACK;
        boolean cache = Boolean.TRUE.equals(entry.cacheHit);
        response.setMeta(buildMeta(fixture.origin, fixture.snapshotVersion, fixture.version, cache, missing, fallback, null));
        return response;
    }

    private OrcaTensuEntry toEtensuEntry(FixtureEtensuEntry entry, LoadedFixture<?> fixture) {
        OrcaTensuEntry response = new OrcaTensuEntry();
        response.setTensuCode(firstNonBlank(entry.tensuCode, entry.medicalFeeCode));
        response.setName(entry.name);
        response.setKubun(firstNonBlank(entry.kubun, entry.category, entry.etensuCategory));
        response.setTanka(entry.points);
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
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode(code);
        response.setMessage(message);
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            response.setCorrelationId(traceId);
        }
        return Response.status(Status.NOT_FOUND).entity(response).build();
    }

    private Response serviceUnavailable(String code, String message) {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode(code);
        response.setMessage(message);
        response.setRunId(RUN_ID);
        response.setTimestamp(Instant.now().toString());
        return Response.status(Status.SERVICE_UNAVAILABLE).entity(response).build();
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
            LoadedFixture<?> fixture, boolean emptyResult, int resultCount, java.util.Map<String, Object> extraDetails) {
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
        details.put("dataSource", dataSourceForOrigin(fixture.origin));
        details.put("snapshotVersion", fixture.snapshotVersion);
        details.put("version", firstNonBlank(fixture.version, DEFAULT_VERSION));
        details.put("cacheHit", Boolean.FALSE);
        details.put("missingMaster", fixture.origin == DataOrigin.FALLBACK);
        details.put("fallbackUsed", fixture.origin == DataOrigin.FALLBACK);
        details.put("resultCount", resultCount);
        details.put("emptyResult", emptyResult);
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
            details.put("size", parsePositiveInt(params, "size", 100));
        }
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
            details.put("size", parsePositiveInt(params, "size", 100));
        }
        return details;
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
        public Double points;
        public String unit;
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
