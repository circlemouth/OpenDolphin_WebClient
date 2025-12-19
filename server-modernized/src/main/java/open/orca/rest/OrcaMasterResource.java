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

/**
 * ORCA master endpoints for the modernized server.
 * Provides read-only responses with audit/meta fields that align with the web client bridge.
 */
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
public class OrcaMasterResource {

    private static final String DEFAULT_USERNAME = "1.3.6.1.4.1.9414.70.1:admin";
    private static final String DEFAULT_PASSWORD = "21232f297a57a5a743894a0e4a801fc3";
    private static final String RUN_ID = "20251219T140028Z";
    private static final String DEFAULT_VERSION = "20240426";
    private static final String DEFAULT_VALID_FROM = "20240401";
    private static final String DEFAULT_VALID_TO = "99991231";
    private static final Pattern SRYCD_PATTERN = Pattern.compile("^\\d{9}$");
    private static final java.nio.file.Path SNAPSHOT_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "master-snapshots");
    private static final java.nio.file.Path MSW_FIXTURE_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "msw-fixture");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

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

        LoadedFixture(List<T> entries, String snapshotVersion, String version, DataOrigin origin) {
            this.entries = entries;
            this.snapshotVersion = snapshotVersion;
            this.version = version;
            this.origin = origin;
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
        final List<FixtureGenericClassEntry> paged = paginate(filtered, params);
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
    @Path("/orca/master/kensa-sort")
    public Response getKensaSortAlias(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @Context UriInfo uriInfo
    ) {
        return getKensaSort(userName, password, uriInfo);
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
        FixtureListResponse<T> snapshot = tryReadResponse(entryType, SNAPSHOT_ROOT.resolve(snapshotRelativePath));
        if (snapshot != null) {
            return new LoadedFixture<>(safeList(snapshot.list), snapshot.snapshotVersion, snapshot.version, DataOrigin.SNAPSHOT);
        }
        FixtureListResponse<T> fixture = tryReadResponse(entryType, MSW_FIXTURE_ROOT.resolve(fixtureFileName));
        if (fixture != null) {
            return new LoadedFixture<>(safeList(fixture.list), fixture.snapshotVersion, fixture.version, DataOrigin.MSW_FIXTURE);
        }
        return new LoadedFixture<>(Collections.emptyList(), null, null, DataOrigin.FALLBACK);
    }

    private <T> FixtureListResponse<T> tryReadResponse(Class<T> entryType, java.nio.file.Path file) {
        if (Files.notExists(file)) {
            return null;
        }
        try {
            JavaType type = TypeFactory.defaultInstance().constructParametricType(FixtureListResponse.class, entryType);
            return OBJECT_MAPPER.readValue(file.toFile(), type);
        } catch (IOException e) {
            return null;
        }
    }

    private <T> List<T> safeList(List<T> source) {
        return source == null ? Collections.emptyList() : source;
    }

    private List<FixtureGenericClassEntry> paginate(List<FixtureGenericClassEntry> source, MultivaluedMap<String, String> params) {
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
}
