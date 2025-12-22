package open.dolphin.adm20.dto;

import java.util.List;
import open.dolphin.infomodel.PHRBundle;

public class PhrMedicationResponse {

    private final String message;
    private final List<PHRBundle> bundles;

    public PhrMedicationResponse(String message, List<PHRBundle> bundles) {
        this.message = message;
        this.bundles = bundles;
    }

    public String getMessage() {
        return message;
    }

    public List<PHRBundle> getBundles() {
        return bundles;
    }
}
