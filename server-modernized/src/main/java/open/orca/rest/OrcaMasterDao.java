package open.orca.rest;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

public class OrcaMasterDao {
    private static final Logger LOGGER = Logger.getLogger(OrcaMasterDao.class.getName());
    private static final int MAX_PAGE_SIZE = 2000;

    public GenericClassSearchResult searchGenericClass(GenericClassCriteria criteria) {
        if (criteria == null) {
            return null;
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            GenericClassTableMeta meta = GenericClassTableMeta.load(connection);
            if (meta == null || meta.codeColumn == null) {
                return new GenericClassSearchResult(Collections.emptyList(), 0, null);
            }
            Query query = buildGenericClassQuery(criteria, meta);
            int totalCount = fetchTotalCount(connection, meta.tableName, query);
            if (totalCount == 0) {
                return new GenericClassSearchResult(Collections.emptyList(), 0, null);
            }
            List<GenericClassRecord> records = fetchGenericClassRecords(connection, meta, query,
                    criteria.page, criteria.size);
            String version = resolveVersion(records, null);
            return new GenericClassSearchResult(records, totalCount, version);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-05 generic class master", e);
            return null;
        }
    }

    public GenericPriceRecord findGenericPrice(GenericPriceCriteria criteria) {
        if (criteria == null || criteria.srycd == null || criteria.srycd.isBlank()) {
            return null;
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            GenericPriceTableMeta meta = GenericPriceTableMeta.load(connection);
            if (meta == null || meta.codeColumn == null) {
                return null;
            }
            Query query = buildGenericPriceQuery(criteria, meta);
            List<GenericPriceRecord> records = fetchGenericPriceRecords(connection, meta, query);
            return records.isEmpty() ? null : records.get(0);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-05 generic price master", e);
            return null;
        }
    }

    public List<YouhouRecord> searchYouhou(YouhouCriteria criteria) {
        if (criteria == null) {
            return Collections.emptyList();
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            YouhouTableMeta meta = YouhouTableMeta.load(connection);
            if (meta == null || meta.codeColumn == null) {
                return Collections.emptyList();
            }
            Query query = buildKeywordEffectiveQuery(criteria.keyword, criteria.effective, meta.tableName,
                    meta.codeColumn, meta.nameColumn, meta.kanaColumn, meta.startDateColumn, meta.endDateColumn);
            return fetchYouhouRecords(connection, meta, query);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-05 youhou master", e);
            return Collections.emptyList();
        }
    }

    public List<MaterialRecord> searchMaterial(MaterialCriteria criteria) {
        if (criteria == null) {
            return Collections.emptyList();
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            MaterialTableMeta meta = MaterialTableMeta.load(connection);
            if (meta == null || meta.codeColumn == null) {
                return Collections.emptyList();
            }
            Query query = buildKeywordEffectiveQuery(criteria.keyword, criteria.effective, meta.tableName,
                    meta.codeColumn, meta.nameColumn, meta.kanaColumn, meta.startDateColumn, meta.endDateColumn);
            return fetchMaterialRecords(connection, meta, query);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-05 material master", e);
            return Collections.emptyList();
        }
    }

    public List<KensaSortRecord> searchKensaSort(KensaSortCriteria criteria) {
        if (criteria == null) {
            return Collections.emptyList();
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            KensaSortTableMeta meta = KensaSortTableMeta.load(connection);
            if (meta == null || meta.codeColumn == null) {
                return Collections.emptyList();
            }
            Query query = buildKeywordEffectiveQuery(criteria.keyword, criteria.effective, meta.tableName,
                    meta.codeColumn, meta.nameColumn, meta.kanaColumn, meta.startDateColumn, meta.endDateColumn);
            return fetchKensaSortRecords(connection, meta, query);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-05 kensa sort master", e);
            return Collections.emptyList();
        }
    }

    public HokenjaSearchResult searchHokenja(HokenjaCriteria criteria) {
        if (criteria == null) {
            return new HokenjaSearchResult(Collections.emptyList(), 0, null);
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            HokenjaTableMeta meta = HokenjaTableMeta.load(connection);
            if (meta == null || meta.codeColumn == null) {
                return new HokenjaSearchResult(Collections.emptyList(), 0, null);
            }
            Query query = buildHokenjaQuery(criteria, meta);
            int totalCount = fetchTotalCount(connection, meta.tableName, query);
            if (totalCount == 0) {
                return new HokenjaSearchResult(Collections.emptyList(), 0, null);
            }
            List<HokenjaRecord> records = fetchHokenjaRecords(connection, meta, query, criteria.page, criteria.size);
            String version = resolveVersion(records, null);
            return new HokenjaSearchResult(records, totalCount, version);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-06 hokenja master", e);
            return new HokenjaSearchResult(Collections.emptyList(), 0, null);
        }
    }

