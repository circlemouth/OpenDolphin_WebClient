 package open.dolphin.rest;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;

/**
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
public class AbstractResource {

    protected static final String CAMMA = ",";
    protected static final boolean DEBUG = false;
    private static final String TRACE_ID_HEADER = "X-Trace-Id";

    protected Date parseDate(String source) {
        try {
            return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(source);
        } catch (Exception e) {
            Logger.getLogger(getClass().getName()).log(Level.WARNING, "Failed to parse date: " + source, e);
            return null;
        }
    }

    protected void debug(String msg) {
        Logger.getLogger("open.dolphin").fine(msg);
    }

    public static String getRemoteFacility(String remoteUser) {
        if (remoteUser == null) {
            return null;
        }
        int index = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (index < 0) {
            return remoteUser;
        }
        return remoteUser.substring(0, index);
    }

    public static String getFidPid(String remoteUser, String pid) {
        StringBuilder sb = new StringBuilder();
        sb.append(getRemoteFacility(remoteUser));
        sb.append(IInfoModel.COMPOSITE_KEY_MAKER);
        sb.append(pid);
        return sb.toString();
    }

    // 2013/06/24    
    public static ObjectMapper getSerializeMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        mapper.configure(SerializationFeature.WRITE_NULL_MAP_VALUES, false);
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        return mapper;
    }

    protected String resolveTraceId(HttpServletRequest request) {
        return resolveTraceIdValue(request);
    }

    public static String resolveTraceIdValue(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object attribute = request.getAttribute(LogFilter.TRACE_ID_ATTRIBUTE);
        if (attribute instanceof String trace && !trace.isBlank()) {
            return trace;
        }
        String fromHeader = request.getHeader(TRACE_ID_HEADER);
        if (fromHeader != null && !fromHeader.isBlank()) {
            return fromHeader.trim();
        }
        return null;
    }

    public static WebApplicationException restError(HttpServletRequest request, Response.Status status,
            String errorCode, String message) {
        return restError(request, status, errorCode, message, null, null);
    }

    public static WebApplicationException restError(HttpServletRequest request, Response.Status status,
            String errorCode, String message, Map<String, ?> details, Throwable cause) {
        Objects.requireNonNull(status, "status");
        Objects.requireNonNull(errorCode, "errorCode");
        Map<String, Object> body = buildErrorBody(request, status.getStatusCode(), errorCode, message, details);
        Response response = Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
        return cause == null ? new WebApplicationException(message, response)
                : new WebApplicationException(message, cause, response);
    }

    public static void writeRestError(HttpServletRequest request, HttpServletResponse response, int status,
            String errorCode, String message, Map<String, ?> details) throws IOException {
        if (response == null) {
            return;
        }
        if (!response.isCommitted()) {
            response.resetBuffer();
        }
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON);
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> body = buildErrorBody(request, status, errorCode, message, details);
        getSerializeMapper().writeValue(response.getOutputStream(), body);
    }

    protected void populateDiagnosisAuditMetadata(HttpServletRequest request,
            DiagnosisSendWrapper wrapper,
            String resourcePath) {
        if (wrapper == null) {
            return;
        }
        if (request != null) {
            wrapper.setRemoteUser(request.getRemoteUser());
            String traceId = resolveTraceId(request);
            if (traceId != null && !traceId.isBlank()) {
                wrapper.setTraceId(traceId);
            }
            String requestIdHeader = request.getHeader("X-Request-Id");
            if (requestIdHeader != null && !requestIdHeader.isBlank()) {
                wrapper.setRequestId(requestIdHeader.trim());
            }
            if (resourcePath == null || resourcePath.isBlank()) {
                wrapper.setAuditResource(request.getRequestURI());
            }
        }
        if (resourcePath != null && !resourcePath.isBlank()) {
            wrapper.setAuditResource(resourcePath);
        }
        if (wrapper.getTraceId() == null || wrapper.getTraceId().isBlank()) {
            String fallback = resolveTraceId(request);
            if (fallback != null && !fallback.isBlank()) {
                wrapper.setTraceId(fallback);
            }
        }
        if (wrapper.getRequestId() == null || wrapper.getRequestId().isBlank()) {
            String fallback = wrapper.getTraceId();
            if (fallback == null || fallback.isBlank()) {
                fallback = UUID.randomUUID().toString();
            }
            wrapper.setRequestId(fallback);
        }
    }

    private static Map<String, Object> buildErrorBody(HttpServletRequest request, int status, String errorCode,
            String message, Map<String, ?> details) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", errorCode);
        body.put("code", errorCode);
        if (message != null && !message.isBlank()) {
            body.put("message", message);
        }
        body.put("status", status);
        String traceId = resolveTraceIdValue(request);
        if (traceId != null && !traceId.isBlank()) {
            body.put("traceId", traceId);
        }
        if (request != null) {
            String path = request.getRequestURI();
            if (path != null && !path.isBlank()) {
                body.put("path", path);
            }
        }
        if (details != null) {
            details.forEach((key, value) -> {
                if (key != null && value != null) {
                    body.put(key, value);
                }
            });
        }
        if (!body.containsKey("validationError") && (status == 400 || status == 422)) {
            body.put("validationError", Boolean.TRUE);
        }
        return body;
    }
}
