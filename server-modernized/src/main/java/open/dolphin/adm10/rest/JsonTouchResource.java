package open.dolphin.adm10.rest;

import java.beans.XMLDecoder;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.function.Function;
import java.util.logging.Logger;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.StreamingOutput;
import open.dolphin.adm10.converter.IBundleModule;
import open.dolphin.adm10.converter.IDocument;
import open.dolphin.adm10.converter.IDocument2;
import open.dolphin.adm10.converter.IOSHelper;
import open.dolphin.adm10.converter.IMKDocument;
import open.dolphin.adm10.converter.IMKDocument2;
import open.dolphin.converter.StringListConverter;
import open.dolphin.converter.UserModelConverter;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.PatientList;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.StringList;
import open.dolphin.infomodel.VisitPackage;
import open.dolphin.adm10.converter.IPatientList;
import open.dolphin.adm10.converter.ISendPackage;
import open.dolphin.adm10.converter.ISendPackage2;
import open.dolphin.adm10.converter.IVisitPackage;
import open.dolphin.adm10.session.ADM10_EHTServiceBean;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.DrugInteractionModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.IStampTreeModel;
import open.dolphin.infomodel.InfoModel;
import open.dolphin.infomodel.InteractionCodeList;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.touch.JsonTouchSharedService;
import open.dolphin.touch.JsonTouchAuditLogger;
import open.orca.rest.ORCAConnection;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 *
 * @author Kazushi Minagawa.
 */
