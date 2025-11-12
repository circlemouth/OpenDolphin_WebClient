package open.dolphin.session.framework;

/**
 * Common attribute keys used to enrich {@link SessionTraceContext} instances.
 */
public final class SessionTraceAttributes {

    private SessionTraceAttributes() {
    }

    public static final String ACTOR_ID = "actorId";
    public static final String ACTOR_ID_MDC_KEY = "remoteUser";
    public static final String REQUEST_ID = "requestId";
    public static final String PATIENT_ID = "patientId";
    public static final String FACILITY_ID = "facilityId";
    public static final String COMPONENT = "component";
}
