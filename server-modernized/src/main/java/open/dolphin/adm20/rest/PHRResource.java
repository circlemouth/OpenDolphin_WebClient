package open.dolphin.adm20.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.persistence.NoResultException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.adm20.dto.PhrExportJobResponse;
import open.dolphin.adm20.dto.PhrExportRequest;
import open.dolphin.adm20.dto.PhrMedicationResponse;
import open.dolphin.adm20.export.PhrExportConfig;
import open.dolphin.adm20.export.PhrExportJobManager;
import open.dolphin.adm20.export.PhrExportStorage;
import open.dolphin.adm20.export.PhrExportStorageFactory;
import open.dolphin.adm20.export.SignedUrlService;
import open.dolphin.adm20.mbean.IdentityService;
import open.dolphin.adm20.rest.support.PhrAuditHelper;
import open.dolphin.adm20.rest.support.PhrErrorMapper;
import open.dolphin.adm20.rest.support.PhrRequestContext;
import open.dolphin.adm20.rest.support.PhrRequestContextExtractor;
import open.dolphin.adm20.session.AMD20_PHRServiceBean;
import open.dolphin.adm20.session.PHRAsyncJobServiceBean;
import open.dolphin.adm20.support.PhrDataAssembler;
import open.dolphin.infomodel.AllergyModel;
import open.dolphin.infomodel.KarteBean;
import open.dolphin.infomodel.ModuleModel;
import open.dolphin.infomodel.NLaboItem;
import open.dolphin.infomodel.NLaboModule;
import open.dolphin.infomodel.PHRAsyncJob;
import open.dolphin.infomodel.PHRContainer;
import open.dolphin.infomodel.PHRKey;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import open.dolphin.infomodel.SchemaModel;

@Path("/20/adm/phr")
public class PHRResource extends open.dolphin.rest.AbstractResource {

    private static final Logger LOGGER = Logger.getLogger(PHRResource.class.getName());
    private static final String TRACE_ID_ATTRIBUTE = open.dolphin.rest.LogFilter.class.getName() + ".TRACE_ID";
    private static final String HEADER_TRACE_ID = "X-Trace-Id";
    private static final String HEADER_FACILITY_ID = "X-Facility-Id";
    private static final long DEFAULT_SIGNED_URL_TTL_SECONDS = 300L;
    private static final String SIGNED_URL_ISSUER = "RESTEASY";
    private static final String SIGNED_URL_BANDWIDTH_PROFILE = "phr-container";
    private static final String SIGNED_URL_KMS_KEY_ALIAS = "alias/opd/phr-export";
    private static final String SIGNED_URL_SUCCESS_ACTION = "PHR_SIGNED_URL_ISSUED";
    private static final String SIGNED_URL_FALLBACK_ACTION = "PHR_SIGNED_URL_NULL_FALLBACK";
    private static final String SIGNED_URL_FAILURE_ACTION = "PHR_SIGNED_URL_ISSUE_FAILED";
    private static final String SIGNED_URL_FALLBACK_REASON_NULL = "null_result";
    private static final String SIGNED_URL_FALLBACK_REASON_UNAVAILABLE = "signed_url_unavailable";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Inject
    private AMD20_PHRServiceBean phrServiceBean;

    @Inject
    private IdentityService identityService;

    @Inject
    private PhrDataAssembler dataAssembler;

    @Inject
    private PhrExportJobManager exportJobManager;

    @Inject
    private PHRAsyncJobServiceBean asyncJobService;

    @Inject
    private PhrAuditHelper auditHelper;

    @Inject
    private SignedUrlService signedUrlService;

    @Inject
    private PhrExportConfig exportConfig;

    @Inject
    private PhrExportStorageFactory storageFactory;

    @Context
    private HttpServletRequest request;

