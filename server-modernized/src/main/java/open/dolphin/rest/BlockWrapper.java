package open.dolphin.rest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

/**
 * BlockWrapper
 *
 * @author Kazushi Minagawa, Digital Globe, Inc
 */
public final class BlockWrapper extends HttpServletRequestWrapper {
    
    private String remoteUser;


    public BlockWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getRemoteUser() {
        return remoteUser;
    }
    
    public void setRemoteUser(String remoteUser) {
        this.remoteUser = remoteUser;
    }

    public String getShortUser() {
        if (remoteUser == null || remoteUser.isBlank()) {
            return "-";
        }
        int separator = remoteUser.lastIndexOf(':');
        if (separator >= 0 && separator + 1 < remoteUser.length()) {
            return remoteUser.substring(separator + 1);
        }
        return remoteUser;
    }

    public String getRequestURIForLog() {
        // /openDolphin/resources/
        String ret = getRequestURI();
        return ret.substring(22);
    }
}
