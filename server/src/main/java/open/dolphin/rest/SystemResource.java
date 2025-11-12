package open.dolphin.rest;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Properties;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import open.dolphin.infomodel.ActivityModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.RoleModel;
import open.dolphin.infomodel.UserModel;
import open.dolphin.session.AccountSummary;
import open.dolphin.session.SystemServiceBean;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;

/**
 * REST Web Service
 *
 * @author kazushi
 */
@Path("/dolphin")
public class SystemResource extends AbstractResource {
    
    @Inject
    private SystemServiceBean systemServiceBean;

    /** Creates a new instance of SystemResource */
    public SystemResource() {
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hellowDolphin() {
        return "Hellow, Dolphin";
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String addFacilityAdmin(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        UserModel user = mapper.readValue(json, UserModel.class);

        // 関係を構築する
        List<RoleModel> roles = user.getRoles();
        for (RoleModel role : roles) {
            role.setUserModel(user);
        }

        AccountSummary summary = systemServiceBean.addFacilityAdmin(user);
        String ret = summary.getFacilityId()+":"+summary.getUserId();
        return ret;
    }
    
    @GET
    @Path("/activity/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<ActivityModel> getActivities(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        ActivityRequest request = parseActivityRequest(param);

        String remoteUser = servletReq != null ? servletReq.getRemoteUser() : null;
        if (remoteUser == null || remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER) < 0) {
            throw unauthorized("Remote user not available");
        }

        String fid = getRemoteFacility(remoteUser);

        ActivityModel[] array = new ActivityModel[request.count + 1]; // +1=total

        int year = request.year;
        int month = request.month;

        // ex month=5,past=-3 -> 3,4,5
        GregorianCalendar gcFirst = new GregorianCalendar(year, month, 1);
        int numDays = gcFirst.getActualMaximum(Calendar.DAY_OF_MONTH);

        int index = array.length - 2;
        while (index >= 0) {
            GregorianCalendar gcLast = new GregorianCalendar(year, month, numDays, 23, 59, 59);
            ActivityModel am = requireActivity(systemServiceBean.countActivities(fid, gcFirst.getTime(), gcLast.getTime()));
            array[index] = am;

            index--;
            gcFirst.add(Calendar.MONTH, -1);
            year = gcFirst.get(Calendar.YEAR);
            month = gcFirst.get(Calendar.MONTH);
            numDays = gcFirst.getActualMaximum(Calendar.DAY_OF_MONTH);
        }

        // 総数
        ActivityModel total = requireActivity(systemServiceBean.countTotalActivities(fid));
        array[array.length - 1] = total;

        return Arrays.asList(array);
    }

    private ActivityModel requireActivity(ActivityModel model) {
        if (model == null) {
            throw internalError("Activity aggregation unavailable");
        }
        return model;
    }

    private ActivityRequest parseActivityRequest(String rawParam) {
        if (rawParam == null || rawParam.trim().isEmpty()) {
            throw badRequest("param must not be empty");
        }

        String[] params = rawParam.split(CAMMA);
        if (params.length < 3) {
            throw badRequest("param must contain year, month, count");
        }

        try {
            int year = Integer.parseInt(params[0]);
            int month = Integer.parseInt(params[1]);
            int count = Integer.parseInt(params[2]);
            if (count < 1) {
                throw badRequest("count must be >= 1");
            }
            return new ActivityRequest(year, month, count);
        } catch (NumberFormatException e) {
            throw badRequest("param must be numeric");
        }
    }

    private WebApplicationException badRequest(String message) {
        return buildException(Response.Status.BAD_REQUEST, message);
    }

    private WebApplicationException unauthorized(String message) {
        return buildException(Response.Status.UNAUTHORIZED, message);
    }

    private WebApplicationException internalError(String message) {
        return buildException(Response.Status.INTERNAL_SERVER_ERROR, message);
    }

    private WebApplicationException buildException(Response.Status status, String message) {
        Response response = Response.status(status)
                .entity(message)
                .type(MediaType.TEXT_PLAIN)
                .build();
        return new WebApplicationException(response);
    }

    private static final class ActivityRequest {
        private final int year;
        private final int month;
        private final int count;

        private ActivityRequest(int year, int month, int count) {
            this.year = year;
            this.month = month;
            this.count = count;
        }
    }
    
//s.oh^ 2014/07/08 クラウド0対応
    @POST
    @Path("/license")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    public String checkLicense(String uid) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        Properties config = new Properties();
        StringBuilder sb = new StringBuilder();
        sb.append(System.getProperty("jboss.home.dir"));
        sb.append(File.separator);
        sb.append("license.properties");
        File f = new File(sb.toString());
        try {
            FileInputStream fin = new FileInputStream(f);
            InputStreamReader isr = new InputStreamReader(fin, "UTF-8");
            config.load(isr);
            isr.close();
            fin.close();
        } catch (IOException ex) {
            Logger.getLogger("open.dolphin").warning("ライセンスファイル読込エラー");
            ex.printStackTrace(System.err);
            return "2";
        }
        
        String val = config.getProperty("license.max", "3");
        int max = Integer.parseInt(val);
        for(int i = 0; i < max; i++) {
            sb = new StringBuilder();
            sb.append("license.uid");
            sb.append(String.valueOf(i+1));
            val = config.getProperty(sb.toString());
            if(val == null) {
                config.setProperty(sb.toString(), uid);
                try {
                    FileOutputStream fon = new FileOutputStream(f);
                    config.store(fon, "OpenDolphinZero License");
                    fon.close();
                } catch (IOException ex) {
                    Logger.getLogger("open.dolphin").warning("ライセンスファイル保存エラー");
                    ex.printStackTrace(System.err);
                    return "3";
                }
                Logger.getLogger("open.dolphin").info("ライセンス新規登録");
                return "0";
            }else{
                if(val.equals(uid)) {
                    Logger.getLogger("open.dolphin").info("ライセンス登録済");
                    return "0";
                }
            }
        }
        
        Logger.getLogger("open.dolphin").warning("ライセンス認証の制限数を超えました");
        return "4";
    }
//s.oh$
    
//s.oh^ 2014/07/08 クラウド0対応
    @GET
    @Path("/cloudzero/sendmail")
    public void sendCloudZeroMail() {
        Logger.getLogger("open.dolphin").info("Send CloudZero mail.");
        
        GregorianCalendar gc = new GregorianCalendar();
        gc.add(Calendar.MONTH, -1);
        int year = gc.get(Calendar.YEAR);
        int month = gc.get(Calendar.MONTH);
        systemServiceBean.sendMonthlyActivities(year, month);
    }
//s.oh$
    
    /**
     * 
     * ResteasyClient client = new ResteasyClientBuilder().build();
     * 
    ResteasyWebTarget target = client.target("http://.../upload");

    MultipartFormDataOutput mdo = new MultipartFormDataOutput();
    mdo.addFormData("file", new FileInputStream(new File("....thermo.wav")),    MediaType.APPLICATION_OCTET_STREAM_TYPE);
    GenericEntity<MultipartFormDataOutput> entity = new GenericEntity<MultipartFormDataOutput>(mdo) {};

    Response r = target.request().post( Entity.entity(entity, MediaType.MULTIPART_FORM_DATA_TYPE));
     */
}
