package open.dolphin.reporting;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfSignatureAppearance;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.security.BouncyCastleDigest;
import com.lowagie.text.pdf.security.DigestAlgorithms;
import com.lowagie.text.pdf.security.ExternalDigest;
import com.lowagie.text.pdf.security.ExternalSignature;
import com.lowagie.text.pdf.security.MakeSignature;
import com.lowagie.text.pdf.security.PrivateKeySignature;
import com.lowagie.text.pdf.security.TSAClient;
import com.lowagie.text.pdf.security.TSAClientBouncyCastle;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.Certificate;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

/**
 * Applies digital signatures (and optional timestamps) to generated PDFs.
 */
public final class PdfSigningService {

    private static final Logger LOGGER = Logger.getLogger(PdfSigningService.class.getName());

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public void sign(Path pdfPath, SigningConfig config) throws IOException {
        Objects.requireNonNull(pdfPath, "pdfPath must not be null");
        Objects.requireNonNull(config, "config must not be null");
        try {
            signInternal(pdfPath, config, true);
        } catch (GeneralSecurityException | IOException ex) {
            if (config.getTsaUrl() != null && !config.getTsaUrl().isBlank()) {
                LOGGER.log(Level.WARNING, "Timestamp signing failed. Falling back to signature without TSA.", ex);
                try {
                    signInternal(pdfPath, config, false);
                    return;
                } catch (GeneralSecurityException | IOException retryEx) {
                    throw new IOException("Failed to sign PDF", retryEx);
                }
            }
            if (ex instanceof IOException ioException) {
                throw ioException;
            }
            throw new IOException("Failed to sign PDF", ex);
        }
    }

    private void signInternal(Path pdfPath, SigningConfig config, boolean applyTsa)
            throws GeneralSecurityException, IOException {
        KeyStore keyStore = loadKeyStore(config);
        if (!keyStore.containsAlias(config.getKeyAlias())) {
            throw new GeneralSecurityException("Key alias not found: " + config.getKeyAlias());
        }
        PrivateKey privateKey = (PrivateKey) keyStore.getKey(config.getKeyAlias(), config.getKeystorePassword());
        if (privateKey == null) {
            throw new GeneralSecurityException("Private key not available for alias: " + config.getKeyAlias());
        }
        Certificate[] chain = keyStore.getCertificateChain(config.getKeyAlias());
        if (chain == null || chain.length == 0) {
            throw new GeneralSecurityException("Certificate chain missing for alias: " + config.getKeyAlias());
        }

        Path tempFile = Files.createTempFile("opendolphin-report-", ".pdf");
        try (InputStream inputStream = Files.newInputStream(pdfPath);
                OutputStream outputStream = Files.newOutputStream(tempFile)) {
            PdfReader reader = new PdfReader(inputStream);
            try {
                PdfStamper stamper = PdfStamper.createSignature(reader, outputStream, '\0', null, true);
                try {
                    PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
                    appearance.setReason(config.getReason());
                    appearance.setLocation(config.getLocation());
                    appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);

                    ExternalDigest digest = new BouncyCastleDigest();
                    ExternalSignature signature = new PrivateKeySignature(privateKey, DigestAlgorithms.SHA256,
                            BouncyCastleProvider.PROVIDER_NAME);

                    TSAClient tsaClient = null;
                    if (applyTsa && config.getTsaUrl() != null && !config.getTsaUrl().isBlank()) {
                        tsaClient = new TSAClientBouncyCastle(config.getTsaUrl(), config.getTsaUsername(),
                                toNullableString(config.getTsaPassword()));
                    }

                    MakeSignature.signDetached(appearance, digest, signature, chain, null, null, tsaClient, 0,
                            MakeSignature.CryptoStandard.CMS);
                } finally {
                    stamper.close();
                }
            } finally {
                reader.close();
            }
        }
        Files.move(tempFile, pdfPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    }

    private KeyStore loadKeyStore(SigningConfig config) throws GeneralSecurityException, IOException {
        try (InputStream keyStream = Files.newInputStream(config.getKeystorePath())) {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(keyStream, config.getKeystorePassword());
            return keyStore;
        }
    }

    private String toNullableString(char[] value) {
        return value == null ? null : new String(value);
    }
}
