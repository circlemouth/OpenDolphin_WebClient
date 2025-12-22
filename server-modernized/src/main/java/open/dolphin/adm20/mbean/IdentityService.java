package open.dolphin.adm20.mbean;

import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.SignatureException;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.EncodedKeySpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Calendar;
import java.util.Base64;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import net.oauth.jsontoken.JsonToken;
import net.oauth.jsontoken.crypto.RsaSHA256Signer;
import org.joda.time.Instant;

/**
 *
 * @author kazushi minagawa
 */
@Singleton
@Startup
public class IdentityService {
    
    private static final long TWO_MINUTES_IN_MILLISECONDS = 1000L * 60L * 2L;
    private static final Logger LOGGER = Logger.getLogger(IdentityService.class.getName());
    
    private LayerConfig layerConfig;
    
    @PostConstruct
    public void init() {
        layerConfig = new LayerConfig();
    }

    @PreDestroy
    public void stop() {
    }
    
    public String getIdentityToken(String nonce, String userId)  {

        try {
            final Calendar cal = Calendar.getInstance();
            final RsaSHA256Signer signer = new RsaSHA256Signer(null, null, getPrivateKey());
            final JsonToken token = new JsonToken(signer);
            final com.google.gson.JsonObject header = token.getHeader();

            header.addProperty("typ", "JWT");
            header.addProperty("alg", "RS256");
            header.addProperty("cty", "layer-eit;v=1");
            header.addProperty("kid", layerConfig.getLayerKeyId());

            token.setParam("iss", layerConfig.getProviderId());
            token.setParam("prn", userId);
            token.setIssuedAt(new Instant(cal.getTimeInMillis()));
            token.setExpiration(new Instant(cal.getTimeInMillis() + TWO_MINUTES_IN_MILLISECONDS));
            token.setParam("nce", nonce);

            String ret = token.serializeAndSign();
            LOGGER.log(Level.INFO, "token={0}", ret);
            return ret;
            
        } catch (NoSuchAlgorithmException | InvalidKeySpecException | IOException | InvalidKeyException | SignatureException ex) {
            LOGGER.log(Level.SEVERE, "Failed to generate IdentityToken.", ex);
            throw new IllegalStateException("Failed to generate IdentityToken.", ex);
        }
    }
    
    private byte[] readPrivateKeyFromDisk(final String path) throws IOException {
        if (path == null || path.isBlank()) {
            throw new IOException("PHR identity private key path is not configured.");
        }
        final File privateKeyFile = new File(path);
        if (!privateKeyFile.exists()) {
            throw new IOException("PHR identity private key file not found: " + privateKeyFile.getAbsolutePath());
        }
        final FileInputStream fileInputStream = new FileInputStream(privateKeyFile);
        final DataInputStream dis = new DataInputStream(fileInputStream);
        final byte[] privateBytes = new byte[(int) privateKeyFile.length()];
        try {
            dis.readFully(privateBytes);
        } catch (IOException ioe) {
            /** No-op **/
        } finally {
            fileInputStream.close();
        }
        if (privateBytes.length == 0) {
            throw new IOException("PHR identity private key file is empty: " + privateKeyFile.getAbsolutePath());
        }
        return privateBytes;
    }

    private byte[] readPrivateKeyFromBase64(final String base64) throws IOException {
        if (base64 == null || base64.isBlank()) {
            throw new IOException("PHR identity private key base64 is empty.");
        }
        String normalized = base64.replaceAll("\\s", "");
        try {
            byte[] decoded = Base64.getDecoder().decode(normalized);
            if (decoded.length == 0) {
                throw new IOException("PHR identity private key base64 is empty after decode.");
            }
            return decoded;
        } catch (IllegalArgumentException ex) {
            throw new IOException("PHR identity private key base64 is invalid.", ex);
        }
    }

    private byte[] resolvePrivateKeyBytes() throws IOException {
        String base64 = layerConfig.getRsaKeyBase64();
        if (base64 != null && !base64.isBlank()) {
            return readPrivateKeyFromBase64(base64);
        }
        return readPrivateKeyFromDisk(layerConfig.getRsaKeyPath());
    }
    
    private RSAPrivateKey getPrivateKey() throws NoSuchAlgorithmException, InvalidKeySpecException,
            IOException {

        final KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        final byte[] encodedKey = resolvePrivateKeyBytes();
        final EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(encodedKey);
        final PrivateKey privateKey = keyFactory.generatePrivate(privateKeySpec);
        return (RSAPrivateKey) privateKey;
    }
}
