package open.dolphin.orca;

/**
 * Runtime exception raised when ORCA gateway cannot provide a valid response.
 */
public class OrcaGatewayException extends RuntimeException {

    public OrcaGatewayException(String message) {
        super(message);
    }

    public OrcaGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