    @GET
    @Path("/accessKey/{accessKey}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response getPHRKeyByAccessKey(@PathParam("accessKey") String accessKey) {
        PhrRequestContext ctx = requireContext("PHR_ACCESS_KEY_FETCH");
        Map<String, Object> details = new HashMap<>();
        details.put("accessKeySuffix", accessKeySuffix(accessKey));
        try {
            PHRKey key = dataAssembler.findKeyByAccessKey(accessKey)
                    .orElseThrow(() -> error(Status.NOT_FOUND,
                            "error.phr.accessKeyNotFound",
                            "指定されたアクセスキーが見つかりません。",
                            ctx.traceId(),
                            null));
            ensureFacility(ctx, key.getFacilityId(), key.getPatientId(), "PHR_ACCESS_KEY_FETCH", details);
            key.dateToString();
            auditSuccess(ctx, "PHR_ACCESS_KEY_FETCH", key.getPatientId(), details);
            return streamJson(key, MediaType.APPLICATION_OCTET_STREAM_TYPE);
        } catch (WebApplicationException ex) {
            Integer status = ex.getResponse() != null ? ex.getResponse().getStatus() : null;
            auditFailure(ctx, "PHR_ACCESS_KEY_FETCH", null, ex.getResponse().getStatusInfo().toString(),
                    failureDetails(details, ex, status));
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_ACCESS_KEY_FETCH", null, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "PHRアクセスキー取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/patient/{patientId}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response getPHRKeyByPatientId(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_ACCESS_KEY_FETCH_BY_PATIENT");
        Map<String, Object> details = new HashMap<>();
        details.put("patientId", patientId);
        try {
            PHRKey key = dataAssembler.findKeyByPatientId(patientId)
                    .orElseThrow(() -> error(Status.NOT_FOUND,
                            "error.phr.accessKeyNotFound",
                            "指定された患者に対応するアクセスキーが見つかりません。",
                            ctx.traceId(),
                            null));
            ensureFacility(ctx, key.getFacilityId(), key.getPatientId(), "PHR_ACCESS_KEY_FETCH_BY_PATIENT", details);
            key.dateToString();
            auditSuccess(ctx, "PHR_ACCESS_KEY_FETCH_BY_PATIENT", key.getPatientId(), details);
            return streamJson(key, MediaType.APPLICATION_OCTET_STREAM_TYPE);
        } catch (WebApplicationException ex) {
            Integer status = ex.getResponse() != null ? ex.getResponse().getStatus() : null;
            auditFailure(ctx, "PHR_ACCESS_KEY_FETCH_BY_PATIENT", patientId, ex.getResponse().getStatusInfo().toString(),
                    failureDetails(details, ex, status));
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_ACCESS_KEY_FETCH_BY_PATIENT", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "PHRアクセスキー取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @PUT
    @Path("/accessKey")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response putPHRKey(String json) {
        PhrRequestContext ctx = requireContext("PHR_ACCESS_KEY_UPSERT");
        Map<String, Object> details = new HashMap<>();
        try {
            PHRKey key = objectMapper.readValue(json, PHRKey.class);
            key.stringToDate();
            if (key.getRegistered() == null) {
                key.setRegistered(new Date());
            }
            key.setFacilityId(ctx.facilityId());
            Long pk = phrServiceBean.addOrUpdatePatient(key);
            details.put("resultId", pk);
            details.put("patientId", key.getPatientId());
            auditSuccess(ctx, "PHR_ACCESS_KEY_UPSERT", key.getPatientId(), details);
            return streamJson(List.of(pk), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        } catch (IOException ex) {
            auditFailure(ctx, "PHR_ACCESS_KEY_UPSERT", null, "invalid_payload",
                    failureDetails(details, ex, Status.BAD_REQUEST.getStatusCode()));
            throw error(Status.BAD_REQUEST,
                    "error.phr.invalidPayload",
                    "リクエストボディの形式が不正です。",
                    ctx.traceId(),
                    ex);
        } catch (WebApplicationException ex) {
            Integer status = ex.getResponse() != null ? ex.getResponse().getStatus() : null;
            auditFailure(ctx, "PHR_ACCESS_KEY_UPSERT", null, ex.getResponse().getStatusInfo().toString(),
                    failureDetails(details, ex, status));
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_ACCESS_KEY_UPSERT", null, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "PHRアクセスキー登録中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/allergy/{patientId}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getAllergy(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_ALLERGY_TEXT");
        Map<String, Object> details = Map.of("patientId", patientId);
        try {
            KarteBean karte = requireKarte(ctx, patientId, "PHR_ALLERGY_TEXT", details);
            List<AllergyModel> list = phrServiceBean.getAllergies(karte.getId());
            if (list.isEmpty()) {
                auditSuccess(ctx, "PHR_ALLERGY_TEXT", patientId, details);
                return okText("アレルギーの登録はありません。");
            }
            StringBuilder sb = new StringBuilder();
            for (AllergyModel allergy : list) {
                sb.append(allergy.getFactor());
                if ("severe".equals(allergy.getSeverity())) {
                    sb.append(" ").append(allergy.getSeverity());
                }
                sb.append("\n");
            }
            if (sb.length() > 0) {
                sb.setLength(sb.length() - 1);
            }
            auditSuccess(ctx, "PHR_ALLERGY_TEXT", patientId, details);
            return okText(sb.toString());
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_ALLERGY_TEXT", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "アレルギー情報取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/disease/{patientId}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getDisease(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_DISEASE_TEXT");
        Map<String, Object> details = Map.of("patientId", patientId);
        try {
            KarteBean karte = requireKarte(ctx, patientId, "PHR_DISEASE_TEXT", details);
            List<RegisteredDiagnosisModel> list = phrServiceBean.getDiagnosis(karte.getId());
            if (list.isEmpty()) {
                auditSuccess(ctx, "PHR_DISEASE_TEXT", patientId, details);
                return okText("病名の登録はありません。");
            }
            StringBuilder sb = new StringBuilder();
            for (RegisteredDiagnosisModel rd : list) {
                sb.append(rd.getDiagnosis()).append("\n");
            }
            if (sb.length() > 0) {
                sb.setLength(sb.length() - 1);
            }
            auditSuccess(ctx, "PHR_DISEASE_TEXT", patientId, details);
            return okText(sb.toString());
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_DISEASE_TEXT", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "病名情報取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/medication/{patientId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLastMedication(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_MEDICATION_TEXT");
        Map<String, Object> details = Map.of("patientId", patientId);
        try {
            KarteBean karte = requireKarte(ctx, patientId, "PHR_MEDICATION_TEXT", details);
            List<ModuleModel> modules = phrServiceBean.getLastMedication(karte.getId());
            PhrMedicationResponse result = dataAssembler.buildMedicationResponse(modules, ctx.facilityId());
            auditSuccess(ctx, "PHR_MEDICATION_TEXT", patientId, details);
            return streamJson(result, MediaType.APPLICATION_JSON_TYPE);
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_MEDICATION_TEXT", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "処方情報取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/labtest/{patientId}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getLastLabTest(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_LABTEST_TEXT");
        Map<String, Object> details = Map.of("patientId", patientId);
        try {
            List<NLaboModule> modules = phrServiceBean.getLastLabTest(ctx.facilityId(), patientId);
            String result = buildLabText(modules);
            auditSuccess(ctx, "PHR_LABTEST_TEXT", patientId, details);
            return okText(result);
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_LABTEST_TEXT", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "検査情報取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/abnormal/{patientId}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getAbnormalValue(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_LABTEST_ABNORMAL_TEXT");
        Map<String, Object> details = Map.of("patientId", patientId);
        try {
            List<NLaboModule> modules = phrServiceBean.getLastLabTest(ctx.facilityId(), patientId);
            String result = buildAbnormalText(modules);
            auditSuccess(ctx, "PHR_LABTEST_ABNORMAL_TEXT", patientId, details);
            return okText(result);
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_LABTEST_ABNORMAL_TEXT", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "異常値情報取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/image/{patientId}")
    @Produces("image/jpeg")
    public Response getImage(@PathParam("patientId") String patientId) {
        PhrRequestContext ctx = requireContext("PHR_IMAGE_FETCH");
        Map<String, Object> details = Map.of("patientId", patientId);
        try {
            Optional<SchemaModel> imageOpt = dataAssembler.findLatestImage(ctx.facilityId(), patientId);
            if (imageOpt.isEmpty()) {
                auditSuccess(ctx, "PHR_IMAGE_FETCH", patientId, details);
                return Response.status(Status.NOT_FOUND).build();
            }
            SchemaModel image = imageOpt.get();
            auditSuccess(ctx, "PHR_IMAGE_FETCH", patientId, details);
            byte[] bytes = image.getJpegByte();
            if (bytes == null || bytes.length == 0) {
                return Response.status(Status.NOT_FOUND).build();
            }
            return Response.ok(bytes, "image/jpeg")
                    .header("Content-Length", bytes.length)
                    .header("Cache-Control", "no-store")
                    .build();
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_IMAGE_FETCH", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "画像取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/{param}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPHRData(@PathParam("param") String param) {
        PhrRequestContext ctx = requireContext("PHR_CONTAINER_FETCH");
        String[] params = param.split(",");
        if (params.length < 2) {
            auditFailure(ctx, "PHR_CONTAINER_FETCH", null, "invalid_parameter",
                    failureDetails(Map.of("param", param, "paramLength", params.length), null,
                            Status.BAD_REQUEST.getStatusCode()));
            throw error(Status.BAD_REQUEST,
                    "error.phr.invalidParameter",
                    "パラメータ形式が不正です。",
                    ctx.traceId(),
                    null);
        }
        String facilityId = params[0];
        String patientId = params[1];
        String docSince = params.length >= 3 ? params[2] : null;
        String labSince = params.length >= 4 ? params[3] : null;
        int rpRequest = 0;
        String replyTo = null;
        if (params.length == 6) {
            try {
                rpRequest = Integer.parseInt(params[4]);
            } catch (NumberFormatException ex) {
                auditFailure(ctx, "PHR_CONTAINER_FETCH", patientId, "invalid_parameter",
                        failureDetails(Map.of("rpRequest", params[4]), ex, Status.BAD_REQUEST.getStatusCode()));
                throw error(Status.BAD_REQUEST,
                        "error.phr.invalidParameter",
                        "rpRequest が数値ではありません。",
                        ctx.traceId(),
                        ex);
            }
            replyTo = params[5];
        }
        Map<String, Object> details = new HashMap<>();
        details.put("patientId", patientId);
        details.put("documentSince", docSince);
        details.put("labSince", labSince);
        try {
            ensureFacility(ctx, facilityId, patientId, "PHR_CONTAINER_FETCH", details);
            PHRContainer container = dataAssembler.buildContainer(
                    facilityId,
                    patientId,
                    docSince,
                    labSince,
                    rpRequest,
                    replyTo);
            auditSuccess(ctx, "PHR_CONTAINER_FETCH", patientId, details);
            return streamJson(container, MediaType.APPLICATION_JSON_TYPE);
        } catch (WebApplicationException ex) {
            Integer status = ex.getResponse() != null ? ex.getResponse().getStatus() : null;
            auditFailure(ctx, "PHR_CONTAINER_FETCH", patientId, ex.getResponse().getStatusInfo().toString(),
                    failureDetails(details, ex, status));
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_CONTAINER_FETCH", patientId, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "PHRデータ取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @POST
    @Path("/identityToken")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    public String getIdentityToken(String json) {
        String traceId = resolveTraceId();
        requireTraceHeader("PHR_IDENTITY_TOKEN", traceId, null);
        try {
            JsonObject jso = Json.createReader(new java.io.StringReader(json)).readObject();
            String nonce = jso.getString("nonce");
            String user = jso.getString("user");
            String token = identityService.getIdentityToken(nonce, user);
            auditHelper.recordSuccess(null, "PHR_IDENTITY_TOKEN", user, Map.of("nonceLength", nonce.length()));
            return token;
        } catch (Exception ex) {
            Map<String, Object> details = new HashMap<>();
            details.put("error", ex.getClass().getSimpleName());
            if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
                details.put("errorMessage", ex.getMessage());
            }
            details.put("httpStatus", Status.INTERNAL_SERVER_ERROR.getStatusCode());
            auditHelper.recordFailure(null, "PHR_IDENTITY_TOKEN", null, ex.getClass().getSimpleName(), details);
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "Identity トークンの生成中にエラーが発生しました。",
                    traceId,
                    ex);
        }
    }

    @POST
    @Path("/export")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response requestExport(String json) {
        PhrRequestContext ctx = requireContext("PHR_EXPORT_REQUEST");
        Map<String, Object> details = new HashMap<>();
        try {
            PhrExportRequest requestPayload = objectMapper.readValue(json, PhrExportRequest.class);
            if (requestPayload == null || requestPayload.isEmpty()) {
                throw error(Status.BAD_REQUEST,
                        "error.phr.invalidPayload",
                        "patientIds を 1 件以上指定してください。",
                        ctx.traceId(),
                        null);
            }
            details.put("patientCount", requestPayload.getPatientIds().size());
            PHRAsyncJob job = exportJobManager.submit(ctx.facilityId(), ctx.userId(), requestPayload);
            PhrExportJobResponse response = toJobResponse(ctx, job, false);
            auditSuccess(ctx, "PHR_EXPORT_REQUEST", null, details);
            return Response.status(Status.ACCEPTED).entity(response).build();
        } catch (WebApplicationException ex) {
            Integer status = ex.getResponse() != null ? ex.getResponse().getStatus() : null;
            auditFailure(ctx, "PHR_EXPORT_REQUEST", null, ex.getResponse().getStatusInfo().toString(),
                    failureDetails(details, ex, status));
            throw ex;
        } catch (IllegalArgumentException ex) {
            auditFailure(ctx, "PHR_EXPORT_REQUEST", null, "invalid_payload",
                    failureDetails(details, ex, Status.BAD_REQUEST.getStatusCode()));
            throw error(Status.BAD_REQUEST,
                    "error.phr.invalidPayload",
                    ex.getMessage(),
                    ctx.traceId(),
                    ex);
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_EXPORT_REQUEST", null, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "PHR エクスポートジョブの登録中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/status/{jobId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getExportStatus(@PathParam("jobId") String rawJobId) {
        PhrRequestContext ctx = requireContext("PHR_EXPORT_STATUS");
        UUID jobId = parseJobId(rawJobId, ctx, "PHR_EXPORT_STATUS");
        Map<String, Object> details = Map.of("jobId", jobId.toString());
        try {
            PHRAsyncJob job = requireJob(ctx, jobId, "PHR_EXPORT_STATUS");
            PhrExportJobResponse response = toJobResponse(ctx, job, true);
            auditSuccess(ctx, "PHR_EXPORT_STATUS", null, details);
            return Response.ok(response).build();
        } catch (WebApplicationException ex) {
            Integer status = ex.getResponse() != null ? ex.getResponse().getStatus() : null;
            auditFailure(ctx, "PHR_EXPORT_STATUS", null, ex.getResponse().getStatusInfo().toString(),
                    failureDetails(details, ex, status));
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_EXPORT_STATUS", null, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "ジョブステータス取得中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @DELETE
    @Path("/status/{jobId}")
    public Response cancelExport(@PathParam("jobId") String rawJobId) {
        PhrRequestContext ctx = requireContext("PHR_EXPORT_CANCEL");
        UUID jobId = parseJobId(rawJobId, ctx, "PHR_EXPORT_CANCEL");
        Map<String, Object> details = Map.of("jobId", jobId.toString());
        try {
            PHRAsyncJob job = requireJob(ctx, jobId, "PHR_EXPORT_CANCEL");
            if (job.getState() != PHRAsyncJob.State.PENDING) {
                auditFailure(ctx, "PHR_EXPORT_CANCEL", null, "invalid_state",
                        failureDetails(details, null, Status.CONFLICT.getStatusCode()));
                throw error(Status.CONFLICT,
                        "error.phr.invalidState",
                        "ジョブはキャンセル可能な状態ではありません。",
                        ctx.traceId(),
                        null);
            }
            boolean cancelled = asyncJobService.cancel(jobId);
            if (!cancelled) {
                auditFailure(ctx, "PHR_EXPORT_CANCEL", null, "invalid_state",
                        failureDetails(details, null, Status.CONFLICT.getStatusCode()));
                throw error(Status.CONFLICT,
                        "error.phr.invalidState",
                        "ジョブはキャンセル可能な状態ではありません。",
                        ctx.traceId(),
                        null);
            }
            auditSuccess(ctx, "PHR_EXPORT_CANCEL", null, details);
            return Response.noContent().build();
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_EXPORT_CANCEL", null, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "ジョブのキャンセル中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    @GET
    @Path("/export/{jobId}/artifact")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadArtifact(@PathParam("jobId") String rawJobId,
                                     @QueryParam("expires") Long expires,
                                     @QueryParam("token") String token) {
        PhrRequestContext ctx = requireContext("PHR_EXPORT_ARTIFACT");
        UUID jobId = parseJobId(rawJobId, ctx, "PHR_EXPORT_ARTIFACT");
        Map<String, Object> details = Map.of("jobId", jobId.toString());
        if (expires == null || token == null || token.isBlank()) {
            Map<String, Object> invalidDetails = new HashMap<>(details);
            invalidDetails.put("expires", expires);
            invalidDetails.put("tokenProvided", token != null && !token.isBlank());
            auditFailure(ctx, "PHR_EXPORT_ARTIFACT", null, "invalid_parameter",
                    failureDetails(invalidDetails, null, Status.BAD_REQUEST.getStatusCode()));
            throw error(Status.BAD_REQUEST,
                    "error.phr.invalidParameter",
                    "expires と token を指定してください。",
                    ctx.traceId(),
                    null);
        }
        try {
            PHRAsyncJob job = requireJob(ctx, jobId, "PHR_EXPORT_ARTIFACT");
            if (job.getState() != PHRAsyncJob.State.SUCCEEDED || job.getResultUri() == null) {
                auditFailure(ctx, "PHR_EXPORT_ARTIFACT", null, "invalid_state",
                        failureDetails(details, null, Status.CONFLICT.getStatusCode()));
                throw error(Status.CONFLICT,
                        "error.phr.invalidState",
                        "ジョブが完了していません。",
                        ctx.traceId(),
                        null);
            }
            String basePath = request != null ? request.getRequestURI() : buildArtifactPath(jobId);
            boolean verified = signedUrlService.verify(basePath, ctx.facilityId(), expires, token);
            if (!verified) {
                auditFailure(ctx, "PHR_EXPORT_ARTIFACT", null, "invalid_signature",
                        failureDetails(details, null, Status.FORBIDDEN.getStatusCode()));
                throw error(Status.FORBIDDEN,
                        "error.phr.invalidSignature",
                        "署名の検証に失敗しました。",
                        ctx.traceId(),
                        null);
            }
            PhrExportStorage storage = storageFactory.getStorage();
            if (storage == null) {
                throw new IllegalStateException("ストレージバックエンドが構成されていません。");
            }
            PhrExportStorage.StoredArtifact artifact = storage.loadArtifact(job, job.getResultUri());
            auditSuccess(ctx, "PHR_EXPORT_ARTIFACT", null, details);
            StreamingOutput body = output -> {
                try (java.io.InputStream in = Files.newInputStream(artifact.getPath())) {
                    in.transferTo(output);
                }
            };
            return Response.ok(body, artifact.getContentType())
                    .header("Content-Disposition", "attachment; filename=\"" + artifact.getPath().getFileName() + "\"")
                    .header("Content-Length", Files.size(artifact.getPath()))
                    .build();
        } catch (WebApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            auditFailure(ctx, "PHR_EXPORT_ARTIFACT", null, ex.getClass().getSimpleName(),
                    failureDetails(details, ex, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.internal",
                    "成果物ダウンロード中にエラーが発生しました。",
                    ctx.traceId(),
                    ex);
        }
    }

    private String resolveTraceId() {
        if (request == null) {
            return UUID.randomUUID().toString();
        }
        Object attribute = request.getAttribute(TRACE_ID_ATTRIBUTE);
        if (attribute instanceof String trace && !trace.isBlank()) {
            return trace;
        }
        String header = request.getHeader(HEADER_TRACE_ID);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }

    private PhrRequestContext requireContext(String action) {
        if (request == null) {
            auditHelper.recordFailure(null, action, null, "missing_request_context",
                    failureDetails(null, null, Status.INTERNAL_SERVER_ERROR.getStatusCode()));
            throw error(Status.INTERNAL_SERVER_ERROR,
                    "error.phr.environment",
                    "HTTP リクエストコンテキストが利用できません。",
                    UUID.randomUUID().toString(),
                    null);
        }
        try {
            PhrRequestContext ctx = PhrRequestContextExtractor.from(request);
            requireTraceHeader(action, ctx.traceId(), ctx);
            String facilityHeader = requireFacilityHeader(action, ctx);
            verifyFacilityHeader(ctx, facilityHeader, action);
            return ctx;
        } catch (IllegalStateException ex) {
            auditHelper.recordFailure(null, action, null, "unauthenticated",
                    failureDetails(Map.of("errorMessage", ex.getMessage()), ex, Status.FORBIDDEN.getStatusCode()));
            throw error(Status.FORBIDDEN,
                    "error.phr.unauthenticated",
                    "認証済みユーザー情報が取得できません。",
                    resolveTraceId(),
                    ex);
        }
    }

    private WebApplicationException error(Status status, String type, String message, String traceId, Throwable cause) {
        return PhrErrorMapper.toException(status, type, message, traceId, cause);
    }

    private void auditSuccess(PhrRequestContext ctx, String action, String patientId, Map<String, Object> details) {
        auditHelper.recordSuccess(ctx, action, patientId, details);
    }

    private void auditFailure(PhrRequestContext ctx, String action, String patientId, String reason, Map<String, Object> details) {
        auditHelper.recordFailure(ctx, action, patientId, reason, details);
    }

    private Map<String, Object> failureDetails(Map<String, Object> base, Throwable error, Integer httpStatus) {
        Map<String, Object> details = new HashMap<>();
        if (base != null && !base.isEmpty()) {
            details.putAll(base);
        }
        if (httpStatus != null) {
            details.put("httpStatus", httpStatus);
        }
        if (error != null) {
            String exceptionClass = error.getClass().getSimpleName();
            details.put("error", exceptionClass);
            details.put("exceptionClass", exceptionClass);
            if (error.getMessage() != null && !error.getMessage().isBlank()) {
                details.put("errorMessage", error.getMessage());
            }
        }
        return details;
    }

    private String readHeader(String headerName) {
        if (request == null || headerName == null) {
            return null;
        }
        String value = request.getHeader(headerName);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void requireTraceHeader(String action, String traceId, PhrRequestContext ctx) {
        String traceHeader = readHeader(HEADER_TRACE_ID);
        if (traceHeader != null) {
            return;
        }
        Map<String, Object> details = new HashMap<>();
        details.put("missingHeader", HEADER_TRACE_ID);
        auditFailure(ctx, action, null, "missing_trace_header",
                failureDetails(details, null, Status.BAD_REQUEST.getStatusCode()));
        throw error(Status.BAD_REQUEST,
                "error.phr.missingTraceId",
                "X-Trace-Id ヘッダーが必要です。",
                traceId,
                null);
    }

    private String requireFacilityHeader(String action, PhrRequestContext ctx) {
        String facilityHeader = readHeader(HEADER_FACILITY_ID);
        if (facilityHeader != null) {
            return facilityHeader;
        }
        Map<String, Object> details = new HashMap<>();
        details.put("missingHeader", HEADER_FACILITY_ID);
        auditFailure(ctx, action, null, "missing_facility_header",
                failureDetails(details, null, Status.BAD_REQUEST.getStatusCode()));
        throw error(Status.BAD_REQUEST,
                "error.phr.missingFacilityId",
                "X-Facility-Id ヘッダーが必要です。",
                ctx.traceId(),
                null);
    }

    private void verifyFacilityHeader(PhrRequestContext ctx, String facilityHeader, String action) {
        if (ctx == null || facilityHeader == null) {
            return;
        }
        String normalizedHeader = facilityHeader.trim();
        String normalizedFacility = ctx.facilityId() != null ? ctx.facilityId().trim() : null;
        if (normalizedFacility == null || normalizedFacility.equalsIgnoreCase(normalizedHeader)) {
            return;
        }
        Map<String, Object> details = new HashMap<>();
        details.put("headerFacilityId", normalizedHeader);
        details.put("remoteFacilityId", ctx.facilityId());
        auditFailure(ctx, action, null, "facility_mismatch_header",
                failureDetails(details, null, Status.FORBIDDEN.getStatusCode()));
        throw error(Status.FORBIDDEN,
                "error.phr.forbiddenFacility",
                "他医療機関のデータにはアクセスできません。",
                ctx.traceId(),
                null);
    }

    private void ensureFacility(PhrRequestContext ctx, String facilityId, String patientId, String action, Map<String, Object> details) {
        if (facilityId == null || facilityId.equals(ctx.facilityId())) {
            return;
        }
        Map<String, Object> failureDetailsMap = new HashMap<>(details);
        failureDetailsMap.put("expectedFacilityId", facilityId);
        failureDetailsMap.put("actualFacilityId", ctx.facilityId());
        auditFailure(ctx, action, patientId, "facility_mismatch",
                failureDetails(failureDetailsMap, null, Status.FORBIDDEN.getStatusCode()));
        throw error(Status.FORBIDDEN,
                "error.phr.forbiddenFacility",
                "他医療機関のデータにはアクセスできません。",
                ctx.traceId(),
                null);
    }

    private Response streamJson(Object value, MediaType mediaType) {
        try {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            getSerializeMapper().writeValue(buffer, value);
            byte[] data = buffer.toByteArray();
            return Response.ok(data, mediaType)
                    .header("Content-Length", data.length)
                    .build();
        } catch (IOException ex) {
            throw new IllegalStateException("レスポンスのシリアライズに失敗しました。", ex);
        }
    }

    private Response okText(String content) {
        return Response.ok(content, MediaType.TEXT_PLAIN_TYPE).build();
    }

    private KarteBean requireKarte(PhrRequestContext ctx, String patientId, String action, Map<String, Object> details) {
        try {
            return phrServiceBean.getKarte(ctx.facilityId(), patientId);
        } catch (NoResultException ex) {
            auditFailure(ctx, action, patientId, "not_found",
                    failureDetails(details, ex, Status.NOT_FOUND.getStatusCode()));
            throw error(Status.NOT_FOUND,
                    "error.phr.patientNotFound",
                    "指定された患者が見つかりません。",
                    ctx.traceId(),
                    ex);
        }
    }

    private String buildLabText(List<NLaboModule> modules) {
        if (modules == null || modules.isEmpty()) {
            return "検査の登録はありません。";
        }
        StringBuilder sb = new StringBuilder();
        for (NLaboModule module : modules) {
            sb.append(normalizeSampleDate2(module.getSampleDate())).append("\n");
            for (NLaboItem item : module.getItems()) {
                sb.append(item.getItemName()).append("=").append(item.getValue());
                if (item.getUnit() != null) {
                    sb.append(item.getUnit());
                }
                if (item.getAbnormalFlg() != null) {
                    sb.append("(").append(item.getAbnormalFlg()).append(")");
                }
                sb.append("\n");
            }
        }
        if (sb.length() > 0) {
            sb.setLength(sb.length() - 1);
        }
        return sb.toString();
    }

    private String buildAbnormalText(List<NLaboModule> modules) {
        if (modules == null || modules.isEmpty()) {
            return "検査の登録はありません。";
        }
        StringBuilder sb = new StringBuilder();
        boolean hasAbnormal = false;
        for (NLaboModule module : modules) {
            sb.append(normalizeSampleDate2(module.getSampleDate())).append("\n");
            for (NLaboItem item : module.getItems()) {
                if (item.getAbnormalFlg() != null) {
                    hasAbnormal = true;
                    sb.append(item.getItemName()).append("=").append(item.getValue());
                    if (item.getUnit() != null) {
                        sb.append(item.getUnit());
                    }
                    sb.append("(").append(item.getAbnormalFlg()).append(")").append("\n");
                }
            }
        }
        if (!hasAbnormal) {
            return "異常値はありません。";
        }
        if (sb.length() > 0) {
            sb.setLength(sb.length() - 1);
        }
        return sb.toString();
    }

    private String normalizeSampleDate2(String sampleDate) {
        if (sampleDate == null) {
            return "";
        }
        try {
            String normalized = sampleDate.replaceAll("[ T/:]", "");
            if (normalized.length() == "yyyyMMdd".length()) {
                normalized += "000000";
            } else if (normalized.length() == "yyyyMMddHHmm".length()) {
                normalized += "00";
            }
            Date d = new SimpleDateFormat("yyyyMMddHHmmss").parse(normalized);
            return new SimpleDateFormat("yyyy年M月d日").format(d);
        } catch (ParseException ex) {
            LOGGER.log(Level.WARNING, "Failed to normalize sample date: {0}", sampleDate);
            return sampleDate;
        }
    }

    private String accessKeySuffix(String accessKey) {
        if (accessKey == null || accessKey.isBlank()) {
            return null;
        }
        int len = accessKey.length();
        return len <= 4 ? accessKey : accessKey.substring(len - 4);
    }

    private String buildArtifactPath(UUID jobId) {
        if (request != null) {
            String uri = request.getRequestURI();
            int idx = uri.indexOf("/20/adm/phr");
            if (idx >= 0) {
                String prefix = uri.substring(0, idx);
                return prefix + "/20/adm/phr/export/" + jobId + "/artifact";
            }
        }
        return "/resources/20/adm/phr/export/" + jobId + "/artifact";
    }

    private UUID parseJobId(String rawJobId, PhrRequestContext ctx, String action) {
        try {
            return UUID.fromString(rawJobId);
        } catch (IllegalArgumentException ex) {
            auditFailure(ctx, action, null, "invalid_job_id",
                    failureDetails(Map.of("jobId", rawJobId), ex, Status.BAD_REQUEST.getStatusCode()));
            throw error(Status.BAD_REQUEST,
                    "error.phr.invalidJobId",
                    "ジョブ ID の形式が不正です。",
                    ctx.traceId(),
                    ex);
        }
    }

    private PHRAsyncJob requireJob(PhrRequestContext ctx, UUID jobId, String action) {
        PHRAsyncJob job = asyncJobService.find(jobId);
        if (job == null) {
            auditFailure(ctx, action, null, "not_found",
                    failureDetails(Map.of("jobId", jobId.toString()), null, Status.NOT_FOUND.getStatusCode()));
            throw error(Status.NOT_FOUND,
                    "error.phr.jobNotFound",
                    "指定されたジョブが見つかりません。",
                    ctx.traceId(),
                    null);
        }
        ensureFacility(ctx, job.getFacilityId(), null, action, Map.of("jobId", jobId.toString()));
        return job;
    }

    private PhrExportJobResponse toJobResponse(PhrRequestContext ctx, PHRAsyncJob job, boolean includeSignedUrl) {
        PhrExportJobResponse response = PhrExportJobResponse.from(job);
        if (includeSignedUrl && job.getState() == PHRAsyncJob.State.SUCCEEDED && job.getResultUri() != null) {
            String basePath = buildArtifactPath(job.getJobId());
            long ttlSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS;
            try {
                ttlSeconds = resolveSignedUrlTtlSeconds();
                String signedUrl = createSignedDownloadUrl(basePath, ctx.facilityId(), ttlSeconds);
                if (signedUrl != null && !signedUrl.isBlank()) {
                    response.setDownloadUrl(signedUrl);
                    Map<String, Object> details = signedUrlDetails(job, basePath, ttlSeconds);
                    details.put("downloadUrl", signedUrl);
                    auditSuccess(ctx, SIGNED_URL_SUCCESS_ACTION, null, details);
                } else {
                    response.setDownloadUrl(basePath);
                    auditSignedUrlFallback(ctx, job, basePath, ttlSeconds, SIGNED_URL_FALLBACK_REASON_NULL, null);
                }
            } catch (Exception ex) {
                response.setDownloadUrl(basePath);
                auditSignedUrlIssueFailed(ctx, job, basePath, ttlSeconds, ex);
            }
        }
        return response;
    }

    private String createSignedDownloadUrl(String basePath, String facilityId, long ttlSeconds) {
        if (signedUrlService == null) {
            throw new IllegalStateException("SignedUrlService is not available.");
        }
        return signedUrlService.createSignedUrl(basePath, facilityId, ttlSeconds);
    }

    private long resolveSignedUrlTtlSeconds() {
        if (exportConfig == null) {
            throw new IllegalStateException("PhrExportConfig is not available.");
        }
        long ttlSeconds = exportConfig.getTokenTtlSeconds();
        if (ttlSeconds <= 0) {
            throw new IllegalStateException("PHR_EXPORT_TOKEN_TTL_SECONDS must be greater than zero.");
        }
        return ttlSeconds;
    }

    private Map<String, Object> signedUrlDetails(PHRAsyncJob job, String basePath, long ttlSeconds) {
        Map<String, Object> details = new HashMap<>();
        details.put("jobId", job.getJobId().toString());
        details.put("facilityId", job.getFacilityId());
        details.put("resultUri", job.getResultUri());
        details.put("artifactPath", basePath);
        details.put("signedUrlIssuer", SIGNED_URL_ISSUER);
        details.put("storageType", resolveStorageType());
        details.put("signedUrlTtlSeconds", ttlSeconds);
        details.put("bandwidthProfile", SIGNED_URL_BANDWIDTH_PROFILE);
        details.put("kmsKeyAlias", SIGNED_URL_KMS_KEY_ALIAS);
        return details;
    }

    private String resolveStorageType() {
        if (exportConfig == null || exportConfig.getStorageType() == null) {
            return "UNKNOWN";
        }
        return exportConfig.getStorageType().name();
    }

    private void auditSignedUrlFallback(PhrRequestContext ctx,
            PHRAsyncJob job,
            String basePath,
            long ttlSeconds,
            String reason,
            String message) {
        Map<String, Object> fallbackDetails = signedUrlDetails(job, basePath, ttlSeconds);
        fallbackDetails.put("fallbackReason", reason);
        fallbackDetails.put("downloadUrl", basePath);
        if (message != null && !message.isBlank()) {
            fallbackDetails.put("message", message);
            fallbackDetails.put("errorMessage", message);
        }
        auditFailure(ctx, SIGNED_URL_FALLBACK_ACTION, null, reason, failureDetails(fallbackDetails, null, null));
    }

    private void auditSignedUrlIssueFailed(PhrRequestContext ctx,
            PHRAsyncJob job,
            String basePath,
            long ttlSeconds,
            Exception ex) {
        Map<String, Object> failureDetails = signedUrlDetails(job, basePath, ttlSeconds);
        failureDetails.put("exception", ex.getClass().getSimpleName());
        if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            failureDetails.put("message", ex.getMessage());
        }
        auditFailure(ctx, SIGNED_URL_FAILURE_ACTION, null, ex.getClass().getSimpleName(),
                failureDetails(failureDetails, ex, null));
        auditSignedUrlFallback(ctx, job, basePath, ttlSeconds, SIGNED_URL_FALLBACK_REASON_UNAVAILABLE, ex.getMessage());
    }
}
