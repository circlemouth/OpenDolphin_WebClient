package open.orca.rest;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.rest.dto.orca.OrcaEtensuAddition;
import open.dolphin.rest.dto.orca.OrcaEtensuCalcUnit;
import open.dolphin.rest.dto.orca.OrcaEtensuConflict;

public class EtensuDao {
    private static final Logger LOGGER = Logger.getLogger(EtensuDao.class.getName());

    public EtensuSearchResult search(EtensuSearchCriteria criteria) {
        if (criteria == null) {
            return null;
        }
        Connection connection = ORCAConnection.getInstance().getConnection();
        if (connection == null) {
            return null;
        }
        try {
            EtensuTableMeta meta = EtensuTableMeta.load(connection);
            EtensuQuery query = buildQuery(criteria, meta);
            int totalCount = fetchTotalCount(connection, query);
            if (totalCount == 0) {
                return new EtensuSearchResult(Collections.emptyList(), 0, criteria.tensuVersion);
            }
            List<EtensuRecord> records = fetchRecords(connection, query, criteria.page, criteria.size, meta);
            if (!records.isEmpty()) {
                populateDetails(connection, records, criteria.asOf, meta);
            }
            String version = resolveVersion(records, criteria.tensuVersion);
            return new EtensuSearchResult(records, totalCount, version);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA ETENSU master", e);
            return null;
        }
    }

    private EtensuQuery buildQuery(EtensuSearchCriteria criteria, EtensuTableMeta meta) {
        StringBuilder where = new StringBuilder(" FROM TBL_ETENSU_1 WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (criteria.keyword != null && !criteria.keyword.isBlank()) {
            String keyword = "%" + criteria.keyword.toUpperCase(Locale.ROOT) + "%";
            if (meta.hasName) {
                where.append(" AND (UPPER(SRYCD) LIKE ? OR UPPER(").append(meta.nameColumn).append(") LIKE ?)");
                params.add(keyword);
                params.add(keyword);
            } else {
                where.append(" AND UPPER(SRYCD) LIKE ?");
                params.add(keyword);
            }
        }
        if (criteria.asOf != null && !criteria.asOf.isBlank()) {
            where.append(" AND ").append(meta.startDateColumn).append(" <= ? AND ")
                    .append(meta.endDateColumn).append(" >= ?");
            params.add(criteria.asOf);
            params.add(criteria.asOf);
        }
        if (criteria.tensuVersion != null && !criteria.tensuVersion.isBlank() && meta.hasTensuVersion) {
            where.append(" AND ").append(meta.tensuVersionColumn).append(" = ?");
            params.add(criteria.tensuVersion);
        }
        if (criteria.category != null && !criteria.category.isBlank()) {
            String categoryColumn = meta.categoryColumn();
            if (categoryColumn != null) {
                where.append(" AND (")
                        .append(categoryColumn).append(" = ? OR (? LIKE ")
                        .append(categoryColumn).append(" || '%' AND length(?) > length(")
                        .append(categoryColumn).append("))");
                params.add(criteria.category);
                params.add(criteria.category);
                params.add(criteria.category);
            }
        }
        return new EtensuQuery(where.toString(), params);
    }