@Path("/10/adm/jtouch")
public class JsonTouchResource extends open.dolphin.rest.AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(JsonTouchResource.class.getName());

    @Inject
    private JsonTouchSharedService sharedService;

    @Inject
    private ADM10_EHTServiceBean ehtService;

    private InteractionExecutor interactionExecutor = new DatabaseInteractionExecutor();
    
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
    @Path("/patient/{pid}")
    @Produces(MediaType.APPLICATION_JSON)
    public open.dolphin.adm10.converter.IPatientModel getPatientById(@Context HttpServletRequest servletReq, @PathParam("pid") String pid) {
        String fid = getRemoteFacility(servletReq.getRemoteUser());
        JsonTouchSharedService.PatientModelSnapshot snapshot = sharedService.getPatientSnapshot(fid, pid);
        open.dolphin.adm10.converter.IPatientModel model = new open.dolphin.adm10.converter.IPatientModel();
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
    public String postSendPackage(String json) {
        final String endpoint = "POST /10/adm/jtouch/sendPackage";
        final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "payloadSize=" + json.length());
        try {
            ObjectMapper mapper = new ObjectMapper();
            ISendPackage pkg = mapper.readValue(json, ISendPackage.class);

            long retPk = sharedService.processSendPackageElements(
                    pkg != null ? pkg.documentModel() : null,
                    pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                    pkg != null ? pkg.deletedDiagnsis() : null,
                    pkg != null ? pkg.chartEventModel() : null);
            JsonTouchAuditLogger.success(endpoint, traceId, () -> "documentPk=" + retPk);
            return String.valueOf(retPk);
        } catch (IOException | RuntimeException e) {
            throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    @POST
    @Path("/sendPackage2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postSendPackage2(String json) {
        final String endpoint = "POST /10/adm/jtouch/sendPackage2";
        final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "payloadSize=" + json.length());
        try {
            ObjectMapper mapper = new ObjectMapper();
            ISendPackage2 pkg = mapper.readValue(json, ISendPackage2.class);

            long retPk = sharedService.processSendPackageElements(
                    pkg != null ? pkg.documentModel() : null,
                    pkg != null ? pkg.diagnosisSendWrapperModel() : null,
                    pkg != null ? pkg.deletedDiagnsis() : null,
                    pkg != null ? pkg.chartEventModel() : null);
            JsonTouchAuditLogger.success(endpoint, traceId, () -> "documentPk=" + retPk);
            return String.valueOf(retPk);
        } catch (IOException | RuntimeException e) {
            throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    @POST
    @Path("/document")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument(String json) {
        return handleDocumentPayload("POST /10/adm/jtouch/document", json, IDocument.class, IDocument::toModel);
    }

    @POST
    @Path("/document2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument2(String json) {
        return handleDocumentPayload("POST /10/adm/jtouch/document2", json, IDocument2.class, IDocument2::toModel);
    }

    @POST
    @Path("/mkdocument")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postMkDocument(String json) {
        return handleDocumentPayload("POST /10/adm/jtouch/mkdocument", json, IMKDocument.class, IMKDocument::toModel);
    }

    @POST
    @Path("/mkdocument2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postMkDocument2(String json) {
        return handleDocumentPayload("POST /10/adm/jtouch/mkdocument2", json, IMKDocument2.class, IMKDocument2::toModel);
    }

////minagawa^
//    private void log(String msg) {
//        Logger.getLogger("open.dolphin").info(msg);
//    }
//    
//    private void warn(String msg) {
//        Logger.getLogger("open.dolphin").info(msg);
//    }
////minagawa$
    
    //---------------------------------------------------------------------------
    // EHT から引っ越し
    //---------------------------------------------------------------------------
    @GET
    @Path("/order/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput collectModules(final @PathParam("param") String param) {

        return output -> {
            final String endpoint = "GET /10/adm/jtouch/order";
            final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "param=" + param);
            try {
                String[] params = param.split(",");
                long pk = Long.parseLong(params[0]);            // patientPK
                Date fromDate = IOSHelper.toDate(params[1]);    // fromDate
                Date toDate = IOSHelper.toDate(params[2]);      // toDate

                List<String> entities;
                if (params.length > 3) {
                    entities = new ArrayList<>(params.length - 3);
                    for (int i = 3; i < params.length; i++) {
                        entities.add(params[i]);
                    }
                } else {
                    entities = new ArrayList<>(1);
                    entities.add(IInfoModel.ENTITY_MED_ORDER);
                }

                List<ModuleModel> list = ehtService.collectModules(pk, fromDate, toDate, entities);
                List<IBundleModule> result = new ArrayList<>(list.size());

                for (ModuleModel module : list) {
                    IBundleModule ib = new IBundleModule();
                    ib.fromModel(module);
                    if (module.getModel() instanceof BundleDolphin bd) {
                        ib.getModel().setOrderName(bd.getOrderName());
                    }
                    result.add(ib);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(output, result);
                JsonTouchAuditLogger.success(endpoint, traceId, () -> "bundleCount=" + result.size());
            } catch (IOException | RuntimeException e) {
                throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
            }
        };
    }
    
    @PUT
    @Path("/interaction")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput checkInteraction(final String json) {

        return os -> {
            final String endpoint = "PUT /10/adm/jtouch/interaction";
            final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "payloadSize=" + json.length());
            try {
                ObjectMapper mapper = new ObjectMapper();
                InteractionCodeList input = mapper.readValue(json, InteractionCodeList.class);

                List<DrugInteractionModel> ret = new ArrayList<>();

                if (input.getCodes1() == null || input.getCodes1().isEmpty()
                        || input.getCodes2() == null || input.getCodes2().isEmpty()) {
                    mapper = getSerializeMapper();
                    mapper.writeValue(os, ret);
                    JsonTouchAuditLogger.success(endpoint, traceId, () -> "interactionCount=0");
                    return;
                }

                StringBuilder sb = new StringBuilder();
                sb.append("select drugcd, drugcd2, TI.syojyoucd, syojyou ");
                sb.append("from tbl_interact TI inner join tbl_sskijyo TS on TI.syojyoucd = TS.syojyoucd ");
                sb.append("where (drugcd in (");
                sb.append(getCodes(input.getCodes1()));
                sb.append(") and drugcd2 in (");
                sb.append(getCodes(input.getCodes2()));
                sb.append("))");
                String sql = sb.toString();

                ret = interactionExecutor.execute(sql);
                mapper = getSerializeMapper();
                mapper.writeValue(os, ret);
                final int count = ret != null ? ret.size() : 0;
                JsonTouchAuditLogger.success(endpoint, traceId, () -> "interactionCount=" + count);
            } catch (IOException | SQLException | RuntimeException e) {
                throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
            }
        };
    }
//--------------------------------------------------------------------    
    
    @GET
    @Path("/stampTree/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getStampTree(final @PathParam("param") String param) {

        return os -> {
            final String endpoint = "GET /10/adm/jtouch/stampTree";
            final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "userPk=" + param);
            try {
                long pk = Long.parseLong(param);
                String json = buildStampTreeJson(pk);
                os.write(json.getBytes(StandardCharsets.UTF_8));
                JsonTouchAuditLogger.success(endpoint, traceId, () -> "payloadSize=" + json.length());
            } catch (IOException | RuntimeException e) {
                throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
            }
        };
    }

    private String buildStampTreeJson(long userPK) throws IOException {
        IStampTreeModel treeModel = ehtService.getTrees(userPK);
        String treeXml = new String(treeModel.getTreeBytes(), StandardCharsets.UTF_8);
        try (BufferedReader reader = new BufferedReader(new StringReader(treeXml))) {
            JSONStampTreeBuilder builder = new JSONStampTreeBuilder();
            StampTreeDirector director = new StampTreeDirector(builder);
            String json = director.build(reader);
            if (json == null) {
                throw new IOException("Failed to convert stamp tree to JSON");
            }
            return json;
        }
    }

    @GET
    @Path("/stamp/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getStamp(final @PathParam("param") String param) {

        return os -> {
            final String endpoint = "GET /10/adm/jtouch/stamp";
            final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "stampId=" + param);
            try {
                StampModel stampModel = ehtService.getStamp(param);
                if (stampModel != null) {
                    try (XMLDecoder decoder = new XMLDecoder(new BufferedInputStream(new ByteArrayInputStream(stampModel.getStampBytes())))) {
                        InfoModel model = (InfoModel) decoder.readObject();
                        JSONStampBuilder builder = new JSONStampBuilder();
                        String json = builder.build(model);
                        if (json != null) {
                            os.write(json.getBytes(StandardCharsets.UTF_8));
                            JsonTouchAuditLogger.success(endpoint, traceId, () -> "payloadSize=" + json.length());
                        } else {
                            os.write(new byte[0]);
                            JsonTouchAuditLogger.success(endpoint, traceId, () -> "payloadSize=0");
                        }
                    }
                } else {
                    os.write(new byte[0]);
                    JsonTouchAuditLogger.success(endpoint, traceId, () -> "payloadSize=0");
                }
            } catch (IOException | RuntimeException e) {
                throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
            }
        };
    }
    
    private <T> String handleDocumentPayload(String endpoint, String json, Class<T> payloadType, Function<T, DocumentModel> converter) {
        final String traceId = JsonTouchAuditLogger.begin(endpoint, () -> "payloadSize=" + json.length());
        try {
            ObjectMapper mapper = new ObjectMapper();
            T payload = mapper.readValue(json, payloadType);
            DocumentModel model = converter.apply(payload);
            long pk = sharedService.saveDocument(model);
            JsonTouchAuditLogger.success(endpoint, traceId, () -> "documentPk=" + pk);
            return String.valueOf(pk);
        } catch (IOException | RuntimeException e) {
            throw JsonTouchAuditLogger.failure(LOGGER, endpoint, traceId, e);
        }
    }

    // srycdのListからカンマ区切りの文字列を作る
    private String getCodes(Collection<String> srycdList){

        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String srycd : srycdList){
            if (!first){
                sb.append(",");
            } else {
                first = false;
            }
            sb.append(addSingleQuote(srycd));
        }
        return sb.toString();
    }

    private String addSingleQuote(String str) {
        StringBuilder sb = new StringBuilder();
        sb.append("'").append(str).append("'");
        return sb.toString();
    }

    void setInteractionExecutor(InteractionExecutor interactionExecutor) {
        this.interactionExecutor = interactionExecutor;
    }

    @FunctionalInterface
    interface InteractionExecutor {
        List<DrugInteractionModel> execute(String sql) throws SQLException;
    }

    private static final class DatabaseInteractionExecutor implements InteractionExecutor {

        @Override
        public List<DrugInteractionModel> execute(String sql) throws SQLException {
            try (Connection con = ORCAConnection.getInstance().getConnection();
                 Statement st = con.createStatement();
                 ResultSet rs = st.executeQuery(sql)) {
                List<DrugInteractionModel> result = new ArrayList<>();
                while (rs.next()) {
                    result.add(new DrugInteractionModel(
                            rs.getString(1),
                            rs.getString(2),
                            rs.getString(3),
                            rs.getString(4)));
                }
                return result;
            }
        }
    }
}
