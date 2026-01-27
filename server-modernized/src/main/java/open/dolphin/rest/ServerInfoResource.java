/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package open.dolphin.rest;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.logging.Logger;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.converter.PatientListConverter;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.PatientModel;
import static open.dolphin.rest.AbstractResource.getRemoteFacility;

/**
 * REST Web Service
 * サーバー情報の取得
 *
 * @author Life Sciences Computing Corporation.
 */
@Path("/serverinfo")
public class ServerInfoResource extends AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(ServerInfoResource.class.getName());
    
    private static final String MOBILE_KIND = "mobile.kind";
    private static final String MOBILE_ONOFF = "mobile.onoff";
    private static final String SERVER_VERSION = "server.version";
    private static final String DOLPHIN_FACILITYID = "dolphin.facilityId";
    private static final String JAMRI_CODE = "jamri.code";
    private static final String USE_AS_PVTSERVER = "useAsPVTServer";
    private static final String PVT_LISTEN_BINDIP = "pvt.listen.bindIP";
    private static final String PVT_LISTEN_PORT = "pvt.listen.port";
    private static final String PVT_LISTEN_ENCODING = "pvt.listen.encoding";
    private static final String RP_DEFAULT_INOUT = "rp.default.inout";
    private static final String PVTLIST_CLEAR = "pvtlist.clear";
    private static final String CLOUD_ZERO = "cloud.zero";
    private static final String SYSTEM_VER = "system.version";
    
    /** Creates a new instance of ServerInfoResource */
    public ServerInfoResource() {
    }
    
    @GET
    @Path("/jamri")
    @Produces(MediaType.TEXT_PLAIN)
    public String getJamri(@Context HttpServletRequest servletReq) {
        return getProperty(JAMRI_CODE);
    }
    
    @GET
    @Path("/cloud/zero")
    @Produces(MediaType.TEXT_PLAIN)
    public String getServerInfo(@Context HttpServletRequest servletReq) {
        return getProperty(CLOUD_ZERO);
    }
    
    public String getProperty(String item) {
        if (isSensitiveProperty(item)) {
            LOGGER.warning("Blocked access to sensitive property in custom.properties: " + item);
            return "";
        }
        Properties config = new Properties();
        StringBuilder sb = new StringBuilder();
        sb.append(System.getProperty("jboss.home.dir"));
        sb.append(File.separator);
        sb.append("custom.properties");
        File f = new File(sb.toString());
        try {
            FileInputStream fin = new FileInputStream(f);
            //InputStreamReader isr = new InputStreamReader(fin, "JISAutoDetect");
            InputStreamReader isr = new InputStreamReader(fin, "UTF-8");
            config.load(isr);
            isr.close();
        } catch (IOException ex) {
            ex.printStackTrace(System.err);
        }
        return config.getProperty(item, "");
    }

    private static boolean isSensitiveProperty(String prop) {
        if (prop == null) {
            return false;
        }
        String lower = prop.toLowerCase(Locale.ROOT);
        return lower.contains("password")
                || lower.contains("token")
                || lower.contains("secret")
                || lower.contains(".jdbc.");
    }
}
