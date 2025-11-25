package open.dolphin.rest;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.Consumes;
import javax.ws.rs.InternalServerErrorException;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.util.logging.Logger;
import open.dolphin.reporting.ReportingEngine;
import open.dolphin.reporting.ReportingResult;
import open.dolphin.reporting.api.ReportingPayload;

/**
 * Legacy WildFly 10 compatible reporting endpoint.
 */
@Path("/reporting")
public class ReportingResource extends AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(ReportingResource.class.getName());
    private final ReportingEngine reportingEngine = new ReportingEngine();

    @POST
    @Path("/karte")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces("application/pdf")
    public Response renderKarte(ReportingPayload payload) {
        if (payload == null) {
            throw new BadRequestException("Payload must not be null");
        }
        try {
            ReportingResult result = reportingEngine.render(payload);
            StreamingOutput output = stream -> stream.write(result.getData());
            LOGGER.info(String.format("Rendered template=%s locale=%s size=%d", result.getTemplateName(),
                    result.getLocale(), result.getData().length));
            return Response.ok(output)
                    .type("application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"" + result.getFileName() + "\"")
                    .header("X-Report-Locale", result.getLocale().toLanguageTag())
                    .header("X-Report-Template", result.getTemplateName())
                    .build();
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage(), ex);
        } catch (IOException ex) {
            throw new InternalServerErrorException("Failed to render PDF", ex);
        }
    }
}
