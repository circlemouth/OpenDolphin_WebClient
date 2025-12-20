package open.dolphin.rest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.orca.OrcaGatewayException;

@Provider
public class RestExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOGGER = Logger.getLogger(RestExceptionMapper.class.getName());

    @Context
    private HttpServletRequest request;

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof WebApplicationException webException) {
            Response response = webException.getResponse();
            if (response != null && response.hasEntity() && isJson(response.getMediaType())) {
                return response;
            }
            int status = response != null ? response.getStatus() : Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();
            logIfNeeded(exception, status);
            return buildErrorResponse(status, webException.getMessage(), exception, response);
        }

        int status = resolveStatus(exception);
        logIfNeeded(exception, status);
        return buildErrorResponse(status, exception.getMessage(), exception, null);
    }

    private Response buildErrorResponse(int status, String message, Throwable exception, Response baseResponse) {
        Response.Status statusEnum = resolveStatusEnum(status);
        String errorCode = resolveErrorCode(status, exception);
        String resolvedMessage = resolveMessage(status, message);
        Map<String, Object> details = buildDetails(status, exception);
        Response errorResponse = AbstractResource.restError(request, statusEnum, errorCode, resolvedMessage, details, exception).getResponse();
        if (baseResponse == null || baseResponse.getHeaders().isEmpty()) {
            return errorResponse;
        }
        return copyHeaders(baseResponse, errorResponse);
    }

    private Response copyHeaders(Response source, Response target) {
        Response.ResponseBuilder builder = Response.fromResponse(target);
        for (Map.Entry<String, java.util.List<Object>> entry : source.getHeaders().entrySet()) {
            String name = entry.getKey();
            if (name == null) {
                continue;
            }
            if ("Content-Type".equalsIgnoreCase(name)) {
                continue;
            }
            for (Object value : entry.getValue()) {
                builder.header(name, value);
            }
        }
        return builder.build();
    }

    private int resolveStatus(Throwable exception) {
        if (exception instanceof OrcaGatewayException) {
            return Response.Status.BAD_GATEWAY.getStatusCode();
        }
        if (exception instanceof SocketTimeoutException || exception instanceof TimeoutException) {
            return Response.Status.GATEWAY_TIMEOUT.getStatusCode();
        }
        if (exception instanceof ConnectException || exception instanceof IOException) {
            return Response.Status.SERVICE_UNAVAILABLE.getStatusCode();
        }
        if (exception instanceof IllegalArgumentException) {
            return Response.Status.BAD_REQUEST.getStatusCode();
        }
        return Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();
    }

    private Response.Status resolveStatusEnum(int status) {
        Response.Status resolved = Response.Status.fromStatusCode(status);
        return resolved != null ? resolved : Response.Status.INTERNAL_SERVER_ERROR;
    }

    private String resolveErrorCode(int status, Throwable exception) {
        if (exception instanceof OrcaGatewayException) {
            return "orca_gateway_error";
        }
        return switch (status) {
            case 400, 422 -> "invalid_request";
            case 401 -> "unauthorized";
            case 403 -> "forbidden";
            case 404 -> "not_found";
            case 405 -> "method_not_allowed";
            case 408 -> "request_timeout";
            case 409 -> "conflict";
            case 410 -> "gone";
            case 415 -> "unsupported_media_type";
            case 429 -> "too_many_requests";
            case 500 -> "internal_server_error";
            case 502 -> "bad_gateway";
            case 503 -> "service_unavailable";
            case 504 -> "gateway_timeout";
            default -> "http_" + status;
        };
    }

    private String resolveMessage(int status, String message) {
        if (message != null && !message.isBlank()) {
            return message;
        }
        return switch (status) {
            case 400, 422 -> "Invalid request";
            case 401 -> "Unauthorized";
            case 403 -> "Forbidden";
            case 404 -> "Not found";
            case 405 -> "Method not allowed";
            case 408 -> "Request timeout";
            case 409 -> "Conflict";
            case 410 -> "Gone";
            case 415 -> "Unsupported media type";
            case 429 -> "Too many requests";
            case 502 -> "Upstream service failure";
            case 503 -> "Service unavailable";
            case 504 -> "Gateway timeout";
            default -> "Internal server error";
        };
    }

    private Map<String, Object> buildDetails(int status, Throwable exception) {
        Map<String, Object> details = new HashMap<>();
        if (isRetryable(status)) {
            details.put("retryable", Boolean.TRUE);
        }
        if (exception != null) {
            details.put("exceptionClass", exception.getClass().getName());
        }
        return details.isEmpty() ? null : details;
    }

    private boolean isRetryable(int status) {
        return status == 408
                || status == 429
                || status == 500
                || status == 502
                || status == 503
                || status == 504;
    }

    private boolean isJson(MediaType mediaType) {
        if (mediaType == null) {
            return false;
        }
        String subtype = mediaType.getSubtype();
        if (subtype == null) {
            return false;
        }
        String normalized = subtype.toLowerCase(Locale.ROOT);
        return normalized.equals("json") || normalized.endsWith("+json");
    }

    private void logIfNeeded(Throwable exception, int status) {
        if (exception == null) {
            return;
        }
        if (status >= 500) {
            LOGGER.log(Level.SEVERE, "REST exception mapped to HTTP " + status, exception);
            return;
        }
        if (LOGGER.isLoggable(Level.FINE)) {
            LOGGER.log(Level.FINE, "REST exception mapped to HTTP " + status, exception);
        }
    }
}
