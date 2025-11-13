package open.dolphin.rest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import open.dolphin.converter.*;
import open.dolphin.infomodel.*;
import open.dolphin.session.KarteServiceBean;
import open.dolphin.session.PVTServiceBean;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * REST Web Service
 *
 * @author Kazushi Minagawa, Digital Globe, Inc.
 */
@Path("/karte")
public class KarteResource extends AbstractResource {

    private static final String HEADER_FACILITY = "X-Facility-Id";
    private static final String HEADER_FACILITY_LEGACY = "facilityId";

    @Inject
    private KarteServiceBean karteServiceBean;
    
    @Inject
    private PVTServiceBean pvtServiceBean;

    /** Creates a new instance of KarteResource */
    public KarteResource() {
    }

    @GET
    @Path("/pid/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public KarteBeanConverter getKarteByPid(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        String pid = params[0];
        Date fromDate = parseDate(params[1]);

        String fid = resolveFacilityId(servletReq);
        KarteBean bean = karteServiceBean.getKarte(fid, pid, fromDate);

        return toConverter(servletReq, bean, "pid_lookup");
    }

    @GET
    @Path("/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public KarteBeanConverter getKarte(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long patientPK = Long.parseLong(params[0]);
        Date fromDate = parseDate(params[1]);
        
        KarteBean bean = karteServiceBean.getKarte(patientPK, fromDate);
        return toConverter(servletReq, bean, "patient_lookup");
    }

    //-------------------------------------------------------

    @GET
    @Path("/docinfo/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public DocInfoListConverter getDocumentList(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);
        Date fromDate = parseDate(params[1]);
        boolean includeModified = Boolean.parseBoolean(params[2]);

        List<DocInfoModel> result = karteServiceBean.getDocumentList(karteId, fromDate, includeModified);

        DocInfoList wrapper = new DocInfoList();
        wrapper.setList(result);
        
        DocInfoListConverter conv = new DocInfoListConverter();
        conv.setModel(wrapper);

        return conv;
    }

    @GET
    @Path("/documents/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public DocumentListConverter getDocuments(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        List<Long> list = new ArrayList<>(params.length);
        for (String s : params) {
            list.add(Long.parseLong(s));
        }

        List<DocumentModel> result = karteServiceBean.getDocuments(list);
        
//s.oh^ 2014/08/20 添付ファイルの別読
        for(DocumentModel model : result) {
            List<AttachmentModel> attachments = model.getAttachment();
            if(attachments != null) {
                for(AttachmentModel attachment : attachments) {
                    attachment.setBytes(null);
                }
            }
        }
//s.oh$

        DocumentList wrapper = new DocumentList();
        wrapper.setList(result);
        
        DocumentListConverter conv = new DocumentListConverter();
        conv.setModel(wrapper);

        return conv;
    } 
    
    @POST
    @Path("/document")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument(String json) throws IOException {
        
        System.err.println(json);
        
        // Karte 保存 ddl.putKarte()
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        DocumentModel document = mapper.readValue(json, DocumentModel.class);

        // 関係を構築する
        List<ModuleModel> modules = document.getModules();
        if (modules!=null && modules.size()>0) {
            for (ModuleModel m : modules) {
                m.setDocumentModel(document);
            }
        }
        // Schemaとの関係を構築する
        List<SchemaModel> schemas = document.getSchema();
        if (schemas!=null && schemas.size()>0) {
            for (SchemaModel m : schemas) {
                m.setDocumentModel(document);
            }
        }
        // Attachmentとの関係を構築する
        List<AttachmentModel> attachments = document.getAttachment();
        if (attachments!=null && attachments.size()>0) {
            for (AttachmentModel m : attachments) {
                m.setDocumentModel(document);
            }
        }

        long result = karteServiceBean.addDocument(document);
        String pkStr = String.valueOf(result);
        debug(pkStr);

        return pkStr;
    }

    @POST
    @Path("/document/pvt/{params}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDocument(@PathParam("params") String param, String json) throws IOException {

        String[] params = param.split(CAMMA);
        long pvtPK = Long.parseLong(params[0]);
        int state = Integer.parseInt(params[1]);

        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        DocumentModel document = mapper.readValue(json, DocumentModel.class);
        
        // 関係を構築する
        List<ModuleModel> modules = document.getModules();
        if (modules!=null && modules.size()>0) {
            for (ModuleModel m : modules) {
                m.setDocumentModel(document);
            }
        }
        // Schemaとの関係を構築する
        List<SchemaModel> schemas = document.getSchema();
        if (schemas!=null && schemas.size()>0) {
            for (SchemaModel m : schemas) {
                m.setDocumentModel(document);
            }
        }
        // Attachmentとの関係を構築する
        List<AttachmentModel> attachments = document.getAttachment();
        if (attachments!=null && attachments.size()>0) {
            for (AttachmentModel m : attachments) {
                m.setDocumentModel(document);
            }
        }

        long result = karteServiceBean.addDocument(document);
        String pkStr = String.valueOf(result);
        
        if (params.length==2) {
            try {
                int cnt = pvtServiceBean.updatePvtState(pvtPK, state);
                StringBuilder sb = new StringBuilder();
                sb.append("PVT state did update: ");
                sb.append(pvtPK).append(" = ").append(state);
                Logger.getLogger("open.dolphin").info(sb.toString());
                
            } catch (Throwable t) {
                Logger.getLogger("open.dolphin").warning(t.getMessage());
            }
        }

        return pkStr;
    }
    
