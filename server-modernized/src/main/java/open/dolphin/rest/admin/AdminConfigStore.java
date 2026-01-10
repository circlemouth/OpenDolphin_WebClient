package open.dolphin.rest.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import open.dolphin.rest.AbstractResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ApplicationScoped
public class AdminConfigStore {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminConfigStore.class);
    private static final String STORAGE_DIR = "opendolphin";
    private static final String STORAGE_FILE = "admin-config.json";

    private final ObjectMapper mapper = AbstractResource.getSerializeMapper();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Path storagePath;
    private AdminConfigSnapshot current;

    public AdminConfigStore() {
        this.storagePath = resolveStoragePath();
        this.current = load();
        if (this.current == null) {
            this.current = defaultSnapshot();
            persist(this.current);
        } else {
            this.current = applyDefaults(this.current);
            persist(this.current);
        }
    }

    public AdminConfigSnapshot getSnapshot() {
        lock.readLock().lock();
        try {
            return current.copy();
        } finally {
            lock.readLock().unlock();
        }
    }

    public AdminConfigSnapshot updateFromPayload(AdminConfigSnapshot incoming, String runId) {
        lock.writeLock().lock();
        try {
            AdminConfigSnapshot merged = current != null ? current.copy() : defaultSnapshot();
            if (incoming.getOrcaEndpoint() != null) merged.setOrcaEndpoint(incoming.getOrcaEndpoint());
            if (incoming.getMswEnabled() != null) merged.setMswEnabled(incoming.getMswEnabled());
            if (incoming.getUseMockOrcaQueue() != null) merged.setUseMockOrcaQueue(incoming.getUseMockOrcaQueue());
            if (incoming.getVerifyAdminDelivery() != null) merged.setVerifyAdminDelivery(incoming.getVerifyAdminDelivery());
            if (incoming.getChartsDisplayEnabled() != null) merged.setChartsDisplayEnabled(incoming.getChartsDisplayEnabled());
            if (incoming.getChartsSendEnabled() != null) merged.setChartsSendEnabled(incoming.getChartsSendEnabled());
            if (incoming.getChartsMasterSource() != null) merged.setChartsMasterSource(incoming.getChartsMasterSource());
            if (incoming.getNote() != null) merged.setNote(incoming.getNote());
            if (incoming.getEnvironment() != null) merged.setEnvironment(incoming.getEnvironment());
            if (incoming.getDeliveryMode() != null) merged.setDeliveryMode(incoming.getDeliveryMode());

            merged = applyDefaults(merged);
            merged.setDeliveredAt(Instant.now().toString());
            if (merged.getDeliveryId() == null || merged.getDeliveryId().isBlank()) {
                merged.setDeliveryId(UUID.randomUUID().toString());
            }
            if (runId != null && !runId.isBlank()) {
                merged.setDeliveryVersion(runId);
                merged.setDeliveryEtag(runId);
            } else {
                String version = "v" + Instant.now().toEpochMilli();
                merged.setDeliveryVersion(version);
                merged.setDeliveryEtag(version);
            }
            merged.setSource(Boolean.TRUE.equals(merged.getUseMockOrcaQueue()) ? "mock" : "live");
            merged.setVerified(Boolean.TRUE.equals(merged.getVerifyAdminDelivery()));

            current = merged;
            persist(current);
            return current.copy();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private AdminConfigSnapshot load() {
        if (storagePath == null || !Files.exists(storagePath)) {
            return null;
        }
        try {
            return mapper.readValue(storagePath.toFile(), AdminConfigSnapshot.class);
        } catch (IOException ex) {
            LOGGER.warn("Failed to load admin config from {}: {}", storagePath, ex.getMessage());
            return null;
        }
    }

    private void persist(AdminConfigSnapshot snapshot) {
        if (snapshot == null || storagePath == null) {
            return;
        }
        try {
            mapper.writeValue(storagePath.toFile(), snapshot);
        } catch (IOException ex) {
            LOGGER.warn("Failed to persist admin config to {}: {}", storagePath, ex.getMessage());
        }
    }

    private Path resolveStoragePath() {
        String base = System.getProperty("jboss.server.data.dir");
        if (base == null || base.isBlank()) {
            base = System.getProperty("java.io.tmpdir");
        }
        try {
            Path dir = Paths.get(base, STORAGE_DIR);
            Files.createDirectories(dir);
            return dir.resolve(STORAGE_FILE);
        } catch (IOException ex) {
            LOGGER.warn("Failed to create admin config directory: {}", ex.getMessage());
            return null;
        }
    }

    private AdminConfigSnapshot defaultSnapshot() {
        AdminConfigSnapshot snapshot = new AdminConfigSnapshot();
        snapshot.setOrcaEndpoint(resolveDefaultOrcaEndpoint());
        snapshot.setMswEnabled(Boolean.FALSE);
        snapshot.setUseMockOrcaQueue(Boolean.FALSE);
        snapshot.setVerifyAdminDelivery(Boolean.FALSE);
        snapshot.setChartsDisplayEnabled(Boolean.TRUE);
        snapshot.setChartsSendEnabled(Boolean.TRUE);
        snapshot.setChartsMasterSource("auto");
        snapshot.setEnvironment(resolveEnvironment());
        snapshot.setDeliveryMode("manual");
        snapshot.setSource("live");
        snapshot.setVerified(Boolean.FALSE);
        return snapshot;
    }

    private AdminConfigSnapshot applyDefaults(AdminConfigSnapshot snapshot) {
        if (snapshot.getOrcaEndpoint() == null) snapshot.setOrcaEndpoint(resolveDefaultOrcaEndpoint());
        if (snapshot.getMswEnabled() == null) snapshot.setMswEnabled(Boolean.FALSE);
        if (snapshot.getUseMockOrcaQueue() == null) snapshot.setUseMockOrcaQueue(Boolean.FALSE);
        if (snapshot.getVerifyAdminDelivery() == null) snapshot.setVerifyAdminDelivery(Boolean.FALSE);
        if (snapshot.getChartsDisplayEnabled() == null) snapshot.setChartsDisplayEnabled(Boolean.TRUE);
        if (snapshot.getChartsSendEnabled() == null) snapshot.setChartsSendEnabled(Boolean.TRUE);
        if (snapshot.getChartsMasterSource() == null || snapshot.getChartsMasterSource().isBlank()) {
            snapshot.setChartsMasterSource("auto");
        }
        if (snapshot.getEnvironment() == null) snapshot.setEnvironment(resolveEnvironment());
        if (snapshot.getDeliveryMode() == null) snapshot.setDeliveryMode("manual");
        if (snapshot.getDeliveryId() == null || snapshot.getDeliveryId().isBlank()) {
            snapshot.setDeliveryId(UUID.randomUUID().toString());
        }
        if (snapshot.getDeliveredAt() == null || snapshot.getDeliveredAt().isBlank()) {
            snapshot.setDeliveredAt(Instant.now().toString());
        }
        if (snapshot.getDeliveryVersion() == null || snapshot.getDeliveryVersion().isBlank()) {
            snapshot.setDeliveryVersion("v" + Instant.now().toEpochMilli());
        }
        if (snapshot.getDeliveryEtag() == null || snapshot.getDeliveryEtag().isBlank()) {
            snapshot.setDeliveryEtag(snapshot.getDeliveryVersion());
        }
        if (snapshot.getSource() == null) {
            snapshot.setSource(Boolean.TRUE.equals(snapshot.getUseMockOrcaQueue()) ? "mock" : "live");
        }
        if (snapshot.getVerified() == null) {
            snapshot.setVerified(Boolean.TRUE.equals(snapshot.getVerifyAdminDelivery()));
        }
        return snapshot;
    }

    private String resolveDefaultOrcaEndpoint() {
        String scheme = env("ORCA_API_SCHEME", "ORCA_SCHEME");
        String host = env("ORCA_API_HOST", "ORCA_HOST");
        String port = env("ORCA_API_PORT", "ORCA_PORT");
        if (host == null || host.isBlank()) {
            return null;
        }
        String resolvedScheme = (scheme == null || scheme.isBlank()) ? "http" : scheme.trim();
        if (port == null || port.isBlank()) {
            return resolvedScheme + "://" + host.trim();
        }
        return resolvedScheme + "://" + host.trim() + ":" + port.trim();
    }

    private String resolveEnvironment() {
        String value = env("VITE_ENVIRONMENT", "VITE_DEPLOY_ENV", "VITE_STAGE", "ENVIRONMENT", "DEPLOY_ENV", "STAGE", "NODE_ENV");
        return value == null || value.isBlank() ? "dev" : value.trim();
    }

    private String env(String... keys) {
        if (keys == null) {
            return null;
        }
        for (String key : keys) {
            if (key == null) continue;
            String value = System.getenv(key);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
