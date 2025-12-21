/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package open.dolphin.adm20.rest;

import java.beans.XMLDecoder;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.StreamingOutput;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.AttachmentModel;
import open.dolphin.infomodel.BundleDolphin;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.DocumentModel;
import open.dolphin.infomodel.DrugInteractionModel;
import open.dolphin.infomodel.IInfoModel;
import open.dolphin.infomodel.KarteNumber;
import open.dolphin.infomodel.IStampTreeModel;
import open.dolphin.infomodel.InfoModel;
import open.dolphin.infomodel.InteractionCodeList;
import open.dolphin.infomodel.LastDateCount;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.ObservationModel;
import open.dolphin.infomodel.PatientFreeDocumentModel;
import open.dolphin.infomodel.PatientMemoModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.infomodel.VitalModel;
import open.dolphin.session.ChartEventServiceBean;
import open.dolphin.adm20.session.ADM20_EHTServiceBean;
import open.dolphin.adm20.converter.IAllergyModel;
import open.dolphin.adm20.converter.IAttachmentModel;
import open.dolphin.adm20.converter.IBundleModule;
import open.dolphin.adm20.converter.IDocument;
import open.dolphin.adm20.converter.IDocument2;
import open.dolphin.adm20.converter.IKarteNumber;
import open.dolphin.adm20.converter.ILaboGraphItem;
import open.dolphin.adm20.converter.ILaboValue;
import open.dolphin.adm20.converter.IOSHelper;
import open.dolphin.adm20.converter.IPatientMemoModel;
import open.dolphin.adm20.converter.IPatientModel;
import open.dolphin.adm20.converter.IPatientVisitModel;
import open.dolphin.adm20.converter.IPhysicalModel;
import open.dolphin.adm20.converter.IFastDocInfo;
import open.dolphin.adm20.converter.IProgressCourseModule30;
import open.dolphin.adm20.converter.IRegisteredDiagnosis;
import open.dolphin.adm20.converter.ILastDateCount;
import open.dolphin.adm20.converter.NLaboModuleConverter;
import open.dolphin.adm20.converter.ISendPackage;
import open.dolphin.adm20.converter.ISendPackage2;
import open.dolphin.adm20.converter.IVitalModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.session.framework.SessionTraceContext;
import open.dolphin.session.framework.SessionTraceManager;
import open.orca.rest.ORCAConnection;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import open.dolphin.session.KarteServiceBean;

/**
 *
 * @author kazushi
 */
@Path("/20/adm/eht")
public class EHTResource extends open.dolphin.rest.AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(EHTResource.class.getName());
    private static final int FACILITY_ID_LENGTH = 10;
    private static final int JMARI_ID_LENGTH = 15;
    private static final String JMARI_PREFIX = "JPN";
    private static final int SUCCESS_RESPONSE = 0x00;
    private static final int FALLBACK_RESPONSE = 0x01;
    
    private static final String QUERY_FACILITYID_BY_1001
            ="select kanritbl from tbl_syskanri where kanricd='1001'";
    
    private static final String MOBILE_KIND = "mobile.kind";
    private static final String MOBILE_ONOFF = "mobile.onoff";
    private static final String SERVER_VERSION = "server.version";
    private static final String DOLPHIN_FACILITYID = "dolphin.facilityId";
    private static final String JAMRI_CODE = "jamri.code";
    private static final String USE_AS_PVTSERVER = "useAsPVTServer";
    private static final String PVT_LISTEN_BINDIP = "pvt.listen.bindIP";
    private static final String PVT_LISTEN_PORT = "pvt.listen.port";
    private static final String PVT_LISTEN_ENCODING = "pvt.listen.encoding";
    private static final String CLAIM_CONN = "claim.conn";
    private static final String CLAIM_HOST = "claim.host";
    private static final String CLAIM_SEND_PORT = "claim.send.port";
    private static final String CLAIM_SEND_ENCODING = "claim.send.encoding";
    private static final String RP_DEFAULT_INOUT = "rp.default.inout";
    private static final String PVTLIST_CLEAR = "pvtlist.clear";
    private static final String CLAIM_JDBC_URL = "claim.jdbc.url";
    private static final String CLAIM_USER = "claim.user";
    private static final String CLAIM_PASSWORD = "claim.password";
    
    @Inject
    private ADM20_EHTServiceBean ehtService;
    
    @Inject
    private KarteServiceBean karteService;
    
    @Inject
    private ChartEventServiceBean eventServiceBean;

    @Inject
    private AuditTrailService auditTrailService;

    @Inject
    private SessionTraceManager sessionTraceManager;
    
    //@Inject
    //private AdmissionSessionBean admissionSessionBean;
    
    @Context
    private HttpServletRequest servletReq;

    
//minagawa^  Deploy 技術の問題で standalone.xml に ORCA DS は指定しない
    //@Resource(mappedName="java:jboss/datasources/OrcaDS")
    //private DataSource ds;
