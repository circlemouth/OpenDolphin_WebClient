package open.orca.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;
import java.time.Instant;
import open.dolphin.rest.AbstractResource;
import open.dolphin.rest.dto.orca.OrcaMasterErrorResponse;
import open.dolphin.rest.orca.AbstractOrcaRestResource;

/**
 * /api/orca/master 配下のaliasを提供する。
 * /orca との@Path衝突を避けるため、基底@Pathを /api/orca/master に限定する。
 */
@Path("/api/orca/master")
@Produces(MediaType.APPLICATION_JSON)
public class OrcaMasterApiAliasResource extends AbstractResource {

    @Inject
    OrcaMasterResource masterResource;

    @GET
    @Path("/generic-class")
    public Response getGenericClass(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getGenericClass(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/generic-price")
    public Response getGenericPrice(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getGenericPrice(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/youhou")
    public Response getYouhou(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getYouhou(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/material")
    public Response getMaterial(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getMaterial(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/kensa-sort")
    public Response getKensaSort(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getKensaSort(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/hokenja")
    public Response getHokenja(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getHokenja(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/address")
    public Response getAddress(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        return masterResource.getAddress(userName, password, ifNoneMatch, uriInfo, request);
    }

    @GET
    @Path("/etensu")
    public Response redirectEtensu(
            @HeaderParam("userName") String userName,
            @HeaderParam("password") String password,
            @HeaderParam("If-None-Match") String ifNoneMatch,
            @Context UriInfo uriInfo,
            @Context HttpServletRequest request
    ) {
        if (!OrcaMasterAuthSupport.isAuthorized(request, userName, password)) {
            return unauthorized(request);
        }
        URI target = buildRedirectUri(uriInfo, "/orca/master/etensu");
        return Response.status(Status.MOVED_PERMANENTLY).location(target).build();
    }

    private Response unauthorized(HttpServletRequest request) {
        OrcaMasterErrorResponse response = new OrcaMasterErrorResponse();
        response.setCode("ORCA_MASTER_UNAUTHORIZED");
        response.setMessage("Invalid Basic headers");
        response.setRunId(AbstractOrcaRestResource.resolveRunIdValue(request));
        response.setTimestamp(Instant.now().toString());
        String traceId = resolveTraceId(request);
        if (traceId != null && !traceId.isBlank()) {
            response.setCorrelationId(traceId);
        }
        return Response.status(Status.UNAUTHORIZED).entity(response).build();
    }

    private URI buildRedirectUri(UriInfo uriInfo, String targetPath) {
        String base = uriInfo.getBaseUri().toString();
        String normalizedBase = base.endsWith("/") ? base : base + "/";
        String normalizedTarget = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
        StringBuilder url = new StringBuilder(normalizedBase).append(normalizedTarget);
        String query = uriInfo.getRequestUri().getRawQuery();
        if (query != null && !query.isBlank()) {
            url.append('?').append(query);
        }
        return URI.create(url.toString());
    }
}

