package open.dolphin.orca.transport;

/**
 * Enumerates ORCA API endpoints handled by the wrapper along with stub payloads.
 */
public enum OrcaEndpoint {

    APPOINTMENT_LIST("/api01rv2/appointlstv2", "orca/stub/06_appointlstv2_response.sample.xml"),
    PATIENT_APPOINTMENT_LIST("/api01rv2/appointlst2v2", "orca/stub/15_appointlst2v2_response.sample.xml"),
    BILLING_SIMULATION("/api01rv2/acsimulatev2", "orca/stub/16_acsimulatev2_response.sample.xml"),
    VISIT_LIST("/api01rv2/visitptlstv2", "orca/stub/18_visitptlstv2_response.sample.xml"),
    PATIENT_ID_LIST("/api01rv2/patientlst1v2", "orca/stub/08_patientlst1v2_response.sample.xml"),
    PATIENT_BATCH("/api01rv2/patientlst2v2", "orca/stub/09_patientlst2v2_response.sample.xml"),
    PATIENT_NAME_SEARCH("/api01rv2/patientlst3v2", "orca/stub/10_patientlst3v2_response.sample.xml"),
    INSURANCE_COMBINATION("/api01rv2/patientlst6v2", "orca/stub/35_patientlst6v2_response.sample.xml"),
    FORMER_NAME_HISTORY("/api01rv2/patientlst8v2", "orca/stub/51_patientlst8v2_response.sample.xml"),
    APPOINTMENT_MUTATION("/orca14/appointmodv2", "orca/stub/02_appointmodv2_response.sample.xml"),
    ACCEPTANCE_MUTATION("/orca11/acceptmodv2", "orca/stub/04_acceptmodv2_response.sample.xml");

    private final String path;
    private final String stubResource;

    OrcaEndpoint(String path, String stubResource) {
        this.path = path;
        this.stubResource = stubResource;
    }

    public String getPath() {
        return path;
    }

    public String getStubResource() {
        return stubResource;
    }
}
