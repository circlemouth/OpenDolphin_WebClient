package open.orca.rest;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;
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

/**
 * ORCA master endpoints for the modernized server.
 * Provides read-only responses with audit/meta fields that align with the web client bridge.
 */
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
public class OrcaMasterResource {

    private static final String DEFAULT_USERNAME = "1.3.6.1.4.1.9414.70.1:admin";
    private static final String DEFAULT_PASSWORD = "21232f297a57a5a743894a0e4a801fc3";
    private static final String RUN_ID = "20251126T150000Z";
    private static final String VERSION = "20251126";
    private static final String DATA_SOURCE = "server";
    private static final java.nio.file.Path SNAPSHOT_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "master-snapshots");
    private static final java.nio.file.Path MSW_FIXTURE_ROOT = Paths.get("artifacts", "api-stability", "20251124T000000Z", "msw-fixture");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    private enum DataOrigin {
        SNAPSHOT,
        MSW_FIXTURE,
        FALLBACK
    }

    private static final class LoadedResult<T extends AuditFields> {
        final List<T> entries;
        final String snapshotVersion;
        final DataOrigin origin;

        LoadedResult(List<T> entries, String snapshotVersion, DataOrigin origin) {
            this.entries = entries;
            this.snapshotVersion = snapshotVersion;
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
        return respondWithMasterList(
                DrugClassificationEntry.class,
                "generic-class/orca_master_generic-class_response.json",
                "orca-master-generic-class.json",
                params,
                genericClassFilter(params)
        );
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
        return respondWithMasterList(
                MinimumDrugPriceEntry.class,
                "generic-price/orca_master_generic-price_response.json",
                "orca-master-generic-price.json",
                params,
                genericPriceFilter(params)
        );
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
    public Response getYouhou(@HeaderParam("userName") String userName,
                              @HeaderParam("password") String password,
                              @Context UriInfo uriInfo) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        return respondWithMasterList(
                DosageInstructionEntry.class,
                "youhou/orca_master_youhou_response.json",
                "orca-master-youhou.json",
                params,
                youhouFilter(params)
        );
    }

    @GET
    @Path("/orca/master/youhou")
    public Response getYouhouAlias(@HeaderParam("userName") String userName,
                                   @HeaderParam("password") String password,
                                   @Context UriInfo uriInfo) {
        return getYouhou(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/material")
    public Response getMaterial(@HeaderParam("userName") String userName,
                                @HeaderParam("password") String password,
                                @Context UriInfo uriInfo) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        return respondWithMasterList(
                SpecialEquipmentEntry.class,
                "material/orca_master_material_response.json",
                "orca-master-material.json",
                params,
                materialFilter(params)
        );
    }

    @GET
    @Path("/orca/master/material")
    public Response getMaterialAlias(@HeaderParam("userName") String userName,
                                     @HeaderParam("password") String password,
                                     @Context UriInfo uriInfo) {
        return getMaterial(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/kensa-sort")
    public Response getKensaSort(@HeaderParam("userName") String userName,
                                 @HeaderParam("password") String password,
                                 @Context UriInfo uriInfo) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        return respondWithMasterList(
                LabClassificationEntry.class,
                "kensa-sort/orca_master_kensa-sort_response.json",
                "orca-master-kensa-sort.json",
                params,
                kensaSortFilter(params)
        );
    }

    @GET
    @Path("/orca/master/kensa-sort")
    public Response getKensaSortAlias(@HeaderParam("userName") String userName,
                                      @HeaderParam("password") String password,
                                      @Context UriInfo uriInfo) {
        return getKensaSort(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/hokenja")
    public Response getHokenja(@HeaderParam("userName") String userName,
                               @HeaderParam("password") String password,
                               @Context UriInfo uriInfo) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        return respondWithMasterList(
                InsurerEntry.class,
                "hokenja/orca_master_hokenja_response.json",
                "orca-master-hokenja.json",
                params,
                hokenjaFilter(params)
        );
    }

    @GET
    @Path("/orca/master/hokenja")
    public Response getHokenjaAlias(@HeaderParam("userName") String userName,
                                    @HeaderParam("password") String password,
                                    @Context UriInfo uriInfo) {
        return getHokenja(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/address")
    public Response getAddress(@HeaderParam("userName") String userName,
                               @HeaderParam("password") String password,
                               @Context UriInfo uriInfo) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        return respondWithMasterList(
                AddressEntry.class,
                "address/orca_master_address_response.json",
                "orca-master-address.json",
                params,
                addressFilter(params)
        );
    }

    @GET
    @Path("/orca/master/address")
    public Response getAddressAlias(@HeaderParam("userName") String userName,
                                    @HeaderParam("password") String password,
                                    @Context UriInfo uriInfo) {
        return getAddress(userName, password, uriInfo);
    }

    @GET
    @Path("/api/orca/master/etensu")
    public Response getEtensu(@HeaderParam("userName") String userName,
                              @HeaderParam("password") String password,
                              @Context UriInfo uriInfo) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }
        final MultivaluedMap<String, String> params = uriInfo.getQueryParameters();
        return respondWithMasterList(
                TensuEntry.class,
                "etensu/orca_tensu_ten_response.json",
                "orca-tensu-ten.json",
                params,
                etensuFilter(params)
        );
    }

    @GET
    @Path("/orca/master/etensu")
    public Response getEtensuAlias(@HeaderParam("userName") String userName,
                                   @HeaderParam("password") String password,
                                   @Context UriInfo uriInfo) {
        return getEtensu(userName, password, uriInfo);
    }

    private <T extends AuditFields> Response respondWithMasterList(
            Class<T> entryType,
            String snapshotRelativePath,
            String fixtureFileName,
            MultivaluedMap<String, String> params,
            Predicate<T> matcher
    ) {
        final LoadedResult<T> loaded = loadEntries(entryType, snapshotRelativePath, fixtureFileName);
        final List<T> normalized = new ArrayList<>(loaded.entries);
        final List<T> filtered = matcher == null
                ? normalized
                : normalized.stream().filter(matcher).collect(Collectors.toList());
        final int limit = parsePositiveInt(params, "limit");
        final List<T> limited = (limit > 0 && filtered.size() > limit)
                ? new ArrayList<>(filtered.subList(0, limit))
                : filtered;
        final String transition = transitionForOrigin(loaded.origin);
        final MasterListResponse<T> response = new MasterListResponse<>();
        applyBaseMeta(response, loaded.origin, loaded.snapshotVersion, transition);
        response.list = limited;
        response.totalCount = limited.size();
        response.fetchedAt = Instant.now().toString();
        response.cacheHit = Boolean.FALSE;
        response.missingMaster = limited.isEmpty();
        response.fallbackUsed = loaded.origin != DataOrigin.SNAPSHOT;
        limited.forEach(entry -> applyBaseMeta(entry, loaded.origin, loaded.snapshotVersion, transition));
        return Response.ok(response).build();
    }

    private <T extends AuditFields> LoadedResult<T> loadEntries(
            Class<T> entryType,
            String snapshotRelativePath,
            String fixtureFileName
    ) {
        final MasterListResponse<T> snapshot = tryReadResponse(entryType, SNAPSHOT_ROOT.resolve(snapshotRelativePath));
        if (snapshot != null) {
            return new LoadedResult<>(safeList(snapshot.list), snapshot.snapshotVersion, DataOrigin.SNAPSHOT);
        }
        final MasterListResponse<T> fixture = tryReadResponse(entryType, MSW_FIXTURE_ROOT.resolve(fixtureFileName));
        if (fixture != null) {
            return new LoadedResult<>(safeList(fixture.list), fixture.snapshotVersion, DataOrigin.MSW_FIXTURE);
        }
        return new LoadedResult<>(Collections.emptyList(), null, DataOrigin.FALLBACK);
    }

    private <T extends AuditFields> MasterListResponse<T> tryReadResponse(Class<T> entryType, java.nio.file.Path file) {
        if (Files.notExists(file)) {
            return null;
        }
        try {
            final JavaType type = TypeFactory.defaultInstance().constructParametricType(MasterListResponse.class, entryType);
            return OBJECT_MAPPER.readValue(file.toFile(), type);
        } catch (IOException e) {
            return null;
        }
    }

    private <T extends AuditFields> List<T> safeList(List<T> source) {
        return source == null ? Collections.emptyList() : source;
    }

    private int parsePositiveInt(MultivaluedMap<String, String> params, String key) {
        final String raw = getFirstValue(params, key);
        if (raw == null) {
            return -1;
        }
        try {
            final int parsed = Integer.parseInt(raw);
            return parsed > 0 ? parsed : -1;
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private String transitionForOrigin(DataOrigin origin) {
        switch (origin) {
            case SNAPSHOT:
                return "server->snapshot";
            case MSW_FIXTURE:
                return "server->msw-fixture";
            default:
                return "server->fallback";
        }
    }

    private Predicate<DrugClassificationEntry> genericClassFilter(MultivaluedMap<String, String> params) {
        final String keyword = getFirstValue(params, "keyword", "className", "q");
        final String classCode = getFirstValue(params, "classCode");
        final String category = getFirstValue(params, "categoryCode");
        return entry -> {
            if (classCode != null && !classCode.equals(entry.classCode)) {
                return false;
            }
            if (category != null && !category.equals(entry.categoryCode)) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.className, keyword) || matchesKeyword(entry.kanaName, keyword);
        };
    }

    private Predicate<MinimumDrugPriceEntry> genericPriceFilter(MultivaluedMap<String, String> params) {
        final String keyword = getFirstValue(params, "keyword", "drugName", "kanaName");
        final String srycd = getFirstValue(params, "srycd");
        return entry -> {
            if (srycd != null && !srycd.equals(entry.srycd)) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.drugName, keyword) || matchesKeyword(entry.kanaName, keyword);
        };
    }

    private Predicate<DosageInstructionEntry> youhouFilter(MultivaluedMap<String, String> params) {
        final String keyword = getFirstValue(params, "keyword", "youhouName", "comment");
        final String code = getFirstValue(params, "youhouCode");
        return entry -> {
            if (code != null && !code.equals(entry.youhouCode)) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.youhouName, keyword) || matchesKeyword(entry.comment, keyword);
        };
    }

    private Predicate<SpecialEquipmentEntry> materialFilter(MultivaluedMap<String, String> params) {
        final String keyword = getFirstValue(params, "keyword", "materialName");
        final String category = getFirstValue(params, "category");
        final String code = getFirstValue(params, "materialCode");
        return entry -> {
            if (category != null && !category.equals(entry.category)) {
                return false;
            }
            if (code != null && !code.equals(entry.materialCode)) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.materialName, keyword);
        };
    }

    private Predicate<LabClassificationEntry> kensaSortFilter(MultivaluedMap<String, String> params) {
        final String keyword = getFirstValue(params, "keyword", "kensaName");
        final String code = getFirstValue(params, "kensaCode");
        return entry -> {
            if (code != null && !code.equals(entry.kensaCode)) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.kensaName, keyword);
        };
    }

    private Predicate<InsurerEntry> hokenjaFilter(MultivaluedMap<String, String> params) {
        final String keyword = getFirstValue(params, "keyword", "insurerName");
        final String pref = getFirstValue(params, "pref", "prefCode", "prefectureCode");
        final String payerCode = getFirstValue(params, "payerCode", "insurerNumber");
        return entry -> {
            if (pref != null && !pref.equals(entry.prefCode) && !pref.equals(entry.prefectureCode)) {
                return false;
            }
            if (payerCode != null && !payerCode.equals(entry.insurerNumber)) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.insurerName, keyword);
        };
    }

    private Predicate<AddressEntry> addressFilter(MultivaluedMap<String, String> params) {
        final String zip = getFirstValue(params, "zip", "zipCode");
        final String pref = getFirstValue(params, "pref", "prefCode", "prefectureCode");
        return entry -> {
            if (zip != null && !zip.equals(entry.zip) && !zip.equals(entry.zipCode)) {
                return false;
            }
            if (pref != null && !pref.equals(entry.prefCode) && !pref.equals(entry.prefectureCode)) {
                return false;
            }
            return true;
        };
    }

    private Predicate<TensuEntry> etensuFilter(MultivaluedMap<String, String> params) {
        final Double minValue = parseDouble(getFirstValue(params, "min", "minValue"));
        final Double maxValue = parseDouble(getFirstValue(params, "max", "maxValue"));
        final String keyword = getFirstValue(params, "keyword", "name");
        return entry -> {
            if (minValue != null && entry.points != null && entry.points < minValue) {
                return false;
            }
            if (maxValue != null && entry.points != null && entry.points > maxValue) {
                return false;
            }
            return keyword == null || matchesKeyword(entry.name, keyword);
        };
    }

    private String getFirstValue(MultivaluedMap<String, String> params, String... keys) {
        if (params == null) {
            return null;
        }
        for (String key : keys) {
            final List<String> values = params.get(key);
            if (values != null && !values.isEmpty()) {
                final String value = values.get(0);
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }
        return null;
    }

    private boolean matchesKeyword(String value, String keyword) {
        if (value == null || keyword == null) {
            return false;
        }
        return value.toLowerCase().contains(keyword.toLowerCase());
    }

    private Double parseDouble(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isAuthorized(String userName, String password) {
        final String expectedUser = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_USER"),
                System.getProperty("ORCA_MASTER_BASIC_USER"),
                DEFAULT_USERNAME
        );
        final String expectedPassword = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_PASSWORD"),
                System.getProperty("ORCA_MASTER_BASIC_PASSWORD"),
                DEFAULT_PASSWORD
        );
        return Objects.equals(expectedUser, userName) && Objects.equals(expectedPassword, password);
    }

    private Response unauthorized() {
        return Response.status(Status.UNAUTHORIZED)
                .entity(new ErrorResponse("ORCA_MASTER_UNAUTHORIZED", "Invalid Basic headers", RUN_ID))
                .build();
    }

    private void applyBaseMeta(AuditFields target, DataOrigin origin, String snapshotVersion, String transition) {
        target.dataSource = DATA_SOURCE;
        target.cacheHit = Boolean.FALSE;
        target.missingMaster = Boolean.FALSE;
        target.fallbackUsed = origin != DataOrigin.SNAPSHOT;
        target.runId = RUN_ID;
        target.snapshotVersion = snapshotVersion;
        target.version = VERSION;
        target.dataSourceTransition = transition;
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

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditFields {
        public String dataSource;
        public String dataSourceTransition;
        public Boolean cacheHit;
        public Boolean missingMaster;
        public Boolean fallbackUsed;
        public String runId;
        public String snapshotVersion;
        public String version;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MasterListResponse<T extends AuditFields> extends AuditFields {
        public List<T> list;
        public Integer totalCount;
        public String fetchedAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorResponse {
        public String code;
        public String message;
        public String runId;

        public ErrorResponse(String code, String message, String runId) {
            this.code = code;
            this.message = message;
            this.runId = runId;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DrugClassificationEntry extends AuditFields {
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

        public DrugClassificationEntry(
                String classCode,
                String className,
                String kanaName,
                String categoryCode,
                String parentClassCode,
                Boolean isLeaf,
                String validFrom,
                String validTo
        ) {
            this.classCode = classCode;
            this.className = className;
            this.kanaName = kanaName;
            this.categoryCode = categoryCode;
            this.parentClassCode = parentClassCode;
            this.isLeaf = isLeaf;
            this.startDate = validFrom;
            this.endDate = validTo;
            this.validFrom = validFrom;
            this.validTo = validTo;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MinimumDrugPriceEntry extends AuditFields {
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
        public Reference reference;

        public MinimumDrugPriceEntry(
                String srycd,
                String drugName,
                String kanaName,
                Double price,
                String unit,
                String priceType,
                String youhouCode,
                String validFrom,
                String validTo,
                Reference reference
        ) {
            this.srycd = srycd;
            this.drugName = drugName;
            this.kanaName = kanaName;
            this.price = price;
            this.unit = unit;
            this.priceType = priceType;
            this.youhouCode = youhouCode;
            this.startDate = validFrom;
            this.endDate = validTo;
            this.validFrom = validFrom;
            this.validTo = validTo;
            this.reference = reference;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Reference {
        public String yukostymd;
        public String yukoedymd;
        public String source;

        public Reference(String yukostymd, String yukoedymd, String source) {
            this.yukostymd = yukostymd;
            this.yukoedymd = yukoedymd;
            this.source = source;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DosageInstructionEntry extends AuditFields {
        public String youhouCode;
        public String youhouName;
        public String timingCode;
        public String routeCode;
        public Integer daysLimit;
        public Integer dosePerDay;
        public String comment;
        public String validFrom;
        public String validTo;

        public DosageInstructionEntry(
                String youhouCode,
                String youhouName,
                String timingCode,
                String routeCode,
                Integer daysLimit,
                Integer dosePerDay,
                String comment,
                String validFrom,
                String validTo
        ) {
            this.youhouCode = youhouCode;
            this.youhouName = youhouName;
            this.timingCode = timingCode;
            this.routeCode = routeCode;
            this.daysLimit = daysLimit;
            this.dosePerDay = dosePerDay;
            this.comment = comment;
            this.validFrom = validFrom;
            this.validTo = validTo;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SpecialEquipmentEntry extends AuditFields {
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

        public SpecialEquipmentEntry(
                String materialCode,
                String materialName,
                String category,
                String materialCategory,
                String insuranceType,
                String unit,
                Double price,
                String startDate,
                String endDate,
                String maker
        ) {
            this.materialCode = materialCode;
            this.materialName = materialName;
            this.category = category;
            this.materialCategory = materialCategory;
            this.insuranceType = insuranceType;
            this.unit = unit;
            this.price = price;
            this.startDate = startDate;
            this.endDate = endDate;
            this.validFrom = startDate;
            this.validTo = endDate;
            this.maker = maker;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LabClassificationEntry extends AuditFields {
        public String kensaCode;
        public String kensaName;
        public String sampleType;
        public String classification;
        public String insuranceCategory;
        public String category;
        public String departmentCode;
        public String startDate;
        public String endDate;
        public String validFrom;
        public String validTo;

        public LabClassificationEntry(
                String kensaCode,
                String kensaName,
                String sampleType,
                String classification,
                String insuranceCategory,
                String category,
                String departmentCode,
                String startDate,
                String endDate
        ) {
            this.kensaCode = kensaCode;
            this.kensaName = kensaName;
            this.sampleType = sampleType;
            this.classification = classification;
            this.insuranceCategory = insuranceCategory;
            this.category = category;
            this.departmentCode = departmentCode;
            this.startDate = startDate;
            this.endDate = endDate;
            this.validFrom = startDate;
            this.validTo = endDate;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class InsurerEntry extends AuditFields {
        public String insurerNumber;
        public String insurerName;
        public String insurerKana;
        public Double payerRatio;
        public String payerType;
        public String prefectureCode;
        public String prefCode;
        public String cityCode;
        public String zip;
        public String address;
        public String addressLine;
        public String phone;
        public String validFrom;
        public String validTo;

        public InsurerEntry(
                String insurerNumber,
                String insurerName,
                String insurerKana,
                Double payerRatio,
                String payerType,
                String prefectureCode,
                String cityCode,
                String zip,
                String address,
                String phone
        ) {
            this.insurerNumber = insurerNumber;
            this.insurerName = insurerName;
            this.insurerKana = insurerKana;
            this.payerRatio = payerRatio;
            this.payerType = payerType;
            this.prefectureCode = prefectureCode;
            this.prefCode = prefectureCode;
            this.cityCode = cityCode;
            this.zip = zip;
            this.address = address;
            this.addressLine = address;
            this.phone = phone;
            this.validFrom = "20240401";
            this.validTo = "99991231";
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AddressEntry extends AuditFields {
        public String zipCode;
        public String zip;
        public String prefectureCode;
        public String prefCode;
        public String cityCode;
        public String city;
        public String town;
        public String kana;
        public String roman;
        public String fullAddress;
        public String validFrom = "20240401";
        public String validTo = "99991231";

        public AddressEntry(
                String zip,
                String prefCode,
                String cityCode,
                String city,
                String town,
                String kana,
                String roman,
                String fullAddress
        ) {
            this.zipCode = zip;
            this.zip = zip;
            this.prefectureCode = prefCode;
            this.prefCode = prefCode;
            this.cityCode = cityCode;
            this.city = city;
            this.town = town;
            this.kana = kana;
            this.roman = roman;
            this.fullAddress = fullAddress;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TensuEntry extends AuditFields {
        public String etensuCategory;
        public String medicalFeeCode;
        public String name;
        public Double points;
        public String unit;
        public String category;
        public String kubun;
        public String startDate;
        public String endDate;
        public String validFrom;
        public String validTo;
        public String tensuVersion;

        public TensuEntry(
                String etensuCategory,
                String medicalFeeCode,
                String name,
                Double points,
                String unit,
                String category,
                String kubun,
                String startDate,
                String endDate,
                String tensuVersion
        ) {
            this.etensuCategory = etensuCategory;
            this.medicalFeeCode = medicalFeeCode;
            this.name = name;
            this.points = points;
            this.unit = unit;
            this.category = category;
            this.kubun = kubun;
            this.startDate = startDate;
            this.endDate = endDate;
            this.validFrom = startDate;
            this.validTo = endDate;
            this.tensuVersion = tensuVersion;
        }
    }
}
