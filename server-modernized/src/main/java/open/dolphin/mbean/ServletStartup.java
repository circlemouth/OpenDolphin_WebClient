package open.dolphin.mbean;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.annotation.Resource;
import jakarta.enterprise.concurrent.ManagedScheduledExecutorService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.GregorianCalendar;
import java.util.Properties;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.session.ChartEventServiceBean;
import open.dolphin.session.SystemServiceBean;
import open.orca.rest.ORCAConnection;

/**
 * サーバー起動時の初期化と定期ジョブの実行を Jakarta Concurrency へ移行したライフサイクル管理コンポーネント。
 */
@ApplicationScoped
public class ServletStartup {

    private static final Logger LOGGER = Logger.getLogger(ServletStartup.class.getSimpleName());
    private static final Logger DOLPHIN_LOGGER = Logger.getLogger("open.dolphin");
    private static final ZoneId DEFAULT_ZONE = ZoneId.systemDefault();

    @Resource
    private ManagedScheduledExecutorService scheduler;

    @Inject
    private ChartEventServiceBean eventServiceBean;

    @Inject
    private SystemServiceBean systemServiceBean;

    private ScheduledFuture<?> midnightRefreshTask;
    private ScheduledFuture<?> monthlyActivityTask;

    @PostConstruct
    public void init() {
        eventServiceBean.start();
        if (scheduler == null) {
            LOGGER.warning("ManagedScheduledExecutorService is not available. Timed jobs will not be executed.");
            return;
        }
        scheduleMidnightRefresh();
        scheduleMonthlyActivityReport();
    }

    @PreDestroy
    public void stop() {
        cancelTask(midnightRefreshTask);
        cancelTask(monthlyActivityTask);
    }

    private void scheduleMidnightRefresh() {
        Duration delay = Duration.between(Instant.now(), nextMidnight());
        if (delay.isNegative()) {
            delay = delay.plusDays(1);
        }
        midnightRefreshTask = scheduler.scheduleAtFixedRate(this::renewPatientVisitListSafely,
                delay.toMillis(), Duration.ofDays(1).toMillis(), TimeUnit.MILLISECONDS);
    }

    private void renewPatientVisitListSafely() {
        try {
            DOLPHIN_LOGGER.info("Renew pvtlist.");
            eventServiceBean.renewPvtList();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Failed to renew patient visit list", ex);
        }
    }

    private void scheduleMonthlyActivityReport() {
        scheduleNextMonthlyReport();
    }

    private void scheduleNextMonthlyReport() {
        Duration delay = Duration.between(Instant.now(), nextMonthlyExecution());
        if (delay.isNegative()) {
            delay = Duration.ZERO;
        }
        monthlyActivityTask = scheduler.schedule(() -> {
            runMonthlyActivityReportSafely();
            scheduleNextMonthlyReport();
        }, delay.toMillis(), TimeUnit.MILLISECONDS);
    }

    private void runMonthlyActivityReportSafely() {
        try {
            Properties config = ORCAConnection.getInstance().getProperties();
            String zero = config.getProperty("cloud.zero");
            if ("true".equalsIgnoreCase(zero)) {
                GregorianCalendar gc = new GregorianCalendar();
                gc.add(GregorianCalendar.MONTH, -1);
                int year = gc.get(GregorianCalendar.YEAR);
                int month = gc.get(GregorianCalendar.MONTH);
                DOLPHIN_LOGGER.info("Send monthly Activities.");
                systemServiceBean.sendMonthlyActivities(year, month);
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Failed to send monthly activity report", ex);
        }
    }

    private void cancelTask(ScheduledFuture<?> future) {
        if (future != null) {
            future.cancel(true);
        }
    }

    private Instant nextMidnight() {
        ZonedDateTime now = ZonedDateTime.now(DEFAULT_ZONE);
        ZonedDateTime next = now.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        return next.toInstant();
    }

    private Instant nextMonthlyExecution() {
        ZonedDateTime now = ZonedDateTime.now(DEFAULT_ZONE);
        ZonedDateTime next = now.withDayOfMonth(1).withHour(5).withMinute(0).withSecond(0).withNano(0);
        if (!now.isBefore(next)) {
            next = next.plusMonths(1).withDayOfMonth(1);
        }
        return next.toInstant();
    }
}
