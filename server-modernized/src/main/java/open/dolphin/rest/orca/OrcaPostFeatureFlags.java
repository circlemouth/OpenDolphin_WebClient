package open.dolphin.rest.orca;

/**
 * Feature flags for ORCA POST endpoints.
 */
final class OrcaPostFeatureFlags {

    private static final String PROP_GLOBAL_MODE = "orca.post.mode";
    private static final String ENV_GLOBAL_MODE = "ORCA_POST_MODE";

    private static final String PROP_SUBJECTIVES_MODE = "orca.post.subjectives.mode";
    private static final String ENV_SUBJECTIVES_MODE = "ORCA_POST_SUBJECTIVES_MODE";
    private static final String PROP_SUBJECTIVES_USE_STUB = "orca.post.subjectives.useStub";
    private static final String ENV_SUBJECTIVES_USE_STUB = "ORCA_POST_SUBJECTIVES_USE_STUB";
    private static final String PROP_SUBJECTIVES_REAL = "orca.post.subjectives.real";
    private static final String ENV_SUBJECTIVES_REAL = "ORCA_POST_SUBJECTIVES_REAL";

    private static final String PROP_MEDICAL_RECORDS_MODE = "orca.post.medical.records.mode";
    private static final String ENV_MEDICAL_RECORDS_MODE = "ORCA_POST_MEDICAL_RECORDS_MODE";
    private static final String PROP_MEDICAL_RECORDS_USE_STUB = "orca.post.medical.records.useStub";
    private static final String ENV_MEDICAL_RECORDS_USE_STUB = "ORCA_POST_MEDICAL_RECORDS_USE_STUB";
    private static final String PROP_MEDICAL_RECORDS_REAL = "orca.post.medical.records.real";
    private static final String ENV_MEDICAL_RECORDS_REAL = "ORCA_POST_MEDICAL_RECORDS_REAL";

    private static final boolean DEFAULT_SUBJECTIVES_REAL = true;
    private static final boolean DEFAULT_MEDICAL_RECORDS_REAL = true;

    private OrcaPostFeatureFlags() {
    }

    static boolean useRealSubjectives() {
        return resolveEndpointMode(
                PROP_SUBJECTIVES_MODE,
                ENV_SUBJECTIVES_MODE,
                PROP_SUBJECTIVES_USE_STUB,
                ENV_SUBJECTIVES_USE_STUB,
                PROP_SUBJECTIVES_REAL,
                ENV_SUBJECTIVES_REAL,
                DEFAULT_SUBJECTIVES_REAL
        );
    }

    static boolean useRealMedicalRecords() {
        return resolveEndpointMode(
                PROP_MEDICAL_RECORDS_MODE,
                ENV_MEDICAL_RECORDS_MODE,
                PROP_MEDICAL_RECORDS_USE_STUB,
                ENV_MEDICAL_RECORDS_USE_STUB,
                PROP_MEDICAL_RECORDS_REAL,
                ENV_MEDICAL_RECORDS_REAL,
                DEFAULT_MEDICAL_RECORDS_REAL
        );
    }

    private static boolean resolveEndpointMode(String modePropertyKey, String modeEnvKey,
            String stubPropertyKey, String stubEnvKey,
            String realPropertyKey, String realEnvKey,
            boolean defaultValue) {
        Mode endpointMode = resolveMode(modePropertyKey, modeEnvKey);
        if (endpointMode != Mode.UNSET) {
            return endpointMode == Mode.REAL;
        }
        Boolean useStub = resolveBoolean(stubPropertyKey, stubEnvKey);
        if (useStub != null) {
            return !useStub;
        }
        Boolean useReal = resolveBoolean(realPropertyKey, realEnvKey);
        if (useReal != null) {
            return useReal;
        }
        Mode globalMode = resolveMode(PROP_GLOBAL_MODE, ENV_GLOBAL_MODE);
        if (globalMode != Mode.UNSET) {
            return globalMode == Mode.REAL;
        }
        return defaultValue;
    }

    private static Mode resolveMode(String propertyKey, String envKey) {
        String value = firstNonBlank(System.getProperty(propertyKey), System.getenv(envKey));
        if (value == null || value.isBlank()) {
            return Mode.UNSET;
        }
        String normalized = value.trim().toLowerCase();
        if ("real".equals(normalized)) {
            return Mode.REAL;
        }
        if ("stub".equals(normalized)) {
            return Mode.STUB;
        }
        Boolean boolValue = parseBoolean(normalized);
        if (boolValue != null) {
            return boolValue ? Mode.REAL : Mode.STUB;
        }
        return Mode.UNSET;
    }

    private static Boolean resolveBoolean(String propertyKey, String envKey) {
        String value = firstNonBlank(System.getProperty(propertyKey), System.getenv(envKey));
        if (value == null || value.isBlank()) {
            return null;
        }
        return parseBoolean(value.trim().toLowerCase());
    }

    private static Boolean parseBoolean(String normalized) {
        if (normalized == null) {
            return null;
        }
        switch (normalized) {
            case "1":
            case "true":
            case "yes":
            case "y":
            case "on":
                return Boolean.TRUE;
            case "0":
            case "false":
            case "no":
            case "n":
            case "off":
                return Boolean.FALSE;
            default:
                return null;
        }
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

    private enum Mode {
        REAL,
        STUB,
        UNSET
    }
}