    private int fetchTotalCount(Connection connection, EtensuQuery query) throws SQLException {
        String sql = "SELECT count(*)" + query.whereClause;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private List<EtensuRecord> fetchRecords(Connection connection, EtensuQuery query, int page, int size,
            EtensuTableMeta meta) throws SQLException {
        String sql = "SELECT "
                + "SRYCD AS srycd, "
                + selectColumn(meta.kubunColumn) + " AS kubun, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.tankaColumn) + " AS tanka, "
                + selectColumn(meta.unitColumn) + " AS unit, "
                + selectColumn(meta.categoryColumn()) + " AS category, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.tensuVersionColumn) + " AS tensuVersion, "
                + selectColumn(meta.rDayColumn) + " AS rDay, "
                + selectColumn(meta.rMonthColumn) + " AS rMonth, "
                + selectColumn(meta.rSameColumn) + " AS rSame, "
                + selectColumn(meta.rWeekColumn) + " AS rWeek, "
                + selectColumn(meta.nGroupColumn) + " AS nGroup, "
                + selectColumn(meta.cKaisuColumn) + " AS cKaisu, "
                + selectColumn(meta.chgYmdColumn) + " AS chgYmd "
                + query.whereClause
                + " ORDER BY SRYCD";
        int safeSize = Math.min(size, 2000);
        int safePage = Math.max(1, page);
        int offset = (safePage - 1) * safeSize;
        sql = sql + " LIMIT ? OFFSET ?";
        List<EtensuRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            int index = bindParams(ps, query.params, 1);
            ps.setInt(index++, safeSize);
            ps.setInt(index, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    EtensuRecord record = new EtensuRecord();
                    record.tensuCode = rs.getString("srycd");
                    record.kubun = rs.getString("kubun");
                    record.name = rs.getString("name");
                    record.tanka = getDouble(rs, "tanka");
                    record.unit = rs.getString("unit");
                    record.category = rs.getString("category");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.tensuVersion = rs.getString("tensuVersion");
                    record.noticeDate = rs.getString("chgYmd");
                    record.effectiveDate = record.startDate;
                    record.points = record.tanka;
                    record.rDay = getInteger(rs, "rDay");
                    record.rMonth = getInteger(rs, "rMonth");
                    record.rSame = getInteger(rs, "rSame");
                    record.rWeek = getInteger(rs, "rWeek");
                    record.nGroup = getInteger(rs, "nGroup");
                    record.cKaisu = getInteger(rs, "cKaisu");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private void populateDetails(Connection connection, List<EtensuRecord> records, String asOf,
            EtensuTableMeta meta) throws SQLException {
        Map<String, List<EtensuRecord>> recordsBySrycd = new HashMap<>();
        Set<String> conflictDay = new HashSet<>();
        Set<String> conflictMonth = new HashSet<>();
        Set<String> conflictSame = new HashSet<>();
        Set<String> conflictWeek = new HashSet<>();
        Set<String> calcUnitTargets = new HashSet<>();
        Set<Integer> additionGroups = new HashSet<>();
        for (EtensuRecord record : records) {
            if (record.tensuCode == null) {
                continue;
            }
            recordsBySrycd.computeIfAbsent(record.tensuCode, key -> new ArrayList<>()).add(record);
            if (isRelated(record.rDay)) {
                conflictDay.add(record.tensuCode);
            }
            if (isRelated(record.rMonth)) {
                conflictMonth.add(record.tensuCode);
            }
            if (isRelated(record.rSame)) {
                conflictSame.add(record.tensuCode);
            }
            if (isRelated(record.rWeek)) {
                conflictWeek.add(record.tensuCode);
            }
            if (isRelated(record.cKaisu)) {
                calcUnitTargets.add(record.tensuCode);
            }
            if (record.nGroup != null && record.nGroup > 0) {
                additionGroups.add(record.nGroup);
            }
        }
        if (!conflictDay.isEmpty()) {
            loadConflicts(connection, "TBL_ETENSU_3_1", "day", conflictDay, asOf, recordsBySrycd);
        }
        if (!conflictMonth.isEmpty()) {
            loadConflicts(connection, "TBL_ETENSU_3_2", "month", conflictMonth, asOf, recordsBySrycd);
        }
        if (!conflictSame.isEmpty()) {
            loadConflicts(connection, "TBL_ETENSU_3_3", "same", conflictSame, asOf, recordsBySrycd);
        }
        if (!conflictWeek.isEmpty()) {
            loadConflicts(connection, "TBL_ETENSU_3_4", "week", conflictWeek, asOf, recordsBySrycd);
        }
        if (!additionGroups.isEmpty()) {
            loadAdditions(connection, additionGroups, asOf, records);
        }
        if (!calcUnitTargets.isEmpty()) {
            loadCalcUnits(connection, calcUnitTargets, asOf, recordsBySrycd);
        }
    }

    private void loadConflicts(Connection connection, String table, String scope, Set<String> srycds, String asOf,
            Map<String, List<EtensuRecord>> recordsBySrycd) throws SQLException {
        String inClause = buildInClause(srycds.size());
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT SRYCD1, SRYCD2, YUKOSTYMD, YUKOEDYMD, HAIHAN, TOKUREI, CHGYMD FROM ")
                .append(table)
                .append(" WHERE (SRYCD1 IN (")
                .append(inClause)
                .append(") OR SRYCD2 IN (")
                .append(inClause)
                .append(") )");
        List<Object> params = new ArrayList<>();
        params.addAll(srycds);
        params.addAll(srycds);
        if (asOf != null && !asOf.isBlank()) {
            sql.append(" AND YUKOSTYMD <= ? AND YUKOEDYMD >= ?");
            params.add(asOf);
            params.add(asOf);
        }
        try (PreparedStatement ps = connection.prepareStatement(sql.toString())) {
            bindParams(ps, params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String left = rs.getString("SRYCD1");
                    String right = rs.getString("SRYCD2");
                    OrcaEtensuConflict conflict = new OrcaEtensuConflict();
                    conflict.setScope(scope);
                    conflict.setLeftSrycd(left);
                    conflict.setRightSrycd(right);
                    conflict.setRule(getInteger(rs, "HAIHAN"));
                    conflict.setSpecialCondition(getInteger(rs, "TOKUREI"));
                    attachConflict(recordsBySrycd, left, conflict, scope);
                    attachConflict(recordsBySrycd, right, conflict, scope);
                }
            }
        }
    }

    private void loadAdditions(Connection connection, Set<Integer> nGroups, String asOf, List<EtensuRecord> records)
            throws SQLException {
        String inClause = buildInClause(nGroups.size());
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT N_GROUP, SRYCD, YUKOSTYMD, YUKOEDYMD, KASAN, CHGYMD FROM TBL_ETENSU_4 WHERE N_GROUP IN (")
                .append(inClause)
                .append(")");
        List<Object> params = new ArrayList<>(nGroups);
        if (asOf != null && !asOf.isBlank()) {
            sql.append(" AND YUKOSTYMD <= ? AND YUKOEDYMD >= ?");
            params.add(asOf);
            params.add(asOf);
        }
        Map<Integer, List<OrcaEtensuAddition>> additionsByGroup = new HashMap<>();
        try (PreparedStatement ps = connection.prepareStatement(sql.toString())) {
            bindParams(ps, params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Integer group = getInteger(rs, "N_GROUP");
                    if (group == null) {
                        continue;
                    }
                    OrcaEtensuAddition addition = new OrcaEtensuAddition();
                    addition.setNGroup(group);
                    addition.setSrycd(rs.getString("SRYCD"));
                    addition.setAdditionCode(getInteger(rs, "KASAN"));
                    additionsByGroup.computeIfAbsent(group, key -> new ArrayList<>()).add(addition);
                }
            }
        }
        for (EtensuRecord record : records) {
            if (record.nGroup == null) {
                continue;
            }
            List<OrcaEtensuAddition> additions = additionsByGroup.get(record.nGroup);
            if (additions != null && !additions.isEmpty()) {
                record.additions.addAll(additions);
            }
        }
    }

    private void loadCalcUnits(Connection connection, Set<String> srycds, String asOf,
            Map<String, List<EtensuRecord>> recordsBySrycd) throws SQLException {
        String inClause = buildInClause(srycds.size());
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT SRYCD, YUKOSTYMD, YUKOEDYMD, TANICD, TANINAME, KAISU, TOKUREI, CHGYMD FROM TBL_ETENSU_5 WHERE SRYCD IN (")
                .append(inClause)
                .append(")");
        List<Object> params = new ArrayList<>(srycds);
        if (asOf != null && !asOf.isBlank()) {
            sql.append(" AND YUKOSTYMD <= ? AND YUKOEDYMD >= ?");
            params.add(asOf);
            params.add(asOf);
        }
        try (PreparedStatement ps = connection.prepareStatement(sql.toString())) {
            bindParams(ps, params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String srycd = rs.getString("SRYCD");
                    OrcaEtensuCalcUnit unit = new OrcaEtensuCalcUnit();
                    unit.setUnitCode(getInteger(rs, "TANICD"));
                    unit.setUnitName(rs.getString("TANINAME"));
                    unit.setMaxCount(getInteger(rs, "KAISU"));
                    unit.setSpecialCondition(getInteger(rs, "TOKUREI"));
                    List<EtensuRecord> targets = recordsBySrycd.get(srycd);
                    if (targets != null) {
                        for (EtensuRecord record : targets) {
                            record.calcUnits.add(unit);
                        }
                    }
                }
            }
        }
    }

    private void attachConflict(Map<String, List<EtensuRecord>> recordsBySrycd, String srycd,
            OrcaEtensuConflict conflict, String scope) {
        if (srycd == null) {
            return;
        }
        List<EtensuRecord> records = recordsBySrycd.get(srycd);
        if (records == null) {
            return;
        }
        for (EtensuRecord record : records) {
            if (!record.isConflictScopeEnabled(scope)) {
                continue;
            }
            record.conflicts.add(conflict);
        }
    }

    private boolean isRelated(Integer flag) {
        return flag != null && flag > 0;
    }

    private String resolveVersion(List<EtensuRecord> records, String fallback) {
        String version = fallback;
        for (EtensuRecord record : records) {
            if (record.tensuVersion == null || record.tensuVersion.isBlank()) {
                continue;
            }
            if (version == null || version.compareTo(record.tensuVersion) < 0) {
                version = record.tensuVersion;
            }
        }
        return version;
    }

    private static String selectColumn(String column) {
        return column != null ? column : "null";
    }

    private static int bindParams(PreparedStatement ps, List<Object> params, int startIndex) throws SQLException {
        int index = startIndex;
        for (Object param : params) {
            if (param == null) {
                ps.setObject(index++, null);
            } else if (param instanceof Integer) {
                ps.setInt(index++, (Integer) param);
            } else {
                ps.setString(index++, param.toString());
            }
        }
        return index;
    }

    private static String buildInClause(int size) {
        if (size <= 0) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < size; i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append('?');
        }
        return builder.toString();
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static Double getDouble(ResultSet rs, String column) throws SQLException {
        double value = rs.getDouble(column);
        return rs.wasNull() ? null : value;
    }

    public static final class EtensuSearchCriteria {
        private String keyword;
        private String category;
        private String asOf;
        private String tensuVersion;
        private int page;
        private int size;

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getAsOf() {
            return asOf;
        }

        public void setAsOf(String asOf) {
            this.asOf = asOf;
        }

        public String getTensuVersion() {
            return tensuVersion;
        }

        public void setTensuVersion(String tensuVersion) {
            this.tensuVersion = tensuVersion;
        }

        public int getPage() {
            return page;
        }

        public void setPage(int page) {
            this.page = page;
        }

        public int getSize() {
            return size;
        }

        public void setSize(int size) {
            this.size = size;
        }
    }

    public static final class EtensuSearchResult {
        private final List<EtensuRecord> records;
        private final int totalCount;
        private final String version;

        public EtensuSearchResult(List<EtensuRecord> records, int totalCount, String version) {
            this.records = records;
            this.totalCount = totalCount;
            this.version = version;
        }

        public List<EtensuRecord> getRecords() {
            return records;
        }

        public int getTotalCount() {
            return totalCount;
        }

        public String getVersion() {
            return version;
        }
    }

    public static final class EtensuRecord {
        private String tensuCode;
        private String name;
        private String kubun;
        private Double tanka;
        private Double points;
        private String unit;
        private String category;
        private String startDate;
        private String endDate;
        private String tensuVersion;
        private String noticeDate;
        private String effectiveDate;
        private Integer rDay;
        private Integer rMonth;
        private Integer rSame;
        private Integer rWeek;
        private Integer nGroup;
        private Integer cKaisu;
        private final List<OrcaEtensuConflict> conflicts = new ArrayList<>();
        private final List<OrcaEtensuAddition> additions = new ArrayList<>();
        private final List<OrcaEtensuCalcUnit> calcUnits = new ArrayList<>();

        public String getTensuCode() {
            return tensuCode;
        }

        public String getName() {
            return name;
        }

        public String getKubun() {
            return kubun;
        }

        public Double getTanka() {
            return tanka;
        }

        public Double getPoints() {
            return points;
        }

        public String getUnit() {
            return unit;
        }

        public String getCategory() {
            return category;
        }

        public String getStartDate() {
            return startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public String getTensuVersion() {
            return tensuVersion;
        }

        public String getNoticeDate() {
            return noticeDate;
        }

        public String getEffectiveDate() {
            return effectiveDate;
        }

        public List<OrcaEtensuConflict> getConflicts() {
            return conflicts;
        }

        public List<OrcaEtensuAddition> getAdditions() {
            return additions;
        }

        public List<OrcaEtensuCalcUnit> getCalcUnits() {
            return calcUnits;
        }

        private boolean isConflictScopeEnabled(String scope) {
            if (scope == null) {
                return false;
            }
            switch (scope) {
                case "day":
                    return isRelated(rDay);
                case "month":
                    return isRelated(rMonth);
                case "same":
                    return isRelated(rSame);
                case "week":
                    return isRelated(rWeek);
                default:
                    return false;
            }
        }
    }

    private static final class EtensuQuery {
        private final String whereClause;
        private final List<Object> params;

        private EtensuQuery(String whereClause, List<Object> params) {
            this.whereClause = whereClause;
            this.params = params;
        }
    }

    private static final class EtensuTableMeta {
        private final String kubunColumn;
        private final String nameColumn;
        private final String tankaColumn;
        private final String unitColumn;
        private final String categoryColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String tensuVersionColumn;
        private final String rDayColumn;
        private final String rMonthColumn;
        private final String rSameColumn;
        private final String rWeekColumn;
        private final String nGroupColumn;
        private final String cKaisuColumn;
        private final String chgYmdColumn;
        private final boolean hasName;
        private final boolean hasTensuVersion;

        private EtensuTableMeta(String kubunColumn, String nameColumn, String tankaColumn, String unitColumn,
                String categoryColumn, String startDateColumn, String endDateColumn, String tensuVersionColumn,
                String rDayColumn, String rMonthColumn, String rSameColumn, String rWeekColumn, String nGroupColumn,
                String cKaisuColumn, String chgYmdColumn, boolean hasName, boolean hasTensuVersion) {
            this.kubunColumn = kubunColumn;
            this.nameColumn = nameColumn;
            this.tankaColumn = tankaColumn;
            this.unitColumn = unitColumn;
            this.categoryColumn = categoryColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.tensuVersionColumn = tensuVersionColumn;
            this.rDayColumn = rDayColumn;
            this.rMonthColumn = rMonthColumn;
            this.rSameColumn = rSameColumn;
            this.rWeekColumn = rWeekColumn;
            this.nGroupColumn = nGroupColumn;
            this.cKaisuColumn = cKaisuColumn;
            this.chgYmdColumn = chgYmdColumn;
            this.hasName = hasName;
            this.hasTensuVersion = hasTensuVersion;
        }

        private static EtensuTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String kubun = columnOrNull(meta, "TBL_ETENSU_1", "KUBUN");
            String name = columnOrNull(meta, "TBL_ETENSU_1", "NAME");
            String tanka = columnOrNull(meta, "TBL_ETENSU_1", "TANKA");
            String unit = columnOrNull(meta, "TBL_ETENSU_1", "TANI");
            String category = columnOrNull(meta, "TBL_ETENSU_1", "CATEGORY");
            String startDate = columnOrNull(meta, "TBL_ETENSU_1", "YMD_START");
            String endDate = columnOrNull(meta, "TBL_ETENSU_1", "YMD_END");
            if (startDate == null) {
                startDate = columnOrNull(meta, "TBL_ETENSU_1", "YUKOSTYMD");
            }
            if (endDate == null) {
                endDate = columnOrNull(meta, "TBL_ETENSU_1", "YUKOEDYMD");
            }
            String tensuVersion = columnOrNull(meta, "TBL_ETENSU_1", "TENSU_VERSION");
            String rDay = columnOrNull(meta, "TBL_ETENSU_1", "R_DAY");
            String rMonth = columnOrNull(meta, "TBL_ETENSU_1", "R_MONTH");
            String rSame = columnOrNull(meta, "TBL_ETENSU_1", "R_SAME");
            String rWeek = columnOrNull(meta, "TBL_ETENSU_1", "R_WEEK");
            String nGroup = columnOrNull(meta, "TBL_ETENSU_1", "N_GROUP");
            String cKaisu = columnOrNull(meta, "TBL_ETENSU_1", "C_KAISU");
            String chgYmd = columnOrNull(meta, "TBL_ETENSU_1", "CHGYMD");
            return new EtensuTableMeta(kubun, name, tanka, unit, category,
                    startDate != null ? startDate : "YUKOSTYMD",
                    endDate != null ? endDate : "YUKOEDYMD",
                    tensuVersion,
                    rDay != null ? rDay : "R_DAY",
                    rMonth != null ? rMonth : "R_MONTH",
                    rSame != null ? rSame : "R_SAME",
                    rWeek != null ? rWeek : "R_WEEK",
                    nGroup != null ? nGroup : "N_GROUP",
                    cKaisu != null ? cKaisu : "C_KAISU",
                    chgYmd != null ? chgYmd : "CHGYMD",
                    name != null,
                    tensuVersion != null);
        }

        private static String columnOrNull(DatabaseMetaData meta, String table, String column) throws SQLException {
            String resolved = findColumn(meta, table, column);
            if (resolved != null) {
                return resolved;
            }
            return findColumn(meta, table.toLowerCase(Locale.ROOT), column.toLowerCase(Locale.ROOT));
        }

        private static String findColumn(DatabaseMetaData meta, String table, String column) throws SQLException {
            try (ResultSet rs = meta.getColumns(null, null, table, column)) {
                if (rs.next()) {
                    return rs.getString("COLUMN_NAME");
                }
            }
            return null;
        }

        private String categoryColumn() {
            if (categoryColumn != null) {
                return categoryColumn;
            }
            return kubunColumn;
        }
    }
}
