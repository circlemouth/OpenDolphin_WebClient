package open.dolphin.touch.user;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.touch.support.TouchErrorMapper;
import open.dolphin.touch.support.TouchRequestContext;
import open.dolphin.touch.support.TouchRequestContextExtractor;

/**
 * Touch ユーザー情報エンドポイント。
 */
@Path("/touch")
@Produces(MediaType.APPLICATION_JSON)
public class TouchUserResource {

    @Inject
    TouchUserService userService;

    @GET
    @Path("/user/{param}")
    public TouchUserDtos.TouchUserResponse getUser(@Context HttpServletRequest request,
                                                   @PathParam("param") String param) {
        TouchRequestContext context = TouchRequestContextExtractor.from(request);
        String[] params = param.split(",");
        if (params.length != 3) {
            throw TouchErrorMapper.toException(jakarta.ws.rs.core.Response.Status.BAD_REQUEST,
                    "invalid_parameters", "パラメータ形式が不正です。", context.traceId());
        }
        String pathUserId = params[0];
        String facilityId = params[1];
        String password = params[2];
        String headerUserName = request.getHeader("userName");
        String headerPassword = request.getHeader("password");
        return userService.getUserSummary(context, pathUserId, facilityId, password, headerUserName, headerPassword);
    }
}

