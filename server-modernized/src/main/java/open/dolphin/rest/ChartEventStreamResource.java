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
import open.dolphin.session.support.ChartEventSessionKeys;

/**
 * SSE endpoint for chart event notifications.
 */
@Path("/chart-events")
public class ChartEventStreamResource extends AbstractResource {

    @Inject
    private ChartEventSseSupport sseSupport;

    @Context
    private HttpServletRequest servletRequest;

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
        sseSupport.register(fid, clientUUID, sse, eventSink, lastEventId);
    }
}
