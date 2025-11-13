package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import open.dolphin.session.framework.SessionOperation;
import open.dolphin.session.framework.SessionTraceAttributes;
import open.dolphin.session.framework.SessionTraceManager;
import open.dolphin.session.support.ChartEventSessionKeys;

/**
 * SSE endpoint for chart event notifications.
 */
@Path("/chart-events")
@SessionOperation
public class ChartEventStreamResource extends AbstractResource {

    @Inject
    private ChartEventSseSupport sseSupport;

    @Context
    private HttpServletRequest servletRequest;

    @Inject
    private SessionTraceManager sessionTraceManager;

    @GET
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public void subscribe(@Context SseEventSink eventSink,
                          @Context Sse sse,
                          @HeaderParam(ChartEventSessionKeys.CLIENT_UUID) String clientUUID,
                          @HeaderParam("Last-Event-ID") String lastEventId) {

        if (eventSink == null || eventSink.isClosed()) {
            return;
        }

        if (clientUUID == null || clientUUID.isBlank()) {
            eventSink.close();
            throw new BadRequestException("Missing clientUUID header");
        }

        String remoteUser = servletRequest.getRemoteUser();
        if (remoteUser == null || remoteUser.isBlank()) {
            eventSink.close();
            throw new BadRequestException("Missing authenticated user");
        }

        String fid = getRemoteFacility(remoteUser);
        ensureTraceAttributes(remoteUser, fid);
        sseSupport.register(fid, clientUUID, sse, eventSink, lastEventId);
    }

    private void ensureTraceAttributes(String remoteUser, String facilityId) {
        if (sessionTraceManager == null) {
            return;
        }
        if (remoteUser != null && !remoteUser.isBlank()) {
            String existingActor = sessionTraceManager.getAttribute(SessionTraceAttributes.ACTOR_ID);
            if (existingActor == null || existingActor.isBlank()) {
                sessionTraceManager.putAttribute(SessionTraceAttributes.ACTOR_ID, remoteUser);
            }
        }
        if (facilityId != null && !facilityId.isBlank()) {
            String existingFacility = sessionTraceManager.getAttribute(SessionTraceAttributes.FACILITY_ID);
            if (existingFacility == null || existingFacility.isBlank()) {
                sessionTraceManager.putAttribute(SessionTraceAttributes.FACILITY_ID, facilityId);
            }
        }
        String traceId = resolveTraceId(servletRequest);
        if (traceId != null && !traceId.isBlank()) {
            String existingRequest = sessionTraceManager.getAttribute(SessionTraceAttributes.REQUEST_ID);
            if (existingRequest == null || existingRequest.isBlank()) {
                sessionTraceManager.putAttribute(SessionTraceAttributes.REQUEST_ID, traceId);
            }
        }
    }
}
