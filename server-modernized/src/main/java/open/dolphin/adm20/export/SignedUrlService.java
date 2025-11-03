package open.dolphin.adm20.export;

public interface SignedUrlService {

    String createSignedUrl(String basePath, String facilityId, long ttlSeconds);

    boolean verify(String basePath, String facilityId, long expiresEpochSeconds, String token);
}
