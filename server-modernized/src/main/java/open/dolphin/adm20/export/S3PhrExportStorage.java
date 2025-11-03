package open.dolphin.adm20.export;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import open.dolphin.infomodel.PHRAsyncJob;

@ApplicationScoped
public class S3PhrExportStorage implements PhrExportStorage {

    @Override
    public StorageResult storeArtifact(PHRAsyncJob job, InputStream data, long size, String contentType) throws IOException {
        throw new UnsupportedOperationException("S3 storage is not configured yet");
    }

    @Override
    public StoredArtifact loadArtifact(PHRAsyncJob job, String location) throws IOException {
        throw new UnsupportedOperationException("S3 storage is not configured yet");
    }
}