    @PUT
    @Path("/document/{id}")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    public String putTitle(@PathParam("id") String idStr, String title) {

        long id = Long.parseLong(idStr);

        int result = karteServiceBean.updateTitle(id, title);

        return String.valueOf(result);
    }

    @DELETE
    @Path("/document/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public StringListConverter deleteDocument(@PathParam("id") String idStr) {

        long id = Long.parseLong(idStr);

        List<String> list = karteServiceBean.deleteDocument(id);
        StringList strList = new StringList();
        strList.setList(list);
        StringListConverter conv = new StringListConverter();
        conv.setModel(strList);
        return conv;
    }

    //-------------------------------------------------------

    @GET
    @Path("/modules/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public ModuleListListConverter getModules(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);
        String entity = params[1];

        List<Date> fromList = new ArrayList<>();
        List<Date> toList = new ArrayList<>();

        int index = 2;

        while (index < params.length) {
            fromList.add(parseDate(params[index++]));
            toList.add(parseDate(params[index++]));
        }

        // Wrapper
        ModuleListList wrapper = new ModuleListList();
        
        List<List<ModuleModel>> result = karteServiceBean.getModules(karteId, entity, fromList, toList);
        for (List<ModuleModel> list : result) {
            ModuleList mlist = new ModuleList();
            mlist.setList(list);
            wrapper.addList(mlist);
        }
        
        // Converter
        ModuleListListConverter conv = new ModuleListListConverter();
        conv.setModel(wrapper);

        return conv;
    }

    @GET
    @Path("/iamges/{param}")
    @Produces(MediaType.APPLICATION_XML)
    public String getImages(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);

        List<Date> fromList = new ArrayList<>();
        List<Date> toList = new ArrayList<>();

        int index = 1;

        while (index < params.length) {
            fromList.add(parseDate(params[index++]));
            toList.add(parseDate(params[index++]));
        }

        List<List> result = karteServiceBean.getImages(karteId, fromList, toList);

        PlistConverter con = new PlistConverter();
        String xml = con.convert(result);
        debug(xml);

