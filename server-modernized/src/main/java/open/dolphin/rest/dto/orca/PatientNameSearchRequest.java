package open.dolphin.rest.dto.orca;

/**
 * Request payload for POST /orca/patients/name-search.
 */
public class PatientNameSearchRequest {

    private String name;
    private String kana;
    private String fuzzyMode;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKana() {
        return kana;
    }

    public void setKana(String kana) {
        this.kana = kana;
    }

    public String getFuzzyMode() {
        return fuzzyMode;
    }

    public void setFuzzyMode(String fuzzyMode) {
        this.fuzzyMode = fuzzyMode;
    }
}
