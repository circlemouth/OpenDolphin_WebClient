package open.dolphin.rest;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import open.dolphin.adm20.dto.PhrExportJobResponse;
import open.dolphin.adm20.dto.PhrExportRequest;
import open.dolphin.adm20.export.PhrExportConfig;
import open.dolphin.adm20.export.PhrExportJobManager;
import open.dolphin.adm20.export.PhrExportStorage;
import open.dolphin.adm20.export.PhrExportStorageFactory;
import open.dolphin.adm20.export.SignedUrlService;
import open.dolphin.adm20.rest.PHRResource;
import open.dolphin.adm20.rest.support.PhrAuditHelper;
import open.dolphin.adm20.session.PHRAsyncJobServiceBean;
import open.dolphin.adm20.support.PhrDataAssembler;
import open.dolphin.infomodel.PHRAsyncJob;
import open.dolphin.infomodel.PHRKey;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PHRResourceTest extends RuntimeDelegateTestSupport {

    private static final String REMOTE_USER = "F001:user01";
    private static final String TRACE_ID = "trace-123";

    @InjectMocks
    private PHRResource resource;

    @Mock
    private PhrDataAssembler dataAssembler;

    @Mock
    private PhrExportJobManager exportJobManager;

    @Mock
    private PHRAsyncJobServiceBean asyncJobService;

    @Mock
    private PhrAuditHelper auditHelper;

    @Mock
    private SignedUrlService signedUrlService;

    @Mock
    private PhrExportStorageFactory storageFactory;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private PhrExportStorage storage;

    @Mock
    private PhrExportConfig exportConfig;

    private Path tempFile;

    @BeforeEach
    void setUp() throws Exception {
        setField(resource, "request", httpRequest);
        setField(resource, "exportConfig", exportConfig);

        lenient().when(httpRequest.getRemoteUser()).thenReturn(REMOTE_USER);
        lenient().when(httpRequest.getRemoteAddr()).thenReturn("192.0.2.10");
        lenient().when(httpRequest.getHeader("User-Agent")).thenReturn("JUnit");
        lenient().when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("192.0.2.10");
        lenient().when(httpRequest.getHeader("X-Trace-Id")).thenReturn(TRACE_ID);
        lenient().when(httpRequest.getHeader("X-Facility-Id")).thenReturn("F001");
        lenient().when(httpRequest.getHeader("X-Request-Id")).thenReturn(null);
        lenient().when(httpRequest.getAttribute(anyString())).thenReturn(TRACE_ID);
        lenient().when(httpRequest.getRequestURI()).thenReturn("/resources/20/adm/phr/export");
        lenient().when(exportConfig.getTokenTtlSeconds()).thenReturn(300L);
        lenient().when(exportConfig.getStorageType()).thenReturn(PhrExportConfig.StorageType.FILESYSTEM);
    }

    @AfterEach
    void tearDown() throws Exception {
        if (tempFile != null) {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    void getPhrKeyByAccessKey_returnsKeyAndAuditsSuccess() throws Exception {
        PHRKey key = new PHRKey();
        key.setFacilityId("F001");
        key.setPatientId("P001");
        key.setAccessKey("ABCDEFGH");
        key.setRegistered(new Date());
        when(dataAssembler.findKeyByAccessKey("ABCDEFGH")).thenReturn(Optional.of(key));

        Response response = resource.getPHRKeyByAccessKey("ABCDEFGH");

        assertThat(response.getStatus()).isEqualTo(200);
        byte[] payload = (byte[]) response.getEntity();
        assertThat(new String(payload)).contains("P001");
        verify(auditHelper).recordSuccess(argThat(ctx -> ctx != null && ctx.facilityId().equals("F001")),
                eq("PHR_ACCESS_KEY_FETCH"),
                eq("P001"),
                argThat(details -> "EFGH".equals(details.get("accessKeySuffix"))));
    }

    @Test
    void getPhrKeyByAccessKey_throwsForbiddenWhenFacilityMismatch() {
        PHRKey key = new PHRKey();
        key.setFacilityId("F999");
        key.setPatientId("P001");
        key.setAccessKey("ABCDEFGH");
        when(dataAssembler.findKeyByAccessKey("ABCDEFGH")).thenReturn(Optional.of(key));

        assertThatThrownBy(() -> resource.getPHRKeyByAccessKey("ABCDEFGH"))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(403);
        verify(auditHelper).recordFailure(any(),
                eq("PHR_ACCESS_KEY_FETCH"),
                eq("P001"),
                eq("facility_mismatch"),
                argThat(details -> "EFGH".equals(details.get("accessKeySuffix"))
                        && "F999".equals(details.get("expectedFacilityId"))
                        && "F001".equals(details.get("actualFacilityId"))));
    }

    @Test
    void requestExport_returnsAcceptedWhenPayloadValid() throws Exception {
        String json = """
                {"patientIds":["P001","P002"]}
                """;
        PHRAsyncJob job = new PHRAsyncJob();
        job.setJobId(UUID.randomUUID());
        job.setFacilityId("F001");
        job.setJobType("PHR_EXPORT");
        job.setQueuedAt(java.time.OffsetDateTime.now());
        when(exportJobManager.submit(eq("F001"), eq("user01"), any(PhrExportRequest.class))).thenReturn(job);

        Response response = resource.requestExport(json);

        assertThat(response.getStatus()).isEqualTo(202);
        verify(exportJobManager).submit(eq("F001"), eq("user01"), argThat(req -> req.getPatientIds().size() == 2));
        verify(auditHelper).recordSuccess(any(), eq("PHR_EXPORT_REQUEST"), isNull(), argThat(details -> (Integer) details.get("patientCount") == 2));
    }

    @Test
    void requestExport_throwsBadRequestOnEmptyPatients() {
        String json = """
                {"patientIds":[]}
                """;

        assertThatThrownBy(() -> resource.requestExport(json))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(400);
    }

    @Test
    void getExportStatus_fallsBackWhenSignedUrlIsNull() {
        UUID jobId = UUID.randomUUID();
        PHRAsyncJob job = succeededJob(jobId);
        when(asyncJobService.find(jobId)).thenReturn(job);
        when(signedUrlService.createSignedUrl(anyString(), anyString(), anyLong())).thenReturn(null);

        Response response = resource.getExportStatus(jobId.toString());

        assertThat(response.getStatus()).isEqualTo(200);
        PhrExportJobResponse body = (PhrExportJobResponse) response.getEntity();
        assertThat(body.getDownloadUrl()).isEqualTo("/resources/20/adm/phr/export/" + jobId + "/artifact");
        verify(auditHelper).recordFailure(any(),
                eq("PHR_SIGNED_URL_NULL_FALLBACK"),
                isNull(),
                eq("null_result"),
                argThat(details -> "RESTEASY".equals(details.get("signedUrlIssuer"))
                        && "FILESYSTEM".equals(details.get("storageType"))
                        && "phr-container".equals(details.get("bandwidthProfile"))
                        && Long.valueOf(300L).equals(details.get("signedUrlTtlSeconds"))
                        && ("/resources/20/adm/phr/export/" + jobId + "/artifact").equals(details.get("downloadUrl"))
                        && "alias/opd/phr-export".equals(details.get("kmsKeyAlias"))));
    }

    @Test
    void getExportStatus_recordsIssueFailedWhenSignedUrlThrowsException() {
        UUID jobId = UUID.randomUUID();
        PHRAsyncJob job = succeededJob(jobId);
        when(asyncJobService.find(jobId)).thenReturn(job);
        when(signedUrlService.createSignedUrl(anyString(), anyString(), anyLong()))
                .thenThrow(new IllegalStateException("PHR_EXPORT_SIGNING_SECRET missing"));

        Response response = resource.getExportStatus(jobId.toString());

        assertThat(response.getStatus()).isEqualTo(200);
        PhrExportJobResponse body = (PhrExportJobResponse) response.getEntity();
        String fallbackUrl = "/resources/20/adm/phr/export/" + jobId + "/artifact";
        assertThat(body.getDownloadUrl()).isEqualTo(fallbackUrl);
        verify(auditHelper).recordFailure(any(),
                eq("PHR_SIGNED_URL_ISSUE_FAILED"),
                isNull(),
                eq("IllegalStateException"),
                argThat(details -> "RESTEASY".equals(details.get("signedUrlIssuer"))
                        && fallbackUrl.equals(details.get("artifactPath"))
                        && "PHR_EXPORT_SIGNING_SECRET missing".equals(details.get("message"))));
        verify(auditHelper).recordFailure(any(),
                eq("PHR_SIGNED_URL_NULL_FALLBACK"),
                isNull(),
                eq("signed_url_unavailable"),
                argThat(details -> fallbackUrl.equals(details.get("downloadUrl"))
                        && "signed_url_unavailable".equals(details.get("fallbackReason"))));
    }

    @Test
    void downloadArtifact_throwsForbiddenWhenSignatureInvalid() {
        UUID jobId = UUID.randomUUID();
        PHRAsyncJob job = new PHRAsyncJob();
        job.setJobId(jobId);
        job.setFacilityId("F001");
        job.setState(PHRAsyncJob.State.SUCCEEDED);
        job.setResultUri("artifact.zip");
        when(asyncJobService.find(jobId)).thenReturn(job);
        when(signedUrlService.verify(anyString(), anyString(), anyLong(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> resource.downloadArtifact(jobId.toString(), Instant.now().getEpochSecond(), "token"))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(403);
        verify(auditHelper).recordFailure(any(), eq("PHR_EXPORT_ARTIFACT"), isNull(), eq("invalid_signature"), anyMap());
    }

    @Test
    void downloadArtifact_returnsArtifactWhenSignatureValid() throws Exception {
        UUID jobId = UUID.randomUUID();
        PHRAsyncJob job = new PHRAsyncJob();
        job.setJobId(jobId);
        job.setFacilityId("F001");
        job.setState(PHRAsyncJob.State.SUCCEEDED);
        job.setResultUri("artifact.zip");
        when(asyncJobService.find(jobId)).thenReturn(job);
        when(signedUrlService.verify(anyString(), anyString(), anyLong(), anyString())).thenReturn(true);
        when(storageFactory.getStorage()).thenReturn(storage);

        tempFile = Files.createTempFile("phr-artifact-", ".zip");
        Files.writeString(tempFile, "dummy");
        PhrExportStorage.StoredArtifact artifact = new PhrExportStorage.StoredArtifact(tempFile, "application/zip");
        when(storage.loadArtifact(job, "artifact.zip")).thenReturn(artifact);

        Response response = resource.downloadArtifact(jobId.toString(), Instant.now().getEpochSecond(), "token");

        assertThat(response.getStatus()).isEqualTo(200);
        StreamingOutput output = (StreamingOutput) response.getEntity();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        output.write(out);
        assertThat(out.toByteArray()).hasSizeGreaterThan(0);
        verify(auditHelper).recordSuccess(any(), eq("PHR_EXPORT_ARTIFACT"), isNull(), anyMap());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static PHRAsyncJob succeededJob(UUID jobId) {
        PHRAsyncJob job = new PHRAsyncJob();
        job.setJobId(jobId);
        job.setFacilityId("F001");
        job.setState(PHRAsyncJob.State.SUCCEEDED);
        job.setResultUri("artifact.zip");
        job.setProgress(100);
        return job;
    }
}
