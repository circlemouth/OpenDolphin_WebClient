package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrcaTensuEntry {

    private String tensuCode;
    private String name;
    private String kubun;
    private String noticeDate;
    private String effectiveDate;
    private Double points;
    private Double tanka;
    private String unit;
    private String category;
    private String startDate;
    private String endDate;
    private String tensuVersion;
    private OrcaMasterMeta meta;

    public String getTensuCode() {
        return tensuCode;
    }

    public void setTensuCode(String tensuCode) {
        this.tensuCode = tensuCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKubun() {
        return kubun;
    }

    public void setKubun(String kubun) {
        this.kubun = kubun;
    }

    public String getNoticeDate() {
        return noticeDate;
    }

    public void setNoticeDate(String noticeDate) {
        this.noticeDate = noticeDate;
    }

    public String getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(String effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public Double getPoints() {
        return points;
    }

    public void setPoints(Double points) {
        this.points = points;
    }

    public Double getTanka() {
        return tanka;
    }

    public void setTanka(Double tanka) {
        this.tanka = tanka;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getTensuVersion() {
        return tensuVersion;
    }

    public void setTensuVersion(String tensuVersion) {
        this.tensuVersion = tensuVersion;
    }

    public OrcaMasterMeta getMeta() {
        return meta;
    }

    public void setMeta(OrcaMasterMeta meta) {
        this.meta = meta;
    }
}