        return xml;
    }

    @GET
    @Path("/image/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public SchemaModelConverter getImage(@PathParam("param") String idStr) {

        debug(idStr);
        long karteId = Long.parseLong(idStr);

        SchemaModel result = karteServiceBean.getImage(karteId);

        SchemaModelConverter conv = new SchemaModelConverter();
        conv.setModel(result);

        return conv;
    }

    //-------------------------------------------------------

    @GET
    @Path("/diagnosis/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public RegisteredDiagnosisListConverter getDiagnosis(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);
        Date fromDate = parseDate(params[1]);
        boolean activeOnly = false;
        if (params.length==3) {
            activeOnly = Boolean.parseBoolean(params[2]);
        }

        List<RegisteredDiagnosisModel> result = karteServiceBean.getDiagnosis(karteId, fromDate, activeOnly);
        RegisteredDiagnosisList list = new RegisteredDiagnosisList();
        list.setList(result);
        
        RegisteredDiagnosisListConverter conv = new RegisteredDiagnosisListConverter();
        conv.setModel(list);

        return conv;
    }
    
    @POST
    @Path("/diagnosis/claim")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postPutSendDiagnosis(@Context HttpServletRequest servletReq, String json) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        DiagnosisSendWrapper wrapper = mapper.readValue(json, DiagnosisSendWrapper.class);

        populateDiagnosisAuditMetadata(servletReq, wrapper, "/karte/diagnosis/claim");

        List<Long> result = karteServiceBean.postPutSendDiagnosis(wrapper);

        if (result!=null && result.size()>0) {
            StringBuilder sb = new StringBuilder();
            for (Long l : result) {
                sb.append(String.valueOf(l));
                sb.append(CAMMA);
            }
            String text = sb.substring(0, sb.length()-1);
            debug(text);

            return text;
        }
        return null;
    }

    @POST
    @Path("/diagnosis")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postDiagnosis(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        RegisteredDiagnosisList list = mapper.readValue(json, RegisteredDiagnosisList.class);

        List<Long> result = karteServiceBean.addDiagnosis(list.getList());

        StringBuilder sb = new StringBuilder();
        for (Long l : result) {
            sb.append(String.valueOf(l));
            sb.append(CAMMA);
        }
        String text = sb.substring(0, sb.length()-1);
        debug(text);

        return text;
    }

    @PUT
    @Path("/diagnosis")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putDiagnosis(String json) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        RegisteredDiagnosisList list = mapper.readValue(json, RegisteredDiagnosisList.class);

        int result = karteServiceBean.updateDiagnosis(list.getList());
        String text = String.valueOf(result);
        debug(text);

        return text;
    }

    @DELETE
    @Path("/diagnosis/{param}")
    public void deleteDiagnosis(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        List<Long> list = new ArrayList<Long>(params.length);
        for (String s : params) {
            list.add(Long.parseLong(s));
        }

        int result = karteServiceBean.removeDiagnosis(list);

        debug(String.valueOf(result));
    }

    //-------------------------------------------------------

    @GET
    @Path("/observations/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public ObservationListConverter getObservations(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);
        String observation = params[1];
        String phenomenon = params[2];
        Date firstConfirmed = null;
        if (params.length==4) {
            firstConfirmed = parseDate(params[3]);
        }

        List<ObservationModel> result = karteServiceBean.getObservations(karteId, observation, phenomenon, firstConfirmed);
        ObservationList list = new ObservationList();
        list.setList(result);
        
        ObservationListConverter conv = new ObservationListConverter();
        conv.setModel(list);

        return conv;
    }

    @POST
    @Path("/observations")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String postObservations(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ObservationList list = mapper.readValue(json, ObservationList.class);

        List<Long> result = karteServiceBean.addObservations(list.getList());

        StringBuilder sb = new StringBuilder();
        for (Long l : result) {
            sb.append(String.valueOf(l));
            sb.append(CAMMA);
        }
        String text = sb.substring(0, sb.length()-1);
        debug(text);

        return text;
    }

    @PUT
    @Path("/observations")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putObservations(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ObservationList list = mapper.readValue(json, ObservationList.class);
        
        int result = karteServiceBean.updateObservations(list.getList());

        String text = String.valueOf(result);
        debug(text);

        return text;
    }

    @DELETE
    @Path("/observations/{param}")
    public void deleteObservations(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        List<Long> list = new ArrayList<Long>(params.length);
        for (String s : params) {
            list.add(Long.parseLong(s));
        }

        int result = karteServiceBean.removeObservations(list);

        debug(String.valueOf(result));
    }

    //-------------------------------------------------------

    @PUT
    @Path("/memo")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putPatientMemo(String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        // 2013/06/24
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        PatientMemoModel memo = mapper.readValue(json, PatientMemoModel.class);

        int result = karteServiceBean.updatePatientMemo(memo);
        String text = String.valueOf(result);
        debug(text);

        return text;
    }
    
//s.oh^ 2014/04/03 サマリー対応
    @GET
    @Path("/freedocument/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public PatientFreeDocumentModelConverter getFreeDocument(@Context HttpServletRequest servletReq, @PathParam("param") String param) {

        String pid = param;
        String fpid = getFidPid(servletReq.getRemoteUser(), pid);
        
        PatientFreeDocumentModel result = karteServiceBean.getPatientFreeDocument(fpid);
        if (result!=null) {
            PatientFreeDocumentModelConverter conv = new PatientFreeDocumentModelConverter();
            conv.setModel(result);
            return conv;
        }
        else {
            return null;
        }
    }
    
    @PUT
    @Path("/freedocument")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String putPatientFreeDocument(@Context HttpServletRequest servletReq, String json) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        PatientFreeDocumentModel model = mapper.readValue(json, PatientFreeDocumentModel.class);
        
        String fpid = getFidPid(servletReq.getRemoteUser(), model.getFacilityPatId());
        model.setFacilityPatId(fpid);

        int result = karteServiceBean.updatePatientFreeDocument(model);
        String text = String.valueOf(result);
        debug(text);

        return text;
    }
