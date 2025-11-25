package open.dolphin.rest.dto;

/**
 * Drug entry within an RP history response.
 */
public class RpHistoryDrugResponse {

    private final String srycd;
    private final String srysyukbn;
    private final String name;
    private final String amount;
    private final String dose;
    private final String usage;
    private final String days;
    private final String memo;

    public RpHistoryDrugResponse(String srycd,
                                 String srysyukbn,
                                 String name,
                                 String amount,
                                 String dose,
                                 String usage,
                                 String days,
                                 String memo) {
        this.srycd = srycd;
        this.srysyukbn = srysyukbn;
        this.name = name;
        this.amount = amount;
        this.dose = dose;
        this.usage = usage;
        this.days = days;
        this.memo = memo;
    }

    public String getSrycd() {
        return srycd;
    }

    public String getSrysyukbn() {
        return srysyukbn;
    }

    public String getName() {
        return name;
    }

    public String getAmount() {
        return amount;
    }

    public String getDose() {
        return dose;
    }

    public String getUsage() {
        return usage;
    }

    public String getDays() {
        return days;
    }

    public String getMemo() {
        return memo;
    }
}
