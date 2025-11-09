package open.dolphin.rest;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.InternalServerErrorException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.util.logging.Logger;
import open.dolphin.reporting.ReportingEngine;
import open.dolphin.reporting.ReportingResult;
import open.dolphin.reporting.api.ReportingPayload;

/**
 * REST endpoint that renders reporting templates as PDF.
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
            LOGGER.info(() -> String.format("Rendered template=%s locale=%s size=%d", result.getTemplateName(),
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
