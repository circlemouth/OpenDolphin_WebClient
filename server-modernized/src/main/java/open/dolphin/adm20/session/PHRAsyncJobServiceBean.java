package open.dolphin.adm20.session;

import jakarta.ejb.Stateless;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.time.OffsetDateTime;
import java.util.UUID;
import open.dolphin.infomodel.PHRAsyncJob;
import open.dolphin.infomodel.PHRAsyncJob.State;
import open.dolphin.session.framework.SessionOperation;

@Named
@Stateless
@SessionOperation
@Transactional
public class PHRAsyncJobServiceBean {

    @PersistenceContext
    private EntityManager em;

    public PHRAsyncJob createJob(String facilityId, String jobType, String patientScopeJson) {
        PHRAsyncJob job = new PHRAsyncJob();
        job.setJobId(UUID.randomUUID());
        job.setFacilityId(facilityId);
        job.setJobType(jobType);
        job.setPatientScope(patientScopeJson);
        job.setState(State.PENDING);
        job.setQueuedAt(OffsetDateTime.now());
        job.setProgress(0);
        em.persist(job);
        return job;
    }

    public PHRAsyncJob find(UUID jobId) {
        return em.find(PHRAsyncJob.class, jobId);
    }

    public PHRAsyncJob lockForExecution(UUID jobId, String workerId) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job == null) {
            return null;
        }
        job.setState(State.RUNNING);
        job.setLockedBy(workerId);
        job.setStartedAt(OffsetDateTime.now());
        job.setHeartbeatAt(job.getStartedAt());
        return job;
    }

    public PHRAsyncJob updateProgress(UUID jobId, int progress) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job != null) {
            job.setProgress(progress);
            job.setHeartbeatAt(OffsetDateTime.now());
        }
        return job;
    }

    public void completeSuccess(UUID jobId, String location, long size) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job != null) {
            job.setProgress(100);
            job.setState(State.SUCCEEDED);
            job.setResultUri(location);
            job.setFinishedAt(OffsetDateTime.now());
            job.setHeartbeatAt(job.getFinishedAt());
            job.setLockedBy(null);
        }
    }

    public void completeFailure(UUID jobId, String code, String message) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job != null) {
            job.setState(State.FAILED);
            job.setErrorCode(code);
            job.setErrorMessage(message);
            job.setFinishedAt(OffsetDateTime.now());
            job.setHeartbeatAt(job.getFinishedAt());
            job.setLockedBy(null);
        }
    }

    public void heartbeat(UUID jobId) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job != null) {
            job.setHeartbeatAt(OffsetDateTime.now());
        }
    }

    public boolean cancel(UUID jobId) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job == null) {
            return false;
        }
        if (job.getState() != State.PENDING) {
            return false;
        }
        OffsetDateTime now = OffsetDateTime.now();
        job.setState(State.CANCELLED);
        job.setFinishedAt(now);
        job.setHeartbeatAt(now);
        job.setLockedBy(null);
        return true;
    }
}
