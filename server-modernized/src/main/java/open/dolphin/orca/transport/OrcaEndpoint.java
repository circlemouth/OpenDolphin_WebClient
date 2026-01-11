package open.dolphin.orca.transport;

/**
 * Enumerates ORCA API endpoints handled by the wrapper along with stub payloads.
 */
public enum OrcaEndpoint {

    ACCEPTANCE_LIST("/api01rv2/acceptlstv2", "orca/stub/05_acceptlstv2_response.sample.xml", true, false,
            "Acceptance_Date"),
    APPOINTMENT_LIST("/api01rv2/appointlstv2", "orca/stub/06_appointlstv2_response.sample.xml", true, false,
            "Appointment_Date"),
    PATIENT_APPOINTMENT_LIST("/api01rv2/appointlst2v2", "orca/stub/15_appointlst2v2_response.sample.xml", true, false,
            "Patient_ID", "Base_Date"),
    BILLING_SIMULATION("/api01rv2/acsimulatev2", "orca/stub/16_acsimulatev2_response.sample.xml", true, false,
            "Patient_ID", "Perform_Date"),
    VISIT_LIST("/api01rv2/visitptlstv2", "orca/stub/18_visitptlstv2_response.sample.xml", true, false,
            "Request_Number", "Visit_Date"),
    PATIENT_ID_LIST("/api01rv2/patientlst1v2", "orca/stub/08_patientlst1v2_response.sample.xml", true, false,
            "Base_StartDate", "Base_EndDate"),
    PATIENT_BATCH("/api01rv2/patientlst2v2", "orca/stub/09_patientlst2v2_response.sample.xml", true, false,
            "Patient_ID_Information"),
    PATIENT_NAME_SEARCH("/api01rv2/patientlst3v2", "orca/stub/10_patientlst3v2_response.sample.xml", true, false,
            "WholeName/WholeName_inKana"),
    INSURANCE_COMBINATION("/api01rv2/patientlst6v2", "orca/stub/35_patientlst6v2_response.sample.xml", true, false,
            "Patient_ID"),
    FORMER_NAME_HISTORY("/api01rv2/patientlst8v2", "orca/stub/51_patientlst8v2_response.sample.xml", true, false,
            "Patient_ID"),
    APPOINTMENT_MUTATION("/orca14/appointmodv2", "orca/stub/02_appointmodv2_response.sample.xml", true, true,
            "Patient_ID", "Appointment_Date", "Appointment_Time"),
    ACCEPTANCE_MUTATION("/orca11/acceptmodv2", "orca/stub/04_acceptmodv2_response.sample.xml", true, false,
            "Request_Number", "Patient_ID");

    private final String path;
    private final String stubResource;
    private final boolean requiresBody;
    private final boolean usesQueryFromMeta;
    private final String[] requiredFields;

    OrcaEndpoint(String path, String stubResource, boolean requiresBody, boolean usesQueryFromMeta,
            String... requiredFields) {
        this.path = path;
        this.stubResource = stubResource;
        this.requiresBody = requiresBody;
        this.usesQueryFromMeta = usesQueryFromMeta;
        this.requiredFields = requiredFields != null ? requiredFields : new String[0];
    }

    public String getPath() {
        return path;
    }

    public String getStubResource() {
        return stubResource;
    }

    public boolean requiresBody() {
        return requiresBody;
    }

    public boolean usesQueryFromMeta() {
        return usesQueryFromMeta;
    }

    public java.util.List<String> requiredFields() {
        return java.util.List.of(requiredFields);
    }
}
