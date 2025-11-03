package open.dolphin.adm20.export;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;
import open.dolphin.infomodel.PHRAsyncJob;

@ApplicationScoped
public class FilesystemPhrExportStorage implements PhrExportStorage {

    private static final Logger LOGGER = Logger.getLogger(FilesystemPhrExportStorage.class.getName());

    @Inject
    private PhrExportConfig config;

    @Override
    public StorageResult storeArtifact(PHRAsyncJob job, InputStream data, long size, String contentType) throws IOException {
        Path base = config.getFilesystemBasePath();
        Files.createDirectories(base);
        Path target = base.resolve(job.getJobId().toString() + ".zip");
        Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
        LOGGER.log(Level.FINE, "Stored PHR export artifact at {0}", target);
        return new StorageResult(target.getFileName().toString(), size);
    }

    @Override
    public StoredArtifact loadArtifact(PHRAsyncJob job, String location) throws IOException {
        Path base = config.getFilesystemBasePath();
        Path target = base.resolve(location);
        if (!Files.exists(target)) {
            throw new IOException("Export artifact not found: " + target);
        }
        return new StoredArtifact(target, "application/zip");
    }
}
