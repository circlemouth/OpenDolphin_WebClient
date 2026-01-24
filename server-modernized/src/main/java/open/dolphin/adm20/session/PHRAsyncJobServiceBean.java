package open.dolphin.adm20.session;

import jakarta.ejb.Stateless;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
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
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId, LockModeType.PESSIMISTIC_WRITE);
        if (job == null) {
            return null;
        }
        if (job.getState() != State.PENDING) {
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
            job.setRetryCount(job.getRetryCount() + 1);
            job.setFinishedAt(OffsetDateTime.now());
            job.setHeartbeatAt(job.getFinishedAt());
            job.setLockedBy(null);
        }
    }

    public PHRAsyncJob resetForRetry(UUID jobId, OffsetDateTime queuedAt) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job == null) {
            return null;
        }
        job.setState(State.PENDING);
        job.setLockedBy(null);
        job.setProgress(0);
        job.setQueuedAt(queuedAt != null ? queuedAt : OffsetDateTime.now());
        job.setHeartbeatAt(job.getQueuedAt());
        return job;
    }

    public PHRAsyncJob markExpired(UUID jobId, String code, String message) {
        PHRAsyncJob job = em.find(PHRAsyncJob.class, jobId);
        if (job == null) {
            return null;
        }
        job.setState(State.EXPIRED);
        if (code != null) {
            job.setErrorCode(code);
        }
        if (message != null) {
            job.setErrorMessage(message);
        }
        job.setFinishedAt(OffsetDateTime.now());
        job.setHeartbeatAt(job.getFinishedAt());
        job.setLockedBy(null);
        return job;
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

    public List<PHRAsyncJob> findByState(State state) {
        return em.createQuery("from PHRAsyncJob j where j.state = :state order by j.queuedAt", PHRAsyncJob.class)
                .setParameter("state", state)
                .getResultList();
    }

    public List<PHRAsyncJob> findStaleRunningJobs(OffsetDateTime threshold) {
        return em.createQuery("""
                from PHRAsyncJob j
                where j.state = :state
                  and (j.heartbeatAt is null or j.heartbeatAt < :threshold)
                order by j.queuedAt
                """, PHRAsyncJob.class)
                .setParameter("state", State.RUNNING)
                .setParameter("threshold", threshold)
                .getResultList();
    }
}
