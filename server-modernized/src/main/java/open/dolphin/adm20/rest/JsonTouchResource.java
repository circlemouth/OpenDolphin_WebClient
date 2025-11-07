package open.dolphin.adm20.rest;

import java.io.IOException;
import java.util.List;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.adm20.converter.IPatientList;
import open.dolphin.adm20.converter.IPatientModel;
import open.dolphin.adm20.converter.ISendPackage;
import open.dolphin.adm20.converter.IVisitPackage;
import open.dolphin.converter.StringListConverter;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.StringList;
import open.dolphin.touch.JsonTouchSharedService;
import open.dolphin.adm20.converter.ISendPackage2;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 *
 * @author Kazushi Minagawa.
 */
@Path("/20/adm/jtouch")
public class JsonTouchResource extends open.dolphin.rest.AbstractResource {
    
    @Inject
    private JsonTouchSharedService sharedService;

    @Inject
    private ObjectMapper legacyTouchMapper;
    
//minagawa^ 2013/08/29
    //@Resource(mappedName="java:jboss/datasources/OrcaDS")
    //private DataSource ds;
//minagawa$
    
    @GET
    @Path("/user/{uid}")
    @Produces(MediaType.APPLICATION_JSON)
    public UserModelConverter getUserById(@PathParam("uid") String uid) {
        return sharedService.getUserById(uid);
    }

    @GET
    @Path("/patients/count")
    @Produces(MediaType.TEXT_PLAIN)
    public String getPatientCount(@Context HttpServletRequest servletReq) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        return String.valueOf(sharedService.countPatients(fid));
    }

    @GET
    @Path("/patients/dump/kana/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public StringListConverter getPatientsWithKana(@Context HttpServletRequest servletReq, @PathParam("param") String param) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        String[] params = param.split(",");
        int first = Integer.parseInt(params[0]);
        int max = Integer.parseInt(params[1]);
        List<String> kanaList = sharedService.getPatientsWithKana(fid, first, max);
        StringList stringList = new StringList();
        stringList.setList(kanaList);
        StringListConverter converter = new StringListConverter();
        converter.setModel(stringList);
        return converter;
    }

    @GET
    @Path("/patient/{pid}")
    @Produces(MediaType.APPLICATION_JSON)
    public IPatientModel getPatientById(@Context HttpServletRequest servletReq, @PathParam("pid") String pid) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        JsonTouchSharedService.PatientModelSnapshot snapshot = sharedService.getPatientSnapshot(fid, pid);
        IPatientModel model = new IPatientModel();
        model.setModel(snapshot.getPatient());
        model.setKartePK(snapshot.getKartePk());
        return model;
    }
    
    @GET
    @Path("/patients/name/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public IPatientList getPatientsByNameOrId(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        //System.err.println("getPatientsByNameOrId");
        
        String [] params = param.split(",");
        
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        String name = params[0];
        //System.err.println(name);
        int firstResult = params.length==3 ? Integer.parseInt(params[1]) : 0;
        int maxResult = params.length==3 ? Integer.parseInt(params[2]) :100;

        List<PatientModel> list = sharedService.getPatientsByNameOrId(fid, name, firstResult, maxResult);

        PatientList patients = new PatientList();
        patients.setList(list);
        IPatientList response = new IPatientList();
        response.setModel(patients);

        return response;
    }  
    
    @GET
    @Path("/visitpackage/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public IVisitPackage getVisitPackage(@PathParam("param") String param) {
        
        String[] params = param.split(",");
        
        long pvtPK = Long.parseLong(params[0]);
        long patientPK = Long.parseLong(params[1]);
        long docPK = Long.parseLong(params[2]);
        int mode = Integer.parseInt(params[3]);
        
        // VisitTouchでカルテ作成に必要なwrapperオブジェクト
        VisitPackage visit = sharedService.getVisitPackage(pvtPK, patientPK, docPK, mode);
        IVisitPackage conv = new IVisitPackage();
        conv.setModel(visit);
        return conv;
    }
    
    @POST
    @Path("/sendPackage")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage(String json) throws IOException {
        
        //System.err.println(json);
        
        ISendPackage pkg = legacyTouchMapper.readValue(json, ISendPackage.class);
        
        long retPk = sharedService.processSendPackageElements(
                pkg != null ? pkg.documentModel() : null,
                pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                pkg != null ? pkg.deletedDiagnsis() : null,
                pkg != null ? pkg.chartEventModel() : null);
        return String.valueOf(retPk);
    }
    
    // S.Oh 2014/02/06 iPadのFreeText対応 Add Start
    @POST
    @Path("/sendPackage2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage2(String json) throws IOException {
        
        ISendPackage2 pkg = legacyTouchMapper.readValue(json, ISendPackage2.class);
        
        long retPk = sharedService.processSendPackageElements(
                pkg != null ? pkg.documentModel() : null,
                pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                pkg != null ? pkg.deletedDiagnsis() : null,
                pkg != null ? pkg.chartEventModel() : null);
        return String.valueOf(retPk);
    }
    // S.Oh 2014/02/06 Add End
    
}