//minagawa$
    
    @GET
    @Path("/patient/firstVisitors/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getFirstVisitors(final @PathParam("param") String param) {

        return new StreamingOutput() {
            
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                
                String [] params = param.split(",");

                if (params.length !=2) {
                    throw new WebApplicationException();
                }

                // 医療機関ID、最初の結果、最大件数
                String facilityId = getRemoteFacility(servletReq.getRemoteUser());
                int firstResult = Integer.parseInt(params[0]);
                int maxResult = Integer.parseInt(params[1]);

                // 新患リストを取得する
                List<PatientModel> list = ehtService.getFirstVisitors(facilityId, firstResult, maxResult);
                List<IPatientModel> result = new ArrayList(list.size());
                
                for (PatientModel patient : list) {
                    IPatientModel ipm = new IPatientModel();
                    ipm.setModel(patient);
                    result.add(ipm);
                }
                
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }
    
    @GET
    @Path("/pvtList")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getPvtList() {
        
        return new StreamingOutput() {
            
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
             
                String fid = getRemoteFacility(servletReq.getRemoteUser());
                List<PatientVisitModel> list = eventServiceBean.getPvtList(fid);
                
                List<IPatientVisitModel> result = new ArrayList(list.size());
                for (PatientVisitModel model : list) {
                    IPatientVisitModel ipv = new IPatientVisitModel();
                    ipv.setModel(model);
                    result.add(ipv);
                }
                
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }
    
// ここへ Move
    @GET
    @Path("/patient/pvt/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getPatientsByPvt(@PathParam("param") String param) {

        return new StreamingOutput() {

            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String facilityId = getRemoteFacility(servletReq.getRemoteUser());
                List<PatientModel> list = ehtService.getPatientsByPvtDate(facilityId, param);
                List<IPatientModel> result = new ArrayList<>(list.size());
                for (PatientModel model : list) {
                    IPatientModel converted = new IPatientModel();
                    converted.setModel(model);
                    result.add(converted);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }

    @GET
    @Path("/patient/documents/status")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getPatientsByTmpKarte() {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String facilityId = getRemoteFacility(servletReq.getRemoteUser());
                List<PatientModel> list = ehtService.getTmpKarte(facilityId);
                List<IPatientModel> result = new ArrayList<>(list.size());
                for (PatientModel model : list) {
                    IPatientModel converted = new IPatientModel();
                    converted.setModel(model);
                    result.add(converted);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }

    @GET
    @Path("/lastDateCount/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getLastDateCount(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String[] params = param.split(",");
                if (params.length < 3) {
                    throw new WebApplicationException();
                }
                long ptPK = Long.parseLong(params[0]);
                String fidPid = params[1] + ":" + params[2];
                LastDateCount data = ehtService.getLastDateCount(ptPK, fidPid);
                ILastDateCount converted = new ILastDateCount();
                converted.fromModel(data);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, converted);
            }
        };
    }

    @GET
    @Path("/freedocument/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getPatientFreeDocument(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String fidPid = getFidPid(servletReq.getRemoteUser(), param);
                PatientFreeDocumentModel model = ehtService.getPatientFreeDocument(fidPid);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, model != null ? model.getComment() : "");
            }
        };
    }

    @GET
    @Path("/karteNumber/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getEHTKarte(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long ptPK = Long.parseLong(param);
                KarteNumber karte = ehtService.getKarteNumber(ptPK);
                karte.setNumber(getFacilityCodeBy1001());
                IKarteNumber ieht = new IKarteNumber();
                ieht.setModel(karte);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, ieht);
            }
        };
    }
    
    @GET
    @Path("/memo/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getPatientMemo(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long ptPK = Long.parseLong(param);
                PatientMemoModel memo = ehtService.getPatientMemo(ptPK);
                IPatientMemoModel conv = new IPatientMemoModel();
                if (memo!=null) {
                    conv.fromModel(memo);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, conv);
            }
        };
    }
    
    @POST
    @Path("/memo")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput postPatientMemo(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                IPatientMemoModel model = mapper.readValue(json, IPatientMemoModel.class);
                Long pk = ehtService.addPatientMemo(model.toModel());
                List<Long> memoIds = new ArrayList<>(1);
                memoIds.add(pk);
                Set<Long> karteIds = new HashSet<>(1);
                if (model.getKarteBean() != null) {
                    karteIds.add(model.getKarteBean().getId());
                }
                mapper = getSerializeMapper();
                mapper.writeValue(os, memoIds);

                Map<String, Object> details = new HashMap<>();
                details.put("createdMemoIds", memoIds);
                details.put("payloadCount", memoIds.size());
                recordAuditEvent("EHT_MEMO_CREATE", "/20/adm/eht/memo", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @PUT
    @Path("/memo")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput putPatientMemo(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                IPatientMemoModel model = mapper.readValue(json, IPatientMemoModel.class);
                int cnt = ehtService.updatePatientMemo(model.toModel());
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Set<Long> karteIds = new HashSet<>(1);
                if (model.getKarteBean() != null) {
                    karteIds.add(model.getKarteBean().getId());
                }
                Map<String, Object> details = new HashMap<>();
                details.put("updatedMemoIds", List.of(model.getId()));
                details.put("affectedRows", cnt);
                recordAuditEvent("EHT_MEMO_UPDATE", "/20/adm/eht/memo", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @DELETE
    @Path("/memo")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput deletePatientMemo(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                IPatientMemoModel model = mapper.readValue(json, IPatientMemoModel.class);
                int cnt = ehtService.deletePatientMemo(model.toModel());
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Set<Long> karteIds = new HashSet<>(1);
                if (model.getKarteBean() != null) {
                    karteIds.add(model.getKarteBean().getId());
                }
                Map<String, Object> details = new HashMap<>();
                details.put("deletedMemoIds", List.of(model.getId()));
                details.put("affectedRows", cnt);
                recordAuditEvent("EHT_MEMO_DELETE", "/20/adm/eht/memo", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @GET
    @Path("/allergy/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getAllergies(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                
                long ptPK = Long.parseLong(param);
                List<AllergyModel> list = ehtService.getAllergies(ptPK);
                List<IAllergyModel> result = new ArrayList();
                for (AllergyModel m : list) {
                    IAllergyModel ac = new IAllergyModel();
                    ac.fromModel(m);
                    result.add(ac);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }
    
    @POST
    @Path("/allergy")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput postAllergies(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IAllergyModel[] allergies = mapper.readValue(json, IAllergyModel[].class);
                
                List<Long> pkList = new ArrayList(allergies.length);
                Set<Long> karteIds = new HashSet<>();
                for (IAllergyModel am : allergies) {
                    ObservationModel om = am.toObservationModel();
                    long pk = ehtService.addAllergy(om);
                    pkList.add(pk);
                    if (am.getKartePK() > 0) {
                        karteIds.add(am.getKartePK());
                    }
                }
                mapper = getSerializeMapper();
                mapper.writeValue(os, pkList);

                Map<String, Object> details = new HashMap<>();
                details.put("createdAllergyIds", pkList);
                details.put("payloadCount", pkList.size());
                recordAuditEvent("EHT_ALLERGY_CREATE", "/20/adm/eht/allergy", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @PUT
    @Path("/allergy")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput putAllergies(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IAllergyModel[] allergies = mapper.readValue(json, IAllergyModel[].class);
                
                int cnt = 0;
                List<Long> observationIds = new ArrayList<>(allergies.length);
                Set<Long> karteIds = new HashSet<>();
                for (IAllergyModel am : allergies) {
                    ObservationModel om = am.toObservationModel();
                    ehtService.updateAllergy(om);
                    cnt++;
                    if (am.getObservationId() > 0) {
                        observationIds.add(am.getObservationId());
                    }
                    if (am.getKartePK() > 0) {
                        karteIds.add(am.getKartePK());
                    }
                }

                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                if (!observationIds.isEmpty()) {
                    details.put("updatedAllergyIds", observationIds);
                }
                details.put("affectedRows", cnt);
                recordAuditEvent("EHT_ALLERGY_UPDATE", "/20/adm/eht/allergy", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @DELETE
    @Path("/allergy")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput deleteAllergies(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IAllergyModel[] allergies = mapper.readValue(json, IAllergyModel[].class);

                int cnt = 0;
                List<Long> observationIds = new ArrayList<>(allergies.length);
                Set<Long> karteIds = new HashSet<>();
                for (IAllergyModel am : allergies) {
                    ObservationModel om = am.toObservationModel();
                    ehtService.deleteAllergy(om);
                    cnt++;
                    if (am.getObservationId() > 0) {
                        observationIds.add(am.getObservationId());
                    }
                    if (am.getKartePK() > 0) {
                        karteIds.add(am.getKartePK());
                    }
                }
                
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                if (!observationIds.isEmpty()) {
                    details.put("deletedAllergyIds", observationIds);
                }
                details.put("affectedRows", cnt);
                recordAuditEvent("EHT_ALLERGY_DELETE", "/20/adm/eht/allergy", joinKarteIds(karteIds), details);
            }
        };
    }
   
    @GET
    @Path("/diagnosis/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getDiagnosis(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String [] params = param.split(",");
                
                long ptPK = Long.parseLong(params[0]);
                boolean active = (params.length>1) ?  Boolean.parseBoolean(params[1]) : true;
                int first = (params.length>2) ? Integer.parseInt(params[2]) : 0;
                int maxResult = (params.length>3) ? Integer.parseInt(params[3]) : 100;
                boolean outcomeOnly = (params.length>4) ?  Boolean.parseBoolean(params[4]) : false;
                
                List<RegisteredDiagnosisModel> list = ehtService.getDiagnosis(ptPK, active, outcomeOnly, first, maxResult);
                List<IRegisteredDiagnosis> result = new ArrayList(list.size());
                for (RegisteredDiagnosisModel model : list) {
                    IRegisteredDiagnosis ir = new IRegisteredDiagnosis();
                    ir.fromModel(model);
                    result.add(ir);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }
    
    @POST
    @Path("/diagnosis")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput postDicease(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IRegisteredDiagnosis[] list = mapper.readValue(json, IRegisteredDiagnosis[].class);
                
                int cnt = 0;
                Set<Long> karteIds = new HashSet<>();
                List<String> diagnosisCodes = new ArrayList<>(list.length);
                for (IRegisteredDiagnosis ir : list) {
                    RegisteredDiagnosisModel model = ir.toModel();
                    ehtService.addDiagnosis(model);
                    cnt++;
                    if (ir.getKarteBean() != null) {
                        karteIds.add(ir.getKarteBean().getId());
                    }
                    if (ir.getDiagnosisCode() != null) {
                        diagnosisCodes.add(ir.getDiagnosisCode());
                    }
                }
                
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                if (!diagnosisCodes.isEmpty()) {
                    details.put("diagnosisCodes", diagnosisCodes);
                }
                details.put("payloadCount", cnt);
                recordAuditEvent("EHT_DIAGNOSIS_CREATE", "/20/adm/eht/diagnosis", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @PUT
    @Path("/diagnosis")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput putDicease(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IRegisteredDiagnosis[] list = mapper.readValue(json, IRegisteredDiagnosis[].class);
                
                int cnt = 0;
                Set<Long> karteIds = new HashSet<>();
                List<Long> diagnosisIds = new ArrayList<>(list.length);
                for (IRegisteredDiagnosis ir : list) {
                    RegisteredDiagnosisModel model = ir.toModel();
                    ehtService.updateDiagnosis(model);
                    cnt++;
                    if (ir.getKarteBean() != null) {
                        karteIds.add(ir.getKarteBean().getId());
                    }
                    if (ir.getId() > 0) {
                        diagnosisIds.add(ir.getId());
                    }
                }
                      
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                if (!diagnosisIds.isEmpty()) {
                    details.put("updatedDiagnosisIds", diagnosisIds);
                }
                details.put("affectedRows", cnt);
                recordAuditEvent("EHT_DIAGNOSIS_UPDATE", "/20/adm/eht/diagnosis", joinKarteIds(karteIds), details);
                
            }
        };
    }
    
    @DELETE
    @Path("/diagnosis")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput deleteDicease(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IRegisteredDiagnosis[] list = mapper.readValue(json, IRegisteredDiagnosis[].class);
                                
                int cnt = 0;
                Set<Long> karteIds = new HashSet<>();
                List<Long> diagnosisIds = new ArrayList<>(list.length);
                for (IRegisteredDiagnosis ir : list) {
                    RegisteredDiagnosisModel model = ir.toModel();
                    ehtService.deleteDiagnosis(model);
                    cnt++;
                    if (ir.getKarteBean() != null) {
                        karteIds.add(ir.getKarteBean().getId());
                    }
                    if (ir.getId() > 0) {
                        diagnosisIds.add(ir.getId());
                    }
                }
                
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                if (!diagnosisIds.isEmpty()) {
                    details.put("deletedDiagnosisIds", diagnosisIds);
                }
                details.put("affectedRows", cnt);
                recordAuditEvent("EHT_DIAGNOSIS_DELETE", "/20/adm/eht/diagnosis", joinKarteIds(karteIds), details);
            }
        };
    }
    
    @GET
    @Path("/progresscourse/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getProgresscourse(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String [] params = param.split(",");
                long ptPK = Long.parseLong(params[0]);
                int firstResult = Integer.parseInt(params[1]);
                int maxResult = Integer.parseInt(params[2]);
                
                List<ModuleModel> list = ehtService.getModules(ptPK, IInfoModel.MODULE_PROGRESS_COURSE, firstResult, maxResult);
                List<IProgressCourseModule30> ret = new ArrayList();
                
                for (ModuleModel mm : list) {
                    if (mm.getModuleInfoBean().getEntity().equals(IInfoModel.MODULE_PROGRESS_COURSE) && 
                            mm.getModuleInfoBean().getStampRole().equals(IInfoModel.ROLE_SOA_SPEC)) {
                    
                        // documentは取得している (ManyToOneなので）
                        /*if (mm.getDocumentModel()!=null) {
                            System.err.println("docPK =" + mm.getDocumentModel().getId());
                        }
                        else {
                            System.err.println("docPK = 0L");
                        }*/
                        IProgressCourseModule30 ip = new IProgressCourseModule30();
                        ip.fromModel(mm);
                        ret.add(ip);
                    }
                }
               
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, ret);
            }
        };
    }

    @GET
    @Path("/module/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getModule(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String[] params = param.split(",");
                if (params.length < 4) {
                    throw new WebApplicationException();
                }
                long patientPk = Long.parseLong(params[0]);
                String entity = params[1];
                int firstResult = Integer.parseInt(params[2]);
                int maxResult = Integer.parseInt(params[3]);

                List<ModuleModel> list = ehtService.getModules(patientPk, entity, firstResult, maxResult);
                List<IBundleModule> result = new ArrayList<>(list.size());
                for (ModuleModel module : list) {
                    IBundleModule converted = new IBundleModule();
                    converted.fromModel(module);
                    if (module.getModel() instanceof BundleDolphin bundle) {
                        converted.getModel().setOrderName(bundle.getOrderName());
                    } else if (module.getModuleInfoBean() != null) {
                        converted.getModel().setOrderName(module.getModuleInfoBean().getEntity());
                    }
                    result.add(converted);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }

    @GET
    @Path("/module/last/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getLastModule(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String[] params = param.split(",");
                if (params.length < 2) {
                    throw new WebApplicationException();
                }
                long patientPk = Long.parseLong(params[0]);
                String entity = params[1];

                List<ModuleModel> list = ehtService.getLastModule(patientPk, entity);
                List<IBundleModule> result = new ArrayList<>(list.size());
                for (ModuleModel module : list) {
                    IBundleModule converted = new IBundleModule();
                    converted.fromModel(module);
                    if (module.getModel() instanceof BundleDolphin bundle) {
                        converted.getModel().setOrderName(bundle.getOrderName());
                    } else if (module.getModuleInfoBean() != null) {
                        converted.getModel().setOrderName(module.getModuleInfoBean().getEntity());
                    }
                    result.add(converted);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }
    
    @GET
    @Path("/module/laboTest/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getLaboTest(final @PathParam("param") String param) {
 
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String [] params = param.split(",");
                String facilityId = params[0];
                String patientId = params[1];
                int firstResult = Integer.parseInt(params[2]);
                int maxResult = Integer.parseInt(params[3]);

                List<NLaboModule> list = ehtService.getLaboTest(facilityId, patientId, firstResult, maxResult);
                List<NLaboModuleConverter> result = new ArrayList(list.size());
                for (NLaboModule module : list) {
                    NLaboModuleConverter conv = new NLaboModuleConverter();
                    conv.setModel(module);
                    result.add(conv);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        }; 
    }
    
    @GET
    @Path("/item/laboItem/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getLaboGraph(@PathParam("param") String param) {

        String [] params = param.split(",");
        
        String facilityId = params[0];
        String patientId = params[1];
        int firstResult = Integer.parseInt(params[2]);
        int maxResult = Integer.parseInt(params[3]);
        String itemCode = params[4];

        List<NLaboItem> list  = ehtService.getLaboTestItem(facilityId, patientId, firstResult, maxResult, itemCode);
        int cnt = list.size();
        
        final ILaboGraphItem graph = new ILaboGraphItem();

        if (cnt==0) {
            return new StreamingOutput() {
                @Override
                public void write(OutputStream os) throws IOException, WebApplicationException {
                    ObjectMapper mapper = getSerializeMapper();
                    mapper.writeValue(os, graph);
                }
            }; 
        }

        // この検査項目の共通情報を出力する
        NLaboItem item = list.get(cnt-1);
        
        // 検査項目コード
        graph.setItemCode(item.getItemCode());

        // 検査項目名
        graph.setItemName(item.getItemName());

        // 基準値
        graph.setNormalValue(item.getNormalValue());

        // 単位
        graph.setUnit(item.getUnit());

        // sampleDate の逆順で結果データを出力する
        for (int k = 0; k < cnt; k++) {

            item = list.get(k);
            ILaboValue value = new ILaboValue();

            // sampleDate
            value.setSampleDate(item.getSampleDate());

            // value
            value.setValue(item.getValue());

            // comment1
            value.setComment1(item.getComment1());

            // comment2
            value.setComment2(item.getComment2());
            
            graph.addValue(value);
        }

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, graph);
            }
        }; 
    }

    @GET
    @Path("/docinfo/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getFastDocInfoList(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long ptPK = Long.parseLong(param);
                List<DocInfoModel> list = ehtService.getDocInfoList(ptPK);
                List<IFastDocInfo> result = new ArrayList<>(list.size());
                for (DocInfoModel model : list) {
                    IFastDocInfo converted = new IFastDocInfo();
                    converted.fromModel(model);
                    result.add(converted);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }

    @GET
    @Path("/document/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getDocument(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long docPK = Long.parseLong(param);
                DocumentModel doc = ehtService.getDocumentByPk(docPK);
                doc.toDetuch();
//                if (doc.getUserModel()!=null) {
//                    System.err.println("doc.getUserModel()!=null");
//                    System.err.println(doc.getUserModel().getCommonName());
//                }
//                else {
//                    System.err.println("doc.getUserModel()==null");
//                }
                IDocument idoc = new IDocument();
                idoc.fromModel(doc);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, idoc);
            }
        };
    }

    @GET
    @Path("/document2/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getDocument2(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long docPK = Long.parseLong(param);
                DocumentModel doc = ehtService.getDocumentByPk(docPK);
                doc.toDetuch();
                IDocument2 converted = new IDocument2();
                converted.fromModel(doc);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, converted);
            }
        };
    }

    @GET
    @Path("/attachment/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getAttachment(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long id = Long.parseLong(param);
                AttachmentModel attachment = ehtService.getAttachment(id);
                IAttachmentModel converted = new IAttachmentModel();
                if (attachment != null) {
                    converted.fromModel(attachment);
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, converted);
            }
        };
    }

    @PUT
    @Path("/sendClaim")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput sendPackage(final String json) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                ISendPackage pkg = mapper.readValue(json, ISendPackage.class);

                handleClaimSend(pkg.documentModel(), pkg.chartEventModel(), os, "EHT_CLAIM_SEND", "/20/adm/eht/sendClaim");
            }
        };
    }

    @PUT
    @Path("/sendClaim2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput sendPackage2(final String json) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                ISendPackage2 pkg = mapper.readValue(json, ISendPackage2.class);

                handleClaimSend(pkg.documentModel(), pkg.chartEventModel(), os, "EHT_CLAIM_SEND2", "/20/adm/eht/sendClaim2");
            }
        };
    }

    private void handleClaimSend(DocumentModel document, ChartEventModel chartEvent, OutputStream os,
            String auditAction, String endpoint) throws IOException {
        boolean fallback = false;
        Exception fallbackCause = null;
        try {
            if (document != null) {
                karteService.sendDocument(document);
            }
            if (chartEvent != null) {
                eventServiceBean.processChartEvent(chartEvent);
            }
        } catch (StringIndexOutOfBoundsException ex) {
            fallback = true;
            fallbackCause = ex;
            logClaimFallback(endpoint, ex);
        }
        os.write(fallback ? FALLBACK_RESPONSE : SUCCESS_RESPONSE);
        Map<String, Object> details = buildClaimAuditDetails(document, chartEvent);
        if (fallback) {
            details.put("fallbackReason", fallbackCause != null ? fallbackCause.getClass().getSimpleName() : "StringIndexOutOfBoundsException");
            details.put("fallbackMessage", fallbackCause != null ? fallbackCause.getMessage() : "StringIndexOutOfBoundsException");
            details.put("fallbackTraceId", Optional.ofNullable(currentTraceId()).orElse("unknown"));
        }
        recordAuditEvent(auditAction, endpoint, resolvePatientFromDocumentOrEvent(document, chartEvent), details);
    }

    private Map<String, Object> buildClaimAuditDetails(DocumentModel document, ChartEventModel chartEvent) {
        Map<String, Object> details = new HashMap<>();
        if (document != null) {
            if (document.getDocInfoModel() != null) {
                details.put("documentId", document.getDocInfoModel().getDocId());
            } else {
                details.put("documentPk", document.getId());
            }
            if (document.getKarteBean() != null) {
                details.put("karteId", document.getKarteBean().getId());
            }
        }
        if (chartEvent != null) {
            details.put("chartEventType", chartEvent.getEventType());
            details.put("chartEventFacility", chartEvent.getFacilityId());
        }
        return details;
    }

    private void logClaimFallback(String endpoint, Exception ex) {
        String traceId = Optional.ofNullable(currentTraceId()).orElse("unknown");
        String message = String.format("Fallback response issued by %s due to %s [traceId=%s]",
                endpoint, ex.getClass().getSimpleName(), traceId);
        LOGGER.log(Level.WARNING, message, ex);
    }

    @DELETE
    @Path("/document")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput deleteDocument(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                String[] pks = mapper.readValue(json, String[].class);
                
                long pk = Long.parseLong(pks[0]);
                Long karteId = null;
                try {
                    DocumentModel document = ehtService.getDocumentByPk(pk);
                    if (document != null && document.getKarteBean() != null) {
                        karteId = document.getKarteBean().getId();
                    }
                } catch (Exception ignore) {
                    // 監査用の参照が失敗しても削除処理は継続する
                }
                try {
                    List<String> list = ehtService.deleteDocumentByPk(pk);
                    
                    mapper = getSerializeMapper();
                    mapper.writeValue(os, list);

                    Map<String, Object> details = new HashMap<>();
                    details.put("deletedDocGroup", list);
                    details.put("requestedDocPk", pk);
                    details.put("status", "success");
                    recordAuditEvent("EHT_DOCUMENT_DELETE", "/20/adm/eht/document", karteId != null ? String.valueOf(karteId) : null, details);
                } catch (Exception ex) {
                    Map<String, Object> details = new HashMap<>();
                    details.put("requestedDocPk", pk);
                    details.put("status", "failed");
                    details.put("reason", ex.getClass().getSimpleName());
                    String message = ex.getMessage();
                    if (message == null || message.isBlank()) {
                        message = "Document delete failed.";
                    }
                    details.put("errorMessage", message);
                    recordAuditEvent("EHT_DOCUMENT_DELETE", "/20/adm/eht/document", karteId != null ? String.valueOf(karteId) : null, details);
                    if (ex instanceof WebApplicationException) {
                        throw (WebApplicationException) ex;
                    }
                    if (ex instanceof IOException) {
                        throw (IOException) ex;
                    }
                    throw new WebApplicationException(ex);
                }
            }
        };
    }
    
    @GET
    @Path("/order/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput collectModules(final @PathParam("param") String param) {
        
        return new StreamingOutput() {

            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                
                String [] params = param.split(",");
                
                long pk = Long.parseLong(params[0]);            // patientPK
                
                Date fromDate = IOSHelper.toDate(params[1]);    // fromDate
                Date toDate = IOSHelper.toDate(params[2]);      // tOdate
                
                List<String> entities = null;
                // 併用禁忌不具合対応
                //if (params.length>3)
                //{
                //    entities = new ArrayList(2);
                //    for (int i=3; i <params.length; i++) {
                //        entities.add(params[i]);                     // entity
                //    }
                //}
                //
                //List<ModuleModel> list = ehtService.collectModules(pk, fromDate, toDate, entities);
                //List<IBundleModule> result = new ArrayList(list.size());
                //
                //for (ModuleModel module : list) {
                //
                //    if (module.getModel() instanceof BundleDolphin) {
                //
                //        IBundleModule ib = new IBundleModule();
                //        ib.fromModel(module);
                //        // trick
                //        //if (module.getModel() instanceof BundleDolphin) {
                //            BundleDolphin bd = (BundleDolphin)module.getModel();
                //            ib.getModel().setOrderName(bd.getOrderName());
                //        //} else {
                //            //ib.getModel().setOrderName(module.getModuleInfoBean().getEntity());
                //        //}
                //        result.add(ib);
                //    }
                //}
                if (params.length>3)
                {
                    entities = new ArrayList(2);
                    for (int i=3; i <params.length; i++) {
                        entities.add(params[i]);                     // entity
                    }
                }else{
                    entities = new ArrayList(2);
                    entities.add(IInfoModel.ENTITY_MED_ORDER);
                }
                
                List<ModuleModel> list = ehtService.collectModules(pk, fromDate, toDate, entities);
                List<IBundleModule> result = new ArrayList(list.size());

                for (ModuleModel module : list) {
                    if (module.getModel() instanceof BundleDolphin) {
                        IBundleModule ib = new IBundleModule();
                        ib.fromModel(module);
                        BundleDolphin bd = (BundleDolphin)module.getModel();
                        ib.getModel().setOrderName(bd.getOrderName());
                        result.add(ib);
                    }else{
                        IBundleModule ib = new IBundleModule();
                        ib.fromModel(module);
                        result.add(ib);
                    }
                }
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(output, result);
            }
        };
    }
    
    @PUT
    @Path("/interaction")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput checkInteraction(final String json) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {

                ObjectMapper mapper = new ObjectMapper();
                InteractionCodeList input = mapper.readValue(json, InteractionCodeList.class);
                
//                if (input.getCodes1()!=null)
//                {
//                    for (String code : input.getCodes1()) {
//                        System.err.println(code);
//                    }
//                }
//                if (input.getCodes2()!=null)
//                {
//                    for (String code : input.getCodes2()) {
//                        System.err.println(code);
//                    }
//                }

                // 相互作用モデルのリスト
                List<DrugInteractionModel> ret = new ArrayList<>();

                if (input.getCodes1() == null       || 
                        input.getCodes1().isEmpty() || 
                        input.getCodes2() == null   || 
                        input.getCodes2().isEmpty()) {
                    mapper = getSerializeMapper();
                    mapper.writeValue(os, ret);
                }

                // SQL文を作成
                StringBuilder sb = new StringBuilder();
                sb.append("select drugcd, drugcd2, TI.syojyoucd, syojyou ");
                sb.append("from tbl_interact TI inner join tbl_sskijyo TS on TI.syojyoucd = TS.syojyoucd ");
                sb.append("where (drugcd in (");
                sb.append(getCodes(input.getCodes1()));
                sb.append(") and drugcd2 in (");
                sb.append(getCodes(input.getCodes2()));
                sb.append("))");
                String sql = sb.toString();

                Connection con = null;
                Statement st = null;

                try {
                    con = getConnection();
                    st = con.createStatement();
                    ResultSet rs = st.executeQuery(sql);

                    while (rs.next()) {
                        ret.add(new DrugInteractionModel(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4)));
                    }
                    rs.close();
                    closeStatement(st);
                    closeConnection(con);
                    mapper = getSerializeMapper();
                    mapper.writeValue(os, ret);
                    
                } catch (Exception e) {
                    processError(e);
                    closeStatement(st);
                    closeConnection(con);
                    throw new WebApplicationException(e);
                }
            }
        };
    }    
