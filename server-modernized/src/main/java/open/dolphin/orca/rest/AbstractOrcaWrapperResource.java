package open.dolphin.orca.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.rest.dto.orca.OrcaApiResponse;
import open.dolphin.rest.orca.AbstractOrcaRestResource;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceManager;

/**
 * Shared audit helpers for ORCA wrapper endpoints.
 */
public abstract class AbstractOrcaWrapperResource extends AbstractOrcaRestResource {

    protected static final String ACTION_APPOINTMENT_OUTPATIENT = "ORCA_APPOINTMENT_OUTPATIENT";
    protected static final String ACTION_PATIENT_SYNC = "ORCA_PATIENT_SYNC";
    private static final String DATA_SOURCE_SERVER = "server";
    private static final String TRACE_HEADER = "X-Request-Id";
    private static final String FACILITY_HEADER = "X-Facility-Id";
    private static final String LEGACY_FACILITY_HEADER = "facilityId";

    @Inject
    protected SessionTraceManager sessionTraceManager;

    protected Map<String, Object> newAuditDetails(HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("runId", OrcaWrapperService.RUN_ID);
        details.put("dataSource", DATA_SOURCE_SERVER);
        details.put("dataSourceTransition", DATA_SOURCE_SERVER);
        details.put("cacheHit", false);
        details.put("missingMaster", false);
        details.put("fallbackUsed", false);
        details.put("fetchedAt", Instant.now().toString());

        String facilityId = resolveFacilityId(request);
        if (facilityId != null && !facilityId.isBlank()) {
            details.put("facilityId", facilityId);
        }

        String traceId = resolveTraceId(request);
        String requestId = request != null ? request.getHeader(TRACE_HEADER) : null;
        if (requestId != null && !requestId.isBlank()) {
            requestId = requestId.trim();
            details.put("requestId", requestId);
        }
        if ((traceId == null || traceId.isBlank()) && requestId != null && !requestId.isBlank()) {
            traceId = requestId;
        }
        if (traceId != null && !traceId.isBlank()) {
            details.put("traceId", traceId);
            if (requestId == null || requestId.isBlank()) {
                details.put("requestId", traceId);
            }
        }
        syncTraceContext(request, facilityId, traceId, requestId);
        return details;
    }

    protected void applyResponseAuditDetails(OrcaApiResponse response, Map<String, Object> details) {
        if (response == null || details == null) {
            return;
        }
        if (response.getRunId() != null && !response.getRunId().isBlank()) {
            details.put("runId", response.getRunId());
        }
        if (response.getApiResult() != null && !response.getApiResult().isBlank()) {
            details.put("apiResult", response.getApiResult());
        }
        if (response.getApiResultMessage() != null && !response.getApiResultMessage().isBlank()) {
            details.put("apiResultMessage", response.getApiResultMessage());
        }
        if (response.getBlockerTag() != null && !response.getBlockerTag().isBlank()) {
            details.put("blockerTag", response.getBlockerTag());
        }
    }

    protected void markFailureDetails(Map<String, Object> details, int httpStatus, String errorCode, String errorMessage) {
        if (details == null) {
            return;
        }
        details.put("status", "failed");
        details.put("httpStatus", httpStatus);
        if (errorCode != null && !errorCode.isBlank()) {
            details.put("errorCode", errorCode);
        }
        if (errorMessage != null && !errorMessage.isBlank()) {
            details.put("errorMessage", errorMessage);
        }
    }

    protected void markSuccessDetails(Map<String, Object> details) {
        if (details == null) {
            return;
        }
        details.put("status", "success");
    }

    private String resolveFacilityId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteUser = request.getRemoteUser();
        String facility = null;
        if (remoteUser != null && remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER) >= 0) {
            facility = getRemoteFacility(remoteUser);
        }
        if (facility == null || facility.isBlank()) {
            facility = resolveFacilityHeader(request);
        }
        return facility;
    }

    private String resolveFacilityHeader(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String header = request.getHeader(FACILITY_HEADER);
        if (header != null && !header.trim().isEmpty()) {
            return header.trim();
        }
        String legacy = request.getHeader(LEGACY_FACILITY_HEADER);
        if (legacy != null && !legacy.trim().isEmpty()) {
            return legacy.trim();
        }
        return null;
    }

    private void syncTraceContext(HttpServletRequest request, String facilityId, String traceId, String requestId) {
        if (sessionTraceManager == null || sessionTraceManager.current() == null) {
            return;
        }
        if (request != null) {
            String remoteUser = request.getRemoteUser();
            if (remoteUser != null && !remoteUser.isBlank()) {
                String existingActor = sessionTraceManager.getAttribute(SessionTraceAttributes.ACTOR_ID);
                if (existingActor == null || existingActor.isBlank()) {
                    sessionTraceManager.putAttribute(SessionTraceAttributes.ACTOR_ID, remoteUser);
                }
            }
        }
        if (facilityId != null && !facilityId.isBlank()) {
            String existingFacility = sessionTraceManager.getAttribute(SessionTraceAttributes.FACILITY_ID);
            if (existingFacility == null || existingFacility.isBlank()) {
                sessionTraceManager.putAttribute(SessionTraceAttributes.FACILITY_ID, facilityId);
            }
        }
        String candidateRequestId = (requestId != null && !requestId.isBlank()) ? requestId : traceId;
        if (candidateRequestId != null && !candidateRequestId.isBlank()) {
            String existingRequest = sessionTraceManager.getAttribute(SessionTraceAttributes.REQUEST_ID);
            if (existingRequest == null || existingRequest.isBlank()) {
                sessionTraceManager.putAttribute(SessionTraceAttributes.REQUEST_ID, candidateRequestId);
            }
        }
    }
}
