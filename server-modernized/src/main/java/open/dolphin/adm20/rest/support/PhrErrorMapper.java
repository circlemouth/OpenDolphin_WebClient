package open.dolphin.adm20.rest.support;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import open.dolphin.touch.TouchErrorResponse;

/**
 * PHR エンドポイント向けの統一エラーレスポンス生成ヘルパー。
 */
public final class PhrErrorMapper {

    private PhrErrorMapper() {
    }

    public static WebApplicationException toException(Response.Status status,
                                                      String type,
                                                      String message,
                                                      String traceId,
                                                      Throwable cause) {
        TouchErrorResponse body = new TouchErrorResponse(type, message, traceId, status.getStatusCode());
        Response response = Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
        return new WebApplicationException(message, cause, response);
    }
}
