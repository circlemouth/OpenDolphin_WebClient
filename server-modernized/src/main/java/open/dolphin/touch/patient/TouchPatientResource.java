package open.dolphin.touch.patient;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.touch.converter.IPatientList;
import open.dolphin.touch.converter.IPatientModel;
import open.dolphin.touch.converter.IPatientVisitModel;
import open.dolphin.touch.patient.dto.TouchPatientDtos.PatientPackageResponse;
import open.dolphin.touch.support.TouchErrorMapper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.support.TouchRequestContextExtractor;

/**
 * Touch 患者系エンドポイント。
 */
@Path("/touch")
@Produces(MediaType.APPLICATION_JSON)
public class TouchPatientResource {

    @Inject
    TouchPatientService patientService;

    @GET
    @Path("/patient/{pk}")
    public IPatientModel getPatientByPk(@Context HttpServletRequest request,
                                        @PathParam("pk") String pk) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        long patientPk = parseLong(pk, context);
        return patientService.getPatientByPk(context, patientPk);
    }

    @GET
    @Path("/patientPackage/{pk}")
    public PatientPackageResponse getPatientPackage(@Context HttpServletRequest request,
                                                    @PathParam("pk") String pk) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        long patientPk = parseLong(pk, context);
        return patientService.getPatientPackage(context, patientPk);
    }

    @GET
    @Path("/patients/name/{param}")
    public IPatientList getPatientsByName(@Context HttpServletRequest request,
                                          @PathParam("param") String param) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        String[] params = param.split(",");
        if (params.length != 4) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.BAD_REQUEST,
                    "invalid_parameters", "パラメータ形式が不正です。", context.traceId());
        }
        String facilityId = params[0];
        String keyword = params[1];
        int firstResult = parseInt(params[2], context);
        int maxResult = parseInt(params[3], context);
        return patientService.searchPatientsByName(context, facilityId, keyword, firstResult, maxResult);
    }

    @GET
    @Path("/patient/visit")
    public java.util.List<IPatientVisitModel> getPatientVisit(@Context HttpServletRequest request,
                                                              @QueryParam("facility") String facilityId,
                                                              @DefaultValue("0") @QueryParam("offset") String offset,
                                                              @DefaultValue("50") @QueryParam("limit") String limit,
                                                              @DefaultValue("pvtDate") @QueryParam("sort") String sort,
                                                              @DefaultValue("desc") @QueryParam("order") String order) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        int firstResult = parseInt(offset, context);
        int maxResult = parseInt(limit, context);
        return patientService.getPatientVisits(context, facilityId, firstResult, maxResult, sort, order);
    }

    private long parseLong(String value, TouchRequestContext context) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.BAD_REQUEST,
                    "invalid_id", "数値として解釈できません。", context.traceId());
        }
    }

    private int parseInt(String value, TouchRequestContext context) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.BAD_REQUEST,
                    "invalid_number", "数値として解釈できません。", context.traceId());
        }
    }
}

