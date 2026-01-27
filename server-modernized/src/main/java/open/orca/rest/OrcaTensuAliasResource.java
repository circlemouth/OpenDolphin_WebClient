package open.orca.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
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
import open.dolphin.rest.dto.orca.MedicationModRequest;
import open.dolphin.rest.dto.orca.MedicationModResponse;
import open.dolphin.rest.dto.orca.OrcaMasterErrorResponse;
import open.dolphin.rest.orca.AbstractOrcaRestResource;
import open.dolphin.rest.orca.OrcaMedicalAdministrationResource;

/**
 * 旧 /orca/tensu/etensu から /orca/master/etensu へリダイレクトする。
 * /orca との@Path衝突を避けるため、基底@Pathを /orca/tensu に限定する。
 */
@Path("/orca/tensu")
@Produces(MediaType.APPLICATION_JSON)
public class OrcaTensuAliasResource extends AbstractResource {

    @Inject
    OrcaMedicalAdministrationResource medicalAdministrationResource;

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

    /**
     * /orca/tensu が /orca ルートよりも優先マッチされるため、
     * /orca/tensu/sync をここで受けて本来の stub 実装へ委譲する。
     */
    @POST
    @Path("/sync")
    @Consumes(MediaType.APPLICATION_JSON)
    public MedicationModResponse syncMedication(
            MedicationModRequest payload,
            @Context HttpServletRequest request
    ) {
        if (medicalAdministrationResource == null) {
            MedicationModResponse response = new MedicationModResponse();
            response.setApiResult("79");
            response.setApiResultMessage("Spec-based implementation / Trial未検証");
            response.setRunId(AbstractOrcaRestResource.resolveRunIdValue(request));
            response.setMessageDetail("点数マスタ同期 API は Trial 未開放のため stub 応答を返します。");
            return response;
        }
        return medicalAdministrationResource.postMedicationSync(request, payload);
    }
}
