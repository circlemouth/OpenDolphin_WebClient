package open.dolphin.orca.transport;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import open.dolphin.orca.OrcaGatewayException;

/**
 * File based transport that returns canned ORCA XML payloads.
 */
@ApplicationScoped
public class StubOrcaTransport implements OrcaTransport {

    @Override
    public String invoke(OrcaEndpoint endpoint, String requestXml) {
        if (endpoint == null) {
            throw new OrcaGatewayException("Endpoint must not be null");
        }
        String resource = endpoint.getStubResource();
        try (InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(resource)) {
            if (stream == null) {
                throw new OrcaGatewayException("Stub payload not found: " + resource);
            }
            byte[] bytes = stream.readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new OrcaGatewayException("Failed to read stub payload for " + endpoint.name(), ex);
        }
    }
}
