package open.orca.rest;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

/**
 * ORCA master endpoints for the modernized server.
 * Provides read-only responses with audit/meta fields that align with the web client bridge.
 */
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
public class OrcaMasterResource {

    private static final String DEFAULT_USERNAME = "1.3.6.1.4.1.9414.70.1:admin";
    private static final String DEFAULT_PASSWORD = "21232f297a57a5a743894a0e4a801fc3";
    private static final String RUN_ID = "20251124T073245Z";
    private static final String VERSION = "20251124";
    private static final String DATA_SOURCE = "server";

    @GET
    @Path("/api/orca/master/generic-class")
    public Response getGenericClass(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<DrugClassificationEntry> list = new ArrayList<>();
        list.add(withMeta(new DrugClassificationEntry(
                "211",
                "降圧薬",
                "ｺｳｱﾂﾔｸ",
                "generic",
                "21",
                true,
                "20240401",
                "99991231"
        )));
        list.add(withMeta(new DrugClassificationEntry(
                "21101",
                "ACE 阻害薬",
                "ACEｿｶﾞｲﾔｸ",
                "generic",
                "211",
                true,
                "20240401",
                "99991231"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/generic-class")
    public Response getGenericClassAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getGenericClass(userName, password);
    }

    @GET
    @Path("/api/orca/master/generic-price")
    public Response getGenericPrice(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<MinimumDrugPriceEntry> list = new ArrayList<>();
        list.add(withMeta(new MinimumDrugPriceEntry(
                "610008123",
                "アムロジピン錠 5mg",
                "ｱﾑﾛｼﾞﾋﾟﾝ5mg",
                12.5,
                "TAB",
                "generic-price",
                "Y003",
                "20240401",
                "99991231",
                new Reference("20240401", "99991231", "TBL_GENERIC_PRICE")
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/generic-price")
    public Response getGenericPriceAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getGenericPrice(userName, password);
    }

    @GET
    @Path("/api/orca/master/youhou")
    public Response getYouhou(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<DosageInstructionEntry> list = new ArrayList<>();
        list.add(withMeta(new DosageInstructionEntry(
                "10",
                "1日1回 朝食後",
                "01",
                "PO",
                1,
                1,
                null,
                "20240401",
                "99991231"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/youhou")
    public Response getYouhouAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getYouhou(userName, password);
    }

    @GET
    @Path("/api/orca/master/material")
    public Response getMaterial(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<SpecialEquipmentEntry> list = new ArrayList<>();
        list.add(withMeta(new SpecialEquipmentEntry(
                "5001001",
                "注射器 2.5mL",
                "特定器材",
                "A1",
                "SYOKAN",
                "EA",
                35.0,
                "20240401",
                "20250331",
                "ExampleMed"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/material")
    public Response getMaterialAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getMaterial(userName, password);
    }

    @GET
    @Path("/api/orca/master/kensa-sort")
    public Response getKensaSort(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<LabClassificationEntry> list = new ArrayList<>();
        list.add(withMeta(new LabClassificationEntry(
                "1101",
                "血液検査",
                "WB",
                "検査分類",
                "SYOKAN",
                "lab",
                "01",
                "20240401",
                "99991231"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/kensa-sort")
    public Response getKensaSortAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getKensaSort(userName, password);
    }

    @GET
    @Path("/api/orca/master/hokenja")
    public Response getHokenja(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<InsurerEntry> list = new ArrayList<>();
        list.add(withMeta(new InsurerEntry(
                "06123456",
                "札幌市国民健康保険",
                "ｻｯﾎﾟﾛｼｺｸﾎ",
                0.7,
                "national_health",
                "01",
                "01100",
                "0600001",
                "北海道札幌市中央区北一条西2",
                "011-123-4567"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/hokenja")
    public Response getHokenjaAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getHokenja(userName, password);
    }

    @GET
    @Path("/api/orca/master/address")
    public Response getAddress(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<AddressEntry> list = new ArrayList<>();
        list.add(withMeta(new AddressEntry(
                "1000001",
                "13",
                "13101",
                "千代田区",
                "千代田",
                "ﾁﾖﾀﾞｸ ﾁﾖﾀﾞ",
                "Chiyoda-ku Chiyoda",
                "東京都千代田区千代田"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/address")
    public Response getAddressAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getAddress(userName, password);
    }

    @GET
    @Path("/api/orca/master/etensu")
    public Response getEtensu(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        if (!isAuthorized(userName, password)) {
            return unauthorized();
        }

        List<TensuEntry> list = new ArrayList<>();
        list.add(withMeta(new TensuEntry(
                "1",
                "D001",
                "初診料",
                288.0,
                "visit",
                "診察",
                "11",
                "20240401",
                "99991231",
                "202404"
        )));

        return Response.ok(wrap(list)).build();
    }

    @GET
    @Path("/orca/master/etensu")
    public Response getEtensuAlias(@HeaderParam("userName") String userName, @HeaderParam("password") String password) {
        return getEtensu(userName, password);
    }

    private boolean isAuthorized(String userName, String password) {
        String expectedUser = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_USER"),
                System.getProperty("ORCA_MASTER_BASIC_USER"),
                DEFAULT_USERNAME);
        String expectedPassword = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_PASSWORD"),
                System.getProperty("ORCA_MASTER_BASIC_PASSWORD"),
                DEFAULT_PASSWORD);
        return Objects.equals(expectedUser, userName) && Objects.equals(expectedPassword, password);
    }

    private Response unauthorized() {
        return Response.status(Status.UNAUTHORIZED)
                .entity(new ErrorResponse("ORCA_MASTER_UNAUTHORIZED", "Invalid Basic headers", RUN_ID))
                .build();
    }

    private <T extends AuditFields> MasterListResponse<T> wrap(List<T> items) {
        MasterListResponse<T> response = new MasterListResponse<>();
        applyBaseMeta(response);
        response.list = items;
        response.totalCount = items.size();
        response.fetchedAt = Instant.now().toString();
        return response;
    }

    private <T extends AuditFields> T withMeta(T entry) {
        applyBaseMeta(entry);
        return entry;
    }

    private void applyBaseMeta(AuditFields target) {
        target.dataSource = DATA_SOURCE;
        target.cacheHit = Boolean.FALSE;
        target.missingMaster = Boolean.FALSE;
        target.fallbackUsed = Boolean.FALSE;
        target.runId = RUN_ID;
        target.snapshotVersion = null;
        target.version = VERSION;
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
