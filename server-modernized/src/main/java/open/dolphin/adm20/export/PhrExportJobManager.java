package open.dolphin.adm20.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.adm20.dto.PhrExportRequest;
import open.dolphin.adm20.session.PHRAsyncJobServiceBean;
import open.dolphin.infomodel.PHRAsyncJob;
import open.dolphin.session.framework.ManagedExecutorFactory;

@ApplicationScoped
public class PhrExportJobManager {

    private static final Logger LOGGER = Logger.getLogger(PhrExportJobManager.class.getName());
    private static final String JOB_TYPE = "PHR_EXPORT";

    private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

    @Resource(lookup = ManagedExecutorFactory.DEFAULT_EXECUTOR)
    private ExecutorService executor;

    @Inject
    private PHRAsyncJobServiceBean jobService;

    @Inject
    private PhrExportJobWorker worker;

    public PHRAsyncJob submit(String facilityId, String userId, PhrExportRequest request) throws IOException {
        String scopeJson = MAPPER.writeValueAsString(request);
        PHRAsyncJob job = jobService.createJob(facilityId, JOB_TYPE, scopeJson);
        executor.submit(() -> runJob(job.getJobId(), facilityId, userId, request));
        return job;
    }

    public PhrExportRequest readScope(PHRAsyncJob job) throws IOException {
        return MAPPER.readValue(job.getPatientScope(), PhrExportRequest.class);
    }

    private void runJob(java.util.UUID jobId, String facilityId, String userId, PhrExportRequest request) {
        try {
            worker.execute(jobId, facilityId, userId, request);
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Unhandled exception while executing PHR export job {0}", new Object[]{jobId});
        }
    }
}
