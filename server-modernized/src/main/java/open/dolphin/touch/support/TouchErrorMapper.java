package open.dolphin.touch.support;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * {@link TouchErrorResponse} を生成するユーティリティ。
 */
public final class TouchErrorMapper {

    private TouchErrorMapper() {
    }

    public static WebApplicationException toException(Response.Status status, String type, String message, String traceId) {
        TouchErrorResponse body = new TouchErrorResponse(type, message, traceId);
        Response response = Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
        return new WebApplicationException(message, response);
    }
}

