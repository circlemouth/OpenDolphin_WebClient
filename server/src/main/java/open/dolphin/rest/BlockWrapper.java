package open.dolphin.rest;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

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
        if (remoteUser == null || remoteUser.isEmpty()) {
            return "-";
        }
        int separator = remoteUser.lastIndexOf(':');
        if (separator >= 0 && separator + 1 < remoteUser.length()) {
            return remoteUser.substring(separator + 1);
        }
        if (remoteUser.length() > 17) {
            return remoteUser.substring(17);
        }
        return remoteUser;
    }
    
    public String getRequestURIForLog() {
        // /openDolphin/resources/
        String ret = getRequestURI();
        if (ret == null || ret.length() <= 22) {
            return ret != null ? ret : "";
        }
        return ret.substring(22);
    }
}
