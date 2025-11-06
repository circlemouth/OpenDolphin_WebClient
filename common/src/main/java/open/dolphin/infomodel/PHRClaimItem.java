package open.dolphin.infomodel;


/**
 * ClaimItem 要素クラス。
 *
 * @author Kazushi Minagawa, Digital Globe,Inc. 
 */
public class PHRClaimItem implements java.io.Serializable {

    // 名称
    private String name;
    
    // コード
    private String code;
    
    // コード体系
    private String codeSystem;
    
    // 種別コード（薬剤｜手技｜材料）
    private String clsCode;
    
    // 種別コード体系
    private String clsCodeSystem;
    
    // 数量 ios=quantity od=number
    private String quantity;
    
    // 単位
    private String unit;
    
    // 数量コード
    private String numberCode;
    
    // 数量コード体系
    private String numberCodeSystem;
    
    // メモ
    private String memo;
    
    // 薬剤区分
    private String ykzKbn;

    // 用法コード
    private String frequency;

    // 用法コード表示名
    private String frequencyName;

    // 投与開始日
    private String startDate;

    // 投与終了日
    private String endDate;

    // 算定区分（用法）
    private String administration;

    // 投与量
    private String dose;

    // 投与量単位
    private String doseUnit;
    

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getCodeSystem() {
        return codeSystem;
    }

    public void setCodeSystem(String codeSystem) {
        this.codeSystem = codeSystem;
    }

    // ios=quantity od=number
    public String getQuantity() {
        return quantity;
    }

    public void setQuantity(String number) {
        this.quantity = number;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getNumberCode() {
        return numberCode;
    }

    public void setNumberCode(String numberCode) {
        this.numberCode = numberCode;
    }

    public String getNumberCodeSystem() {
        return numberCodeSystem;
    }

    public void setNumberCodeSystem(String numberCodeSystem) {
        this.numberCodeSystem = numberCodeSystem;
    }

    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public String getYkzKbn() {
        return ykzKbn;
    }

    public void setYkzKbn(String ykzKbn) {
        this.ykzKbn = ykzKbn;
    }

    public String getClsCode() {
        return clsCode;
    }

    public void setClsCode(String clsCode) {
        this.clsCode = clsCode;
    }

    public String getClsCodeSystem() {
        return clsCodeSystem;
    }

    public void setClsCodeSystem(String clsCodeSystem) {
        this.clsCodeSystem = clsCodeSystem;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public String getFrequencyName() {
        return frequencyName;
    }

    public void setFrequencyName(String frequencyName) {
        this.frequencyName = frequencyName;
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

    public String getAdministration() {
        return administration;
    }

    public void setAdministration(String administration) {
        this.administration = administration;
    }

    public String getDose() {
        return dose;
    }

    public void setDose(String dose) {
        this.dose = dose;
    }

    public String getDoseUnit() {
        return doseUnit;
    }

    public void setDoseUnit(String doseUnit) {
        this.doseUnit = doseUnit;
    }
}
