package open.dolphin.rest;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.converter.PatientVisitListConverter;
import open.dolphin.infomodel.PatientVisitList;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.infomodel.PostSchedule;
import open.dolphin.session.ScheduleServiceBean;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * (予定カルテ対応)
 * @author kazushi Minagawa
 */
@Path("/schedule")
public class ScheduleResource extends AbstractResource {
    
    @Inject
    private ScheduleServiceBean scheduleService;
    
    @GET
    @Path("/pvt/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public PatientVisitListConverter getPvt(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        // 譁ｽ險ｭ
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        debug(fid);

        List<PatientVisitModel> result;

        String[] params = param.split(CAMMA);
        if (params.length==1) {
            String pvtDate = params[0];
            result = scheduleService.getPvt(fid, null, null, pvtDate);
        } else {
            String did = params[0];
            String unassigned = params[1];
            String pvtDate = params[2];
            result = scheduleService.getPvt(fid, did, unassigned, pvtDate);
        }
        
        PatientVisitList list = new PatientVisitList();
        list.setList(result);
        
        PatientVisitListConverter conv = new PatientVisitListConverter();
        conv.setModel(list);
        
        return conv;
    }
        
    @POST
    @Path("/document")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postScheduleAndSendClaim(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        PostSchedule schedule = mapper.readValue(json, PostSchedule.class);
        long pvtPK = schedule.getPvtPK();
        long phPK = schedule.getPhPK();
        Date date = schedule.getScheduleDate();
        boolean send = schedule.getSendClaim();
        debug(schedule.toString());
        
        int cnt = scheduleService.makeScheduleAndSend(pvtPK, phPK, date, send);
        
        return String.valueOf(cnt);
    }
    
    @DELETE
    @Path("/pvt/{param}")
    public void deletePvt(@PathParam("param") String param) throws Exception {

        String[] params = param.split(",");
        long pvtPK = Long.parseLong(params[0]);
        long ptPK = Long.parseLong(params[1]);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date d = sdf.parse(params[2]);

        int cnt = scheduleService.removePvt(pvtPK, ptPK, d);

        debug(String.valueOf(cnt));
    }
}
