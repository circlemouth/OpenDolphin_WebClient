 package open.dolphin.rest;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import open.dolphin.infomodel.IInfoModel;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.codehaus.jackson.map.annotate.JsonSerialize;

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
            e.printStackTrace(System.err);
        }
        return null;
    }

    protected void debug(String msg) {
        Logger.getLogger("open.dolphin").fine(msg);
    }

    protected static String getRemoteFacility(String remoteUser) {
        if (remoteUser == null) {
            return null;
        }
        int index = remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (index < 0) {
            return remoteUser;
        }
        return remoteUser.substring(0, index);
    }

    protected static String getFidPid(String remoteUser, String pid) {
        StringBuilder sb = new StringBuilder();
        sb.append(getRemoteFacility(remoteUser));
        sb.append(IInfoModel.COMPOSITE_KEY_MAKER);
        sb.append(pid);
        return sb.toString();
    }

    // 2013/06/24    
    protected static ObjectMapper getSerializeMapper() {
        ObjectMapper mapper = new ObjectMapper();
        //mapper.getSerializationConfig().setSerializationInclusion(JsonSerialize.Inclusion.NON_NULL);
        mapper.configure(SerializationConfig.Feature.WRITE_NULL_MAP_VALUES, false);
        mapper.configure(SerializationConfig.Feature.FAIL_ON_EMPTY_BEANS, false);
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
        if (attribute instanceof String) {
            String value = (String) attribute;
            if (!value.isEmpty()) {
                return value;
            }
        }
        String fromHeader = request.getHeader(TRACE_ID_HEADER);
        if (fromHeader != null && !fromHeader.isEmpty()) {
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
                .type(MediaType.APPLICATION_JSON)
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

    private static Map<String, Object> buildErrorBody(HttpServletRequest request, int status, String errorCode,
            String message, Map<String, ?> details) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", errorCode);
        if (message != null && !message.isEmpty()) {
            body.put("message", message);
        }
        body.put("status", status);
        String traceId = resolveTraceIdValue(request);
        if (traceId != null && !traceId.isEmpty()) {
            body.put("traceId", traceId);
        }
        if (request != null) {
            String path = request.getRequestURI();
            if (path != null && !path.isEmpty()) {
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
        return body;
    }
}
