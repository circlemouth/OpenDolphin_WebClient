package open.dolphin.adm20.export;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.AbstractExecutorService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import open.dolphin.adm20.dto.PhrExportRequest;
import open.dolphin.adm20.session.PHRAsyncJobServiceBean;
import open.dolphin.infomodel.PHRAsyncJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PhrExportJobManagerTest {

    @InjectMocks
    private PhrExportJobManager jobManager;

    @Mock
    private PHRAsyncJobServiceBean jobService;

    @Mock
    private PhrExportJobWorker worker;

    @Mock
    private PhrExportConfig exportConfig;

    private ExecutorService executor;

    @BeforeEach
    void setUp() throws Exception {
        executor = new DirectExecutorService();
        setField(jobManager, "executor", executor);
        lenient().when(exportConfig.getJobHeartbeatTimeoutSeconds()).thenReturn(300L);
        lenient().when(exportConfig.getJobMaxRuntimeSeconds()).thenReturn(1800L);
        lenient().when(exportConfig.getJobMaxRetries()).thenReturn(3);
        lenient().when(exportConfig.getJobRetryBackoffSeconds()).thenReturn(30L);
        lenient().when(exportConfig.getJobRetryBackoffMaxSeconds()).thenReturn(300L);
    }

    @Test
    void reconcileJobs_schedulesPendingJob() {
        PHRAsyncJob pending = new PHRAsyncJob();
        pending.setJobId(UUID.randomUUID());
        pending.setFacilityId("F001");
        pending.setJobType("PHR_EXPORT");
        pending.setPatientScope("{\"patientIds\":[\"P001\"]}");
        pending.setQueuedAt(OffsetDateTime.now().minusSeconds(10));

        when(jobService.findByState(PHRAsyncJob.State.PENDING)).thenReturn(List.of(pending));
        when(jobService.findByState(PHRAsyncJob.State.RUNNING)).thenReturn(Collections.emptyList());
        when(jobService.findStaleRunningJobs(any())).thenReturn(Collections.emptyList());
        when(jobService.findByState(PHRAsyncJob.State.FAILED)).thenReturn(Collections.emptyList());

        jobManager.reconcileJobs();

        verify(worker).execute(eq(pending.getJobId()), eq("F001"), isNull(), any(PhrExportRequest.class));
    }

    @Test
    void reconcileJobs_retriesFailedJobAfterBackoff() {
        UUID jobId = UUID.randomUUID();
        PHRAsyncJob failed = new PHRAsyncJob();
        failed.setJobId(jobId);
        failed.setFacilityId("F001");
        failed.setJobType("PHR_EXPORT");
        failed.setPatientScope("{\"patientIds\":[\"P002\"]}");
        failed.setState(PHRAsyncJob.State.FAILED);
        failed.setErrorCode("STORAGE_ERROR");
        failed.setRetryCount(1);
        failed.setFinishedAt(OffsetDateTime.now().minusSeconds(90));

        when(jobService.findByState(PHRAsyncJob.State.PENDING)).thenReturn(Collections.emptyList());
        when(jobService.findByState(PHRAsyncJob.State.RUNNING)).thenReturn(Collections.emptyList());
        when(jobService.findStaleRunningJobs(any())).thenReturn(Collections.emptyList());
        when(jobService.findByState(PHRAsyncJob.State.FAILED)).thenReturn(List.of(failed));
        when(jobService.resetForRetry(eq(jobId), any())).thenReturn(failed);
        when(jobService.find(jobId)).thenReturn(failed);

        jobManager.reconcileJobs();

        verify(jobService).resetForRetry(eq(jobId), any());
        verify(worker).execute(eq(jobId), eq("F001"), isNull(), any(PhrExportRequest.class));
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static final class DirectExecutorService extends AbstractExecutorService {
        private boolean shutdown;

        @Override
        public void shutdown() {
            shutdown = true;
        }

        @Override
        public List<Runnable> shutdownNow() {
            shutdown = true;
            return List.of();
        }

        @Override
        public boolean isShutdown() {
            return shutdown;
        }

        @Override
        public boolean isTerminated() {
            return shutdown;
        }

        @Override
        public boolean awaitTermination(long timeout, TimeUnit unit) {
            return true;
        }

        @Override
        public void execute(Runnable command) {
            command.run();
        }
    }
}