//--------------------------------------------------------------------    
    
    @GET
    @Path("/stampTree/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getStampTree(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long pk = Long.parseLong(param);
                String json = getTreeJson(pk);
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }
        };
    }
    
    private String getTreeJson(long userPK) {
        
        IStampTreeModel treeModel = ehtService.getTrees(userPK);
        
        try {
            String treeXml = new String(treeModel.getTreeBytes(), StandardCharsets.UTF_8);
            BufferedReader reader = new BufferedReader(new StringReader(treeXml));
            JSONStampTreeBuilder builder = new JSONStampTreeBuilder();
            StampTreeDirector director = new StampTreeDirector(builder);
            String json = director.build(reader);
            reader.close();
            return json;
        } catch (UnsupportedEncodingException ex) {
            //System.err.println("getTreeJson:" + ex.getMessage());
        } catch (IOException ex) {
            //System.err.println("getTreeJson:" + ex.getMessage());
        }
        return null;
    }
    
    @GET
    @Path("/stamp/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getStamp(final @PathParam("param") String param) {
        
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {

                StampModel stampModel = ehtService.getStamp(param);
                if (stampModel!=null) {
                    XMLDecoder d = new XMLDecoder(
                        new BufferedInputStream(
                        new ByteArrayInputStream(stampModel.getStampBytes())));
                    InfoModel model = (InfoModel)d.readObject();
                    JSONStampBuilder builder = new JSONStampBuilder();
                    String json = builder.build(model);
                    os.write(json.getBytes(StandardCharsets.UTF_8));
                } else {
                    os.write(null);
                }
            }
        };
    }
    
    /**
     * 保健医療機関コードとJMARIコードを取得する。
     * @return 
     */
    private String getFacilityCodeBy1001() {
       
//s.oh^ 2013/10/17 ローカルORCA対応
        try {
            // custom.properties から 保健医療機関コードとJMARIコードを読む
            Properties config = new Properties();
            // コンフィグファイルを読み込む
            StringBuilder sb = new StringBuilder();
            sb.append(System.getProperty("jboss.home.dir"));
            sb.append(File.separator);
            sb.append("custom.properties");
            File f = new File(sb.toString());
            FileInputStream fin = new FileInputStream(f);
            InputStreamReader r = new InputStreamReader(fin, "JISAutoDetect");
            config.load(r);
            r.close();
            // JMARI code
            String jmari = config.getProperty("jamri.code");
            String hcfacility = config.getProperty("healthcarefacility.code");
            if(jmari != null && jmari.length() == 12 && hcfacility != null && hcfacility.length() == 10) {
                StringBuilder ret = new StringBuilder();
                ret.append(hcfacility);
                ret.append("JPN");
                ret.append(jmari);
                return ret.toString();
            }
        } catch (FileNotFoundException ex) {
            LOGGER.log(Level.SEVERE, "custom.properties not found while resolving facility identifiers", ex);
        } catch (UnsupportedEncodingException ex) {
            LOGGER.log(Level.SEVERE, "Unsupported encoding when reading custom.properties", ex);
        } catch (IOException ex) {
            LOGGER.log(Level.SEVERE, "Failed to read custom.properties", ex);
        }
//s.oh$
        // SQL 文
        StringBuilder buf = new StringBuilder();
        buf.append(QUERY_FACILITYID_BY_1001);
        String sql = buf.toString();

        Connection con = null;
        PreparedStatement ps;
        
        StringBuilder ret = new StringBuilder();

        try {
            con = getConnection();
            ps = con.prepareStatement(sql);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                appendFacilityIdentifiers(ret, rs.getString(1), "adm20");
            }
            rs.close();
            ps.close();
            con.close();
            con = null;

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Failed to load facility/JMARI identifiers from tbl_syskanri", e);
        } finally {
            if (con != null) {
                try {
                    con.close();
                } catch (SQLException e) {
                }
            }
        }

        return ret.toString();        
    }

    @GET
    @Path("/vital/pat/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getPatVital(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                String fidPid = getFidPid(servletReq.getRemoteUser(), param);
                List<VitalModel> list = ehtService.getPatVital(fidPid);
                List<IVitalModel> result = new ArrayList<>(list.size());
                for (VitalModel model : list) {
                    IVitalModel converted = new IVitalModel();
                    converted.fromModel(model);
                    result.add(converted);
                }
                mapper = getSerializeMapper();
                mapper.writeValue(os, result);
            }
        };
    }

    @POST
    @Path("/vital")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput postVital(final String json) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IVitalModel input = mapper.readValue(json, IVitalModel.class);
                VitalModel model = input.toModel();
                int cnt = ehtService.addVital(model);
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                details.put("facilityPatId", input.getFacilityPatId());
                details.put("vitalDate", input.getDate());
                details.put("vitalTime", input.getTime());
                details.put("vitalId", model.getId());
                recordAuditEvent("EHT_VITAL_CREATE", "/20/adm/eht/vital", extractPatientFromFidPid(input.getFacilityPatId()), details);
            }
        };
    }

    @DELETE
    @Path("/vital/id/{param}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput removeVital(final String json) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String vitalId = json.replace("\"", "").trim();
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                int cnt = ehtService.removeVital(vitalId);
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                details.put("vitalId", vitalId);
                recordAuditEvent("EHT_VITAL_DELETE", "/20/adm/eht/vital", null, details);
            }
        };
    }

    @GET
    @Path("/physical/karteid/{param}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getKartePhysical(@PathParam("param") String param) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                long karteId = Long.parseLong(param);
                List<IPhysicalModel> list = ehtService.getPhysicals(karteId);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, list);
            }
        };
    }

    @POST
    @Path("/physical")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput postPhysical(final String json) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                IPhysicalModel model = mapper.readValue(json, IPhysicalModel.class);
                List<ObservationModel> observations = model.toObservationModel();
                List<Long> ids = ehtService.addObservations(observations);
                mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(ids != null ? ids.size() : 0));

                Map<String, Object> details = new HashMap<>();
                details.put("observationIds", ids);
                Long karteId = model.getKartePK() > 0 ? model.getKartePK() : null;
                if (karteId != null) {
                    details.put("karteId", karteId);
                }
                recordAuditEvent("EHT_PHYSICAL_CREATE", "/20/adm/eht/physical", karteId != null ? String.valueOf(karteId) : null, details);
            }
        };
    }

    @DELETE
    @Path("/physical/id/{param}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput removePhysical(final String json) {

        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                String[] tokens = json.split(CAMMA);
                List<Long> ids = new ArrayList<>(tokens.length);
                for (String token : tokens) {
                    ids.add(Long.parseLong(token.trim()));
                }
                int cnt = ehtService.removeObservations(ids);
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, String.valueOf(cnt));

                Map<String, Object> details = new HashMap<>();
                details.put("observationIds", ids);
                recordAuditEvent("EHT_PHYSICAL_DELETE", "/20/adm/eht/physical", null, details);
            }
        };
    }

    // サーバー情報の取得
    @GET
    @Path("/claim/conn")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getClaimConn() {
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = getSerializeMapper();
                mapper.writeValue(os, getProperty(CLAIM_CONN));
            }
        };
    }
    
    @GET
    @Path("/serverinfo")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public StreamingOutput getServerInfo() {
        return new StreamingOutput() {
            @Override
            public void write(OutputStream os) throws IOException, WebApplicationException {
                ObjectMapper mapper = getSerializeMapper();
                
                StringBuilder sb = new StringBuilder();
                sb.append((getProperty(MOBILE_KIND).toLowerCase().equals("cis")) ? "1" : "0");
                sb.append(",");
                sb.append((getProperty(MOBILE_ONOFF).toLowerCase().equals("on")) ? "1" : "0");
                
                mapper.writeValue(os, sb.toString());
//                mapper.writeValue(os, getProperty(MOBILE_ONOFF));
//                mapper.writeValue(os, getProperty(SERVER_VERSION));
//                mapper.writeValue(os, getProperty(DOLPHIN_FACILITYID));
//                mapper.writeValue(os, getProperty(JAMRI_CODE));
//                mapper.writeValue(os, getProperty(USE_AS_PVTSERVER));
//                mapper.writeValue(os, getProperty(PVT_LISTEN_BINDIP));
//                mapper.writeValue(os, getProperty(PVT_LISTEN_PORT));
//                mapper.writeValue(os, getProperty(PVT_LISTEN_ENCODING));
//                mapper.writeValue(os, getProperty(CLAIM_CONN));
//                mapper.writeValue(os, getProperty(CLAIM_HOST));
//                mapper.writeValue(os, getProperty(CLAIM_SEND_PORT));
//                mapper.writeValue(os, getProperty(CLAIM_SEND_ENCODING));
//                mapper.writeValue(os, getProperty(CLAIM_JDBC_URL));
//                mapper.writeValue(os, getProperty(CLAIM_USER));
//                mapper.writeValue(os, getProperty(CLAIM_PASSWORD));
//                mapper.writeValue(os, getProperty(RP_DEFAULT_INOUT));
//                mapper.writeValue(os, getProperty(PVTLIST_CLEAR));
            }
        };
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
        if (CLAIM_USER.equals(prop) || CLAIM_PASSWORD.equals(prop)) {
            return true;
        }
        return prop.startsWith("claim.jdbc.");
    }

    private String currentTraceId() {
        if (sessionTraceManager == null) {
            return null;
        }
        SessionTraceContext context = sessionTraceManager.current();
        return context != null ? context.getTraceId() : null;
    }

    private void appendFacilityIdentifiers(StringBuilder target, String rawValue, String context) {
        if (rawValue == null || rawValue.isEmpty()) {
            LOGGER.log(Level.WARNING, () -> String.format("%s: tbl_syskanri.kanritbl is empty for kanricd=1001", context));
            return;
        }
        appendSubstringSafely(target, rawValue, 0, FACILITY_ID_LENGTH, "facilityId", context);
        int index = rawValue.indexOf(JMARI_PREFIX);
        if (index >= 0) {
            appendSubstringSafely(target, rawValue, index, JMARI_ID_LENGTH, "jmariCode", context);
        } else {
            LOGGER.log(Level.WARNING, () -> String.format("%s: JMARI prefix '%s' not found in value '%s'", context, JMARI_PREFIX, rawValue));
        }
    }

    private void appendSubstringSafely(StringBuilder target, String value, int beginIndex, int expectedLength,
            String fieldName, String context) {
        if (value.length() <= beginIndex) {
            LOGGER.log(Level.WARNING, () -> String.format(
                    "%s: insufficient length for %s (beginIndex=%d, valueLength=%d, raw=%s)",
                    context, fieldName, beginIndex, value.length(), value));
            return;
        }
        int endExclusive = Math.min(value.length(), beginIndex + expectedLength);
        if (value.length() < beginIndex + expectedLength) {
            LOGGER.log(Level.WARNING, () -> String.format(
                    "%s: truncated %s (expectedLength=%d, available=%d, raw=%s)",
                    context, fieldName, expectedLength, value.length() - beginIndex, value));
        }
        target.append(value, beginIndex, endExclusive);
    }

    private String resolvePatientFromDocumentOrEvent(DocumentModel document, ChartEventModel chartEvent) {
        if (document != null && document.getKarteBean() != null && document.getKarteBean().getPatientModel() != null) {
            return String.valueOf(document.getKarteBean().getPatientModel().getId());
        }
        if (chartEvent != null) {
            if (chartEvent.getPatientModel() != null) {
                return String.valueOf(chartEvent.getPatientModel().getId());
            }
            if (chartEvent.getPtPk() > 0) {
                return String.valueOf(chartEvent.getPtPk());
            }
        }
        return null;
    }

    private String extractPatientFromFidPid(String fidPid) {
        if (fidPid == null || fidPid.isBlank()) {
            return null;
        }
        int index = fidPid.indexOf(IInfoModel.COMPOSITE_KEY_MAKER);
        if (index < 0 || index + 1 >= fidPid.length()) {
            return null;
        }
        return fidPid.substring(index + 1);
    }

    private void recordAuditEvent(String action, String resource, String patientId, Map<String, Object> extraDetails) {
        if (auditTrailService == null) {
            return;
        }
        Map<String, Object> details = prepareAuditDetails(extraDetails);
        AuditEventPayload payload = new AuditEventPayload();
        String actorId = resolveActorId();
        payload.setActorId(actorId);
        payload.setActorDisplayName(actorId);
        if (servletReq != null && servletReq.isUserInRole("ADMIN")) {
            payload.setActorRole("ADMIN");
        }
        payload.setAction(action);
        payload.setResource(resource);
        payload.setPatientId(patientId);
        if (servletReq != null) {
            payload.setIpAddress(servletReq.getRemoteAddr());
            payload.setUserAgent(servletReq.getHeader("User-Agent"));
            payload.setRequestId(Optional.ofNullable(servletReq.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString()));
        } else {
            payload.setRequestId(UUID.randomUUID().toString());
        }
        String traceId = resolveTraceId(servletReq);
        if (traceId == null || traceId.isBlank()) {
            traceId = payload.getRequestId();
        }
        payload.setTraceId(traceId);
        payload.setDetails(details);
        auditTrailService.record(payload);
    }

    private Map<String, Object> prepareAuditDetails(Map<String, Object> extraDetails) {
        Map<String, Object> details = new HashMap<>();
        if (extraDetails != null && !extraDetails.isEmpty()) {
            details.putAll(extraDetails);
        }
        SessionTraceContext context = sessionTraceManager != null ? sessionTraceManager.current() : null;
        if (context != null) {
            details.putIfAbsent("traceId", context.getTraceId());
            details.putIfAbsent("sessionOperation", context.getOperation());
        }
        String remoteUser = servletReq != null ? servletReq.getRemoteUser() : null;
        if (remoteUser != null && !remoteUser.isEmpty()) {
            details.putIfAbsent("facilityId", getRemoteFacility(remoteUser));
        }
        return details;
    }

    private String resolveActorId() {
        if (servletReq == null) {
            return "anonymous";
        }
        String remoteUser = servletReq.getRemoteUser();
        return remoteUser != null ? remoteUser : "anonymous";
    }

    private String joinKarteIds(Set<Long> karteIds) {
        if (karteIds == null || karteIds.isEmpty()) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        boolean first = true;
        for (Long id : karteIds) {
            if (id == null) {
                continue;
            }
            if (!first) {
                builder.append(',');
            }
            builder.append(id);
            first = false;
        }
        return builder.length() == 0 ? null : builder.toString();
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
    
    private Connection getConnection() throws SQLException {
        return ORCAConnection.getInstance().getConnection();
    }
    
    private void closeStatement(java.sql.Statement st) {
        if (st != null) {
            try {
                st.close();
            }
            catch (SQLException e) {
            	e.printStackTrace(System.err);
            }
        }
    }
    
    private void closeConnection(Connection c) {
        try {
            c.close();
        } catch (Exception e) {
            e.printStackTrace(System.err);
        }
    }
    
    private void processError(Throwable e) {
        e.printStackTrace(System.err);
    }
}
