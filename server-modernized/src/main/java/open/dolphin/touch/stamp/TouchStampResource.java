package open.dolphin.touch.stamp;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.converter.StampModelConverter;
import open.dolphin.converter.StampTreeHolderConverter;
import open.dolphin.touch.support.TouchErrorMapper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.support.TouchRequestContextExtractor;

/**
 * Touch スタンプ系エンドポイント。
 */
@Path("/touch")
@Produces(MediaType.APPLICATION_JSON)
public class TouchStampResource {

    @Inject
    TouchStampService stampService;

    @GET
    @Path("/stamp/{stampId}")
    public StampModelConverter getStamp(@Context HttpServletRequest request,
                                        @PathParam("stampId") String stampId) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        return stampService.getStamp(context, stampId);
    }

    @GET
    @Path("/stampTree/{userPk}")
    public StampTreeHolderConverter getStampTree(@Context HttpServletRequest request,
                                                 @PathParam("userPk") String userPk) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        long pk = parseLong(userPk, context);
        return stampService.getStampTree(context, pk);
    }

    private long parseLong(String value, TouchRequestContext context) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.BAD_REQUEST,
                    "invalid_user_pk", "ユーザー PK を数値として解釈できません。", context.traceId());
        }
    }
}

