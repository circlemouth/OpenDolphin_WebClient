package open.dolphin.adm20.export;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.logging.Logger;

@ApplicationScoped
public class PhrExportStorageFactory {

    private static final Logger LOGGER = Logger.getLogger(PhrExportStorageFactory.class.getName());

    @Inject
    private PhrExportConfig config;

    @Inject
    private FilesystemPhrExportStorage filesystemStorage;

    @Inject
    private S3PhrExportStorage s3Storage;

    private PhrExportStorage storage;

    @PostConstruct
    void init() {
        switch (config.getStorageType()) {
            case FILESYSTEM -> storage = filesystemStorage;
            case S3 -> {
                storage = s3Storage;
                LOGGER.info("PHR export storage initialized in S3 mode.");
            }
        }
    }

    public PhrExportStorage getStorage() {
        return storage;
    }
}
