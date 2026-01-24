package open.dolphin.adm20.export;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.annotation.Resource;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infrastructure.concurrent.ConcurrencyResourceNames;

@Singleton
@Startup
public class PhrExportJobSupervisor {

    private static final Logger LOGGER = Logger.getLogger(PhrExportJobSupervisor.class.getName());

    @Resource(lookup = ConcurrencyResourceNames.DEFAULT_SCHEDULER)
    private ScheduledExecutorService scheduler;

    @Inject
    private PhrExportJobManager jobManager;

    @Inject
    private PhrExportConfig exportConfig;

    private ScheduledFuture<?> scheduled;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @PostConstruct
    public void init() {
        if (!exportConfig.isJobRecoveryEnabled()) {
            LOGGER.info("PHR export job supervisor is disabled by configuration.");
            return;
        }
        if (scheduler == null) {
            LOGGER.warning("Managed scheduler is not available; PHR export job supervisor disabled.");
            return;
        }
        long intervalSeconds = Math.max(5L, exportConfig.getJobRecoveryIntervalSeconds());
        scheduler.execute(this::reconcileSafely);
        scheduled = scheduler.scheduleAtFixedRate(this::reconcileSafely, intervalSeconds, intervalSeconds, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void shutdown() {
        if (scheduled != null) {
            scheduled.cancel(false);
        }
    }

    private void reconcileSafely() {
        if (!running.compareAndSet(false, true)) {
            return;
        }
        try {
            jobManager.reconcileJobs();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Failed to reconcile PHR export jobs.", ex);
        } finally {
            running.set(false);
        }
    }
}
