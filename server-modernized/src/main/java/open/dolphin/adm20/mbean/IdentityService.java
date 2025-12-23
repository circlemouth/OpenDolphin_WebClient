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
            
        } catch (IdentityTokenSecretsException ex) {
            LOGGER.log(Level.SEVERE, "IdentityToken secrets are not configured.", ex);
            throw ex;
        } catch (NoSuchAlgorithmException | IOException | InvalidKeyException | SignatureException ex) {
            LOGGER.log(Level.SEVERE, "Failed to generate IdentityToken.", ex);
            throw new IllegalStateException("Failed to generate IdentityToken.", ex);
        }
    }
    
    private byte[] readPrivateKeyFromDisk(final String path) throws IOException {
        if (path == null || path.isBlank()) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_MISSING,
                    "PHR identity private key path is not configured.",
                    "path");
        }
        final File privateKeyFile = new File(path);
        if (!privateKeyFile.exists()) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_NOT_FOUND,
                    "PHR identity private key file not found: " + privateKeyFile.getAbsolutePath(),
                    "path");
        }
        if (!privateKeyFile.isFile()) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_NOT_FOUND,
                    "PHR identity private key is not a file: " + privateKeyFile.getAbsolutePath(),
                    "path");
        }
        final byte[] privateBytes = new byte[(int) privateKeyFile.length()];
        try (FileInputStream fileInputStream = new FileInputStream(privateKeyFile);
             DataInputStream dis = new DataInputStream(fileInputStream)) {
            dis.readFully(privateBytes);
        } catch (IOException ex) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_READ_FAILED,
                    "PHR identity private key file read failed: " + privateKeyFile.getAbsolutePath(),
                    "path",
                    ex);
        }
        if (privateBytes.length == 0) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_EMPTY,
                    "PHR identity private key file is empty: " + privateKeyFile.getAbsolutePath(),
                    "path");
        }
        return privateBytes;
    }

    private byte[] readPrivateKeyFromBase64(final String base64) throws IOException {
        if (base64 == null || base64.isBlank()) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_MISSING,
                    "PHR identity private key base64 is empty.",
                    "base64");
        }
        String normalized = base64.replaceAll("\\s", "");
        try {
            byte[] decoded = Base64.getDecoder().decode(normalized);
            if (decoded.length == 0) {
                throw new IdentityTokenSecretsException(
                        IdentityTokenSecretsException.REASON_KEY_EMPTY,
                        "PHR identity private key base64 is empty after decode.",
                        "base64");
            }
            return decoded;
        } catch (IllegalArgumentException ex) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_INVALID,
                    "PHR identity private key base64 is invalid.",
                    "base64",
                    ex);
        }
    }

    private byte[] resolvePrivateKeyBytes() throws IOException {
        String base64 = layerConfig.getRsaKeyBase64();
        if (base64 != null && !base64.isBlank()) {
            return readPrivateKeyFromBase64(base64);
        }
        return readPrivateKeyFromDisk(layerConfig.getRsaKeyPath());
    }

    private String resolvePrivateKeySource() {
        String base64 = layerConfig.getRsaKeyBase64();
        if (base64 != null && !base64.isBlank()) {
            return "base64";
        }
        return "path";
    }
    
    private RSAPrivateKey getPrivateKey() throws NoSuchAlgorithmException, IOException {

        final KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        final byte[] encodedKey = resolvePrivateKeyBytes();
        final EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(encodedKey);
        try {
            final PrivateKey privateKey = keyFactory.generatePrivate(privateKeySpec);
            return (RSAPrivateKey) privateKey;
        } catch (InvalidKeySpecException | ClassCastException ex) {
            throw new IdentityTokenSecretsException(
                    IdentityTokenSecretsException.REASON_KEY_INVALID,
                    "PHR identity private key format is invalid.",
                    resolvePrivateKeySource(),
                    ex);
        }
    }
}
