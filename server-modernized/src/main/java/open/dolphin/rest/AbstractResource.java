 package open.dolphin.rest;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.servlet.http.HttpServletRequest;
import open.dolphin.infomodel.IInfoModel;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

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
}
