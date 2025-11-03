package jakarta.naming;

/**
 * Minimal Jakarta Naming exception bridge backed by javax.naming.NamingException.
 */
public class NamingException extends Exception {

    public NamingException() {
        super();
    }

    public NamingException(String message) {
        super(message);
    }

    public NamingException(String message, Throwable cause) {
        super(message, cause);
    }

    public NamingException(Throwable cause) {
        super(cause);
    }
}