    public AddressRecord findAddress(AddressCriteria criteria) {
        if (criteria == null || criteria.zip == null || criteria.zip.isBlank()) {
            return null;
        }
        try (Connection connection = ORCAConnection.getInstance().getConnection()) {
            AddressTableMeta meta = AddressTableMeta.load(connection);
            if (meta == null || meta.zipColumn == null) {
                return null;
            }
            Query query = buildAddressQuery(criteria, meta);
            List<AddressRecord> records = fetchAddressRecords(connection, meta, query);
            return records.isEmpty() ? null : records.get(0);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Failed to load ORCA-06 address master", e);
            return null;
        }
    }

    private Query buildGenericClassQuery(GenericClassCriteria criteria, GenericClassTableMeta meta) {
        StringBuilder where = new StringBuilder(" FROM ").append(meta.tableName).append(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        appendKeywordFilter(where, params, criteria.keyword, meta.codeColumn, meta.nameColumn, meta.kanaColumn);
        appendEffectiveFilter(where, params, criteria.effective, meta.startDateColumn, meta.endDateColumn);
        return new Query(where.toString(), params);
    }

    private Query buildGenericPriceQuery(GenericPriceCriteria criteria, GenericPriceTableMeta meta) {
        StringBuilder where = new StringBuilder(" FROM ").append(meta.tableName).append(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        where.append(" AND ").append(meta.codeColumn).append(" = ?");
        params.add(criteria.srycd);
        appendEffectiveFilter(where, params, criteria.effective, meta.startDateColumn, meta.endDateColumn);
        return new Query(where.toString(), params);
    }

    private Query buildHokenjaQuery(HokenjaCriteria criteria, HokenjaTableMeta meta) {
        StringBuilder where = new StringBuilder(" FROM ").append(meta.tableName).append(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        appendKeywordFilter(where, params, criteria.keyword, meta.codeColumn, meta.nameColumn, meta.kanaColumn);
        appendEffectiveFilter(where, params, criteria.effective, meta.startDateColumn, meta.endDateColumn);
        if (criteria.pref != null && !criteria.pref.isBlank()) {
            if (meta.prefColumn != null) {
                where.append(" AND ").append(meta.prefColumn).append(" = ?");
                params.add(criteria.pref);
            } else if (meta.codeColumn != null) {
                where.append(" AND SUBSTRING(").append(meta.codeColumn).append(" FROM 1 FOR 2) = ?");
                params.add(criteria.pref);
            }
        }
        return new Query(where.toString(), params);
    }

    private Query buildAddressQuery(AddressCriteria criteria, AddressTableMeta meta) {
        StringBuilder where = new StringBuilder(" FROM ").append(meta.tableName).append(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        where.append(" AND ").append(meta.zipColumn).append(" = ?");
        params.add(criteria.zip);
        appendEffectiveFilter(where, params, criteria.effective, meta.startDateColumn, meta.endDateColumn);
        return new Query(where.toString(), params);
    }

    private Query buildKeywordEffectiveQuery(String keyword, String effective, String tableName, String codeColumn,
            String nameColumn, String kanaColumn, String startDateColumn, String endDateColumn) {
        StringBuilder where = new StringBuilder(" FROM ").append(tableName).append(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        appendKeywordFilter(where, params, keyword, codeColumn, nameColumn, kanaColumn);
        appendEffectiveFilter(where, params, effective, startDateColumn, endDateColumn);
        return new Query(where.toString(), params);
    }

    private void appendKeywordFilter(StringBuilder where, List<Object> params, String keyword,
            String codeColumn, String nameColumn, String kanaColumn) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        String like = "%" + keyword.toUpperCase(Locale.ROOT) + "%";
        List<String> clauses = new ArrayList<>();
        if (codeColumn != null) {
            clauses.add("UPPER(" + codeColumn + ") LIKE ?");
            params.add(like);
        }
        if (nameColumn != null) {
            clauses.add("UPPER(" + nameColumn + ") LIKE ?");
            params.add(like);
        }
        if (kanaColumn != null) {
            clauses.add("UPPER(" + kanaColumn + ") LIKE ?");
            params.add(like);
        }
        if (!clauses.isEmpty()) {
            where.append(" AND (").append(String.join(" OR ", clauses)).append(")");
        }
    }

    private void appendEffectiveFilter(StringBuilder where, List<Object> params, String effective,
            String startDateColumn, String endDateColumn) {
        if (effective == null || effective.isBlank()) {
            return;
        }
        if (startDateColumn == null || endDateColumn == null) {
            return;
        }
        where.append(" AND ").append(startDateColumn).append(" <= ? AND ").append(endDateColumn).append(" >= ?");
        params.add(effective);
        params.add(effective);
    }

    private int fetchTotalCount(Connection connection, String tableName, Query query) throws SQLException {
        if (tableName == null) {
            return 0;
        }
        String sql = "SELECT count(*)" + query.whereClause;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private List<GenericClassRecord> fetchGenericClassRecords(Connection connection, GenericClassTableMeta meta,
            Query query, int page, int size) throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.codeColumn) + " AS code, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.kanaColumn) + " AS kana, "
                + selectColumn(meta.categoryColumn) + " AS category, "
                + selectColumn(meta.parentColumn) + " AS parent, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause
                + " ORDER BY " + meta.codeColumn;
        sql = applyPaging(sql);
        List<GenericClassRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            int index = bindParams(ps, query.params, 1);
            applyPagingParams(ps, index, page, size);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    GenericClassRecord record = new GenericClassRecord();
                    record.classCode = rs.getString("code");
                    record.className = rs.getString("name");
                    record.kanaName = rs.getString("kana");
                    record.categoryCode = rs.getString("category");
                    record.parentClassCode = rs.getString("parent");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private List<GenericPriceRecord> fetchGenericPriceRecords(Connection connection, GenericPriceTableMeta meta,
            Query query) throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.codeColumn) + " AS code, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.kanaColumn) + " AS kana, "
                + selectColumn(meta.unitColumn) + " AS unit, "
                + selectColumn(meta.priceColumn) + " AS price, "
                + selectColumn(meta.youhouColumn) + " AS youhou, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause;
        if (meta.startDateColumn != null) {
            sql = sql + " ORDER BY " + meta.startDateColumn + " DESC";
        }
        sql = sql + " LIMIT 1";
        List<GenericPriceRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    GenericPriceRecord record = new GenericPriceRecord();
                    record.srycd = rs.getString("code");
                    record.drugName = rs.getString("name");
                    record.kanaName = rs.getString("kana");
                    record.unit = rs.getString("unit");
                    record.price = getDouble(rs, "price");
                    record.youhouCode = rs.getString("youhou");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private List<YouhouRecord> fetchYouhouRecords(Connection connection, YouhouTableMeta meta, Query query)
            throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.codeColumn) + " AS code, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.kanaColumn) + " AS kana, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause
                + " ORDER BY " + meta.codeColumn;
        List<YouhouRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    YouhouRecord record = new YouhouRecord();
                    record.youhouCode = rs.getString("code");
                    record.youhouName = rs.getString("name");
                    record.kanaName = rs.getString("kana");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private List<MaterialRecord> fetchMaterialRecords(Connection connection, MaterialTableMeta meta, Query query)
            throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.codeColumn) + " AS code, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.kanaColumn) + " AS kana, "
                + selectColumn(meta.categoryColumn) + " AS category, "
                + selectColumn(meta.materialCategoryColumn) + " AS materialCategory, "
                + selectColumn(meta.unitColumn) + " AS unit, "
                + selectColumn(meta.priceColumn) + " AS price, "
                + selectColumn(meta.makerColumn) + " AS maker, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause
                + " ORDER BY " + meta.codeColumn;
        List<MaterialRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    MaterialRecord record = new MaterialRecord();
                    record.materialCode = rs.getString("code");
                    record.materialName = rs.getString("name");
                    record.kanaName = rs.getString("kana");
                    record.category = rs.getString("category");
                    record.materialCategory = rs.getString("materialCategory");
                    record.unit = rs.getString("unit");
                    record.price = getDouble(rs, "price");
                    record.maker = rs.getString("maker");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private List<KensaSortRecord> fetchKensaSortRecords(Connection connection, KensaSortTableMeta meta, Query query)
            throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.codeColumn) + " AS code, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.kanaColumn) + " AS kana, "
                + selectColumn(meta.kensaSortColumn) + " AS kensaSort, "
                + selectColumn(meta.classificationColumn) + " AS classification, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause
                + " ORDER BY " + meta.codeColumn;
        List<KensaSortRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    KensaSortRecord record = new KensaSortRecord();
                    record.kensaCode = rs.getString("code");
                    record.kensaName = rs.getString("name");
                    record.kanaName = rs.getString("kana");
                    record.kensaSort = rs.getString("kensaSort");
                    record.classification = rs.getString("classification");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private List<HokenjaRecord> fetchHokenjaRecords(Connection connection, HokenjaTableMeta meta, Query query,
            int page, int size) throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.codeColumn) + " AS code, "
                + selectColumn(meta.nameColumn) + " AS name, "
                + selectColumn(meta.kanaColumn) + " AS kana, "
                + selectColumn(meta.payerTypeColumn) + " AS payerType, "
                + selectColumn(meta.payerRatioColumn) + " AS payerRatio, "
                + selectColumn(meta.prefColumn) + " AS pref, "
                + selectColumn(meta.cityColumn) + " AS city, "
                + selectColumn(meta.zipColumn) + " AS zip, "
                + selectColumn(meta.addressColumn) + " AS address, "
                + selectColumn(meta.phoneColumn) + " AS phone, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause
                + " ORDER BY " + meta.codeColumn;
        sql = applyPaging(sql);
        List<HokenjaRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            int index = bindParams(ps, query.params, 1);
            applyPagingParams(ps, index, page, size);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    HokenjaRecord record = new HokenjaRecord();
                    record.payerCode = rs.getString("code");
                    record.payerName = rs.getString("name");
                    record.payerKana = rs.getString("kana");
                    record.insurerType = rs.getString("payerType");
                    record.payerRatio = getDouble(rs, "payerRatio");
                    record.prefCode = rs.getString("pref");
                    record.cityCode = rs.getString("city");
                    record.zip = rs.getString("zip");
                    record.addressLine = rs.getString("address");
                    record.phone = rs.getString("phone");
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private List<AddressRecord> fetchAddressRecords(Connection connection, AddressTableMeta meta, Query query)
            throws SQLException {
        String sql = "SELECT "
                + selectColumn(meta.zipColumn) + " AS zip, "
                + selectColumn(meta.prefCodeColumn) + " AS pref, "
                + selectColumn(meta.cityCodeColumn) + " AS cityCode, "
                + selectColumn(meta.lpubColumn) + " AS lpub, "
                + selectColumn(meta.prefNameColumn) + " AS prefName, "
                + selectColumn(meta.cityNameColumn) + " AS cityName, "
                + selectColumn(meta.townNameColumn) + " AS townName, "
                + selectColumn(meta.prefKanaColumn) + " AS prefKana, "
                + selectColumn(meta.cityKanaColumn) + " AS cityKana, "
                + selectColumn(meta.townKanaColumn) + " AS townKana, "
                + selectColumn(meta.editKanaColumn) + " AS editKana, "
                + selectColumn(meta.editNameColumn) + " AS editName, "
                + selectColumn(meta.romanColumn) + " AS roman, "
                + selectColumn(meta.startDateColumn) + " AS startDate, "
                + selectColumn(meta.endDateColumn) + " AS endDate, "
                + selectColumn(meta.versionColumn) + " AS version "
                + query.whereClause
                + " LIMIT 1";
        List<AddressRecord> records = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            bindParams(ps, query.params, 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    AddressRecord record = new AddressRecord();
                    record.zip = rs.getString("zip");
                    record.prefCode = firstNonBlank(rs.getString("pref"), prefFromLpub(rs.getString("lpub")));
                    record.cityCode = firstNonBlank(rs.getString("cityCode"), cityFromLpub(rs.getString("lpub")));
                    record.city = rs.getString("cityName");
                    record.town = rs.getString("townName");
                    record.kana = buildAddressKana(rs.getString("editKana"), rs.getString("prefKana"),
                            rs.getString("cityKana"), rs.getString("townKana"));
                    record.roman = rs.getString("roman");
                    record.fullAddress = buildAddressName(rs.getString("editName"), rs.getString("prefName"),
                            rs.getString("cityName"), rs.getString("townName"));
                    record.startDate = rs.getString("startDate");
                    record.endDate = rs.getString("endDate");
                    record.version = rs.getString("version");
                    records.add(record);
                }
            }
        }
        return records;
    }

    private static String applyPaging(String sql) {
        return sql + " LIMIT ? OFFSET ?";
    }

    private static void applyPagingParams(PreparedStatement ps, int index, int page, int size) throws SQLException {
        int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));
        int safePage = Math.max(1, page);
        int offset = (safePage - 1) * safeSize;
        ps.setInt(index++, safeSize);
        ps.setInt(index, offset);
    }

    private static String prefFromLpub(String lpub) {
        if (lpub == null || lpub.length() < 2) {
            return null;
        }
        return lpub.substring(0, 2);
    }

    private static String cityFromLpub(String lpub) {
        if (lpub == null || lpub.isBlank()) {
            return null;
        }
        return lpub;
    }

    private static String buildAddressKana(String editKana, String prefKana, String cityKana, String townKana) {
        if (editKana != null && !editKana.isBlank()) {
            return editKana;
        }
        StringBuilder builder = new StringBuilder();
        appendWithSpace(builder, prefKana);
        appendWithSpace(builder, cityKana);
        appendWithSpace(builder, townKana);
        return builder.length() == 0 ? null : builder.toString();
    }

    private static String buildAddressName(String editName, String prefName, String cityName, String townName) {
        if (editName != null && !editName.isBlank()) {
            return editName;
        }
        StringBuilder builder = new StringBuilder();
        appendWithoutSpace(builder, prefName);
        appendWithoutSpace(builder, cityName);
        appendWithoutSpace(builder, townName);
        return builder.length() == 0 ? null : builder.toString();
    }

    private static void appendWithSpace(StringBuilder builder, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (builder.length() > 0) {
            builder.append(' ');
        }
        builder.append(value.trim());
    }

    private static void appendWithoutSpace(StringBuilder builder, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        builder.append(value.trim());
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String resolveVersion(List<? extends VersionedRecord> records, String fallback) {
        String version = fallback;
        for (VersionedRecord record : records) {
            if (record == null) {
                continue;
            }
            String candidate = record.version();
            if (candidate == null || candidate.isBlank()) {
                continue;
            }
            if (version == null || version.compareTo(candidate) < 0) {
                version = candidate;
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
            } else if (param instanceof Double) {
                ps.setDouble(index++, (Double) param);
            } else {
                ps.setString(index++, param.toString());
            }
        }
        return index;
    }

    private static Double getDouble(ResultSet rs, String column) throws SQLException {
        double value = rs.getDouble(column);
        return rs.wasNull() ? null : value;
    }

    private interface VersionedRecord {
        String version();
    }

    private static final class Query {
        private final String whereClause;
        private final List<Object> params;

        private Query(String whereClause, List<Object> params) {
            this.whereClause = whereClause;
            this.params = params;
        }
    }

    public static final class GenericClassCriteria {
        private String keyword;
        private String effective;
        private int page = 1;
        private int size = 100;

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
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

    public static final class GenericPriceCriteria {
        private String srycd;
        private String effective;

        public String getSrycd() {
            return srycd;
        }

        public void setSrycd(String srycd) {
            this.srycd = srycd;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
        }
    }

    public static final class YouhouCriteria {
        private String keyword;
        private String effective;

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
        }
    }

    public static final class MaterialCriteria {
        private String keyword;
        private String effective;

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
        }
    }

    public static final class KensaSortCriteria {
        private String keyword;
        private String effective;

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
        }
    }

    public static final class HokenjaCriteria {
        private String pref;
        private String keyword;
        private String effective;
        private int page = 1;
        private int size = 100;

        public String getPref() {
            return pref;
        }

        public void setPref(String pref) {
            this.pref = pref;
        }

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
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

    public static final class AddressCriteria {
        private String zip;
        private String effective;

        public String getZip() {
            return zip;
        }

        public void setZip(String zip) {
            this.zip = zip;
        }

        public String getEffective() {
            return effective;
        }

        public void setEffective(String effective) {
            this.effective = effective;
        }
    }

    public static final class GenericClassRecord implements VersionedRecord {
        public String classCode;
        public String className;
        public String kanaName;
        public String categoryCode;
        public String parentClassCode;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class GenericPriceRecord implements VersionedRecord {
        public String srycd;
        public String drugName;
        public String kanaName;
        public Double price;
        public String unit;
        public String youhouCode;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class YouhouRecord implements VersionedRecord {
        public String youhouCode;
        public String youhouName;
        public String kanaName;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class MaterialRecord implements VersionedRecord {
        public String materialCode;
        public String materialName;
        public String kanaName;
        public String category;
        public String materialCategory;
        public String unit;
        public Double price;
        public String maker;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class KensaSortRecord implements VersionedRecord {
        public String kensaCode;
        public String kensaName;
        public String kanaName;
        public String kensaSort;
        public String classification;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class HokenjaRecord implements VersionedRecord {
        public String payerCode;
        public String payerName;
        public String payerKana;
        public String insurerType;
        public Double payerRatio;
        public String prefCode;
        public String cityCode;
        public String zip;
        public String addressLine;
        public String phone;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class AddressRecord implements VersionedRecord {
        public String zip;
        public String prefCode;
        public String cityCode;
        public String city;
        public String town;
        public String kana;
        public String roman;
        public String fullAddress;
        public String startDate;
        public String endDate;
        public String version;

        @Override
        public String version() {
            return version;
        }
    }

    public static final class GenericClassSearchResult {
        private final List<GenericClassRecord> records;
        private final int totalCount;
        private final String version;

        public GenericClassSearchResult(List<GenericClassRecord> records, int totalCount, String version) {
            this.records = records;
            this.totalCount = totalCount;
            this.version = version;
        }

        public List<GenericClassRecord> getRecords() {
            return records;
        }

        public int getTotalCount() {
            return totalCount;
        }

        public String getVersion() {
            return version;
        }
    }

    public static final class HokenjaSearchResult {
        private final List<HokenjaRecord> records;
        private final int totalCount;
        private final String version;

        public HokenjaSearchResult(List<HokenjaRecord> records, int totalCount, String version) {
            this.records = records;
            this.totalCount = totalCount;
            this.version = version;
        }

        public List<HokenjaRecord> getRecords() {
            return records;
        }

        public int getTotalCount() {
            return totalCount;
        }

        public String getVersion() {
            return version;
        }
    }

    private static final class GenericClassTableMeta {
        private final String tableName;
        private final String codeColumn;
        private final String nameColumn;
        private final String kanaColumn;
        private final String categoryColumn;
        private final String parentColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private GenericClassTableMeta(String tableName, String codeColumn, String nameColumn, String kanaColumn,
                String categoryColumn, String parentColumn, String startDateColumn, String endDateColumn,
                String versionColumn) {
            this.tableName = tableName;
            this.codeColumn = codeColumn;
            this.nameColumn = nameColumn;
            this.kanaColumn = kanaColumn;
            this.categoryColumn = categoryColumn;
            this.parentColumn = parentColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static GenericClassTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_GENERIC_CLASS", "tbl_generic_class");
            if (table == null) {
                return null;
            }
            String code = columnOrNull(meta, table, "class_code", "yakkakjncd", "code");
            String name = columnOrNull(meta, table, "class_name", "yakkakjnnm", "name");
            String kana = columnOrNull(meta, table, "kana_name", "kananame", "kana");
            String category = columnOrNull(meta, table, "category_code", "category", "kouhatu");
            String parent = columnOrNull(meta, table, "parent_class_code", "parent_code");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new GenericClassTableMeta(table, code, name, kana, category, parent, startDate, endDate, version);
        }
    }

    private static final class GenericPriceTableMeta {
        private final String tableName;
        private final String codeColumn;
        private final String nameColumn;
        private final String kanaColumn;
        private final String priceColumn;
        private final String unitColumn;
        private final String youhouColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private GenericPriceTableMeta(String tableName, String codeColumn, String nameColumn, String kanaColumn,
                String priceColumn, String unitColumn, String youhouColumn, String startDateColumn,
                String endDateColumn, String versionColumn) {
            this.tableName = tableName;
            this.codeColumn = codeColumn;
            this.nameColumn = nameColumn;
            this.kanaColumn = kanaColumn;
            this.priceColumn = priceColumn;
            this.unitColumn = unitColumn;
            this.youhouColumn = youhouColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static GenericPriceTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_GENERIC_PRICE", "tbl_generic_price");
            if (table == null) {
                return null;
            }
            String code = columnOrNull(meta, table, "srycd", "yakkakjncd", "code");
            String name = columnOrNull(meta, table, "name", "drug_name", "generic_name");
            String kana = columnOrNull(meta, table, "kana_name", "kananame", "kana");
            String price = columnOrNull(meta, table, "price", "min_price", "tanka");
            String unit = columnOrNull(meta, table, "unit", "tani", "taniname");
            String youhou = columnOrNull(meta, table, "youhoucode", "youhou_code", "yakkakjncd");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new GenericPriceTableMeta(table, code, name, kana, price, unit, youhou, startDate, endDate,
                    version);
        }
    }

    private static final class YouhouTableMeta {
        private final String tableName;
        private final String codeColumn;
        private final String nameColumn;
        private final String kanaColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private YouhouTableMeta(String tableName, String codeColumn, String nameColumn, String kanaColumn,
                String startDateColumn, String endDateColumn, String versionColumn) {
            this.tableName = tableName;
            this.codeColumn = codeColumn;
            this.nameColumn = nameColumn;
            this.kanaColumn = kanaColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static YouhouTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_YOUHOU", "tbl_youhou");
            if (table == null) {
                return null;
            }
            String code = columnOrNull(meta, table, "youhoucode", "code");
            String name = columnOrNull(meta, table, "youhouname", "name", "detail_name");
            String kana = columnOrNull(meta, table, "kana", "kana_name", "kananame");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new YouhouTableMeta(table, code, name, kana, startDate, endDate, version);
        }
    }

    private static final class MaterialTableMeta {
        private final String tableName;
        private final String codeColumn;
        private final String nameColumn;
        private final String kanaColumn;
        private final String categoryColumn;
        private final String materialCategoryColumn;
        private final String unitColumn;
        private final String priceColumn;
        private final String makerColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private MaterialTableMeta(String tableName, String codeColumn, String nameColumn, String kanaColumn,
                String categoryColumn, String materialCategoryColumn, String unitColumn, String priceColumn,
                String makerColumn, String startDateColumn, String endDateColumn, String versionColumn) {
            this.tableName = tableName;
            this.codeColumn = codeColumn;
            this.nameColumn = nameColumn;
            this.kanaColumn = kanaColumn;
            this.categoryColumn = categoryColumn;
            this.materialCategoryColumn = materialCategoryColumn;
            this.unitColumn = unitColumn;
            this.priceColumn = priceColumn;
            this.makerColumn = makerColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static MaterialTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_MATERIAL_H_M", "TBL_MATERIAL", "tbl_material_h_m",
                    "tbl_material");
            if (table == null) {
                return null;
            }
            String code = columnOrNull(meta, table, "material_code", "srycd", "jancd", "code");
            String name = columnOrNull(meta, table, "material_name", "name", "snamecd");
            String kana = columnOrNull(meta, table, "kana_name", "kananame", "kana");
            String category = columnOrNull(meta, table, "category", "classification", "kinokbnno");
            String materialCategory = columnOrNull(meta, table, "material_category", "category_code", "dockanricd");
            String unit = columnOrNull(meta, table, "unit", "tani", "taniname");
            String price = columnOrNull(meta, table, "price", "tanka", "kakaku");
            String maker = columnOrNull(meta, table, "maker", "companycd1", "companycd2");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new MaterialTableMeta(table, code, name, kana, category, materialCategory, unit, price, maker,
                    startDate, endDate, version);
        }
    }

    private static final class KensaSortTableMeta {
        private final String tableName;
        private final String codeColumn;
        private final String nameColumn;
        private final String kanaColumn;
        private final String kensaSortColumn;
        private final String classificationColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private KensaSortTableMeta(String tableName, String codeColumn, String nameColumn, String kanaColumn,
                String kensaSortColumn, String classificationColumn, String startDateColumn, String endDateColumn,
                String versionColumn) {
            this.tableName = tableName;
            this.codeColumn = codeColumn;
            this.nameColumn = nameColumn;
            this.kanaColumn = kanaColumn;
            this.kensaSortColumn = kensaSortColumn;
            this.classificationColumn = classificationColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static KensaSortTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_KENSASORT", "tbl_kensasort");
            if (table == null) {
                return null;
            }
            String code = columnOrNull(meta, table, "kensa_code", "srycd", "code");
            String name = columnOrNull(meta, table, "kensa_name", "name");
            String kana = columnOrNull(meta, table, "kana_name", "kananame", "kana");
            String kensaSort = columnOrNull(meta, table, "kensa_sort", "knsbunrui", "classification_code");
            String classification = columnOrNull(meta, table, "classification", "kbn", "bunrui");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new KensaSortTableMeta(table, code, name, kana, kensaSort, classification, startDate, endDate,
                    version);
        }
    }

    private static final class HokenjaTableMeta {
        private final String tableName;
        private final String codeColumn;
        private final String nameColumn;
        private final String kanaColumn;
        private final String payerTypeColumn;
        private final String payerRatioColumn;
        private final String prefColumn;
        private final String cityColumn;
        private final String zipColumn;
        private final String addressColumn;
        private final String phoneColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private HokenjaTableMeta(String tableName, String codeColumn, String nameColumn, String kanaColumn,
                String payerTypeColumn, String payerRatioColumn, String prefColumn, String cityColumn,
                String zipColumn, String addressColumn, String phoneColumn, String startDateColumn,
                String endDateColumn, String versionColumn) {
            this.tableName = tableName;
            this.codeColumn = codeColumn;
            this.nameColumn = nameColumn;
            this.kanaColumn = kanaColumn;
            this.payerTypeColumn = payerTypeColumn;
            this.payerRatioColumn = payerRatioColumn;
            this.prefColumn = prefColumn;
            this.cityColumn = cityColumn;
            this.zipColumn = zipColumn;
            this.addressColumn = addressColumn;
            this.phoneColumn = phoneColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static HokenjaTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_HKNJAINF_MASTER", "TBL_HKNJAINF", "tbl_hknjainf_master",
                    "tbl_hknjainf");
            if (table == null) {
                return null;
            }
            String code = columnOrNull(meta, table, "hknjanum", "payer_code", "code");
            String name = columnOrNull(meta, table, "hknjaname", "payer_name", "name");
            String kana = columnOrNull(meta, table, "hknjakana", "hknjaname_tan1", "kana");
            String payerType = columnOrNull(meta, table, "hknjakbn", "hknnum", "payer_type");
            String payerRatio = columnOrNull(meta, table, "hknjafutankeiritsu", "hon_gaikyurate", "payer_ratio");
            String pref = columnOrNull(meta, table, "pref_code", "pref", "prefcode");
            String city = columnOrNull(meta, table, "city_code", "city", "citycode");
            String zip = columnOrNull(meta, table, "post", "zip", "zip_code");
            String address = columnOrNull(meta, table, "adrs", "address", "banti");
            String phone = columnOrNull(meta, table, "tel", "phone");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from", "idoymd");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new HokenjaTableMeta(table, code, name, kana, payerType, payerRatio, pref, city, zip, address,
                    phone, startDate, endDate, version);
        }
    }

    private static final class AddressTableMeta {
        private final String tableName;
        private final String zipColumn;
        private final String prefCodeColumn;
        private final String cityCodeColumn;
        private final String lpubColumn;
        private final String prefNameColumn;
        private final String cityNameColumn;
        private final String townNameColumn;
        private final String prefKanaColumn;
        private final String cityKanaColumn;
        private final String townKanaColumn;
        private final String editKanaColumn;
        private final String editNameColumn;
        private final String romanColumn;
        private final String startDateColumn;
        private final String endDateColumn;
        private final String versionColumn;

        private AddressTableMeta(String tableName, String zipColumn, String prefCodeColumn, String cityCodeColumn,
                String lpubColumn, String prefNameColumn, String cityNameColumn, String townNameColumn,
                String prefKanaColumn, String cityKanaColumn, String townKanaColumn, String editKanaColumn,
                String editNameColumn, String romanColumn, String startDateColumn, String endDateColumn,
                String versionColumn) {
            this.tableName = tableName;
            this.zipColumn = zipColumn;
            this.prefCodeColumn = prefCodeColumn;
            this.cityCodeColumn = cityCodeColumn;
            this.lpubColumn = lpubColumn;
            this.prefNameColumn = prefNameColumn;
            this.cityNameColumn = cityNameColumn;
            this.townNameColumn = townNameColumn;
            this.prefKanaColumn = prefKanaColumn;
            this.cityKanaColumn = cityKanaColumn;
            this.townKanaColumn = townKanaColumn;
            this.editKanaColumn = editKanaColumn;
            this.editNameColumn = editNameColumn;
            this.romanColumn = romanColumn;
            this.startDateColumn = startDateColumn;
            this.endDateColumn = endDateColumn;
            this.versionColumn = versionColumn;
        }

        private static AddressTableMeta load(Connection connection) throws SQLException {
            DatabaseMetaData meta = connection.getMetaData();
            String table = resolveTable(meta, "TBL_ADRS", "tbl_adrs");
            if (table == null) {
                return null;
            }
            String zip = columnOrNull(meta, table, "zip", "post", "zip_code");
            String prefCode = columnOrNull(meta, table, "pref_code", "prefcode");
            String cityCode = columnOrNull(meta, table, "city_code", "citycode");
            String lpub = columnOrNull(meta, table, "lpubcd", "lpub_code");
            String prefName = columnOrNull(meta, table, "prefname", "pref_name");
            String cityName = columnOrNull(meta, table, "cityname", "city_name");
            String townName = columnOrNull(meta, table, "townname", "town_name");
            String prefKana = columnOrNull(meta, table, "prefkana", "pref_kana");
            String cityKana = columnOrNull(meta, table, "citykana", "city_kana");
            String townKana = columnOrNull(meta, table, "townkana", "town_kana");
            String editKana = columnOrNull(meta, table, "editadrs_kana", "kana", "full_kana");
            String editName = columnOrNull(meta, table, "editadrs_name", "full_address", "address");
            String roman = columnOrNull(meta, table, "roman", "romaji");
            String startDate = columnOrNull(meta, table, "start_date", "yukostymd", "valid_from");
            String endDate = columnOrNull(meta, table, "end_date", "yukoedymd", "valid_to");
            String version = columnOrNull(meta, table, "upymd", "creymd", "chgymd", "version");
            return new AddressTableMeta(table, zip, prefCode, cityCode, lpub, prefName, cityName, townName,
                    prefKana, cityKana, townKana, editKana, editName, roman, startDate, endDate, version);
        }
    }

    private static String resolveTable(DatabaseMetaData meta, String... candidates) throws SQLException {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            String resolved = findTable(meta, candidate);
            if (resolved != null) {
                return resolved;
            }
            resolved = findTable(meta, candidate.toLowerCase(Locale.ROOT));
            if (resolved != null) {
                return resolved;
            }
        }
        return null;
    }

    private static String findTable(DatabaseMetaData meta, String table) throws SQLException {
        try (ResultSet rs = meta.getTables(null, null, table, new String[] {"TABLE", "VIEW"})) {
            if (rs.next()) {
                return rs.getString("TABLE_NAME");
            }
        }
        return null;
    }

    private static String columnOrNull(DatabaseMetaData meta, String table, String... candidates) throws SQLException {
        if (table == null || candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            String resolved = findColumn(meta, table, candidate);
            if (resolved != null) {
                return resolved;
            }
            resolved = findColumn(meta, table.toLowerCase(Locale.ROOT), candidate.toLowerCase(Locale.ROOT));
            if (resolved != null) {
                return resolved;
            }
        }
        return null;
    }

    private static String findColumn(DatabaseMetaData meta, String table, String column) throws SQLException {
        try (ResultSet rs = meta.getColumns(null, null, table, column)) {
            if (rs.next()) {
                return rs.getString("COLUMN_NAME");
            }
        }
        return null;
    }
}
