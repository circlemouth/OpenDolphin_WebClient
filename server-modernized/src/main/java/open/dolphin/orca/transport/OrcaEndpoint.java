package open.dolphin.orca.transport;

/**
 * Enumerates ORCA API endpoints handled by the wrapper along with stub payloads.
 */
public enum OrcaEndpoint {

    ACCEPTANCE_LIST("/api01rv2/acceptlstv2", "orca/stub/05_acceptlstv2_response.sample.xml", true, true, null,
            "Acceptance_Date"),
    APPOINTMENT_LIST("/api01rv2/appointlstv2", "orca/stub/06_appointlstv2_response.sample.xml", true, false, null,
            "Appointment_Date"),
    PATIENT_APPOINTMENT_LIST("/api01rv2/appointlst2v2", "orca/stub/15_appointlst2v2_response.sample.xml", true, false, null,
            "Patient_ID", "Base_Date"),
    BILLING_SIMULATION("/api01rv2/acsimulatev2", "orca/stub/16_acsimulatev2_response.sample.xml", true, false, null,
            "Patient_ID", "Perform_Date"),
    VISIT_LIST("/api01rv2/visitptlstv2", "orca/stub/18_visitptlstv2_response.sample.xml", true, false, null,
            "Request_Number", "Visit_Date"),
    PATIENT_ID_LIST("/api01rv2/patientlst1v2", "orca/stub/08_patientlst1v2_response.sample.xml", true, false, null,
            "Base_StartDate", "Base_EndDate"),
    PATIENT_BATCH("/api01rv2/patientlst2v2", "orca/stub/09_patientlst2v2_response.sample.xml", true, false, null,
            "Patient_ID_Information"),
    PATIENT_NAME_SEARCH("/api01rv2/patientlst3v2", "orca/stub/10_patientlst3v2_response.sample.xml", true, false, null,
            "WholeName/WholeName_inKana"),
    INSURANCE_COMBINATION("/api01rv2/patientlst6v2", "orca/stub/35_patientlst6v2_response.sample.xml", true, false, null,
            "Patient_ID"),
    FORMER_NAME_HISTORY("/api01rv2/patientlst8v2", "orca/stub/51_patientlst8v2_response.sample.xml", true, false, null,
            "Patient_ID"),
    APPOINTMENT_MUTATION("/orca14/appointmodv2", "orca/stub/02_appointmodv2_response.sample.xml", true, true, null,
            "Patient_ID", "Appointment_Date", "Appointment_Time"),
    ACCEPTANCE_MUTATION("/orca11/acceptmodv2", "orca/stub/04_acceptmodv2_response.sample.xml", true, false, null,
            "Request_Number", "Patient_ID"),
    SYSTEM_MANAGEMENT_LIST("/api01rv2/system01lstv2", "orca/stub/44_system01lstv2_response.sample.xml", true, true, null,
            "Request_Number"),
    MANAGE_USERS("/orca101/manageusersv2", "orca/stub/45_manageusersv2_response.sample.xml", true, false, null,
            "Request_Number"),
    INSURANCE_PROVIDER("/api01rv2/insprogetv2", "orca/stub/46_insprogetv2_response.sample.xml", true, false, null),
    PRESCRIPTION_REPORT("/api01rv2/prescriptionv2", "orca/stub/47_prescriptionv2_response.sample.json", true, false,
            "application/json"),
    PATIENT_GET("/api01rv2/patientgetv2", "GET", "orca/stub/52_patientgetv2_response.sample.xml", false, false, null),
    PATIENT_MOD("/orca12/patientmodv2", "orca/stub/53_patientmodv2_response.sample.xml", true, true, null),
    PATIENT_MEMO_LIST("/api01rv2/patientlst7v2", "orca/stub/54_patientlst7v2_response.sample.xml", true, false, null),
    PATIENT_MEMO_MOD("/orca06/patientmemomodv2", "orca/stub/55_patientmemomodv2_response.sample.xml", true, false, null),
    DISEASE_GET("/api01rv2/diseasegetv2", "orca/stub/56_diseasegetv2_response.sample.xml", true, true, null),
    DISEASE_MOD_V3("/orca22/diseasev3", "orca/stub/57_diseasev3_response.sample.xml", true, true, null),
    MEDICAL_GET("/api01rv2/medicalgetv2", "orca/stub/58_medicalgetv2_response.sample.xml", true, true, null),
    MEDICAL_MOD("/api21/medicalmodv2", "orca/stub/59_medicalmodv2_response.sample.xml", true, true, null);

    private final String path;
    private final String method;
    private final String stubResource;
    private final boolean requiresBody;
    private final boolean usesQueryFromMeta;
    private final String accept;
    private final String[] requiredFields;

    OrcaEndpoint(String path, String stubResource, boolean requiresBody, boolean usesQueryFromMeta, String accept,
            String... requiredFields) {
        this(path, "POST", stubResource, requiresBody, usesQueryFromMeta, accept, requiredFields);
    }

    OrcaEndpoint(String path, String method, String stubResource, boolean requiresBody, boolean usesQueryFromMeta,
            String accept, String... requiredFields) {
        this.path = path;
        this.method = method;
        this.stubResource = stubResource;
        this.requiresBody = requiresBody;
        this.usesQueryFromMeta = usesQueryFromMeta;
        this.accept = accept;
        this.requiredFields = requiredFields != null ? requiredFields : new String[0];
    }

    public String getPath() {
        return path;
    }

    public String getMethod() {
        return method;
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

    public String getAccept() {
        return accept;
    }

    public java.util.List<String> requiredFields() {
        return java.util.List.of(requiredFields);
    }
}
