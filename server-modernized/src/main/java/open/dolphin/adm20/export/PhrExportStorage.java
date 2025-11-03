package open.dolphin.adm20.export;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import open.dolphin.infomodel.PHRAsyncJob;

public interface PhrExportStorage {

    StorageResult storeArtifact(PHRAsyncJob job, InputStream data, long size, String contentType) throws IOException;

    StoredArtifact loadArtifact(PHRAsyncJob job, String location) throws IOException;

    final class StorageResult {
        private final String location;
        private final long size;

        public StorageResult(String location, long size) {
            this.location = location;
            this.size = size;
        }

        public String getLocation() {
            return location;
        }

        public long getSize() {
            return size;
        }
    }

    final class StoredArtifact {
        private final Path path;
        private final String contentType;

        public StoredArtifact(Path path, String contentType) {
            this.path = path;
            this.contentType = contentType;
        }

        public Path getPath() {
            return path;
        }

        public String getContentType() {
            return contentType;
        }
    }
}