//s.oh$

    //-------------------------------------------------------

    @GET
    @Path("/appo/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public AppoListListConverter getAppoinmentList(@PathParam("param") String param) {

        debug(param);
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);

        List<Date> fromList = new ArrayList<Date>();
        List<Date> toList = new ArrayList<Date>();

        int index = 1;

        while (index < params.length) {
            fromList.add(parseDate(params[index++]));
            toList.add(parseDate(params[index++]));
        }
        
        // Wrapper
        AppoListList wrapper = new AppoListList();

        // List List
        List<List<AppointmentModel>> result = karteServiceBean.getAppointmentList(karteId, fromList, toList);
        for (List<AppointmentModel> list : result) {
            AppoList mlist = new AppoList();
            mlist.setList(list);
            wrapper.addList(mlist);
        }
        
        // Converter
        AppoListListConverter conv = new AppoListListConverter();
        conv.setModel(wrapper);

        return conv;
    }
    
    @PUT
    @Path("/claim")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public String sendDocument(String json) throws Exception {
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            // 2013/06/24
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            DocumentModel model = mapper.readValue(json, DocumentModel.class);
            debug(model.getDocInfoModel().getPVTHealthInsuranceModel().toString());

            karteServiceBean.sendDocument(model);

            return "1";
        } catch (Exception e) {
            e.printStackTrace(System.err);
        }
        return "0";
    }
    
    //--------------------------------------------------------------------------
 //masuda^   
    // 指定したEntityのModuleModelをまとめて取得
    @GET
    @Path("/moduleSearch/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public ModuleListConverter getModulesEntitySearch(@Context HttpServletRequest servletReq,@PathParam("param") String param) {

        String fid = getRemoteFacility(servletReq.getRemoteUser());
        
        String[] params = param.split(CAMMA);
        long karteId = Long.parseLong(params[0]);
        Date fromDate = parseDate(params[1]+" 00:00:00");
        Date toDate = parseDate(params[2]+" 00:00:00");
        List<String> entities = new ArrayList<String>();
        for (int i=3;i <params.length;i++) {
            entities.add(params[i]);
        }

        List<ModuleModel> list = karteServiceBean.getModulesEntitySearch(fid, karteId, fromDate, toDate, entities);
        ModuleList mList = new ModuleList();
        mList.setList(list);
        
        ModuleListConverter conv = new ModuleListConverter();
        conv.setModel(mList);
        
        return conv;
    }
//masuda$
    
//s.oh^ 2014/07/22 一括カルテPDF出力
    @GET
    @Path("/docinfo/all/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public DocumentListConverter getAllDocument(@PathParam("param") String param) {

        long pk = Long.parseLong(param);

        List<DocumentModel> result = karteServiceBean.getAllDocument(pk);
        
//s.oh^ 2014/08/20 添付ファイルの別読
        for(DocumentModel model : result) {
            List<AttachmentModel> attachments = model.getAttachment();
            if(attachments != null) {
                for(AttachmentModel attachment : attachments) {
                    attachment.setBytes(null);
                }
            }
        }
//s.oh$

        DocumentList wrapper = new DocumentList();
        wrapper.setList(result);
        
        DocumentListConverter conv = new DocumentListConverter();
        conv.setModel(wrapper);

        return conv;
    }
//s.oh$
    
//s.oh^ 2014/08/20 添付ファイルの別読
    @GET
    @Path("/attachment/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public AttachmentModelConverter getAttachment(@PathParam("param") String param) {

        long id = Long.parseLong(param);

        AttachmentModel result = karteServiceBean.getAttachment(id);
        
        AttachmentModelConverter conv = new AttachmentModelConverter();
        conv.setModel(result);

        return conv;
    }
//s.oh$

    private KarteBeanConverter toConverter(HttpServletRequest request, KarteBean bean, String context) {
        if (bean == null) {
            Map<String, Object> extras = new HashMap<>();
            extras.put("context", context);
            throw AbstractResource.restError(request, Response.Status.INTERNAL_SERVER_ERROR, "karte_lookup_failed",
                    "Karte result is empty", extras, null);
        }
        KarteBeanConverter conv = new KarteBeanConverter();
        conv.setModel(bean);
        return conv;
    }

    private String resolveFacilityId(HttpServletRequest request) {
        String remoteUser = request != null ? request.getRemoteUser() : null;
        boolean hasSeparator = remoteUser != null && remoteUser.indexOf(IInfoModel.COMPOSITE_KEY_MAKER) >= 0;
        String facility = hasSeparator ? getRemoteFacility(remoteUser) : null;
        String headerFacility = headerFacility(request);
        if (facility == null || facility.isBlank()) {
            facility = firstNonBlank(facility, headerFacility);
        }
        if (facility == null || facility.isBlank()) {
            Map<String, Object> extras = new HashMap<>();
            extras.put("remoteUser", remoteUser);
            extras.put("headerFacility", headerFacility);
            throw AbstractResource.restError(request, Response.Status.UNAUTHORIZED, "facility_missing",
                    "Facility identifier is not available", extras, null);
        }
        return facility;
    }

    private String headerFacility(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String override = request.getHeader(HEADER_FACILITY);
        if (override != null && !override.trim().isEmpty()) {
            return override.trim();
        }
        String legacy = request.getHeader(HEADER_FACILITY_LEGACY);
        if (legacy != null && !legacy.trim().isEmpty()) {
            return legacy.trim();
        }
        return null;
    }

    private String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.trim().isEmpty()) {
                return candidate.trim();
            }
        }
        return null;
    }

}
